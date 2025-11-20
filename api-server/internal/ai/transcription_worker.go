// internal/ai/transcription_worker.go
package ai

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"go.uber.org/zap"
)

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

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "transcription failed when parsing testimonial UUID", err)
	}

	// Update testimonial processing_status to "processing" (first job starting)
	// Note: "transcribing" is not a valid value in job_status enum (only: pending, processing, completed, failed)
	if updateErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"processing_status": "processing",
	}, qw.db); updateErr != nil {
		qw.logger.Warn("Failed to update testimonial processing_status to processing", zap.Error(updateErr))
	}

	qw.logger.Info("🎙️ Starting testimonial transcription",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.String("media_url", req.MediaURL))

	// Call transcription service
	transcriptionResult, err := qw.aiService.AudioTranscriptionService.TranscribeAudio(req.MediaURL) //use background context

	if err != nil {
		// Update processing_status to "failed" on error
		if failErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
			"processing_status": "failed",
		}, qw.db); failErr != nil {
			qw.logger.Warn("Failed to update testimonial processing_status to failed", zap.Error(failErr))
		}
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "transcription failed when transcribing audio", err)
	}

	if err := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"content":             transcriptionResult.Transcript,
		"transcript_segments": transcriptionResult.Segments,
	}, qw.db); err != nil {
		qw.logger.Error("Failed to update testimonial with transcript", zap.Error(err))
		// Update processing_status to "failed" on database error
		if failErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
			"processing_status": "failed",
		}, qw.db); failErr != nil {
			qw.logger.Warn("Failed to update testimonial processing_status to failed", zap.Error(failErr))
		}
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "failed to save transcription to database", err)
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, map[string]any{
		"transcription":  transcriptionResult,
		"testimonial_id": req.TestimonialID,
		"job_type":       "transcription",
	}, nil)

	qw.logger.Info("✅ Testimonial transcription completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID))

	// Chain sentiment analysis and highlight extraction immediately after transcription completes
	// This eliminates retry loops and reduces Redis writes by 95%
	go func() {
		// Fetch testimonial to get workspace_id
		testimonial, fetchErr := qw.testimonialRepo.FetchForAIProcessing(context.Background(), testimonialID, qw.db)
		if fetchErr != nil {
			qw.logger.Error("Failed to fetch testimonial for dependent job queueing",
				zap.String("testimonial_id", req.TestimonialID),
				zap.Error(fetchErr))
			return
		}

		// Queue sentiment analysis
		sentimentJobID := uuid.New()
		sentimentMessage := queue.Message{
			ID:   sentimentJobID.String(),
			Type: "sentiment_analysis",
			Payload: map[string]interface{}{
				"workspace_id":   testimonial.WorkspaceID.String(),
				"testimonial_id": req.TestimonialID,
				"content":        transcriptionResult.Transcript,
				"type":           "video",
				"job_id":         sentimentJobID.String(),
			},
		}

		if _, err := qw.queueService.Publish(context.Background(), "sentiment_analysis", sentimentMessage); err != nil {
			qw.logger.Error("Failed to queue sentiment analysis after transcription",
				zap.String("testimonial_id", req.TestimonialID),
				zap.Error(err))
		} else {
			qw.logger.Info("💭 Queued sentiment analysis after transcription",
				zap.String("testimonial_id", req.TestimonialID),
				zap.String("job_id", sentimentJobID.String()))
		}

		// // Queue highlight extraction
		// highlightJobID := uuid.New()
		// highlightMessage := queue.Message{
		// 	ID:   highlightJobID.String(),
		// 	Type: "highlight_extraction",
		// 	Payload: map[string]interface{}{
		// 		"workspace_id":        testimonial.WorkspaceID.String(),
		// 		"testimonial_id":      req.TestimonialID,
		// 		"max_highlights":      5,
		// 		"min_importance_score": 0.7,
		// 		"job_id":              highlightJobID.String(),
		// 	},
		// }

		// if _, err := qw.queueService.Publish(context.Background(), "highlight_extraction", highlightMessage); err != nil {
		// 	qw.logger.Error("Failed to queue highlight extraction after transcription",
		// 		zap.String("testimonial_id", req.TestimonialID),
		// 		zap.Error(err))
		// } else {
		// 	qw.logger.Info("⭐ Queued highlight extraction after transcription",
		// 		zap.String("testimonial_id", req.TestimonialID),
		// 		zap.String("job_id", highlightJobID.String()))
		// }
	}()

	return nil
}
