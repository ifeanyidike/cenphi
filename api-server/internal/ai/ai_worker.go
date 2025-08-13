// internal/ai/ai_worker.go
package ai

import (
	"context"
	"database/sql"
	"encoding/json"
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
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

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

// Import NonRetryableError from queue package

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
	logger *zap.Logger) *AIQueueWorker {
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
		circuitBreaker:    NewCircuitBreaker(5, 5*time.Minute, logger), // 3 failures, 5 min timeout
		queues: []string{
			"enhancement",
			"emotion",
			"narration",
			"clipping",
			"platform_optimizer",
			"thumbnail",
			"story_video",

			"transcription",
			"sentiment_analysis",
			"highlight_extraction",
		},
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
			case "emotion":
				return qw.handleEmotionJob(ctx, m)
			case "narration":
				return qw.handleNarrationJob(ctx, m)
			case "clipping":
				return qw.handleClippingJob(ctx, m)
			case "platform_optimizer":
				return qw.handlePlatformOptimization(ctx, m)
			case "thumbnail":
				return qw.handleThumbnailSelection(ctx, m)
			case "story_video":
				return qw.handleStoryVideoGeneration(ctx, m)
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

func (qw *AIQueueWorker) handleEnhancementJob(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.EnhanceRequest
		JobID string `json:"job_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal enhancement job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "enhance-media"
	// CHECK: See if job was cancelled before starting
	if qw.isJobCancelled(ctx, req.JobID) {
		qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "cancelled", 100, nil, nil)
		return &queue.NonRetryableError{Message: "Job was cancelled before processing"}
	}

	// CREATE: Cancellable context for this job
	jobCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	// TRACK: Store cancel function in Redis for later use
	qw.setJobCancelFunction(ctx, req.JobID, cancel)
	defer qw.clearJobCancelFunction(ctx, req.JobID)

	// MONITOR: Start background cancellation checker
	go qw.monitorJobCancellation(jobCtx, req.JobID, cancel)

	testimonialID, err := uuid.Parse(req.TestimonialId)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
	}

	if testimonial.MediaURL == nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "enhancement job failed - no media url ", nil)
	}

	brandContext, err := qw.workspaceRepo.GetPbBrandContext(ctx, workspaceID, qw.db)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "Failed to get highlight moments", err)
	}

	// CHECK: Cancellation point before major processing
	select {
	case <-jobCtx.Done():
		return qw.respondWithCancellation(ctx, serviceID, req.JobID)
	default:
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 25, nil, nil)

	pbReq := &req.EnhanceRequest
	pbReq.MediaUrl = *testimonial.MediaURL
	pbReq.UploadToCloud = true
	pbReq.LogoUrl = brandContext.LogoUrl
	pbReq.JobId = req.JobID

	if len(brandContext.ColorSlice) > 0 {
		pbReq.BrandColor = brandContext.ColorSlice[0]
	}

	result, err := qw.mediaIntelligence.EnhanceMedia(ctx, pbReq)
	// if err != nil {
	// 	return qw.respondWithFailure(ctx, serviceID, req.JobID, "enhancements failed", err)
	// }
	// CHECK: Final cancellation check
	select {
	case <-jobCtx.Done():
		return qw.respondWithCancellation(ctx, serviceID, req.JobID)
	default:
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "enhancement failed", err)
		}
	}

	_, err = qw.aiService.SaveResponseToArtifacts(ctx, "enhancement", workspaceID, &testimonialID, models.JSONMap{
		"enhanced_url":         result.EnhancedUrl,
		"applied_enhancements": result.AppliedEnhancements,
		"quality_score":        result.QualityScore,
	})

	if err != nil {
		qw.logger.Error("Failed to save enhancement artifact", zap.Error(err))
	}

	enhancedResult := map[string]any{
		"enhanced_url":         result.EnhancedUrl,
		"applied_enhancements": result.AppliedEnhancements,
		"quality_score":        result.QualityScore,
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, enhancedResult, nil)

	return nil
}

func (qw *AIQueueWorker) handleEmotionJob(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.EmotionRequest
		JobID string `json:"job_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal emotion job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "analyze-emotions"
	testimonialID, err := uuid.Parse(req.TestimonialId)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
	}

	if testimonial.MediaURL == nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "emotions analysis job failed - no media url ", nil)
	}

	pbReq := &req.EmotionRequest
	pbReq.MediaUrl = *testimonial.MediaURL
	pbReq.JobId = req.JobID

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 30, nil, nil)

	response, err := qw.mediaIntelligence.AnalyzeEmotion(ctx, pbReq)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "emotion analysis failed", err)
	}

	result_data := models.JSONMap{
		"segments":             response.Segments,
		"overall_confidence":   response.OverallConfidence,
		"emotion_distribution": response.EmotionDistribution,
	}

	_, err = qw.aiService.SaveResponseToArtifacts(ctx, "emotions_analysis", workspaceID, &testimonialID, result_data)

	if err != nil {
		qw.logger.Error("Failed to save emotions artifact", zap.Error(err))
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, result_data, nil)

	return nil
}

func (qw *AIQueueWorker) handleNarrationJob(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.NarrationRequest
		JobID string `json:"job_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal narration job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	qw.logger.Info("🎙️ Processing voice narration",
		zap.String("jobId", req.JobID),
		zap.String("voiceId", req.VoiceId),
		zap.Int("textLength", len(req.Text)))

	serviceID := "generate-narration"

	testimonialID, err := uuid.Parse(req.TestimonialId)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
	}

	if testimonial.Content == nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "testimonial has no text content", err)
	}

	pbReq := &req.NarrationRequest
	pbReq.JobId = req.JobID
	if pbReq.Text == "" {
		pbReq.Text = *testimonial.Content
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 40, nil, nil)

	result, err := qw.mediaIntelligence.GenerateNarration(ctx, &req.NarrationRequest)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "narration generation failed", err)
	}

	response_data := models.JSONMap{
		"audio_url": result.AudioUrl,
		"voice_id":  req.VoiceId,
	}
	_, err = qw.aiService.SaveResponseToArtifacts(ctx, "narration", workspaceID, &testimonialID, response_data)

	if err != nil {
		qw.logger.Error("Failed to save narration artifact", zap.Error(err))
	}

	qw.logger.Info("✅ Narration completed",
		zap.String("jobId", req.JobID),
		zap.String("audioUrl", result.AudioUrl))

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, response_data, nil)

	return nil
}

func (qw *AIQueueWorker) handleClippingJob(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.ClippingRequest
		JobID string `json:"job_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal clipping job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "smart-clips"
	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 20, nil, nil)

	// if req.TestimonialId == "" || req.MediaUrl == "" {
	// 	return qw.respondWithFailure(ctx, serviceID, req.JobID, "clipping failed - no media url or testimonial id", nil)
	// }
	if req.TestimonialId == "" {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "clipping failed - testimonial id", nil)
	}

	testimonialID, err := uuid.Parse(req.TestimonialId)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
	}

	if testimonial.MediaURL == nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "clipping failed - no media url ", nil)
	}

	moments := req.HighlightMoments
	if len(moments) == 0 {
		moments, err = qw.getStoryHighlightSegments(ctx, testimonialID, testimonial)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
		}

		if len(moments) != 0 {
			for i := range moments {
				fmt.Printf("start time %.f", moments[i].StartTime)
				fmt.Printf("end time %.f", moments[i].EndTime)
				moments[i] = &pb.HighlightMoment{
					StartTime:          moments[i].StartTime,
					EndTime:            moments[i].EndTime,
					Theme:              moments[i].Theme,
					Text:               moments[i].Text,
					IncludeLogo:        true,
					IncludeSubtitle:    true,
					IncludeWatermark:   true,
					AddBackgroundMusic: true,
					IncludeTheme:       true,
					RemoveNoise:        true,
					// SocialMediaOptimize: true,
					// EnhanceClip:         true,
				}
			}
		}
	}

	// var branding = req.Branding
	branding := &pb.BrandingOptions{}
	// if branding == nil {
	context, err := qw.workspaceRepo.GetPbBrandContext(ctx, workspaceID, qw.db)
	if err != nil {
		qw.logger.Error("failed to get brand context", zap.Error(err))
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "Failed to get brand context", err)
	}
	if context.LogoUrl != "" {
		branding.LogoUrl = context.LogoUrl
	}

	var brandColor string
	for k := range context.BrandColors {
		brandColor = context.BrandColors[k]
		break
	}

	if brandColor != "" {
		branding.BrandColor = brandColor
	}

	// }

	pbReq := pb.ClippingRequest{
		JobId:            req.JobID,
		TestimonialId:    testimonial.ID.String(),
		MediaUrl:         *testimonial.MediaURL,
		HighlightMoments: moments,
		// BackgroundMusic:  req.BackgroundMusic,
		// MusicVolume:      req.MusicVolume,
		Branding: branding,
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 40, nil, nil)

	clips, err := qw.mediaIntelligence.GenerateClips(ctx, &pbReq)
	if err != nil {
		// Check if it's a non-retryable error
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "clip generation failed", err)
	}

	result := models.JSONMap{
		"generated_clips": clips,
	}

	if _, err := qw.aiService.SaveResponseToArtifacts(ctx, "clipping", workspaceID, &testimonialID, result); err != nil {
		qw.logger.Error("Failed to save clipping artifact", zap.Error(err))
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, result, nil)

	return nil
}

func (qw *AIQueueWorker) handlePlatformOptimization(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		Prompt      string `json:"prompt"`
		pb.OptimizeRequest
		JobID string `json:"job_id"`
	}

	fmt.Printf("platform optimization payload %#v", msg)

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal platform optimization job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "optimize-platform"
	testimonialID, err := uuid.Parse(req.TestimonialId)
	if err != nil {
		qw.logger.Info("invalid testimonial id", zap.String("testimonialID", req.TestimonialId))
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
	}

	if testimonial.MediaURL == nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "optimization failed - no media url ", nil)
	}

	brandContext := &pb.BrandContext{}

	if req.BrandContext != nil {
		brandContext = req.BrandContext
	} else {
		context, err := qw.workspaceRepo.GetPbBrandContext(ctx, workspaceID, qw.db)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "Failed to get highlight moments", err)
		}
		brandContext = context
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 30, nil, nil)

	// if testimonial.Content != nil {
	// 	result, err := qw.aiService.PlatformOptimizerService.OptimizeForPlatform(ctx, req.WorkspaceID, *testimonial.Content, brandContext, req.TargetPlatform, req.Prompt)
	// 	if err != nil {
	// 		qw.logger.Error("Failed to optimize text", zap.Error(err))
	// 	}
	// 	optimized_transcript = result.Content
	// }
	log.Printf("brand context %#v", brandContext)

	pbReq := &req.OptimizeRequest
	pbReq.BrandContext = brandContext
	pbReq.MediaUrl = *testimonial.MediaURL
	pbReq.Transcript = *testimonial.Content
	pbReq.JobId = req.JobID
	pbReq.TranscriptSegments, _ = qw.convertModelSegmenttoPb(*testimonial.TranscriptSegments)

	mediaOptResult, err := qw.mediaIntelligence.OptimizeMediaForPlatform(ctx, pbReq)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "platform optimization failed", err)
	}

	optimized_transcript := *testimonial.Content

	if testimonial.Content != nil {
		textOptResult, err := qw.aiService.PlatformOptimizerService.OptimizeForPlatform(ctx, req.WorkspaceID, *testimonial.Content, brandContext, req.TargetPlatform, req.Prompt)
		if err != nil {
			qw.logger.Error("Failed to optimize text", zap.Error(err))
		} else if textOptResult != nil {
			optimized_transcript = textOptResult.Content
		}
	}

	result_data := models.JSONMap{
		"optimized_url": mediaOptResult.OptimizedUrl,
		"text":          optimized_transcript,
	}

	_, err = qw.aiService.SaveResponseToArtifacts(ctx, "video_platform_optization", workspaceID, &testimonialID, result_data)

	if err != nil {
		qw.logger.Error("Failed to save optimized url", zap.Error(err))
	}

	fmt.Printf("platform optimization result %#v", mediaOptResult)

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, result_data, nil)

	return nil
}

func (qw *AIQueueWorker) handleThumbnailSelection(ctx context.Context, msg queue.Message) error {
	fmt.Print("Thumbnail selection request worker begins")
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.ThumbnailRequest
		JobID string `json:"job_id"`
	}

	fmt.Printf("thumbnail selection payload %#v", msg)

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal thumbnail selection job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "select-thumbnail"
	testimonialID, err := uuid.Parse(req.TestimonialId)
	if err != nil {
		qw.logger.Info("invalid testimonial id", zap.String("testimonialID", req.TestimonialId))
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
	}

	if testimonial.MediaURL == nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "optimization failed - no media url ", nil)
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 30, nil, nil)

	pbReq := &req.ThumbnailRequest
	pbReq.MediaUrl = *testimonial.MediaURL
	pbReq.JobId = req.JobID

	result, err := qw.mediaIntelligence.SelectThumbnail(ctx, pbReq)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "thumbnail selection failed", err)
	}

	result_data := models.JSONMap{
		"thumbnail_urls": result.ThumbnailUrls,
	}

	if _, err := qw.aiService.SaveResponseToArtifacts(ctx, "thumbnail_selection", workspaceID, &testimonialID, result_data); err != nil {
		qw.logger.Error("Failed to get thumbnail", zap.Error(err))
	}
	fmt.Printf("thumbnail selection result %#v", result)

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, map[string]interface{}{
		"thumbnail_urls": result.ThumbnailUrls,
	}, nil)

	return nil
}

func (qw *AIQueueWorker) handleStoryVideoGeneration(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.StoryModeRequest
		JobID string `json:"job_id"`
	}

	fmt.Printf("story video generation payload %#v", msg)

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal story video generation job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "story-video"

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 20, nil, nil)

	segments := []*pb.TestimonialSegment{}
	for _, s := range req.TestimonialSegments {
		fmt.Println("testimonial ID", s.TestimonialId)
		if s.MediaUrl == "" && s.TestimonialId == "" {
			continue
		}

		if s.Highlights == nil && s.TestimonialId == "" {
			continue
		}

		highlights := s.Highlights

		if s.Highlights == nil && s.TestimonialId != "" {
			testimonialID, err := uuid.Parse(s.TestimonialId)
			if err != nil {
				return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
			}

			testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
			if err != nil {
				return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
			}
			if testimonial.MediaURL == nil {
				qw.logger.Info("testimonial has no media URL", zap.String("testimonialID", s.TestimonialId))
				continue
			}
			s.MediaUrl = *testimonial.MediaURL

			highlights, err = qw.getStoryHighlightSegments(ctx, testimonialID, testimonial)
			if err != nil {
				return qw.respondWithFailure(ctx, serviceID, req.JobID, "Failed to get highlight moments", err)
			}

			for i := range highlights {
				highlights[i].IncludeLogo = true
				highlights[i].IncludeWatermark = true
				highlights[i].IncludeTheme = true
			}
		}

		s.Highlights = highlights
		segments = append(segments, s)
	}

	brandContext := &pb.BrandContext{}

	if req.BrandContext != nil {
		brandContext = req.BrandContext
	} else {
		context, err := qw.workspaceRepo.GetPbBrandContext(ctx, workspaceID, qw.db)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "Failed to get highlight moments", err)
		}
		brandContext = context
	}

	pbReq := pb.StoryModeRequest{
		JobId:               req.JobID,
		TestimonialSegments: segments,
		BrandContext:        brandContext,
		OutputFormat:        req.OutputFormat,
		AddBackgroundMusic:  true,
		// BackgroundMusic:     req.BackgroundMusic,
		MusicVolume: req.BackgroundMusic,
		Prompt:      req.Prompt,
		// IntroImageUrl:      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop",
		// OutroImageUrl:      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop",
		// AddBackgroundMusic: true,
		CompanyName: "Cenphi",
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 40, nil, nil)

	result, err := qw.mediaIntelligence.GenerateStoryVideo(ctx, &pbReq)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "story video generation failed", err)
	}

	response_data := models.JSONMap{"story_video_url": result.StoryVideoUrl}

	_, err = qw.aiService.SaveResponseToArtifacts(ctx, "story_mode_generation", workspaceID, nil, response_data)

	if err != nil {
		qw.logger.Error("Failed to save video generation artifact", zap.Error(err))
	}

	fmt.Printf("story video generation result %#v", result)
	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, response_data, nil)

	return nil
}

func (qw *AIQueueWorker) handleTestimonialTranscription(ctx context.Context, msg queue.Message) error {
	var req struct {
		TestimonialID string `json:"testimonial_id"`
		MediaURL      string `json:"media_url"`
		JobID         string `json:"job_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal transcription job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "transcription"

	// Update job status to processing
	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 10, nil, nil)

	qw.logger.Info("🎙️ Starting testimonial transcription",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.String("media_url", req.MediaURL))

	// Call transcription service
	transcriptionResult, err := qw.aiService.AudioTranscriptionService.TranscribeAudio(req.MediaURL) //use background context

	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "transcription failed when transcribing audio", err)
	}

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "transcription failed when parsing testimonial UUID", err)
	}

	if err := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"content":             transcriptionResult.Transcript,
		"transcript_segments": transcriptionResult.Segments,
	}, qw.db); err != nil {
		qw.logger.Error("Failed to update testimonial with transcript", zap.Error(err))
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, map[string]any{
		"transcription": transcriptionResult,
	}, nil)

	qw.logger.Info("✅ Testimonial transcription completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID))

	return nil
}

func (qw *AIQueueWorker) handleTestimonialSentimentAnalysis(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID   string `json:"workspace_id"`
		TestimonialID string `json:"testimonial_id"`
		Content       string `json:"content,omitempty"`
		Type          string `json:"type"`
		DependsOn     string `json:"depends_on,omitempty"`
		JobID         string `json:"job_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal sentiment job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "sentiment-analysis"

	if req.DependsOn != "" {
		dependencyReady, err := qw.checkJobDependency(ctx, req.DependsOn)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
		}

		if !dependencyReady {
			// Dependency not ready yet - this is RETRYABLE
			qw.logger.Info("Sentiment analysis waiting for transcription",
				zap.String("job_id", req.JobID),
				zap.String("depends_on", req.DependsOn),
				zap.String("testimonial_id", req.TestimonialID))

			return fmt.Errorf("dependency job %s not complete yet, retrying", req.DependsOn)
		}
	}

	// Update job status to processing
	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 10, nil, nil)

	qw.logger.Info("💭 Starting testimonial sentiment analysis",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.String("type", req.Type))

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	// Get testimonial content (either from payload or from database)
	var content string
	if req.Content != "" {
		content = req.Content
	} else {
		// For video, get the transcript from the testimonial
		testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "failed to get testimonial", err)
		}

		if testimonial.Content == nil || *testimonial.Content == "" {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "no content available for sentiment analysis", err)
		}
		content = *testimonial.Content
	}

	// Call sentiment analysis service
	result, err := qw.aiService.SentimentService.AnalyzeSentiment(ctx, content, nil, "")
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "sentiment analysis failed", err)
	}
	// qw.aiService.
	artifact_id, err := qw.aiService.SaveResponseToArtifacts(ctx, "sentiment_analysis", workspaceID, &testimonialID, models.JSONMap{
		"sentiment_score":          result.SentimentScore,
		"label":                    result.Label,
		"emotions":                 result.Emotions,
		"business_recommendations": result.BusinessRecommendations,
	})

	if err != nil {
		qw.logger.Error("Failed to save sentiment artifact", zap.Error(err))
	}

	response := map[string]interface{}{
		"sentiment_result": result,
		"artifact_id":      artifact_id,
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, response, nil)

	qw.logger.Info("✅ Testimonial sentiment analysis completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.String("label", result.Label))

	return nil
}

// NEW: Testimonial highlight extraction handler
func (qw *AIQueueWorker) handleTestimonialHighlightExtraction(ctx context.Context, msg queue.Message) error {
	var req struct {
		TestimonialID      string  `json:"testimonial_id"`
		WorkspaceID        string  `json:"workspace_id"`
		MaxHighlights      int     `json:"max_highlights"`
		MinImportanceScore float64 `json:"min_importance_score"`
		DependsOn          string  `json:"depends_on,omitempty"`
		JobID              string  `json:"job_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal highlight job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "highlight-extraction"

	if req.DependsOn != "" {
		dependencyReady, err := qw.checkJobDependency(ctx, req.DependsOn)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
		}

		if !dependencyReady {
			// Dependency not ready yet - this is RETRYABLE
			qw.logger.Info("Highlight extraction waiting for transcription",
				zap.String("job_id", req.JobID),
				zap.String("depends_on", req.DependsOn),
				zap.String("testimonial_id", req.TestimonialID))

			return fmt.Errorf("dependency job %s not complete yet, retrying", req.DependsOn)
		}
	}

	// Update job status to processing
	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 10, nil, nil)

	qw.logger.Info("⭐ Starting testimonial highlight extraction",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID))

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	// // Get testimonial content
	// testimonial, err := qw.testimonialRepo.FetchByID(ctx, testimonialID, qw.db)
	// if err != nil {
	// 	return qw.respondWithFailure(ctx, serviceID, req.JobID, "failed to get testimonial", err)
	// }

	// if testimonial.Content == nil || *testimonial.Content == "" {
	// 	return qw.respondWithFailure(ctx, serviceID, req.JobID, "testimonial has no content for highlight extraction", err)
	// }

	// // Convert transcript segments for highlight service
	// var segments = testimonial.TranscriptSegments

	// Extract highlights
	// highlights, err := qw.aiService.HighlightService.ExtractHighlights(ctx, *testimonial.Content, *segments, "")
	highlightRequest := HighlightRequest{
		// Text:          *testimonial.Content,
		// Segments:      *segments,
		TestimonialID: testimonialID,
		HighlightType: HighlightType("general"),
	}

	highlights, err := qw.aiService.HighlightService.ExtractHighlightsByType(ctx, highlightRequest)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "highlight extraction failed", err)
	}

	// Save highlights artifact
	artifact_id, err := qw.aiService.SaveResponseToArtifacts(ctx, "highlight_extraction", workspaceID, &testimonialID, models.JSONMap{
		"highlights":           highlights,
		"max_highlights":       req.MaxHighlights,
		"min_importance_score": req.MinImportanceScore,
	})

	if err != nil {
		qw.logger.Error("Failed to save highlights artifact", zap.Error(err), zap.String("testimonialID", req.TestimonialID))
	}

	response := map[string]interface{}{
		"highlights":  highlights,
		"artifact_id": artifact_id,
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, response, nil)

	qw.logger.Info("✅ Testimonial highlight extraction completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.Int("highlights_count", len(highlights)))

	return nil
}

// isNonRetryableError determines if an error should not be retried
func (qw *AIQueueWorker) isNonRetryableError(err error) bool {
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

func (qw *AIQueueWorker) getStoryHighlightSegments(ctx context.Context, testimonialId uuid.UUID, testimonial *models.Testimonial) ([]*pb.HighlightMoment, error) {
	artifacts, err := qw.artifactRepo.GetByTestimonialID(ctx, testimonialId, qw.db)

	if err != nil {
		return nil, err
	}

	var latest_artifact *models.TestimonialArtifact
	for i := range artifacts {
		a := &artifacts[i]
		if a.ProcessingType == "highlight_extraction" &&
			(latest_artifact == nil || a.CreatedAt.After(latest_artifact.CreatedAt)) {
			latest_artifact = a
		}
	}

	var highlights []*pb.HighlightMoment
	if latest_artifact != nil && latest_artifact.Data != nil {
		// if val, ok := latest_artifact.Data["highlights"].([]*pb.HighlightMoment); ok {
		// 	highlights = val
		// }
		if raw, ok := latest_artifact.Data["highlights"]; ok {
			b, err := json.Marshal(raw)
			if err == nil {
				if err := json.Unmarshal(b, &highlights); err != nil {
					log.Printf("failed to unmarshal highlights from artifact: %v", err)
				}
			} else {
				log.Printf("failed to marshal highlights raw: %v", err)
			}
		}
	}

	if len(highlights) == 0 {
		if testimonial.Content == nil || testimonial.TranscriptSegments == nil {
			return nil, fmt.Errorf("testimonial content/transcript is nil; cannot extract highlights")
		}

		highlights, err = qw.aiService.HighlightService.ExtractHighlights(ctx, *testimonial.Content, *testimonial.TranscriptSegments, "")
		if err != nil {
			return nil, err
		}
		artifact := &models.TestimonialArtifact{
			ID:             uuid.New(),
			TestimonialID:  &testimonialId,
			ProcessingType: "highlight_extraction",
			ResultCategory: "content",
			Data:           models.JSONMap{"highlights": highlights},
			ContentType:    "highlights",
			IsStreamed:     false,
		}

		err = qw.artifactRepo.Create(ctx, artifact, qw.db)
		if err != nil {
			return nil, err
		}
	}
	return highlights, nil

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
