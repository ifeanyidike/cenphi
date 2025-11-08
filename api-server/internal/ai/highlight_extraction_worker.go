// internal/ai/highlight_extraction_worker.go
package ai

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"go.uber.org/zap"
)

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

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	// Update testimonial processing_status to "extracting_highlights"
	if updateErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"processing_status": "extracting_highlights",
	}, qw.db); updateErr != nil {
		qw.logger.Warn("Failed to update testimonial processing_status to extracting_highlights", zap.Error(updateErr))
	}

	qw.logger.Info("⭐ Starting testimonial highlight extraction",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID))

	highlightRequest := HighlightRequest{
		// Text:          *testimonial.Content,
		// Segments:      *segments,
		TestimonialID: testimonialID,
		HighlightType: HighlightType("general"),
	}

	qw.logger.Info("📊 Starting highlight extraction with type-specific prompt",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.String("highlight_type", string(highlightRequest.HighlightType)),
		zap.Int("max_highlights", highlightRequest.MaxHighlights))

	highlights, err := qw.aiService.HighlightService.ExtractHighlightsByType(ctx, highlightRequest)
	if err != nil {
		qw.logger.Error("❌ Highlight extraction failed",
			zap.String("job_id", req.JobID),
			zap.String("testimonial_id", req.TestimonialID),
			zap.Error(err))
		// Update processing_status to "failed" on error
		if failErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
			"processing_status": "failed",
		}, qw.db); failErr != nil {
			qw.logger.Warn("Failed to update testimonial processing_status to failed", zap.Error(failErr))
		}
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "highlight extraction failed", err)
	}

	// Calculate duration statistics for diagnostics (convert milliseconds to seconds)
	var totalDuration, minDur, maxDur float64
	minDur = 999999.0
	var durationBreakdown = map[string]int{
		"<5s":    0,
		"5-8s":   0,
		"8-20s":  0,
		"20-25s": 0,
		">25s":   0,
	}

	for _, h := range highlights {
		durMs := h.EndTime - h.StartTime    // In milliseconds
		dur := durMs / 1000.0               // Convert to seconds
		totalDuration += dur
		if dur < minDur {
			minDur = dur
		}
		if dur > maxDur {
			maxDur = dur
		}

		// Track duration distribution
		if dur < 5.0 {
			durationBreakdown["<5s"]++
		} else if dur < 8.0 {
			durationBreakdown["5-8s"]++
		} else if dur <= 20.0 {
			durationBreakdown["8-20s"]++
		} else if dur <= 25.0 {
			durationBreakdown["20-25s"]++
		} else {
			durationBreakdown[">25s"]++
		}
	}

	avgDur := 0.0
	if len(highlights) > 0 {
		avgDur = totalDuration / float64(len(highlights))
	}

	qw.logger.Info("✅ Highlight extraction and filtering completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.Int("final_highlights_count", len(highlights)),
		zap.Float64("avg_duration_seconds", avgDur),
		zap.Float64("min_duration_seconds", minDur),
		zap.Float64("max_duration_seconds", maxDur),
		zap.Int("count_8_20s_sweetspot", durationBreakdown["8-20s"]),
		zap.Int("count_under_5s", durationBreakdown["<5s"]),
		zap.Int("count_over_25s", durationBreakdown[">25s"]),
		zap.String("quality_note", "Ideal: Most highlights in 8-20s range"))

	// Don't save empty highlights to database
	if len(highlights) == 0 {
		qw.logger.Warn("No highlights passed filtering - not saving to database",
			zap.String("job_id", req.JobID),
			zap.String("testimonial_id", req.TestimonialID))

		response := map[string]interface{}{
			"highlights":      highlights,
			"message":         "No highlights passed filtering. Try adjusting your testimonial content or re-record with more specific value propositions.",
			"testimonial_id":  req.TestimonialID,
			"job_type":        "highlight_extraction",
		}

		// Update testimonial processing_status to "completed" even with no highlights
		if updateErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
			"processing_status": "completed",
		}, qw.db); updateErr != nil {
			qw.logger.Warn("Failed to update testimonial processing_status to completed", zap.Error(updateErr))
		}

		qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, response, nil)
		return nil
	}

	// Save highlights artifact
	artifact_id, err := qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "highlight_extraction", workspaceID, &testimonialID, models.JSONMap{
		"highlights":           highlights,
		"max_highlights":       req.MaxHighlights,
		"min_importance_score": req.MinImportanceScore,
		"highlight_type":       "general",
	}, models.CreateArtifactSourceParams{Type: models.NoTypeSource}, nil, qw.db)

	if err != nil {
		qw.logger.Error("Failed to save highlights artifact", zap.Error(err), zap.String("testimonialID", req.TestimonialID))
	}

	response := map[string]interface{}{
		"highlights":     highlights,
		"artifact_id":    artifact_id,
		"testimonial_id": req.TestimonialID,
		"job_type":       "highlight_extraction",
	}

	// Update testimonial processing_status to "completed" (last job finishing)
	if updateErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"processing_status": "completed",
	}, qw.db); updateErr != nil {
		qw.logger.Warn("Failed to update testimonial processing_status to completed", zap.Error(updateErr))
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, response, nil)

	qw.logger.Info("✅ Testimonial highlight extraction completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.Int("highlights_saved", len(highlights)))

	return nil
}
