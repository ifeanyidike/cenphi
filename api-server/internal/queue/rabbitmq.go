package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type RabbitMQService struct {
	conn           *amqp.Connection
	publishChannel *amqp.Channel
	existingQueues map[string]struct{}
	mu             sync.Mutex
	logger         *zap.Logger
	closeOnce      sync.Once
	cacheService   cache.RedisCache

	activeJobs map[string]context.CancelFunc
	jobsMutex  sync.RWMutex
}

func NewRabbitMQ(config config.RabbitMQConfig, logger *zap.Logger, cacheService cache.RedisCache) (*RabbitMQService, error) {
	url := fmt.Sprintf("amqp://%s:%s@%s:%d%s",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		config.VHost,
	)
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to create publish channel: %w", err)
	}

	return &RabbitMQService{
		conn:           conn,
		publishChannel: ch,
		existingQueues: make(map[string]struct{}),
		logger:         logger,
		cacheService:   cacheService,
		activeJobs:     make(map[string]context.CancelFunc),
	}, nil
}

func (q *RabbitMQService) createConsumerChannel() (*amqp.Channel, error) {
	ch, err := q.conn.Channel()
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer channel: %w", err)
	}

	// Set QoS to process one message at a time per consumer
	if err := ch.Qos(10, 0, false); err != nil {
		ch.Close()
		return nil, fmt.Errorf("failed to set QoS: %w", err)
	}

	return ch, nil
}

func (q *RabbitMQService) declareQueueIfNeeded(ch *amqp.Channel, name string) error {
	q.mu.Lock()
	defer q.mu.Unlock()

	// First try to declare queue without arguments (to match existing queues)
	_, err := ch.QueueDeclare(
		name,  // name
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // no arguments first
	)

	if err != nil {
		// If that fails, try with TTL arguments (for new queues)
		_, err = ch.QueueDeclare(
			name,  // name
			true,  // durable
			false, // delete when unused
			false, // exclusive
			false, // no-wait
			amqp.Table{
				"x-message-ttl": 24 * 60 * 60 * 1000, // 24 hours in milliseconds
			}, // arguments
		)

		if err != nil {
			return fmt.Errorf("failed to declare queue %s: %w", name, err)
		}

		q.logger.Info("Created new queue with TTL", zap.String("queue", name))
	} else {
		q.logger.Info("Using existing queue", zap.String("queue", name))
	}

	q.existingQueues[name] = struct{}{}
	return nil
}

func (q *RabbitMQService) Publish(ctx context.Context, name string, message Message) (string, error) {
	if err := q.declareQueueIfNeeded(q.publishChannel, name); err != nil {
		q.logger.Error(fmt.Sprintf("%s queue declaration failed", name), zap.Error(err))
		return "", err
	}

	if message.ID == "" {
		message.ID = uuid.NewString()
	}

	body, err := json.Marshal(message)
	if err != nil {
		q.logger.Error("JSON marshall failed: ", zap.Error(err))
		return "", err
	}
	log.Printf("message type %s\n", message.Type)
	// Add retry count to headers
	headers := amqp.Table{
		"retry_count": int32(message.RetryCount),
	}

	return message.ID, q.publishChannel.PublishWithContext(ctx, "", name, false, false, amqp.Publishing{
		ContentType:  "application/json",
		Body:         body,
		DeliveryMode: amqp.Persistent,
		Timestamp:    time.Now(),
		MessageId:    message.ID,
		Headers:      headers,
	})
}

func (q *RabbitMQService) Consume(ctx context.Context, name string, handler func(context.Context, Message) error) error {
	ch, err := q.createConsumerChannel()
	if err != nil {
		return fmt.Errorf("failed to create consumer channel: %w", err)
	}
	defer ch.Close()

	if err := q.declareQueueIfNeeded(ch, name); err != nil {
		return err
	}

	consumerTag := fmt.Sprintf("%s-async-consumer-%s", name, uuid.NewString()[:8])

	msgs, err := ch.Consume(
		name,        // queue
		consumerTag, // consumer tag
		false,       // auto-ack
		false,       // exclusive
		false,       // no-local
		false,       // no-wait
		nil,         // args
	)
	if err != nil {
		return fmt.Errorf("failed to consume from queue %s: %w", name, err)
	}

	q.logger.Info("🚀 Async Consumer started",
		zap.String("queue", name),
		zap.String("consumer_tag", consumerTag))

	defer func() {
		ch.Cancel(consumerTag, false)
		q.logger.Info("🛑 Async Consumer stopped",
			zap.String("queue", name),
			zap.String("consumer_tag", consumerTag))
	}()

	for {
		select {
		case <-ctx.Done():
			q.logger.Info("Shutting down async consumer for queue", zap.String("queue", name))
			return nil
		case d, ok := <-msgs:
			if !ok {
				q.logger.Warn("Message channel closed", zap.String("queue", name))
				return nil
			}

			// Process message quickly and asynchronously
			go func(delivery amqp.Delivery) {
				err := q.processAsyncMessage(ctx, delivery, name, handler)
				if err != nil {
					q.logger.Error("Async message processing failed", zap.Error(err))
				}
			}(d)
		}
	}
}

func (q *RabbitMQService) processAsyncMessage(
	ctx context.Context,
	delivery amqp.Delivery,
	queueName string,
	handler func(context.Context, Message) error,
) error {
	var msg Message
	if err := json.Unmarshal(delivery.Body, &msg); err != nil {
		q.logger.Error("Failed to unmarshal message", zap.Error(err))
		delivery.Nack(false, false)
		return err
	}

	// Check if this job is already running (prevent duplicates)
	q.jobsMutex.RLock()
	if _, exists := q.activeJobs[msg.ID]; exists {
		q.logger.Warn("Job already running, skipping", zap.String("job_id", msg.ID))
		delivery.Ack(false) // Acknowledge to prevent redelivery
		q.jobsMutex.RUnlock()
		return nil
	}
	q.jobsMutex.RUnlock()

	// IMMEDIATELY acknowledge the message to free up RabbitMQ
	delivery.Ack(false)
	q.logger.Info("✅ Message acknowledged immediately",
		zap.String("job_id", msg.ID),
		zap.String("queue", queueName))

	// Set initial job status
	q.SetJobStatus(ctx, msg.ID, "accepted", 0, map[string]interface{}{
		"message": "Job accepted and queued for processing",
		"queue":   queueName,
	})

	// Start async processing
	go q.executeJobAsync(ctx, msg, handler)

	return nil
}

func (q *RabbitMQService) executeJobAsync(ctx context.Context, msg Message, handler func(context.Context, Message) error) {
	jobCtx, cancel := context.WithCancel(ctx)

	// Register the job for tracking and cancellation
	q.jobsMutex.Lock()
	q.activeJobs[msg.ID] = cancel
	q.jobsMutex.Unlock()

	// Clean up when done
	defer func() {
		q.jobsMutex.Lock()
		delete(q.activeJobs, msg.ID)
		q.jobsMutex.Unlock()
		cancel()
	}()

	q.logger.Info("🔄 Starting async job execution", zap.String("job_id", msg.ID))

	// Update status to processing
	q.SetJobStatus(jobCtx, msg.ID, "processing", 5, map[string]interface{}{
		"message":    "Job processing started",
		"started_at": time.Now().Unix(),
	})

	// Execute the actual job (NO TIMEOUT HERE - let it run as long as needed)
	startTime := time.Now()
	err := handler(jobCtx, msg)
	duration := time.Since(startTime)

	if err != nil {
		// Check if it was a cancellation
		if jobCtx.Err() == context.Canceled {
			q.logger.Info("❌ Job was cancelled", zap.String("job_id", msg.ID))
			q.SetJobStatus(context.Background(), msg.ID, "cancelled", 100, nil, WithError(err))
			return
		}

		q.logger.Error("❌ Job failed",
			zap.String("job_id", msg.ID),
			zap.Duration("duration", duration),
			zap.Error(err))

		q.SetJobStatus(context.Background(), msg.ID, "failed", 100, nil, WithError(err))
		return
	}

	q.logger.Info("✅ Job completed successfully",
		zap.String("job_id", msg.ID),
		zap.Duration("duration", duration))

	// q.SetJobStatus(context.Background(), msg.ID, "completed", 100, map[string]interface{}{
	// 	"message":          "Job completed successfully",
	// 	"duration": duration.Seconds(),
	// 	"completed_at":     time.Now().Unix(),
	// })
	currentStatus, err := q.GetJobStatus(context.Background(), msg.ID)
	if err != nil {
		q.logger.Error("Failed to get current job status", zap.Error(err))
		// Fallback to generic completion if we can't get current status
		q.SetJobStatus(context.Background(), msg.ID, "completed", 100, map[string]interface{}{
			"message":      "Job completed successfully",
			"duration":     duration.Seconds(),
			"completed_at": time.Now().Unix(),
		})
		return
	}

	var finalResult interface{}
	if currentStatus.Result != nil {
		if resultMap, ok := currentStatus.Result.(map[string]interface{}); ok {
			// Add completion metadata to existing results
			resultMap["duration"] = duration.Seconds()
			resultMap["completed_at"] = time.Now().Unix()
			if resultMap["message"] == nil || resultMap["message"] == "" {
				resultMap["message"] = "Job completed successfully"
			}
			finalResult = resultMap
		} else {
			// Handler result is not a map, wrap it
			finalResult = map[string]interface{}{
				"data":         currentStatus.Result,
				"message":      "Job completed successfully",
				"duration":     duration.Seconds(),
				"completed_at": time.Now().Unix(),
			}
		}
	} else {
		// No handler results, use generic completion
		finalResult = map[string]interface{}{
			"message":      "Job completed successfully",
			"duration":     duration.Seconds(),
			"completed_at": time.Now().Unix(),
		}
	}

	// Set final status with preserved/enhanced results
	q.SetJobStatus(context.Background(), msg.ID, "completed", 100, finalResult)
}

// ADD this method for job cancellation:
func (q *RabbitMQService) CancelJob(ctx context.Context, jobID string) error {
	q.jobsMutex.RLock()
	cancel, exists := q.activeJobs[jobID]
	q.jobsMutex.RUnlock()

	if !exists {
		return fmt.Errorf("job %s not found or not running", jobID)
	}

	cancel()
	q.logger.Info("🛑 Job cancellation requested", zap.String("job_id", jobID))
	return nil
}

func (q *RabbitMQService) GetKeys(ctx context.Context, pattern string) ([]string, error) {
	return q.cacheService.GetKeys(ctx, pattern)
}

func (q *RabbitMQService) Close() {
	q.closeOnce.Do(func() {
		q.logger.Info("Closing queue service")

		if q.publishChannel != nil {
			q.publishChannel.Close()
		}
		if q.conn != nil {
			q.conn.Close()
		}

		q.logger.Info("Queue service closed")
	})
}

func (q *RabbitMQService) SetJobStatus(ctx context.Context, jobID, status string, progress int, result any, opts ...JobStatusOption) {
	var existing JobResult
	q.cacheService.Get(ctx, fmt.Sprintf("job_status:%s", jobID), &existing)

	now := time.Now()

	jobResult := JobResult{
		ID:        jobID,
		Status:    status,
		Progress:  progress,
		Result:    result,
		UpdatedAt: now,
		CreatedAt: existing.CreatedAt,
		Duration:  now.Sub(existing.CreatedAt),
	}

	if jobResult.CreatedAt.IsZero() {
		jobResult.CreatedAt = now
	}

	for _, opt := range opts {
		opt(&jobResult)
	}

	// Store job status in cache/database
	ttl := q.getTTLForJobType(result)
	q.cacheService.Set(ctx, fmt.Sprintf("job_status:%s", jobID), jobResult, ttl)
}

func (q *RabbitMQService) GetJobStatus(ctx context.Context, jobID string) (JobResult, error) {
	var jobStatus JobResult
	if err := q.cacheService.Get(ctx, fmt.Sprintf("job_status:%s", jobID), &jobStatus); err != nil {
		if err == redis.Nil {
			jobStatus.Message = "not_found"
			return jobStatus, nil
		}
		return JobResult{}, fmt.Errorf("failed to get job status: %w", err)
	}
	return jobStatus, nil
}

func (q *RabbitMQService) HealthCheck() error {
	if q.conn == nil {
		return fmt.Errorf("no connection to RabbitMQ")
	}

	if q.conn.IsClosed() {
		return fmt.Errorf("RabbitMQ connection is closed")
	}

	// Try to create a temporary channel to test connectivity
	ch, err := q.conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to create test channel: %w", err)
	}
	defer ch.Close()

	return nil
}

func (q *RabbitMQService) getTTLForJobType(result any) time.Duration {
	if resultMap, ok := result.(map[string]interface{}); ok {
		if jobType, exists := resultMap["job_type"]; exists {
			switch jobType {
			// Testimonial collection jobs (immediate)
			case "transcription", "sentiment_analysis", "highlight_extraction":
				return 6 * time.Hour
			// Sharing package jobs (can be long-running)
			case "publish_post", "sync_post_metrics", "refresh_account_token":
				return 7 * 24 * time.Hour // Longer for social media jobs
			}
		}
	}
	return 24 * time.Hour // Default
}
