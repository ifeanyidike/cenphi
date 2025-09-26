// internal/ai/narration_worker.go
package ai

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

func (qw *AIQueueWorker) handleNarrationJob(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.NarrationRequest
		JobID  string                            `json:"job_id"`
		Source models.CreateArtifactSourceParams `json:"source"`
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

	serviceID := "narration"
	if req.Source.Type != models.TestimonialTypeSource && req.Source.Type != models.ArtifactTypeSource {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid resource type", nil)
	}

	qw.logger.Info("🎙️ Processing voice narration",
		zap.String("jobId", req.JobID),
		zap.String("voiceId", req.VoiceId),
		zap.Int("textLength", len(req.Text)))

	// testimonialID, err := uuid.Parse(req.TestimonialId)
	// if err != nil {
	// 	return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	// }
	source, err := qw.getSourceData(ctx, req.Source)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid source: ", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	// testimonial, err := qw.testimonialRepo.FetchForAIProcessing(ctx, testimonialID, qw.db)
	// if err != nil {
	// 	return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial", err)
	// }

	if source.content == "" {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "testimonial has no text content", err)
	}

	pbReq := &req.NarrationRequest
	pbReq.JobId = req.JobID
	if pbReq.Text == "" {
		pbReq.Text = source.content
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 40, nil, nil)

	result, err := qw.mediaIntelligence.GenerateNarration(ctx, &req.NarrationRequest)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "narration generation failed", err)
	}

	// response_data := models.JSONMap{
	// 	"audio_url": result.AudioUrl,
	// 	"voice_id":  req.VoiceId,
	// }

	enhancementData := models.JSONMap{
		"audio_url":   result.AudioUrl,
		"voice_id":    req.VoiceId,
		"source_info": req.Source,
	}

	// Update source to mark enhancement as applied
	enhancedSource := req.Source
	enhancedSource.AppliedServices = append(enhancedSource.AppliedServices, "narration")

	enhancedSource.Metadata = map[string]any{
		"asset_url":    result.AudioUrl,
		"text_content": source.content,
	}

	_, err = qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "narration", workspaceID, &source.testimonialID, enhancementData, enhancedSource, nil, qw.db)

	if err != nil {
		qw.logger.Error("Failed to save narration artifact", zap.Error(err))
	}

	qw.logger.Info("✅ Narration completed",
		zap.String("jobId", req.JobID),
		zap.String("audioUrl", result.AudioUrl))

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, enhancementData, nil)

	return nil
}
