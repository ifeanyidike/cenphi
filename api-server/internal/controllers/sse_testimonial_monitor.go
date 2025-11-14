// internal/controllers/sse_testimonial_monitor.go
package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"go.uber.org/zap"
)

// SSETestimonialMonitor handles real-time testimonial processing updates via SSE
type SSETestimonialMonitor struct {
	cacheService cache.RedisCache
	logger       *zap.Logger
	sseManager   *TestimonialSSEManager
}

// TestimonialSSEManager manages SSE connections for testimonial processing updates
type TestimonialSSEManager struct {
	clients      map[string]chan TestimonialSSEEvent
	mu           sync.RWMutex
	logger       *zap.Logger
	cacheService cache.RedisCache
	ctx          context.Context
	cancel       context.CancelFunc

	// Track processed jobs to avoid duplicate notifications
	processedJobs map[string]bool
	jobsMutex     sync.RWMutex
}

// TestimonialSSEEvent represents an event sent via SSE for testimonial processing
type TestimonialSSEEvent struct {
	Type          string      `json:"type"`
	TestimonialID string      `json:"testimonial_id,omitempty"`
	JobID         string      `json:"job_id,omitempty"`
	JobType       string      `json:"job_type,omitempty"`
	Status        string      `json:"status"`
	Progress      int         `json:"progress,omitempty"`
	Data          interface{} `json:"data,omitempty"`
	Error         string      `json:"error,omitempty"`
	Timestamp     int64       `json:"timestamp"`
}

func NewSSETestimonialMonitor(
	cacheService cache.RedisCache,
	logger *zap.Logger,
) *SSETestimonialMonitor {
	ctx, cancel := context.WithCancel(context.Background())

	sseManager := &TestimonialSSEManager{
		clients:       make(map[string]chan TestimonialSSEEvent),
		logger:        logger,
		cacheService:  cacheService,
		ctx:           ctx,
		cancel:        cancel,
		processedJobs: make(map[string]bool),
	}

	controller := &SSETestimonialMonitor{
		cacheService: cacheService,
		logger:       logger,
		sseManager:   sseManager,
	}

	// Start the background job monitoring system
	go controller.startJobMonitoringSystem()

	return controller
}

// ============================================================================
// SSE STREAM ENDPOINT
// ============================================================================

// StreamTestimonialProcessing handles SSE connections for real-time testimonial processing updates
func (c *SSETestimonialMonitor) StreamTestimonialProcessing(w http.ResponseWriter, r *http.Request) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Cache-Control")

	// Check if response writer supports flushing
	flusher, ok := w.(http.Flusher)
	if !ok {
		c.logger.Error("SSE not supported by this response writer")
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	// Generate unique client ID
	clientID := fmt.Sprintf("testimonial_monitor_%d", time.Now().UnixNano())
	c.logger.Info("New testimonial processing SSE client connected", zap.String("clientID", clientID))

	// Create channel for this client
	clientChan := make(chan TestimonialSSEEvent, 100)

	// Register client
	c.sseManager.mu.Lock()
	c.sseManager.clients[clientID] = clientChan
	c.sseManager.mu.Unlock()

	// Send initial connection message
	c.writeSSEEvent(w, TestimonialSSEEvent{
		Type: "connected",
		Data: map[string]interface{}{
			"message":   "Testimonial processing monitor connected",
			"client_id": clientID,
			"capabilities": []string{
				"testimonial_job_updates",
				"transcription_completed",
				"sentiment_analysis_completed",
				"highlight_extraction_completed",
				"content_enhancement_completed",
			},
		},
		Timestamp: time.Now().Unix(),
	})
	flusher.Flush()

	// Handle client disconnection
	defer func() {
		c.sseManager.mu.Lock()
		delete(c.sseManager.clients, clientID)
		close(clientChan)
		c.sseManager.mu.Unlock()
		c.logger.Info("Testimonial processing SSE client disconnected", zap.String("clientID", clientID))
	}()

	// Listen for events or client disconnect
	for {
		select {
		case <-r.Context().Done():
			return
		case event := <-clientChan:
			c.writeSSEEvent(w, event)
			flusher.Flush()
		case <-time.After(30 * time.Second):
			// Send heartbeat every 30 seconds
			c.writeSSEEvent(w, TestimonialSSEEvent{
				Type:      "heartbeat",
				Timestamp: time.Now().Unix(),
			})
			flusher.Flush()
		}
	}
}

// ============================================================================
// JOB MONITORING SYSTEM
// ============================================================================

// startJobMonitoringSystem monitors Redis for testimonial job completions
func (c *SSETestimonialMonitor) startJobMonitoringSystem() {
	c.logger.Info("Starting testimonial job monitoring system (pub/sub mode only)")

	// DISABLED: Polling system is redundant with pub/sub
	// The SSE manager's subscribeToAIServiceProgress() already handles all job updates via Redis pub/sub
	// This polling was causing 8M+ Redis commands per day by scanning job_status:* keys every 2 seconds
	//
	// ticker := time.NewTicker(2 * time.Second) // Check every 2 seconds
	// defer ticker.Stop()
	// for {
	// 	select {
	// 	case <-c.sseManager.ctx.Done():
	// 		c.logger.Info("Testimonial job monitoring system stopped")
	// 		return
	// 	case <-ticker.C:
	// 		c.checkTestimonialJobUpdates()
	// 	}
	// }

	// Just keep the service alive - pub/sub handles all updates
	<-c.sseManager.ctx.Done()
	c.logger.Info("Testimonial job monitoring system stopped")
}

// checkTestimonialJobUpdates checks for job status changes and notifies clients
func (c *SSETestimonialMonitor) checkTestimonialJobUpdates() {
	c.sseManager.mu.RLock()
	clientCount := len(c.sseManager.clients)
	c.sseManager.mu.RUnlock()

	if clientCount == 0 {
		return // No clients connected
	}

	// Get all job status keys from Redis
	ctx := context.Background()
	keys, err := c.cacheService.GetKeys(ctx, "job_status:*")
	if err != nil {
		c.logger.Error("Failed to get job keys", zap.Error(err))
		return
	}

	for _, key := range keys {
		jobID := key[11:] // Remove "job_status:" prefix

		// Skip if we've already processed this job
		c.sseManager.jobsMutex.RLock()
		alreadyProcessed := c.sseManager.processedJobs[jobID]
		c.sseManager.jobsMutex.RUnlock()

		if alreadyProcessed {
			continue
		}

		var jobStatus queue.JobResult
		if err := c.cacheService.Get(ctx, key, &jobStatus); err != nil {
			continue
		}

		// Only process completed or failed testimonial jobs
		if jobStatus.Status != "completed" && jobStatus.Status != "failed" {
			continue
		}

		// Check if this is a testimonial-related job
		testimonialID, jobType := c.extractTestimonialJobInfo(jobStatus)
		if testimonialID == "" {
			continue // Not a testimonial job
		}

		// Mark as processed to avoid duplicates
		c.sseManager.jobsMutex.Lock()
		c.sseManager.processedJobs[jobID] = true
		c.sseManager.jobsMutex.Unlock()

		// Create appropriate event based on job type and status
		event := c.createTestimonialJobEvent(testimonialID, jobID, jobType, jobStatus)
		c.broadcastEvent(event)

		c.logger.Info("Testimonial job update sent",
			zap.String("job_id", jobID),
			zap.String("job_type", jobType),
			zap.String("testimonial_id", testimonialID),
			zap.String("status", jobStatus.Status))
	}
}

// extractTestimonialJobInfo extracts testimonial ID and job type from job result
func (c *SSETestimonialMonitor) extractTestimonialJobInfo(jobResult queue.JobResult) (testimonialID, jobType string) {
	// Define testimonial job types
	testimonialJobTypes := map[string]bool{
		"transcription":        true,
		"sentiment_analysis":   true,
		"highlight_extraction": true,
		"content_enhancement":  true,
	}

	// Try to extract from job result data
	if result, ok := jobResult.Result.(map[string]interface{}); ok {
		// Direct extraction from enhanced result structure
		if tid, exists := result["testimonial_id"]; exists {
			if testimonialIDStr, ok := tid.(string); ok {
				testimonialID = testimonialIDStr
			}
		}

		if jt, exists := result["job_type"]; exists {
			if jobTypeStr, ok := jt.(string); ok {
				jobType = jobTypeStr
			}
		}

		// Fallback: try to extract from nested payload
		if testimonialID == "" || jobType == "" {
			if payload, exists := result["payload"]; exists {
				if payloadMap, ok := payload.(map[string]interface{}); ok {
					if tid, exists := payloadMap["testimonial_id"]; exists {
						if testimonialIDStr, ok := tid.(string); ok {
							testimonialID = testimonialIDStr
						}
					}
					if jt, exists := payloadMap["type"]; exists {
						if jobTypeStr, ok := jt.(string); ok {
							jobType = jobTypeStr
						}
					}
				}
			}
		}
	}

	// Validate that this is actually a testimonial job
	if !testimonialJobTypes[jobType] {
		return "", ""
	}

	return testimonialID, jobType
}

// createTestimonialJobEvent creates an appropriate SSE event for the job completion
func (c *SSETestimonialMonitor) createTestimonialJobEvent(testimonialID, jobID, jobType string, jobResult queue.JobResult) TestimonialSSEEvent {
	baseEvent := TestimonialSSEEvent{
		TestimonialID: testimonialID,
		JobID:         jobID,
		JobType:       jobType,
		Status:        jobResult.Status,
		Progress:      jobResult.Progress,
		Timestamp:     time.Now().Unix(),
	}

	if jobResult.Status == "failed" {
		baseEvent.Type = fmt.Sprintf("%s_failed", jobType)
		baseEvent.Error = jobResult.Error
		baseEvent.Data = map[string]interface{}{
			"message": fmt.Sprintf("%s processing failed", jobType),
		}
		return baseEvent
	}

	// Handle successful completions based on job type
	switch jobType {
	case "transcription":
		baseEvent.Type = "transcription_completed"
		if result, ok := jobResult.Result.(map[string]interface{}); ok {
			baseEvent.Data = map[string]interface{}{
				"transcript":  result["transcript"],
				"segments":    result["segments"],
				"confidence":  result["confidence"],
				"duration":    result["duration"],
				"artifact_id": result["artifact_id"],
			}
		}

	case "sentiment_analysis":
		baseEvent.Type = "sentiment_analysis_completed"
		if result, ok := jobResult.Result.(map[string]interface{}); ok {
			if sentimentResult, exists := result["sentiment_result"]; exists {
				baseEvent.Data = map[string]interface{}{
					"sentiment_result": sentimentResult,
					"artifact_id":      result["artifact_id"],
				}
			}
		}

	case "highlight_extraction":
		baseEvent.Type = "highlights_extracted"
		if result, ok := jobResult.Result.(map[string]interface{}); ok {
			baseEvent.Data = map[string]interface{}{
				"highlights":  result["highlights"],
				"artifact_id": result["artifact_id"],
			}
		}

	case "content_enhancement":
		baseEvent.Type = "content_enhanced"
		if result, ok := jobResult.Result.(map[string]interface{}); ok {
			baseEvent.Data = map[string]interface{}{
				"enhanced_content": result["enhanced_content"],
				"artifact_id":      result["artifact_id"],
			}
		}

	default:
		baseEvent.Type = "job_completed"
		baseEvent.Data = jobResult.Result
	}

	return baseEvent
}

// ============================================================================
// UTILITY METHODS
// ============================================================================

func (c *SSETestimonialMonitor) writeSSEEvent(w http.ResponseWriter, event TestimonialSSEEvent) {
	jsonData, err := json.Marshal(event)
	if err != nil {
		c.logger.Error("Failed to marshal SSE event", zap.Error(err))
		fmt.Fprintf(w, "event: error\n")
		fmt.Fprintf(w, "data: {\"error\": \"Failed to marshal event data\"}\n\n")
		return
	}

	eventType := event.Type
	if eventType == "" {
		eventType = "testimonial_update"
	}

	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
}

func (c *SSETestimonialMonitor) broadcastEvent(event TestimonialSSEEvent) {
	c.sseManager.mu.RLock()
	defer c.sseManager.mu.RUnlock()

	for clientID, clientChan := range c.sseManager.clients {
		select {
		case clientChan <- event:
			// Successfully sent
		default:
			// Channel is full, skip this client
			c.logger.Warn("SSE client channel full, skipping testimonial event",
				zap.String("clientID", clientID),
				zap.String("event_type", event.Type))
		}
	}
}

// HandleStreamingOptions handles CORS preflight requests for SSE
func (c *SSETestimonialMonitor) HandleStreamingOptions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")
	w.Header().Set("Access-Control-Max-Age", "3600")
	w.WriteHeader(http.StatusOK)
}

// GetTestimonialProcessingStatus returns current processing status for a testimonial
func (c *SSETestimonialMonitor) GetTestimonialProcessingStatus(w http.ResponseWriter, r *http.Request) {
	testimonialIDStr := r.URL.Query().Get("testimonial_id")
	if testimonialIDStr == "" {
		http.Error(w, "testimonial_id query parameter is required", http.StatusBadRequest)
		return
	}

	testimonialID, err := uuid.Parse(testimonialIDStr)
	if err != nil {
		http.Error(w, "Invalid testimonial_id format", http.StatusBadRequest)
		return
	}

	// Get all job statuses from cache that relate to this testimonial
	ctx := context.Background()
	keys, err := c.cacheService.GetKeys(ctx, "job_status:*")
	if err != nil {
		c.logger.Error("Failed to get job keys", zap.Error(err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	testimonialJobs := make(map[string]interface{})
	completedJobs := []string{}
	pendingJobs := []string{}
	failedJobs := []string{}

	for _, key := range keys {
		var jobStatus queue.JobResult
		if err := c.cacheService.Get(ctx, key, &jobStatus); err != nil {
			continue
		}

		// Check if this job belongs to our testimonial
		jobTestimonialID, jobType := c.extractTestimonialJobInfo(jobStatus)
		if jobTestimonialID != testimonialID.String() {
			continue
		}

		testimonialJobs[jobType] = map[string]interface{}{
			"job_id":   jobStatus.ID,
			"status":   jobStatus.Status,
			"progress": jobStatus.Progress,
			"result":   jobStatus.Result,
			"error":    jobStatus.Error,
		}

		switch jobStatus.Status {
		case "completed":
			completedJobs = append(completedJobs, jobType)
		case "failed":
			failedJobs = append(failedJobs, jobType)
		case "pending", "processing":
			pendingJobs = append(pendingJobs, jobType)
		}
	}

	status := map[string]interface{}{
		"testimonial_id": testimonialID.String(),
		"jobs":           testimonialJobs,
		"completed_jobs": completedJobs,
		"pending_jobs":   pendingJobs,
		"failed_jobs":    failedJobs,
		"last_updated":   time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// Cleanup closes all connections and stops the monitoring system
func (c *SSETestimonialMonitor) Cleanup() {
	if c.sseManager != nil {
		c.sseManager.cancel()
	}
}
