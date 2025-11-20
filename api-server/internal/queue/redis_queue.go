// queue/redis_queue.go
package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type RedisQueueService struct {
	client       *redis.Client
	cacheService cache.RedisCache
	logger       *zap.Logger
	closeOnce    sync.Once

	// Job management
	activeJobs map[string]context.CancelFunc
	jobsMutex  sync.RWMutex

	// Consumer management
	consumers      map[string]context.CancelFunc
	consumersMutex sync.RWMutex

	// Scheduler for delayed jobs
	scheduler *JobScheduler
}

type Message struct {
	Type        string     `json:"type"`
	Payload     any        `json:"payload"`
	ID          string     `json:"id"`
	RetryCount  int        `json:"retry_count,omitempty"`
	QueueName   string     `json:"queue_name,omitempty"`
	ScheduledAt *time.Time `json:"scheduled_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type JobResult struct {
	ID        string        `json:"id"`
	Status    string        `json:"status"`
	Message   string        `json:"message,omitempty"`
	Progress  int           `json:"progress"`
	Result    any           `json:"result"`
	UpdatedAt time.Time     `json:"updated"`
	Error     string        `json:"error,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	Duration  time.Duration `json:"duration,omitempty"`
}

// JobStatusOption allows customizing job status updates
type JobStatusOption func(*JobResult)

func WithError(err error) JobStatusOption {
	return func(j *JobResult) {
		if err != nil {
			j.Status = err.Error()
			j.Error = err.Error()
		}
	}
}

func NewRedisQueue(client *redis.Client, cacheService cache.RedisCache, logger *zap.Logger) (*RedisQueueService, error) {
	service := &RedisQueueService{
		client:       client,
		cacheService: cacheService,
		logger:       logger,
		activeJobs:   make(map[string]context.CancelFunc),
		consumers:    make(map[string]context.CancelFunc),
	}

	// Initialize job scheduler
	scheduler := NewJobScheduler(service, logger)
	service.scheduler = scheduler

	// Start the scheduler
	go scheduler.Start()

	logger.Info("✅ Redis Queue Service initialized successfully")
	return service, nil
}

// Publish publishes a message to a queue
func (r *RedisQueueService) Publish(ctx context.Context, queueName string, message Message) (string, error) {
	// Generate ID if not provided
	fmt.Println("message ID is", message.ID)
	if message.ID == "" {
		message.ID = uuid.NewString()
	}

	message.QueueName = queueName
	message.CreatedAt = time.Now()

	// Check if this is a scheduled message
	if message.ScheduledAt != nil && message.ScheduledAt.After(time.Now()) {
		return r.scheduleMessage(ctx, queueName, message)
	}

	// Immediate publish to queue
	return r.publishImmediate(ctx, queueName, message)
}

// PublishScheduled publishes a message to be processed at a specific time
func (r *RedisQueueService) PublishScheduled(ctx context.Context, queueName string, message Message, scheduledAt time.Time) (string, error) {
	message.ScheduledAt = &scheduledAt
	return r.Publish(ctx, queueName, message)
}

// publishImmediate publishes message immediately to the queue
func (r *RedisQueueService) publishImmediate(ctx context.Context, queueName string, message Message) (string, error) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		return "", fmt.Errorf("failed to marshal message: %w", err)
	}

	// Use Redis Streams for reliable message delivery
	streamKey := fmt.Sprintf("queue:%s", queueName)

	// Add to stream with auto-generated ID
	result := r.client.XAdd(ctx, &redis.XAddArgs{
		Stream: streamKey,
		Values: map[string]any{
			"message_id": message.ID,
			"data":       string(messageBytes),
			"queue":      queueName,
			"created_at": message.CreatedAt.Unix(),
		},
	})

	if result.Err() != nil {
		return "", fmt.Errorf("failed to publish message to Redis stream: %w", result.Err())
	}

	// Set initial job status
	r.SetJobStatus(ctx, message.ID, "queued", 0, map[string]any{
		"message": "Job queued successfully",
		"queue":   queueName,
	})

	r.logger.Debug("Message published to queue",
		zap.String("queue", queueName),
		zap.String("message_id", message.ID),
		zap.String("stream_id", result.Val()))

	return message.ID, nil
}

// scheduleMessage schedules a message for future delivery
func (r *RedisQueueService) scheduleMessage(ctx context.Context, queueName string, message Message) (string, error) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		return "", fmt.Errorf("failed to marshal scheduled message: %w", err)
	}

	// Use sorted set for scheduled jobs
	scheduledKey := "scheduled_jobs"
	score := float64(message.ScheduledAt.Unix())

	// Store the message with its scheduled time as score
	err = r.client.ZAdd(ctx, scheduledKey, redis.Z{
		Score:  score,
		Member: string(messageBytes),
	}).Err()

	if err != nil {
		return "", fmt.Errorf("failed to schedule message: %w", err)
	}

	// Set initial job status
	r.SetJobStatus(ctx, message.ID, "scheduled", 0, map[string]interface{}{
		"message":      "Job scheduled successfully",
		"queue":        queueName,
		"scheduled_at": message.ScheduledAt.Format(time.RFC3339),
	})

	r.logger.Info("Message scheduled",
		zap.String("queue", queueName),
		zap.String("message_id", message.ID),
		zap.Time("scheduled_at", *message.ScheduledAt))

	return message.ID, nil
}

// Consume consumes messages from a queue
func (r *RedisQueueService) Consume(ctx context.Context, queueName string, handler func(context.Context, Message) error) error {
	streamKey := fmt.Sprintf("queue:%s", queueName)
	consumerGroup := fmt.Sprintf("%s_consumers", queueName)
	consumerName := fmt.Sprintf("consumer_%s_%d", queueName, time.Now().UnixNano())

	// Create consumer group if it doesn't exist
	r.client.XGroupCreateMkStream(ctx, streamKey, consumerGroup, "0")

	r.logger.Info("Starting Redis queue consumer",
		zap.String("queue", queueName),
		zap.String("consumer", consumerName))

	// Store consumer context for cancellation
	consumerCtx, cancel := context.WithCancel(ctx)
	r.consumersMutex.Lock()
	r.consumers[queueName] = cancel
	r.consumersMutex.Unlock()

	defer func() {
		r.consumersMutex.Lock()
		delete(r.consumers, queueName)
		r.consumersMutex.Unlock()
	}()

	for {
		select {
		case <-consumerCtx.Done():
			r.logger.Info("Consumer stopped", zap.String("queue", queueName))
			return nil
		default:
			// Read messages from stream
			result := r.client.XReadGroup(ctx, &redis.XReadGroupArgs{
				Group:    consumerGroup,
				Consumer: consumerName,
				Streams:  []string{streamKey, ">"},
				Count:    1,
				Block:    time.Second * 60, // 60 second timeout - background jobs can wait up to 1 min to start
			})

			if result.Err() != nil {
				if result.Err() == redis.Nil {
					continue // No messages, continue polling
				}
				r.logger.Error("Failed to read from stream", zap.Error(result.Err()))
				time.Sleep(time.Second)
				continue
			}

			// Process messages
			for _, stream := range result.Val() {
				for _, message := range stream.Messages {
					r.processMessage(consumerCtx, queueName, consumerGroup, message, handler)
				}
			}
		}
	}
}

// processMessage processes a single message from the stream
func (r *RedisQueueService) processMessage(
	ctx context.Context,
	queueName, consumerGroup string,
	streamMsg redis.XMessage,
	handler func(context.Context, Message) error,
) {
	// Extract message data
	messageData, ok := streamMsg.Values["data"].(string)
	if !ok {
		r.logger.Error("Invalid message format", zap.String("stream_id", streamMsg.ID))
		r.ackMessage(ctx, queueName, consumerGroup, streamMsg.ID)
		return
	}

	var msg Message
	if err := json.Unmarshal([]byte(messageData), &msg); err != nil {
		r.logger.Error("Failed to unmarshal message", zap.Error(err))
		r.ackMessage(ctx, queueName, consumerGroup, streamMsg.ID)
		return
	}

	// Check for duplicate processing
	r.jobsMutex.RLock()
	if _, exists := r.activeJobs[msg.ID]; exists {
		r.logger.Warn("Job already running, skipping", zap.String("job_id", msg.ID))
		r.ackMessage(ctx, queueName, consumerGroup, streamMsg.ID)
		r.jobsMutex.RUnlock()
		return
	}
	r.jobsMutex.RUnlock()

	// Acknowledge message immediately to prevent blocking (same as RabbitMQ approach)
	r.ackMessage(ctx, queueName, consumerGroup, streamMsg.ID)

	// Set job status to processing
	r.SetJobStatus(ctx, msg.ID, "accepted", 5, map[string]interface{}{
		"message": "Job accepted for processing",
		"queue":   queueName,
	})

	// Process asynchronously - NO TIMEOUT, jobs can run as long as needed
	go r.executeJob(ctx, msg, handler)
}

// executeJob executes a job asynchronously - SUPPORTS LONG-RUNNING JOBS
func (r *RedisQueueService) executeJob(ctx context.Context, msg Message, handler func(context.Context, Message) error) {
	// Use WithCancel (NOT WithTimeout) - jobs can run indefinitely
	jobCtx, cancel := context.WithCancel(ctx)

	// Register job for tracking and cancellation
	r.jobsMutex.Lock()
	r.activeJobs[msg.ID] = cancel
	r.jobsMutex.Unlock()

	// Cleanup when done
	defer func() {
		r.jobsMutex.Lock()
		delete(r.activeJobs, msg.ID)
		r.jobsMutex.Unlock()
		cancel()
	}()

	r.logger.Info("🔄 Starting job execution", zap.String("job_id", msg.ID))

	// Update status to processing
	r.SetJobStatus(jobCtx, msg.ID, "processing", 10, map[string]interface{}{
		"message":    "Job processing started",
		"started_at": time.Now().Unix(),
	})

	// Execute the job - NO TIMEOUT CONSTRAINT
	startTime := time.Now()
	err := handler(jobCtx, msg)
	duration := time.Since(startTime)

	if err != nil {
		// Check if it was cancelled
		if jobCtx.Err() == context.Canceled {
			r.logger.Info("❌ Job was cancelled", zap.String("job_id", msg.ID))
			r.SetJobStatus(context.Background(), msg.ID, "cancelled", 100, nil, WithError(err))
			return
		}

		// Check if it's a non-retryable error
		if IsNonRetryableError(err) {
			r.logger.Error("❌ Job failed with non-retryable error",
				zap.String("job_id", msg.ID),
				zap.Duration("duration", duration),
				zap.Error(err))
			r.SetJobStatus(context.Background(), msg.ID, "failed", 100, nil, WithError(err))
			return
		}

		// Handle retryable error
		r.handleRetryableError(ctx, msg, err)
		return
	}

	r.logger.Info("✅ Job completed successfully",
		zap.String("job_id", msg.ID),
		zap.Duration("duration", duration))

	// Get current status to preserve any results set during processing
	currentStatus, err := r.GetJobStatus(context.Background(), msg.ID)
	if err != nil {
		r.logger.Error("Failed to get current job status", zap.Error(err))
		r.SetJobStatus(context.Background(), msg.ID, "completed", 100, map[string]interface{}{
			"message":      "Job completed successfully",
			"duration":     duration.Seconds(),
			"completed_at": time.Now().Unix(),
		})
		return
	}

	// Preserve existing result if any
	var finalResult interface{}
	if currentStatus.Result != nil {
		finalResult = currentStatus.Result
	} else {
		finalResult = map[string]interface{}{
			"message":      "Job completed successfully",
			"duration":     duration.Seconds(),
			"completed_at": time.Now().Unix(),
		}
	}

	r.SetJobStatus(context.Background(), msg.ID, "completed", 100, finalResult)
}

// handleRetryableError handles retrying failed jobs
func (r *RedisQueueService) handleRetryableError(ctx context.Context, msg Message, err error) {
	maxRetries := 3
	if msg.RetryCount >= maxRetries {
		r.logger.Error("❌ Job failed after max retries",
			zap.String("job_id", msg.ID),
			zap.Int("retry_count", msg.RetryCount),
			zap.Error(err))
		r.SetJobStatus(ctx, msg.ID, "failed", 100, nil, WithError(err))
		return
	}

	// Calculate backoff delay
	backoffDelay := time.Duration(msg.RetryCount+1) * 30 * time.Second

	// Schedule retry
	msg.RetryCount++
	retryTime := time.Now().Add(backoffDelay)
	msg.ScheduledAt = &retryTime

	r.logger.Warn("⚠️ Job failed, scheduling retry",
		zap.String("job_id", msg.ID),
		zap.Int("retry_count", msg.RetryCount),
		zap.Duration("backoff", backoffDelay),
		zap.Error(err))

	// Schedule the retry
	if _, scheduleErr := r.scheduleMessage(ctx, msg.QueueName, msg); scheduleErr != nil {
		r.logger.Error("Failed to schedule retry", zap.Error(scheduleErr))
		r.SetJobStatus(ctx, msg.ID, "failed", 100, nil, WithError(err))
	} else {
		r.SetJobStatus(ctx, msg.ID, "retrying", 0, map[string]interface{}{
			"message":     fmt.Sprintf("Retry %d/%d scheduled", msg.RetryCount, maxRetries),
			"retry_count": msg.RetryCount,
			"retry_at":    retryTime.Format(time.RFC3339),
		})
	}
}

// ackMessage acknowledges a message in the stream and trims old entries
func (r *RedisQueueService) ackMessage(ctx context.Context, queueName, consumerGroup, messageID string) {
	streamKey := fmt.Sprintf("queue:%s", queueName)

	// Acknowledge the message
	err := r.client.XAck(ctx, streamKey, consumerGroup, messageID).Err()
	if err != nil {
		r.logger.Error("Failed to acknowledge message",
			zap.String("stream", streamKey),
			zap.String("message_id", messageID),
			zap.Error(err))
	}

	// Trim the stream to prevent unbounded growth
	// Keep last 1000 entries using approximate trimming (more efficient)
	// The "~" makes it approximate, allowing Redis to trim in a more efficient way
	trimErr := r.client.XTrimMaxLenApprox(ctx, streamKey, 1000, 0).Err()
	if trimErr != nil {
		r.logger.Warn("Failed to trim stream",
			zap.String("stream", streamKey),
			zap.Error(trimErr))
	}
}

// // SetJobStatus sets the status of a job
// func (r *RedisQueueService) SetJobStatus(ctx context.Context, jobID, status string, progress int, result any, opts ...JobStatusOption) {
// 	var existing JobResult
// 	r.cacheService.Get(ctx, fmt.Sprintf("job_status:%s", jobID), &existing)

// 	now := time.Now()

// 	jobResult := JobResult{
// 		ID:        jobID,
// 		Status:    status,
// 		Progress:  progress,
// 		Result:    result,
// 		UpdatedAt: now,
// 		CreatedAt: existing.CreatedAt,
// 		Duration:  now.Sub(existing.CreatedAt),
// 	}

// 	if jobResult.CreatedAt.IsZero() {
// 		jobResult.CreatedAt = now
// 	}

// 	// Apply options
// 	for _, opt := range opts {
// 		opt(&jobResult)
// 	}

// 	// Store job status in cache
// 	ttl := r.getTTLForJobType(result)
// 	r.cacheService.Set(ctx, fmt.Sprintf("job_status:%s", jobID), jobResult, ttl)
// }

func (r *RedisQueueService) SetJobStatus(ctx context.Context, jobID, status string, progress int, result any, opts ...JobStatusOption) {
	key := fmt.Sprintf("job_status:%s", jobID)

	// Check if job already exists to preserve CreatedAt
	var createdAt time.Time
	var existingJob JobResult

	if err := r.cacheService.Get(ctx, key, &existingJob); err == nil {
		// Preserve original CreatedAt
		createdAt = existingJob.CreatedAt
	} else {
		// New job
		createdAt = time.Now()
	}

	jobResult := JobResult{
		ID:        jobID,
		Status:    status,
		Progress:  progress,
		Result:    result,
		UpdatedAt: time.Now(),
		CreatedAt: createdAt,
	}

	// Apply any options
	for _, opt := range opts {
		opt(&jobResult)
	}

	// Set TTL based on status - this is the key fix
	var ttl time.Duration
	switch status {
	case "completed", "failed", "cancelled":
		ttl = 10 * time.Minute // Keep completed jobs longer for dependent jobs
	case "processing":
		ttl = 30 * time.Minute // Active jobs get more time
	default: // pending, queued, etc
		ttl = 15 * time.Minute // Default timeout
	}

	data, _ := json.Marshal(jobResult)
	r.cacheService.SetWithTTL(ctx, key, string(data), ttl)

	r.logger.Debug("Job status set with TTL",
		zap.String("job_id", jobID),
		zap.String("status", status),
		zap.Int("progress", progress),
		zap.Duration("ttl", ttl))
}

// One-time nuclear cleanup function - call this once to start fresh
func NukeAllJobStatus(ctx context.Context, cacheService cache.RedisCache, logger *zap.Logger) error {
	keys, err := cacheService.GetKeys(ctx, "job_status:*")
	if err != nil {
		return fmt.Errorf("failed to get job status keys: %w", err)
	}

	logger.Info("🧹 Nuking all existing job status keys", zap.Int("count", len(keys)))

	deletedCount := 0
	for _, key := range keys {
		if err := cacheService.Delete(ctx, key); err != nil {
			logger.Error("Failed to delete key", zap.String("key", key), zap.Error(err))
		} else {
			deletedCount++
		}
	}

	logger.Info("✅ Job status cleanup completed",
		zap.Int("deleted", deletedCount),
		zap.Int("total", len(keys)))

	return nil
}

// GetJobStatus gets the status of a job
func (r *RedisQueueService) GetJobStatus(ctx context.Context, jobID string) (JobResult, error) {
	var jobStatus JobResult
	if err := r.cacheService.Get(ctx, fmt.Sprintf("job_status:%s", jobID), &jobStatus); err != nil {
		if err.Error() == "key not found" {
			jobStatus.Message = "not_found"
			return jobStatus, nil
		}
		return JobResult{}, fmt.Errorf("failed to get job status: %w", err)
	}
	return jobStatus, nil
}

// CancelJob cancels a running job
func (r *RedisQueueService) CancelJob(ctx context.Context, jobID string) error {
	r.jobsMutex.RLock()
	if cancel, exists := r.activeJobs[jobID]; exists {
		r.jobsMutex.RUnlock()
		cancel()
		r.logger.Info("Job cancelled", zap.String("job_id", jobID))
		return nil
	}
	r.jobsMutex.RUnlock()

	return fmt.Errorf("job not found or not running: %s", jobID)
}

// StopConsumer stops a consumer for a specific queue
func (r *RedisQueueService) StopConsumer(queueName string) {
	r.consumersMutex.RLock()
	if cancel, exists := r.consumers[queueName]; exists {
		r.consumersMutex.RUnlock()
		cancel()
		r.logger.Info("Consumer stopped", zap.String("queue", queueName))
	} else {
		r.consumersMutex.RUnlock()
	}
}

// GetKeys returns keys matching a pattern (for compatibility)
func (r *RedisQueueService) GetKeys(ctx context.Context, pattern string) ([]string, error) {
	return r.client.Keys(ctx, pattern).Result()
}

// HealthCheck checks if Redis is available
func (r *RedisQueueService) HealthCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := r.client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis health check failed: %w", err)
	}

	return nil
}

// Close closes the Redis queue service
func (r *RedisQueueService) Close() {
	r.closeOnce.Do(func() {
		r.logger.Info("Closing Redis queue service")

		// Stop all consumers
		r.consumersMutex.RLock()
		for queueName, cancel := range r.consumers {
			cancel()
			r.logger.Info("Stopped consumer", zap.String("queue", queueName))
		}
		r.consumersMutex.RUnlock()

		// Cancel all active jobs
		r.jobsMutex.RLock()
		for jobID, cancel := range r.activeJobs {
			cancel()
			r.logger.Info("Cancelled job", zap.String("job_id", jobID))
		}
		r.jobsMutex.RUnlock()

		// Stop scheduler
		if r.scheduler != nil {
			r.scheduler.Stop()
		}

		r.logger.Info("Redis queue service closed")
	})
}

// getTTLForJobType returns appropriate TTL for different job types
func (r *RedisQueueService) getTTLForJobType(result any) time.Duration {
	if resultMap, ok := result.(map[string]interface{}); ok {
		if jobType, exists := resultMap["job_type"].(string); exists {
			switch jobType {
			case "enhancement", "narration", "story_video", "remove_noise", "optimization", "clipping":
				return 1 * time.Hour // Long-running jobs
			case "publish_post", "sync_post_metrics":
				return 48 * time.Hour // Social media jobs
			default:
				return 12 * time.Hour // Default
			}
		}
	}
	return 12 * time.Hour // Default TTL
}
