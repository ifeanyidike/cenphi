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

	// Update testimonial processing_status to "transcribing" (first job starting)
	if updateErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"processing_status": "transcribing",
	}, qw.db); updateErr != nil {
		qw.logger.Warn("Failed to update testimonial processing_status to transcribing", zap.Error(updateErr))
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
		"transcription":   transcriptionResult,
		"testimonial_id":  req.TestimonialID,
		"job_type":        "transcription",
	}, nil)

	qw.logger.Info("✅ Testimonial transcription completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID))

	return nil
}
