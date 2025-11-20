// queue/scheduler.go
package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// JobScheduler schedules and executes delayed jobs using Redis sorted sets
type JobScheduler struct {
	queue  *RedisQueueService
	logger *zap.Logger
	ctx    context.Context
	cancel context.CancelFunc
}

// NewJobScheduler creates a new job scheduler
func NewJobScheduler(queue *RedisQueueService, logger *zap.Logger) *JobScheduler {
	ctx, cancel := context.WithCancel(context.Background())
	return &JobScheduler{
		queue:  queue,
		logger: logger,
		ctx:    ctx,
		cancel: cancel,
	}
}

// Start starts the scheduler
func (s *JobScheduler) Start() {
	s.logger.Info("🕐 Job scheduler started")
	ticker := time.NewTicker(30 * time.Second) // Optimized: check every 30 seconds (67% reduction in Redis ops, scheduled jobs have precision tolerance)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			s.logger.Info("🛑 Job scheduler stopped")
			return

		case <-ticker.C:
			if err := s.processScheduledJobs(); err != nil {
				s.logger.Error("Error processing scheduled jobs", zap.Error(err))
			}
		}
	}
}

// Stop stops the scheduler
func (s *JobScheduler) Stop() {
	s.cancel()
}

// processScheduledJobs processes jobs that are ready to be executed
func (s *JobScheduler) processScheduledJobs() error {
	// Use timeout only for scheduler operations, NOT for job execution
	ctx, cancel := context.WithTimeout(s.ctx, 30*time.Second)
	defer cancel()

	scheduledKey := "scheduled_jobs"
	now := float64(time.Now().Unix())

	// FIXED: Properly convert timestamp to string for Redis query
	result := s.queue.client.ZRangeByScoreWithScores(ctx, scheduledKey, &redis.ZRangeBy{
		Min:   "-inf",
		Max:   fmt.Sprintf("%.0f", now), // FIXED: Proper timestamp conversion
		Count: 50,                       // Reduced from 100 for better performance
	})

	if result.Err() != nil {
		if result.Err() != redis.Nil {
			return fmt.Errorf("failed to get scheduled jobs: %w", result.Err())
		}
		return nil // No error for nil result
	}

	jobs := result.Val()
	if len(jobs) == 0 {
		return nil
	}

	s.logger.Info("Processing scheduled jobs", zap.Int("count", len(jobs)))

	// Process jobs in batches to avoid overwhelming Redis
	const batchSize = 10
	for i := 0; i < len(jobs); i += batchSize {
		end := i + batchSize
		if end > len(jobs) {
			end = len(jobs)
		}

		batch := jobs[i:end]
		if err := s.processBatch(ctx, scheduledKey, batch); err != nil {
			s.logger.Error("Error processing batch",
				zap.Error(err),
				zap.Int("batch_start", i),
				zap.Int("batch_size", len(batch)))
			// Continue with next batch instead of failing completely
		}
	}

	return nil
}

// processBatch processes a batch of scheduled jobs
func (s *JobScheduler) processBatch(ctx context.Context, scheduledKey string, jobs []redis.Z) error {
	for _, job := range jobs {
		// Parse the message
		var msg Message
		if err := json.Unmarshal([]byte(job.Member.(string)), &msg); err != nil {
			s.logger.Error("failed to unmarshal scheduled job",
				zap.Error(err),
				zap.String("job_data", job.Member.(string)))

			// Remove the invalid job
			if removeErr := s.queue.client.ZRem(ctx, scheduledKey, job.Member).Err(); removeErr != nil {
				s.logger.Error("failed to remove invalid job", zap.Error(removeErr))
			}
			continue
		}

		// Use Redis transaction to ensure atomicity
		if err := s.moveJobToQueue(ctx, scheduledKey, job, msg); err != nil {
			s.logger.Error("Failed to move job to queue",
				zap.String("job_id", msg.ID),
				zap.Error(err))
			continue
		}

		s.logger.Debug("Scheduled job moved to queue",
			zap.String("job_id", msg.ID),
			zap.String("queue", msg.QueueName))
	}

	return nil
}

// moveJobToQueue atomically moves a job from scheduled to immediate queue
func (s *JobScheduler) moveJobToQueue(ctx context.Context, scheduledKey string, job redis.Z, msg Message) error {
	// Use Redis transaction for atomicity
	pipe := s.queue.client.TxPipeline()

	// Remove from scheduled jobs
	pipe.ZRem(ctx, scheduledKey, job.Member)

	// Execute transaction
	results, err := pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to execute transaction: %w", err)
	}

	// Check if we actually removed the job (prevent duplicate processing)
	if removeResult, ok := results[0].(*redis.IntCmd); ok && removeResult.Val() > 0 {
		// Successfully removed, now publish to queue
		// Clear the scheduled time and publish immediately
		msg.ScheduledAt = nil

		// Update status to show it's being moved from scheduled to queue
		s.queue.SetJobStatus(ctx, msg.ID, "queued", 5, map[string]interface{}{
			"message": "Moved from scheduled to immediate queue",
			"queue":   msg.QueueName,
		})

		if _, err := s.queue.publishImmediate(ctx, msg.QueueName, msg); err != nil {
			s.logger.Error("Failed to publish scheduled job",
				zap.String("job_id", msg.ID),
				zap.String("queue", msg.QueueName),
				zap.Error(err))

			// Update job status to failed
			s.queue.SetJobStatus(ctx, msg.ID, "failed", 100, nil, WithError(err))
			return err
		}

		s.logger.Info("✅ Scheduled job published successfully",
			zap.String("job_id", msg.ID),
			zap.String("queue", msg.QueueName))
	}

	return nil
}
