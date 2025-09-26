// internal/ai/ai_worker.go
package ai

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

type SourceParam struct {
	mediaURL           string
	testimonialID      uuid.UUID
	artifactID         uuid.UUID
	artifact           *models.TestimonialArtifact
	content            string
	transcriptSegments models.TranscriptSegments
	processedSegments  []*pb.ProcessedSegment
	startTime          *float64
	endTime            *float64
}

// CircuitBreaker prevents infinite retries
type CircuitBreaker struct {
	failures    int
	lastFailure time.Time
	state       string // "CLOSED", "OPEN", "HALF_OPEN"
	threshold   int
	timeout     time.Duration
	mutex       sync.RWMutex
	logger      *zap.Logger
}

func NewCircuitBreaker(threshold int, timeout time.Duration, logger *zap.Logger) *CircuitBreaker {
	return &CircuitBreaker{
		threshold: threshold,
		timeout:   timeout,
		state:     "CLOSED",
		logger:    logger,
	}
}

func (cb *CircuitBreaker) Call(fn func() error) error {
	// Lock only to CHECK state, not during execution
	cb.mutex.RLock()
	currentState := cb.state
	lastFailure := cb.lastFailure
	cb.mutex.RUnlock()

	if currentState == "OPEN" {
		if time.Since(lastFailure) > cb.timeout {
			// Try to transition to HALF_OPEN
			cb.mutex.Lock()
			if cb.state == "OPEN" { // Double-check after acquiring write lock
				cb.state = "HALF_OPEN"
				cb.logger.Info("🔄 Circuit breaker attempting reset")
			}
			cb.mutex.Unlock()
		} else {
			remaining := cb.timeout - time.Since(lastFailure)
			return &queue.NonRetryableError{
				Message: fmt.Sprintf("circuit breaker OPEN, %v remaining", remaining),
			}
		}
	}

	// Execute the function WITHOUT holding any locks
	err := fn()

	// Lock only to UPDATE state after execution
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	if err != nil {
		cb.failures++
		cb.lastFailure = time.Now()
		if cb.failures >= cb.threshold {
			cb.state = "OPEN"
			cb.logger.Error("🔴 Circuit breaker OPEN due to repeated failures",
				zap.Int("failures", cb.failures))
		}
		return err
	}

	// Success - reset circuit breaker
	if cb.failures > 0 {
		cb.logger.Info("✅ Circuit breaker reset - service restored")
	}
	cb.failures = 0
	cb.state = "CLOSED"
	return nil
}

type AIQueueWorker struct {
	queueService queue.Service
	queues       []string

	cacheService   cache.RedisCache
	logger         *zap.Logger
	ctx            context.Context
	cancel         context.CancelFunc
	wg             sync.WaitGroup
	circuitBreaker *CircuitBreaker
	db             *sql.DB

	aiService         AIServiceManager
	mediaIntelligence MediaIntelligence

	workspaceRepo         repositories.WorkspaceRepository
	testimonialRepo       repositories.TestimonialRepository
	artifactRepo          repositories.TestimonialArtifactRepository
	jobRepo               repositories.JobRepository
	activeCancelFunctions map[string]context.CancelFunc
	mu                    sync.RWMutex
	sseNotifier           *sse.SSEManager
}

func NewAIQueueWorker(ctx context.Context,
	queueService queue.Service,
	aiService AIServiceManager,
	mediaIntelligence MediaIntelligence,
	cacheService cache.RedisCache,
	db *sql.DB,
	workspaceRepo repositories.WorkspaceRepository,
	testimonialRepo repositories.TestimonialRepository,
	artifactRepo repositories.TestimonialArtifactRepository,
	jobRepo repositories.JobRepository,
	logger *zap.Logger,
	sseNotifier *sse.SSEManager,
) *AIQueueWorker {
	workerCtx, cancel := context.WithCancel(ctx)

	return &AIQueueWorker{
		queueService:      queueService,
		mediaIntelligence: mediaIntelligence,
		aiService:         aiService,
		cacheService:      cacheService,
		logger:            logger,
		ctx:               workerCtx,
		cancel:            cancel,
		db:                db,
		workspaceRepo:     workspaceRepo,
		testimonialRepo:   testimonialRepo,
		jobRepo:           jobRepo,
		artifactRepo:      artifactRepo,

		circuitBreaker: NewCircuitBreaker(5, 5*time.Minute, logger), // 3 failures, 5 min timeout
		queues: []string{
			"enhancement",
			"narration",
			"clipping",
			"platform_optimizer",
			"story_video",
			"remove_noise",

			"transcription",
			"sentiment_analysis",
			"highlight_extraction",
		},
		sseNotifier: sseNotifier,
	}
}

func (qw *AIQueueWorker) Start() error {
	qw.logger.Info("🚀 Starting AI Queue Worker with circuit breaker protection")

	// Health check first
	if err := qw.queueService.HealthCheck(); err != nil {
		qw.logger.Warn("Queue service health check failed, continuing anyway", zap.Error(err))
	}

	// Add a small delay between starting workers to avoid connection conflicts
	for i, queueName := range qw.queues {
		qw.wg.Add(1)

		// Add a small delay between workers to avoid startup conflicts
		time.Sleep(time.Duration(i) * 100 * time.Millisecond)

		go func(name string, index int) {
			defer qw.wg.Done()

			// Add retry logic for worker startup
			maxRetries := 3
			for attempt := 1; attempt <= maxRetries; attempt++ {
				if err := qw.startWorker(name); err != nil {
					qw.logger.Error("Failed to start worker",
						zap.String("queue", name),
						zap.Int("attempt", attempt),
						zap.Error(err))

					if attempt < maxRetries {
						backoff := time.Duration(attempt) * 5 * time.Second
						qw.logger.Info("Retrying worker startup",
							zap.String("queue", name),
							zap.Duration("backoff", backoff))

						select {
						case <-time.After(backoff):
							continue
						case <-qw.ctx.Done():
							return
						}
					}
				} else {
					// Worker started successfully
					return
				}
			}

			qw.logger.Error("Worker failed to start after all retries",
				zap.String("queue", name))
		}(queueName, i)
	}

	return nil
}

func (qw *AIQueueWorker) Name() string {
	return "AI Queue Worker"
}

func (w *AIQueueWorker) Stop() {
	w.logger.Info("🛑 Stopping AI queue workers")
	w.cancel()

	// Wait for all workers to finish with a timeout
	done := make(chan struct{})
	go func() {
		w.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		w.logger.Info("✅ All AI queue workers stopped")
	case <-time.After(30 * time.Second):
		w.logger.Warn("⚠️ Timeout waiting for AI queue workers to stop")
	}
}

func (qw *AIQueueWorker) startWorker(name string) error {
	qw.logger.Info("Worker starting", zap.String("queue", name))

	return qw.queueService.Consume(qw.ctx, name, func(ctx context.Context, m queue.Message) error {
		start := time.Now()
		qw.logger.Info("Received job",
			zap.String("id", m.ID),
			zap.String("type", m.Type),
			zap.String("queue", name))

		// Use circuit breaker for AI operations
		err := qw.circuitBreaker.Call(func() error {
			switch m.Type {
			case "enhancement":
				return qw.handleEnhancementJob(ctx, m)
			case "narration":
				return qw.handleNarrationJob(ctx, m)
			case "clipping":
				return qw.handleClippingJob(ctx, m)
			case "platform_optimizer":
				return qw.handlePlatformOptimization(ctx, m)
			case "story_video":
				return qw.handleStoryVideoGeneration(ctx, m)
			case "remove_noise":
				return qw.handleNoiseRemoval(ctx, m)
			case "transcription":
				return qw.handleTestimonialTranscription(ctx, m)
			case "sentiment_analysis":
				return qw.handleTestimonialSentimentAnalysis(ctx, m)
			case "highlight_extraction":
				return qw.handleTestimonialHighlightExtraction(ctx, m)
			default:
				// Unknown job type - non-retryable
				return &queue.NonRetryableError{
					Message: fmt.Sprintf("unknown job type: %s", m.Type),
				}
			}
		})

		if err != nil {
			qw.logger.Error("Job processing failed",
				zap.String("id", m.ID),
				zap.String("type", m.Type),
				zap.String("queue", name),
				zap.Error(err))
		} else {
			qw.logger.Info("✅ Job completed successfully",
				zap.String("id", m.ID),
				zap.String("type", m.Type),
				zap.String("queue", name),
				zap.Duration("duration", time.Since(start)))
		}

		return err
	})
}

// isNonRetryableError determines if an error should not be retried
func (qw *AIQueueWorker) isNonRetryableError(err error) bool {
	// Add nil check
	if err == nil {
		return false
	}

	errorStr := err.Error()

	// Configuration/deployment errors - don't retry
	nonRetryablePatterns := []string{
		"not available",
		"not deployed",
		"cannot access local variable",
		"circuit breaker OPEN",
		"Service disabled",
		"Invalid request body",
		"required field",
		"validation failed",
	}

	for _, pattern := range nonRetryablePatterns {
		if strings.Contains(errorStr, pattern) {
			return true
		}
	}

	return false
}

func (qw *AIQueueWorker) respondWithFailure(ctx context.Context, serviceID, jobID, msg string, err error) error {

	if qw.isNonRetryableError(err) {
		qw.updateJobStatusWithService(ctx, jobID, serviceID, "failed", 100, nil, err)
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("%s: %v", msg, err),
		}
	}
	qw.updateJobStatusWithService(ctx, jobID, serviceID, "failed", 100, nil, err)
	return fmt.Errorf("%s: %w", msg, err)

}

func (qw *AIQueueWorker) checkJobDependency(ctx context.Context, dependsOnJobID string) (bool, error) {
	if dependsOnJobID == "" {
		return true, nil
	}

	// ONLY check Redis - no database fallback to avoid schema issues
	jobStatus, err := qw.queueService.GetJobStatus(ctx, dependsOnJobID)
	if err != nil {
		qw.logger.Debug("Dependency job not found in Redis",
			zap.String("dependency_job_id", dependsOnJobID))
		return false, nil // Job not found, dependency not ready
	}

	qw.logger.Debug("Checking dependency from Redis",
		zap.String("dependency_job_id", dependsOnJobID),
		zap.String("status", jobStatus.Status))

	switch jobStatus.Status {
	case "completed":
		return true, nil
	case "failed", "cancelled":
		return false, fmt.Errorf("dependency job failed: %s", dependsOnJobID)
	default:
		return false, nil // Still pending/processing
	}
}

func (qw *AIQueueWorker) updateJobStatusWithService(ctx context.Context, jobID, serviceID, status string, progress int, result interface{}, err error) {
	// Enhance result with metadata

	enhancedResult := result
	if result != nil {
		if resultMap, ok := result.(map[string]interface{}); ok {
			resultMap["service_id"] = serviceID
			enhancedResult = resultMap
		} else {
			enhancedResult = map[string]interface{}{
				"data":       result,
				"service_id": serviceID,
			}
		}
	} else {
		enhancedResult = map[string]interface{}{
			"service_id": serviceID,
		}
	}

	jobResult := queue.JobResult{
		ID:        jobID,
		Status:    status,
		Progress:  progress,
		Result:    enhancedResult,
		UpdatedAt: time.Now(),
	}
	if err != nil {
		jobResult.Error = err.Error()
	}

	qw.sseNotifier.NotifyClients(jobResult)

	// ONLY update Redis - remove all database updates
	qw.queueService.SetJobStatus(ctx, jobID, status, progress, enhancedResult, func(j *queue.JobResult) {
		if err != nil {
			j.Error = err.Error()
		}
	})
}

func (qw *AIQueueWorker) convertModelSegmenttoPb(segment []models.TranscriptionSegment) ([]*pb.TranscriptSegment, error) {

	res := []*pb.TranscriptSegment{}
	if data, err := json.Marshal(segment); err == nil {
		if err := json.Unmarshal(data, &res); err == nil {
			return res, err
		} else {
			return nil, err
		}
	} else {
		return nil, err
	}
}

func (qw *AIQueueWorker) isJobCancelled(ctx context.Context, jobID string) bool {
	key := fmt.Sprintf("job_cancelled:%s", jobID)
	result, _ := qw.cacheService.Exists(ctx, key)
	return result
}

func (qw *AIQueueWorker) setJobCancelFunction(ctx context.Context, jobID string, cancelFunc context.CancelFunc) {
	// Store a flag that can be checked, the actual cancel function stays in memory
	key := fmt.Sprintf("job_active:%s", jobID)
	qw.cacheService.Set(ctx, key, "active", 30*time.Minute)

	// Store cancel function in worker's memory
	qw.mu.Lock()
	if qw.activeCancelFunctions == nil {
		qw.activeCancelFunctions = make(map[string]context.CancelFunc)
	}
	qw.activeCancelFunctions[jobID] = cancelFunc
	qw.mu.Unlock()
}

func (qw *AIQueueWorker) clearJobCancelFunction(ctx context.Context, jobID string) {
	key := fmt.Sprintf("job_active:%s", jobID)
	qw.cacheService.Delete(ctx, key)

	qw.mu.Lock()
	if qw.activeCancelFunctions != nil {
		delete(qw.activeCancelFunctions, jobID)
	}
	qw.mu.Unlock()
}

func (qw *AIQueueWorker) monitorJobCancellation(jobCtx context.Context, jobID string, cancel context.CancelFunc) {
	ticker := time.NewTicker(2 * time.Second) // Check every 2 seconds
	defer ticker.Stop()

	for {
		select {
		case <-jobCtx.Done():
			return // Job finished or already cancelled
		case <-ticker.C:
			if qw.isJobCancelled(context.Background(), jobID) {
				qw.logger.Info("Job cancellation detected", zap.String("job_id", jobID))
				cancel()
				return
			}
		}
	}
}

func (qw *AIQueueWorker) respondWithCancellation(ctx context.Context, serviceID, jobID string) error {
	qw.updateJobStatusWithService(ctx, jobID, serviceID, "cancelled", 100, nil, nil)
	return &queue.NonRetryableError{Message: "Job was cancelled"}
}

func (qw *AIQueueWorker) getSourceData(ctx context.Context, source models.CreateArtifactSourceParams) (SourceParam, error) {
	s := SourceParam{}
	switch source.Type {
	case models.TestimonialTypeSource:
		// processing on original testimonial
		tID, err := uuid.Parse(source.Data.(string))
		if err != nil {
			return SourceParam{}, fmt.Errorf("invalid testimonial ID %v", err)
		}
		s.testimonialID = tID

		testimonial, err := qw.testimonialRepo.FetchForAIProcessing(ctx, tID, qw.db)
		if err != nil {
			return SourceParam{}, fmt.Errorf("testimonial not found %v", err)
		}
		s.mediaURL = *testimonial.MediaURL
		s.content = *testimonial.Content
		s.transcriptSegments = *testimonial.TranscriptSegments

	case models.ArtifactTypeSource:
		// processing on existing artifact (e.g., clip)
		artifactID, err := uuid.Parse(source.Data.(string))
		fmt.Println("artifactID", artifactID)
		if err != nil {
			return SourceParam{}, fmt.Errorf("invalid artifact ID %v", err)
		}

		var artifact *models.TestimonialArtifact
		if source.RawData != nil {
			// If raw data is provided, use it directly
			b, _ := json.Marshal(source.RawData)
			var a models.TestimonialArtifact
			if err := json.Unmarshal(b, &a); err != nil {
				return SourceParam{}, fmt.Errorf("failed to unmarshal raw artifact data: %w", err)
			}
			artifact = &a

			if artifact.TestimonialID == nil && source.ParentTestimonialId != "" {
				parentID, err := uuid.Parse(source.ParentTestimonialId)
				if err == nil {
					artifact.TestimonialID = &parentID
				}
			}

			fmt.Println("Using raw artifact data:")
		} else {
			artifact, err := qw.artifactRepo.GetByID(ctx, artifactID, qw.db)
			fmt.Println("artifact", artifact)
			if err != nil {
				return SourceParam{}, fmt.Errorf("artifact not found %v", err)
			}
		}

		log.Printf("asset url %v", *artifact.AssetURL)

		if artifact.AssetURL != nil {
			s.mediaURL = *artifact.AssetURL
		} else {
			return SourceParam{}, fmt.Errorf("artifact asset url is required but missing")
		}

		if artifact.TestimonialID != nil {
			s.testimonialID = *artifact.TestimonialID
		} else {
			// check processing metadata for testimonial ID
			if testimonialIDs, ok := artifact.ProcessingMetadata["testimonial_ids"].([]string); ok {
				if len(testimonialIDs) > 0 {
					if tid, err := uuid.Parse(testimonialIDs[0]); err == nil {
						s.testimonialID = tid
					}
				}
			} else {
				return SourceParam{}, fmt.Errorf("artifact testimonial ID is required but missing")
			}

		}

		if artifact.TextContent != nil {
			s.content = *artifact.TextContent
		} else {
			// For media-only artifacts, text content might not be available
			s.content = ""
		}
		s.artifactID = artifactID
		s.artifact = artifact

		fmt.Println("mediaURL", *artifact.AssetURL)
		if start_time, ok := artifact.ProcessingMetadata["start_time"].(float64); ok {
			s.startTime = &start_time

			if end_time, ok := artifact.ProcessingMetadata["end_time"].(float64); ok {
				s.endTime = &end_time
			}
		}

		if processed_segments, ok := artifact.ProcessingMetadata["processed_segments"].([]*pb.ProcessedSegment); ok {
			s.processedSegments = processed_segments
		}

	case models.ClipTypeSource:
		// processing on specific clip
		var clipData models.ClipSource
		switch data := source.Data.(type) {
		case models.ClipSource:
			clipData = data
		case map[string]any:
			b, _ := json.Marshal(data)
			if err := json.Unmarshal(b, &clipData); err != nil {
				return SourceParam{}, fmt.Errorf("failed to unmarshal ClipSource: %w", err)
			}
		default:
			return SourceParam{}, fmt.Errorf("unexpected data type for source.Data: %T", source.Data)
		}

		artifact, err := qw.artifactRepo.GetByID(ctx, clipData.ArtifactID, qw.db)
		if err != nil {
			return SourceParam{}, fmt.Errorf("clip artifact not found %v", err)
		}

		if artifact.TestimonialID == nil {
			return SourceParam{}, fmt.Errorf("clip artifact testimonial ID is required but missing")
		}
		s.testimonialID = *artifact.TestimonialID

		// Find the specific clip and extract its data
		var clipStartTimeMs, clipEndTimeMs float64
		var clipText string
		var foundClip bool

		if data, ok := artifact.Data["generated_clips"]; ok {
			var resp pb.ClippingResponse
			if b, err := json.Marshal(data); err == nil {
				if err := json.Unmarshal(b, &resp); err == nil {
					for _, clip := range resp.Clips {
						if clip.Id == clipData.ClipID.String() {
							s.mediaURL = clip.Url
							clipText = clip.Text
							clipStartTimeMs = clip.StartTime
							clipEndTimeMs = clip.EndTime
							foundClip = true
							break
						}
					}
				}
			}
		}

		if !foundClip {
			return SourceParam{}, fmt.Errorf("clip not found in artifact data")
		}

		// Set basic clip info (no transcript segments here - handled by specific services that need them)
		s.content = clipText
		s.startTime = &clipStartTimeMs // Original testimonial timing
		s.endTime = &clipEndTimeMs     // Original testimonial timing

		fmt.Printf("Clip source data: %s - %.0fms-%.0fms, content length: %d\n",
			clipData.ClipID.String(), clipStartTimeMs, clipEndTimeMs, len(clipText))

	default:
		return SourceParam{}, errors.New("unsupported source type")
	}

	return s, nil
}
