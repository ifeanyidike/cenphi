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
	artifact_id, err := qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "highlight_extraction", workspaceID, &testimonialID, models.JSONMap{
		"highlights":           highlights,
		"max_highlights":       req.MaxHighlights,
		"min_importance_score": req.MinImportanceScore,
	}, models.CreateArtifactSourceParams{Type: models.NoTypeSource}, nil, qw.db)

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
