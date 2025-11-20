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

	// NOTE: Dependency checking removed - jobs are now chained instead of using depends_on
	// Sentiment analysis is queued directly after transcription completes (see transcription_worker.go)

	// Update job status to processing
	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 10, nil, nil)

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	// Update testimonial processing_status to "processing"
	// Note: "analyzing_sentiment" is not a valid value in job_status enum (only: pending, processing, completed, failed)
	if updateErr := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"processing_status": "processing",
	}, qw.db); updateErr != nil {
		qw.logger.Warn("Failed to update testimonial processing_status to processing", zap.Error(updateErr))
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
	// Save sentiment data directly to testimonials.sentiment_data
	sentimentData := models.JSONMap{
		"sentiment_score":          result.SentimentScore,
		"label":                    result.Label,
		"emotions":                 result.Emotions,
		"business_recommendations": result.BusinessRecommendations,
	}

	// Update sentiment_data using new UpdateSentiment method
	if err := qw.testimonialRepo.UpdateSentiment(ctx, testimonialID, sentimentData, qw.db); err != nil {
		qw.logger.Error("Failed to update testimonial sentiment data", zap.Error(err))
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "failed to save sentiment data", err)
	}

	// Also update the sentiment_score field for quick filtering
	if err := qw.testimonialRepo.UpdateAny(ctx, testimonialID, map[string]any{
		"sentiment_score": result.SentimentScore,
	}, qw.db); err != nil {
		qw.logger.Error("Failed to update testimonial with sentiment score", zap.Error(err))
	}

	response := map[string]interface{}{
		"sentiment_result": result,
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
