package sse

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"go.uber.org/zap"
)

type SSEManager struct {
	clients      map[string]chan queue.JobResult
	mu           sync.RWMutex
	logger       *zap.Logger
	cacheService cache.RedisCache
	ctx          context.Context
	cancel       context.CancelFunc
}

func NewSSEManager(cacheService cache.RedisCache, logger *zap.Logger) *SSEManager {
	ctx, cancel := context.WithCancel(context.Background())
	manager := &SSEManager{
		clients:      make(map[string]chan queue.JobResult),
		logger:       logger,
		cacheService: cacheService,
		ctx:          ctx,
		cancel:       cancel,
	}

	go manager.startSSENotificationSystem()
	return manager
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

		case <-time.After(30 * time.Second):
			// Send heartbeat every 30 seconds
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
