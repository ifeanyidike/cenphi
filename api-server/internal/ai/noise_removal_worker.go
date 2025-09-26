// internal/ai/noise_removal_worker.go
package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

func (qw *AIQueueWorker) handleNoiseRemoval(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.NoiseReductionRequest
		JobID  string                            `json:"job_id"`
		Source models.CreateArtifactSourceParams `json:"source"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal noise removal job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "noise-removal"
	if qw.isJobCancelled(ctx, req.JobID) {
		qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "cancelled", 100, nil, nil)
		return &queue.NonRetryableError{Message: "Job was cancelled before processing"}
	}

	jobCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	qw.setJobCancelFunction(ctx, req.JobID, cancel)
	defer qw.clearJobCancelFunction(ctx, req.JobID)

	go qw.monitorJobCancellation(jobCtx, req.JobID, cancel)

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	source, err := qw.getSourceData(ctx, req.Source)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid source: ", err)
	}

	if source.mediaURL == "" {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "no media URL found for noise removal", nil)
	}

	select {
	case <-jobCtx.Done():
		return qw.respondWithCancellation(ctx, serviceID, req.JobID)
	default:
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 25, nil, nil)

	pbReq := &req.NoiseReductionRequest
	pbReq.MediaUrl = source.mediaURL
	pbReq.TestimonialId = source.testimonialID.String()
	pbReq.JobId = req.JobID

	result, err := qw.mediaIntelligence.NoiseRemoval(ctx, pbReq)
	select {
	case <-jobCtx.Done():
		return qw.respondWithCancellation(ctx, serviceID, req.JobID)
	default:
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "noise removal failed", err)
		}
	}

	denoiseData := models.JSONMap{
		"denoised_media_url": result.DenoisedMediaUrl,
		"original_media_url": source.mediaURL,
	}

	// Update source to mark noise removal as applied
	enhancedSource := req.Source
	enhancedSource.AppliedServices = append(enhancedSource.AppliedServices, "noise-removal")
	enhancedSource.Metadata = map[string]any{
		"start_time": source.startTime,
		"end_time":   source.endTime,
	}
	log.Println("enhancedSource", enhancedSource, source.testimonialID)

	_, err = qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "noise removal", workspaceID, &source.testimonialID, denoiseData, enhancedSource, nil, qw.db)

	if err != nil {
		qw.logger.Error("Failed to save noise removal artifact", zap.Error(err))
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, denoiseData, nil)

	return nil
}
