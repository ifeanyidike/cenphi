// internal/ai/sentiment_analysis_worker.go
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

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	// Update testimonial processing_status to "analyzing_sentiment"
	if updateErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"processing_status": "analyzing_sentiment",
	}, qw.db); updateErr != nil {
		qw.logger.Warn("Failed to update testimonial processing_status to analyzing_sentiment", zap.Error(updateErr))
	}

	qw.logger.Info("💭 Starting testimonial sentiment analysis",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.String("type", req.Type))

	// Get testimonial content (either from payload or from database)
	var content string
	if req.Content != "" {
		content = req.Content
	} else {
		// For video, get the transcript from the testimonial
		testimonial, err := qw.testimonialRepo.FetchForAIProcessing(ctx, testimonialID, qw.db)
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
		// Update processing_status to "failed" on error
		if failErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
			"processing_status": "failed",
		}, qw.db); failErr != nil {
			qw.logger.Warn("Failed to update testimonial processing_status to failed", zap.Error(failErr))
		}
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "sentiment analysis failed", err)
	}
	// qw.aiService.
	artifact_id, err := qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "sentiment_analysis", workspaceID, &testimonialID, models.JSONMap{
		"sentiment_score":          result.SentimentScore,
		"label":                    result.Label,
		"emotions":                 result.Emotions,
		"business_recommendations": result.BusinessRecommendations,
	}, models.CreateArtifactSourceParams{Type: models.NoTypeSource}, nil, qw.db)

	if err != nil {
		qw.logger.Error("Failed to save sentiment artifact", zap.Error(err))
	}

	if err := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"sentiment_score": result.SentimentScore,
	}, qw.db); err != nil {
		qw.logger.Error("Failed to update testimonial with sentiment score", zap.Error(err))
	}

	response := map[string]interface{}{
		"sentiment_result": result,
		"artifact_id":      artifact_id,
		"testimonial_id":   req.TestimonialID,
		"job_type":         "sentiment_analysis",
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, response, nil)

	qw.logger.Info("✅ Testimonial sentiment analysis completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialID),
		zap.String("label", result.Label))

	return nil
}
