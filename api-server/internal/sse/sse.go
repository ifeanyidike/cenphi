package sse

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type SSEManager struct {
	clients         map[string]chan queue.JobResult
	studioClients   map[string]chan StudioEvent   // New: Studio-specific clients
	mu              sync.RWMutex
	logger          *zap.Logger
	cacheService    cache.RedisCache
	ctx             context.Context
	cancel          context.CancelFunc
	sessions        map[string]*ProcessingSession // Track active studio sessions
	stageRepo       repositories.ProcessingStageRepository // Injected stage repository for database updates
	db              *sql.DB // Database connection
}

func NewSSEManager(cacheService cache.RedisCache, logger *zap.Logger) *SSEManager {
	ctx, cancel := context.WithCancel(context.Background())
	manager := &SSEManager{
		clients:       make(map[string]chan queue.JobResult),
		studioClients: make(map[string]chan StudioEvent),
		logger:        logger,
		cacheService:  cacheService,
		ctx:           ctx,
		cancel:        cancel,
		sessions:      make(map[string]*ProcessingSession),
	}

	go manager.startSSENotificationSystem()
	go manager.subscribeToAIServiceProgress() // NEW: Subscribe to Python progress updates
	return manager
}

// SetStageRepo injects the stage repository for database updates
func (m *SSEManager) SetStageRepo(stageRepo repositories.ProcessingStageRepository, db *sql.DB) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.stageRepo = stageRepo
	m.db = db
}

func (s *SSEManager) startSSENotificationSystem() {
	s.logger.Info("Starting SSE notification system")

	ticker := time.NewTicker(4 * time.Second) // Check every 4 seconds
	defer ticker.Stop()

	trackedJobs := make(map[string]queue.JobResult)

	for {
		select {
		case <-s.ctx.Done():
			s.logger.Info("SSE notification system stopped")
			return
		case <-ticker.C:
			s.checkJobUpdates(trackedJobs)
		}
	}
}

// // checkJobUpdates checks for job status changes and notifies clients
// func (m *SSEManager) checkJobUpdates(trackedJobs map[string]queue.JobResult) {
// 	m.mu.RLock()
// 	clientCount := len(m.clients)
// 	m.mu.RUnlock()

// 	if clientCount == 0 {
// 		return // No clients connected
// 	}

// 	// Get all active job keys from Redis
// 	ctx := context.Background()
// 	keys, err := m.cacheService.GetKeys(ctx, "job_status:*")
// 	if err != nil {
// 		m.logger.Error("Failed to get job keys", zap.Error(err))
// 		return
// 	}

// 	for _, key := range keys {
// 		jobID := key[11:] // Remove "job_status:" prefix

// 		var currentStatus queue.JobResult
// 		if err := m.cacheService.Get(ctx, key, &currentStatus); err != nil {
// 			continue // Skip if can't get job status
// 		}

// 		// Check if this job status has changed
// 		if lastStatus, exists := trackedJobs[jobID]; !exists ||
// 			lastStatus.Status != currentStatus.Status ||
// 			lastStatus.Progress != currentStatus.Progress {

// 			// Job status changed, notify all clients
// 			m.NotifyClients(currentStatus)
// 			trackedJobs[jobID] = currentStatus
// 		}

// 		// Clean up completed/failed jobs from tracking after some time
// 		if (currentStatus.Status == "completed" || currentStatus.Status == "failed" || currentStatus.Status == "cancelled") &&
// 			time.Since(currentStatus.UpdatedAt) > 5*time.Minute {
// 			delete(trackedJobs, jobID)
// 		}
// 	}
// }

// NotifyClients sends job updates to all connected SSE clients
func (m *SSEManager) NotifyClients(jobResult queue.JobResult) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for clientID, clientChan := range m.clients {
		select {
		case clientChan <- jobResult:
			// Successfully sent
		default:
			// Channel is full, skip this client
			m.logger.Warn("SSE client channel full, skipping", zap.String("clientID", clientID))
		}
	}
}

func (m *SSEManager) Cleanup() {
	if m != nil {
		m.cancel()
	}
}

func (m *SSEManager) StreamJobStatus(ctx context.Context, w io.Writer) error {
	// Set SSE headers

	// Check if response writer supports flushing
	flusher, ok := w.(http.Flusher)
	if !ok {
		m.logger.Error("SSE not supported by this response writer")
		// http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return fmt.Errorf("response writer does not support flushing")
	}

	// Generate unique client ID
	clientID := fmt.Sprintf("client_%d", time.Now().UnixNano())
	m.logger.Info("New SSE client connected", zap.String("clientID", clientID))

	// Create channel for this client
	clientChan := make(chan queue.JobResult, 100)

	// Register client
	m.mu.Lock()
	m.clients[clientID] = clientChan
	m.mu.Unlock()

	// Send initial connection message
	m.writeSSEEvent(w, "connected", map[string]interface{}{
		"message":   "SSE connection established",
		"client_id": clientID,
		"timestamp": time.Now().Unix(),
	})
	flusher.Flush()

	// Handle client disconnection
	defer func() {
		m.mu.Lock()
		delete(m.clients, clientID)
		close(clientChan)
		m.mu.Unlock()
		m.logger.Info("SSE client disconnected", zap.String("clientID", clientID))
	}()

	// Listen for messages or client disconnect
	for {
		select {
		case <-ctx.Done():
			// Client disconnected
			return nil
		case jobResult := <-clientChan:
			// Send job update to client
			eventType := "job_update"
			switch jobResult.Status {
			case "completed":
				eventType = "job_completed"
			case "failed", "cancelled":
				eventType = "job_failed"
			}

			m.writeSSEEvent(w, eventType, map[string]interface{}{
				"job_id":     jobResult.ID,
				"status":     jobResult.Status,
				"progress":   jobResult.Progress,
				"result":     jobResult.Result,
				"error":      jobResult.Error,
				"timestamp":  time.Now().Unix(),
				"service_id": m.extractServiceIdFromJobId(jobResult.ID),
			})
			flusher.Flush()

		case <-time.After(15 * time.Second):
			// Send heartbeat every 15 seconds to prevent proxy timeouts
			m.writeSSEEvent(w, "heartbeat", map[string]interface{}{
				"timestamp": time.Now().Unix(),
			})
			flusher.Flush()
		}
	}
}

// writeSSEEvent formats and writes an SSE event
func (c *SSEManager) writeSSEEvent(w io.Writer, eventType string, data interface{}) {
	if eventType == "" {
		eventType = "message"
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		c.logger.Error("Failed to marshal SSE data", zap.Error(err))
		fmt.Fprintf(w, "event: error\n")
		fmt.Fprintf(w, "data: {\"error\": \"Failed to marshal data\"}\n\n")
		return
	}

	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
}

func (c *SSEManager) extractServiceIdFromJobId(jobID string) string {
	// Try to get service ID from job result metadata
	ctx := context.Background()
	var jobResult queue.JobResult
	if err := c.cacheService.Get(ctx, fmt.Sprintf("job_status:%s", jobID), &jobResult); err == nil {
		if jobResult.Result != nil {
			if resultMap, ok := jobResult.Result.(map[string]interface{}); ok {
				if serviceID, exists := resultMap["service_id"]; exists {
					if serviceIDStr, ok := serviceID.(string); ok {
						return serviceIDStr
					}
				}
			}
		}
	}

	// Fallback: extract from job ID pattern if it contains service info
	if strings.Contains(jobID, "_") {
		parts := strings.Split(jobID, "_")
		if len(parts) >= 3 {
			return parts[2] // Assuming format: job_timestamp_serviceId
		}
	}

	return ""
}

// Studio-specific methods

// CreateProcessingSession creates a new studio processing session with auto-generated ID
func (m *SSEManager) CreateProcessingSession(testimonialID, workspaceID, sessionType string, autoProceed bool) *ProcessingSession {
	sessionID := fmt.Sprintf("session_%s_%d", testimonialID, time.Now().UnixNano())
	return m.CreateProcessingSessionWithID(sessionID, testimonialID, workspaceID, sessionType, autoProceed)
}

// CreateProcessingSessionWithID creates a new studio processing session with a specified ID
func (m *SSEManager) CreateProcessingSessionWithID(sessionID, testimonialID, workspaceID, sessionType string, autoProceed bool) *ProcessingSession {
	session := &ProcessingSession{
		ID:               sessionID,
		TestimonialID:    testimonialID,
		WorkspaceID:      workspaceID,
		Type:             sessionType,
		Status:           "active",
		AutoProceed:      autoProceed,
		Stages:           make(map[string]*ProcessingStageEvent),
		AcceptedVersions: make(map[string]string),
		StartedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		Metadata:         make(map[string]interface{}),
	}

	// NOTE: Stages will be populated from the database when StreamStudioEvents sends session_created event
	// This avoids hardcoding stage definitions and ensures consistency with database

	m.mu.Lock()
	m.sessions[sessionID] = session
	m.mu.Unlock()

	m.logger.Info("Created studio processing session",
		zap.String("session_id", sessionID),
		zap.String("testimonial_id", testimonialID),
		zap.String("type", sessionType))

	return session
}

// UpdateStageProgress updates the progress of a specific stage and notifies studio clients
func (m *SSEManager) UpdateStageProgress(sessionID, stageID string, progress int, message string, preview *PreviewData) {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return
	}

	stage, stageExists := session.Stages[stageID]
	if !stageExists {
		m.mu.Unlock()
		return
	}

	// Update stage
	stage.Progress = progress
	stage.Message = message
	stage.Status = "processing"
	if stage.StartedAt == nil {
		now := time.Now()
		stage.StartedAt = &now
	}

	session.UpdatedAt = time.Now()
	m.mu.Unlock()

	// Persist progress to database (async to avoid blocking SSE)
	go func() {
		if m.stageRepo != nil && m.db != nil {
			// Parse session ID
			sessionUUID, err := uuid.Parse(sessionID)
			if err != nil {
				m.logger.Error("Failed to parse session ID for progress persistence",
					zap.String("session_id", sessionID),
					zap.Error(err))
				return
			}

			// Get database stage record
			dbStage, err := m.stageRepo.GetBySessionAndStageID(context.Background(), sessionUUID, stageID, m.db)
			if err != nil {
				m.logger.Error("Failed to get stage for progress persistence",
					zap.String("session_id", sessionID),
					zap.String("stage_id", stageID),
					zap.Error(err))
				return
			}

			// CRITICAL FIX: Don't update database if stage is already in a terminal state
			// This prevents race condition where progress updates overwrite status changes
			// Terminal states: reviewing, completed, accepted, failed, cancelled, skipped, skipped_auto
			terminalStatuses := []string{"reviewing", "completed", "accepted", "failed", "cancelled", "skipped", "skipped_auto"}
			for _, terminalStatus := range terminalStatuses {
				if dbStage.Status == terminalStatus {
					m.logger.Debug("Skipping progress update - stage already in terminal state",
						zap.String("session_id", sessionID),
						zap.String("stage_id", stageID),
						zap.String("current_status", dbStage.Status),
						zap.Int("progress", progress))
					return
				}
			}

			// Only update if still in "processing" or "pending" state
			messagePtr := &message
			err = m.stageRepo.UpdateStatus(context.Background(), dbStage.ID, "processing", progress, messagePtr, m.db)
			if err != nil {
				m.logger.Error("Failed to persist stage progress to database",
					zap.String("session_id", sessionID),
					zap.String("stage_id", stageID),
					zap.Int("progress", progress),
					zap.Error(err))
			} else {
				m.logger.Debug("Successfully persisted stage progress",
					zap.String("session_id", sessionID),
					zap.String("stage_id", stageID),
					zap.Int("progress", progress))
			}
		}
	}()

	// Create studio event
	stageIDPtr := &stageID
	event := StudioEvent{
		ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:          "step_progress",
		SessionID:     sessionID,
		JobID:         sessionID,
		StageID:       stageIDPtr,
		TestimonialID: session.TestimonialID,
		WorkspaceID:   session.WorkspaceID,
		Stage:         stage,
		Preview:       preview,
		Timestamp:     time.Now(),
	}

	m.BroadcastStudioEvent(event)
}

// UpdateStageComplete updates a stage to completed status in memory AND database
func (m *SSEManager) UpdateStageComplete(sessionID, stageID string, progress int, metadata map[string]interface{}) {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return
	}

	stage, stageExists := session.Stages[stageID]
	if !stageExists {
		m.mu.Unlock()
		return
	}

	// Update stage in memory
	stage.Progress = progress
	stage.Status = "completed"
	now := time.Now()
	stage.CompletedAt = &now

	// Update metadata in memory
	if metadata != nil {
		if stage.Metadata == nil {
			stage.Metadata = make(map[string]interface{})
		}
		for k, v := range metadata {
			stage.Metadata[k] = v
		}
	}

	session.UpdatedAt = time.Now()
	m.mu.Unlock()

	m.logger.Debug("Updated stage to completed in memory",
		zap.String("session_id", sessionID),
		zap.String("stage_id", stageID),
		zap.Int("progress", progress))
}

// CompleteStage marks a stage as completed and provides options
func (m *SSEManager) CompleteStage(sessionID, stageID string, preview *PreviewData, suggestions []ContextualSuggestion, options []ActionOption) {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return
	}

	stage, stageExists := session.Stages[stageID]
	if !stageExists {
		m.mu.Unlock()
		return
	}

	// Update stage
	stage.Progress = 100
	stage.Status = "reviewing"
	now := time.Now()
	stage.CompletedAt = &now
	session.UpdatedAt = time.Now()
	m.mu.Unlock()

	// Create studio event
	stageIDPtr := &stageID
	event := StudioEvent{
		ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:          "step_complete",
		SessionID:     sessionID,
		JobID:         sessionID,
		StageID:       stageIDPtr,
		TestimonialID: session.TestimonialID,
		WorkspaceID:   session.WorkspaceID,
		Stage:         stage,
		Preview:       preview,
		Suggestions:   suggestions,
		Options:       options,
		Timestamp:     time.Now(),
	}

	m.BroadcastStudioEvent(event)
}

// AcceptStage marks a stage as accepted by the user
func (m *SSEManager) AcceptStage(sessionID, stageID string) error {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("session not found: %s", sessionID)
	}

	stage, stageExists := session.Stages[stageID]
	if !stageExists {
		m.mu.Unlock()
		return fmt.Errorf("stage not found: %s", stageID)
	}

	// Mark stage as accepted
	stage.Status = "accepted"
	stage.Progress = 100
	now := time.Now()
	stage.CompletedAt = &now
	session.UpdatedAt = now
	m.mu.Unlock()

	// Create acceptance event
	stageIDPtr := &stageID
	event := StudioEvent{
		ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:          "stage_accepted",
		SessionID:     sessionID,
		JobID:         sessionID,
		StageID:       stageIDPtr,
		TestimonialID: session.TestimonialID,
		WorkspaceID:   session.WorkspaceID,
		Stage:         stage,
		Metadata: map[string]interface{}{
			"accepted_at": now,
		},
		Timestamp: now,
	}

	m.BroadcastStudioEvent(event)
	m.logger.Info("Stage accepted",
		zap.String("session_id", sessionID),
		zap.String("stage_id", stageID))

	return nil
}

// AcceptStageVersion accepts the current version of a stage
func (m *SSEManager) AcceptStageVersion(sessionID, stageID, versionID string) {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return
	}

	stage, stageExists := session.Stages[stageID]
	if !stageExists {
		m.mu.Unlock()
		return
	}

	// Accept the version
	session.AcceptedVersions[stageID] = versionID
	stage.Status = "completed"
	session.UpdatedAt = time.Now()

	// Check if we can proceed to next stage
	nextStageID := m.getNextPendingStage(session)
	m.mu.Unlock()

	// Create acceptance event
	event := StudioEvent{
		ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:          "stage_accepted",
		JobID:         sessionID,
		TestimonialID: session.TestimonialID,
		WorkspaceID:   session.WorkspaceID,
		Stage:         stage,
		Metadata: map[string]interface{}{
			"version_id":    versionID,
			"next_stage_id": nextStageID,
		},
		Timestamp: time.Now(),
	}

	m.BroadcastStudioEvent(event)
}

// PauseSession pauses a processing session
func (m *SSEManager) PauseSession(sessionID string, pausedByUser bool) error {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("session not found: %s", sessionID)
	}

	if session.Status != "active" {
		m.mu.Unlock()
		return fmt.Errorf("can only pause active sessions, current status: %s", session.Status)
	}

	now := time.Now()
	session.Status = "paused"
	session.UpdatedAt = now
	m.mu.Unlock()

	// Create pause event
	event := StudioEvent{
		ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:          "session_paused",
		JobID:         sessionID,
		TestimonialID: session.TestimonialID,
		WorkspaceID:   session.WorkspaceID,
		Metadata: map[string]interface{}{
			"paused_by_user": pausedByUser,
			"paused_at":      now,
			"current_stage":  session.CurrentStage,
		},
		Timestamp: now,
	}

	m.BroadcastStudioEvent(event)
	m.logger.Info("Session paused",
		zap.String("session_id", sessionID),
		zap.Bool("by_user", pausedByUser))

	return nil
}

// ResumeSession resumes a paused processing session
func (m *SSEManager) ResumeSession(sessionID string, resumeFromStageID *string) error {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("session not found: %s", sessionID)
	}

	if session.Status != "paused" {
		m.mu.Unlock()
		return fmt.Errorf("can only resume paused sessions, current status: %s", session.Status)
	}

	session.Status = "active"
	session.UpdatedAt = time.Now()

	// Determine which stage to resume from
	var resumeStage string
	if resumeFromStageID != nil && *resumeFromStageID != "" {
		resumeStage = *resumeFromStageID
	} else {
		// Resume from current stage or next pending stage
		resumeStage = m.getNextPendingStage(session)
	}
	m.mu.Unlock()

	// Create resume event
	event := StudioEvent{
		ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:          "session_resumed",
		JobID:         sessionID,
		TestimonialID: session.TestimonialID,
		WorkspaceID:   session.WorkspaceID,
		Metadata: map[string]interface{}{
			"resume_from_stage": resumeStage,
			"resumed_at":        time.Now(),
		},
		Timestamp: time.Now(),
	}

	m.BroadcastStudioEvent(event)
	m.logger.Info("Session resumed",
		zap.String("session_id", sessionID),
		zap.String("resume_stage", resumeStage))

	return nil
}

// SkipStage skips a stage in the processing pipeline
func (m *SSEManager) SkipStage(sessionID, stageID, skipReason string) error {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("session not found: %s", sessionID)
	}

	stage, stageExists := session.Stages[stageID]
	if !stageExists {
		m.mu.Unlock()
		return fmt.Errorf("stage not found: %s", stageID)
	}

	// Mark stage as skipped
	stage.Status = "skipped"
	stage.Progress = 0
	now := time.Now()
	stage.CompletedAt = &now
	session.UpdatedAt = now

	// Find dependent stages and auto-skip them if necessary
	dependentStages := m.findDependentStages(session, stageID)
	m.mu.Unlock()

	// Create skip event
	event := StudioEvent{
		ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:          "stage_skipped",
		JobID:         sessionID,
		TestimonialID: session.TestimonialID,
		WorkspaceID:   session.WorkspaceID,
		Stage:         stage,
		Metadata: map[string]interface{}{
			"skip_reason":       skipReason,
			"dependent_stages":  dependentStages,
			"skipped_at":        now,
		},
		Timestamp: now,
	}

	m.BroadcastStudioEvent(event)
	m.logger.Info("Stage skipped",
		zap.String("session_id", sessionID),
		zap.String("stage_id", stageID),
		zap.String("reason", skipReason))

	// Auto-skip dependent stages if they can't proceed without this stage
	for _, depStageID := range dependentStages {
		m.mu.Lock()
		depStage, exists := session.Stages[depStageID]
		if exists && depStage.Status == "pending" {
			depStage.Status = "skipped_auto"
			depStage.Progress = 0
			depStage.CompletedAt = &now
		}
		m.mu.Unlock()

		// Notify about auto-skipped stages
		autoSkipEvent := StudioEvent{
			ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
			Type:          "stage_skipped",
			JobID:         sessionID,
			TestimonialID: session.TestimonialID,
			WorkspaceID:   session.WorkspaceID,
			Stage:         depStage,
			Metadata: map[string]interface{}{
				"skip_reason":      "dependency_skipped",
				"dependency_stage": stageID,
			},
			Timestamp: time.Now(),
		}
		m.BroadcastStudioEvent(autoSkipEvent)
	}

	return nil
}

// RetryStage retries a failed or rejected stage
func (m *SSEManager) RetryStage(sessionID, stageID string) error {
	m.mu.Lock()
	session, exists := m.sessions[sessionID]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("session not found: %s", sessionID)
	}

	stage, stageExists := session.Stages[stageID]
	if !stageExists {
		m.mu.Unlock()
		return fmt.Errorf("stage not found: %s", stageID)
	}

	// Reset stage to pending
	stage.Status = "pending"
	stage.Progress = 0
	stage.Message = ""
	stage.StartedAt = nil
	stage.CompletedAt = nil
	session.UpdatedAt = time.Now()
	m.mu.Unlock()

	// Create retry event
	event := StudioEvent{
		ID:            fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:          "stage_retry",
		JobID:         sessionID,
		TestimonialID: session.TestimonialID,
		WorkspaceID:   session.WorkspaceID,
		Stage:         stage,
		Metadata: map[string]interface{}{
			"retry_at": time.Now(),
		},
		Timestamp: time.Now(),
	}

	m.BroadcastStudioEvent(event)
	m.logger.Info("Stage retry initiated",
		zap.String("session_id", sessionID),
		zap.String("stage_id", stageID))

	return nil
}

// findDependentStages finds stages that depend on a given stage
func (m *SSEManager) findDependentStages(session *ProcessingSession, stageID string) []string {
	var dependents []string
	for _, stage := range session.Stages {
		for _, dep := range stage.Dependencies {
			if dep == stageID {
				dependents = append(dependents, stage.ID)
				break
			}
		}
	}
	return dependents
}

// BroadcastStudioEvent sends an event to all studio clients
func (m *SSEManager) BroadcastStudioEvent(event StudioEvent) {
	m.mu.RLock()
	clientCount := len(m.studioClients)
	m.mu.RUnlock()

	// PERFORMANCE FIX: Removed verbose Info logging from hot path
	// This function fires on EVERY SSE event (could be 100s per second)
	// Only log warnings/errors for actual problems

	if clientCount == 0 {
		// Only log when events are actually being dropped (indicates a problem)
		m.logger.Warn("No studio clients connected - event will be dropped",
			zap.String("event_type", event.Type),
			zap.String("session_id", event.SessionID))
		return
	}

	m.mu.RLock()
	defer m.mu.RUnlock()

	for clientID, clientChan := range m.studioClients {
		select {
		case clientChan <- event:
			// PERFORMANCE FIX: Removed Debug log that fires per-client per-event
			// With N users × M events/sec, this creates massive log volume
			// Debug logging should be enabled manually when troubleshooting
		default:
			// Channel is full - this IS a problem, keep the warning
			m.logger.Warn("Studio SSE client channel full, skipping",
				zap.String("clientID", clientID),
				zap.String("event_type", event.Type))
		}
	}
}

// SendStudioEvent sends an event to a specific session
func (m *SSEManager) SendStudioEvent(sessionID string, event *StudioEvent) {
	if event == nil {
		return
	}

	// Use the BroadcastStudioEvent for now since we're sending to all connected clients
	// In a full implementation, you'd filter by sessionID
	m.BroadcastStudioEvent(*event)

	// Also store in session if it exists
	m.mu.Lock()
	if session, exists := m.sessions[sessionID]; exists {
		// Update session metadata or last event timestamp
		session.UpdatedAt = time.Now()
		if event.Stage != nil {
			if existingStage, ok := session.Stages[event.Stage.ID]; ok {
				existingStage.Status = event.Stage.Status
				existingStage.Progress = event.Stage.Progress
				existingStage.Message = event.Stage.Message
				if event.Stage.StartedAt != nil {
					existingStage.StartedAt = event.Stage.StartedAt
				}
				if event.Stage.CompletedAt != nil {
					existingStage.CompletedAt = event.Stage.CompletedAt
				}
			}
		}
	}
	m.mu.Unlock()
}

// HasStudioClient checks if there are any connected studio clients
func (m *SSEManager) HasStudioClient(sessionID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	// Currently checks if ANY studio client is connected
	// Session-specific filtering happens in BroadcastStudioEvent
	return len(m.studioClients) > 0
}

// GetSession retrieves a processing session by ID
func (m *SSEManager) GetSession(sessionID string) *ProcessingSession {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.sessions[sessionID]
}

// RestoreSession restores a session from database to in-memory state
// This is used when reconnecting to an existing session after disconnect/restart
func (m *SSEManager) RestoreSession(session *ProcessingSession) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[session.ID] = session
	m.logger.Info("Restored session to SSEManager",
		zap.String("session_id", session.ID),
		zap.String("type", session.Type),
		zap.String("status", session.Status))
}

// StreamStudioEvents handles studio-specific SSE connections
func (m *SSEManager) StreamStudioEvents(ctx context.Context, w io.Writer, sessionID string) error {
	// Set SSE headers
	flusher, ok := w.(http.Flusher)
	if !ok {
		return fmt.Errorf("response writer does not support flushing")
	}

	// Generate unique client ID
	clientID := fmt.Sprintf("studio_client_%d", time.Now().UnixNano())
	m.logger.Debug("New studio SSE client connected",
		zap.String("clientID", clientID),
		zap.String("sessionID", sessionID))

	// Create channel for this client
	clientChan := make(chan StudioEvent, 100)

	// Register client FIRST before sending any events
	m.mu.Lock()
	m.studioClients[clientID] = clientChan
	m.mu.Unlock()

	// Log successful registration
	m.logger.Debug("Studio SSE client registered",
		zap.String("clientID", clientID),
		zap.String("sessionID", sessionID),
		zap.Int("total_clients", len(m.studioClients)))

	// Get session data and send initial event with all stages
	m.mu.RLock()
	session, sessionExists := m.sessions[sessionID]
	m.mu.RUnlock()

	if sessionExists && session != nil {
		// Build stages array from session.Stages (sorted by order)
		stages := make([]*ProcessingStageEvent, 0, len(session.Stages))
		for _, stage := range session.Stages {
			stages = append(stages, stage)
		}

		// Sort stages by order for consistent display
		sortStages := func(stages []*ProcessingStageEvent) {
			for i := 0; i < len(stages); i++ {
				for j := i + 1; j < len(stages); j++ {
					if stages[i].Order > stages[j].Order {
						stages[i], stages[j] = stages[j], stages[i]
					}
				}
			}
		}
		sortStages(stages)

		// Send session_created event with all stages
		initialEvent := StudioEvent{
			ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
			Type:      "session_created",
			SessionID: sessionID,
			JobID:     sessionID,
			TestimonialID: session.TestimonialID,
			WorkspaceID:   session.WorkspaceID,
			Data: map[string]interface{}{
				"session_id":  sessionID,
				"type":        session.Type,
				"status":      session.Status,
				"auto_proceed": session.AutoProceed, // BUGFIX: Use actual auto_proceed from session
				"stages":      stages,
			},
			Timestamp: time.Now(),
		}

		m.logger.Debug("Sending session_created event with stages",
			zap.String("sessionID", sessionID),
			zap.Int("stages_count", len(stages)),
			zap.String("status", session.Status))

		m.writeStudioSSEEvent(w, initialEvent)
		flusher.Flush()
	} else {
		// Session not found - this shouldn't happen in normal flow
		// Log warning but send connection_established to avoid breaking frontend
		m.logger.Warn("Session not found in SSE manager - may need restoration from DB",
			zap.String("sessionID", sessionID))

		initialEvent := StudioEvent{
			ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
			Type:      "connection_established",
			SessionID: sessionID,
			Data: map[string]interface{}{
				"message":   "Studio SSE connection established",
				"client_id": clientID,
				"warning":   "Session not found in memory - may be loading from database",
			},
			Timestamp: time.Now(),
		}

		m.writeStudioSSEEvent(w, initialEvent)
		flusher.Flush()
	}

	// Handle client disconnection
	defer func() {
		m.mu.Lock()
		delete(m.studioClients, clientID)
		close(clientChan)
		m.mu.Unlock()
		m.logger.Debug("Studio SSE client disconnected", zap.String("clientID", clientID))
	}()

	// Set maximum connection duration (2 hours) to prevent resource leaks
	connectionTimeout := time.After(2 * time.Hour)

	// Listen for messages or client disconnect
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-connectionTimeout:
			// Close connection after timeout and expect client to reconnect
			m.logger.Info("SSE connection timeout reached, closing connection",
				zap.String("clientID", clientID),
				zap.String("sessionID", sessionID))
			return nil
		case event := <-clientChan:
			m.writeStudioSSEEvent(w, event)
			flusher.Flush()
		case <-time.After(15 * time.Second):
			// Send heartbeat every 15 seconds to prevent proxy timeouts
			heartbeat := StudioEvent{
				ID:   fmt.Sprintf("heartbeat_%d", time.Now().UnixNano()),
				Type: "heartbeat",
				Metadata: map[string]interface{}{
					"timestamp": time.Now().Unix(),
				},
				Timestamp: time.Now(),
			}
			m.writeStudioSSEEvent(w, heartbeat)
			flusher.Flush()
		}
	}
}

// writeStudioSSEEvent formats and writes a studio SSE event
func (m *SSEManager) writeStudioSSEEvent(w io.Writer, event StudioEvent) {
	jsonData, err := json.Marshal(event)
	if err != nil {
		m.logger.Error("Failed to marshal studio SSE data", zap.Error(err))
		fmt.Fprintf(w, "data: {\"error\": \"Failed to marshal data\"}\n\n")
		return
	}

	// Don't use custom event types - frontend uses onmessage which only receives default events
	// Event type is already in the JSON data as event.type
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
}

// getNextPendingStage finds the next stage that can be processed
func (m *SSEManager) getNextPendingStage(session *ProcessingSession) string {
	for _, stage := range session.Stages {
		if stage.Status == "pending" {
			// Check if dependencies are satisfied
			dependenciesMet := true
			for _, depID := range stage.Dependencies {
				if _, accepted := session.AcceptedVersions[depID]; !accepted {
					dependenciesMet = false
					break
				}
			}
			if dependenciesMet {
				return stage.ID
			}
		}
	}
	return ""
}

// subscribeToAIServiceProgress subscribes to Redis pub/sub for Python AI service progress updates
func (m *SSEManager) subscribeToAIServiceProgress() {
	m.logger.Info("Starting AI service progress subscriber")

	// Subscribe to studio:progress:* pattern
	pubsub := m.cacheService.Subscribe(m.ctx, "studio:progress:*")
	if pubsub == nil {
		m.logger.Error("Failed to subscribe to Redis pub/sub")
		return
	}

	ch := pubsub.Channel()

	for {
		select {
		case <-m.ctx.Done():
			m.logger.Info("AI service progress subscriber stopped")
			return
		case msg := <-ch:
			if msg == nil {
				continue
			}

			// Parse progress message from Python
			var progressData struct {
				EventType   string                 `json:"event_type"`
				JobID       string                 `json:"job_id"`
				StepID      string                 `json:"step_id"`
				StepName    string                 `json:"step_name"`
				Progress    int                    `json:"progress"`
				Message     string                 `json:"message"`
				PreviewURL  string                 `json:"preview_url"`
				PreviewType string                 `json:"preview_type"`
				Width       int                    `json:"width"`
				Height      int                    `json:"height"`
				Duration    float64                `json:"duration"`
				OutputURL   string                 `json:"output_url"`
				Metadata    map[string]interface{} `json:"metadata"`
				ErrorCode   string                 `json:"error_code"`
				ErrorMsg    string                 `json:"error_message"`
			}

			if err := json.Unmarshal([]byte(msg.Payload), &progressData); err != nil {
				m.logger.Error("Failed to parse progress data", zap.Error(err))
				continue
			}

			// Convert to StudioEvent and broadcast
			switch progressData.EventType {
			case "step_progress":
				// Update stage progress in session
				m.UpdateStageProgress(
					progressData.JobID,
					progressData.StepID,
					progressData.Progress,
					progressData.Message,
					nil,
				)

			case "preview_ready":
				// Create preview data
				preview := &PreviewData{
					Type:      progressData.PreviewType,
					Content:   progressData.PreviewURL,
					Quality:   0.85,
					IsPartial: false,
					StageID:   progressData.StepID,
				}

				// Broadcast preview_ready event
				stepID := progressData.StepID
				event := StudioEvent{
					ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
					Type:      "preview_ready",
					SessionID: progressData.JobID,
					JobID:     progressData.JobID,
					StageID:   &stepID,
					Preview:   preview,
					Data: map[string]interface{}{
						"previewUrl":  progressData.PreviewURL,
						"previewType": progressData.PreviewType,
						"width":       progressData.Width,
						"height":      progressData.Height,
						"duration":    progressData.Duration,
					},
					Timestamp: time.Now(),
				}
				m.BroadcastStudioEvent(event)

			case "step_complete":
				// Complete the stage
				m.CompleteStage(
					progressData.JobID,
					progressData.StepID,
					&PreviewData{
						Type:    "video_segment",
						Content: progressData.OutputURL,
						StageID: progressData.StepID,
					},
					nil, // suggestions
					[]ActionOption{
						{
							ID:      "accept",
							Type:    "accept",
							Label:   "Accept",
							Variant: "primary",
							Enabled: true,
						},
						{
							ID:      "retry",
							Type:    "regenerate",
							Label:   "Retry",
							Variant: "secondary",
							Enabled: true,
						},
					},
				)

			case "error":
				// Broadcast error event
				stepID := progressData.StepID
				event := StudioEvent{
					ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
					Type:      "error",
					SessionID: progressData.JobID,
					JobID:     progressData.JobID,
					StageID:   &stepID,
					Data: map[string]interface{}{
						"code":    progressData.ErrorCode,
						"message": progressData.ErrorMsg,
					},
					Timestamp: time.Now(),
				}
				m.BroadcastStudioEvent(event)
			}
		}
	}
}

func (m *SSEManager) checkJobUpdates(trackedJobs map[string]queue.JobResult) {
	m.mu.RLock()
	clientCount := len(m.clients)
	m.mu.RUnlock()

	if clientCount == 0 {
		// Clean up in-memory tracking when no clients
		for jobID, job := range trackedJobs {
			if time.Since(job.UpdatedAt) > 5*time.Minute {
				delete(trackedJobs, jobID)
			}
		}
		return
	}

	// Get all active job keys from Redis
	ctx := context.Background()
	keys, err := m.cacheService.GetKeys(ctx, "job_status:*")
	if err != nil {
		m.logger.Error("Failed to get job keys", zap.Error(err))
		return
	}

	// Track which jobs we see in this cycle
	seenJobs := make(map[string]bool)

	for _, key := range keys {
		jobID := key[11:] // Remove "job_status:" prefix
		seenJobs[jobID] = true

		var currentStatus queue.JobResult
		if err := m.cacheService.Get(ctx, key, &currentStatus); err != nil {
			// Job disappeared (probably TTL expired), remove from tracking
			delete(trackedJobs, jobID)
			continue
		}

		// Check if this job status has meaningfully changed
		if lastStatus, exists := trackedJobs[jobID]; !exists ||
			lastStatus.Status != currentStatus.Status ||
			(currentStatus.Status == "processing" && currentStatus.Progress != lastStatus.Progress) {

			// Only log significant changes to reduce noise
			if !exists {
				m.logger.Info("New job started",
					zap.String("job_id", jobID),
					zap.String("status", currentStatus.Status))
			} else if lastStatus.Status != currentStatus.Status {
				m.logger.Info("Job status changed",
					zap.String("job_id", jobID),
					zap.String("from", lastStatus.Status),
					zap.String("to", currentStatus.Status))
			} else if currentStatus.Status == "processing" && currentStatus.Progress-lastStatus.Progress >= 25 {
				// Only log every 25% progress to reduce noise
				m.logger.Info("Job progress",
					zap.String("job_id", jobID),
					zap.Int("progress", currentStatus.Progress))
			}

			// Notify clients of the change
			m.NotifyClients(currentStatus)
			trackedJobs[jobID] = currentStatus
		}
	}

	// Clean up jobs that no longer exist in Redis (TTL expired)
	for jobID := range trackedJobs {
		if !seenJobs[jobID] {
			delete(trackedJobs, jobID)
		}
	}
}
