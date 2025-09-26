// internal/ai/enhancement_worker.go
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

func (qw *AIQueueWorker) handleEnhancementJob(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.EnhanceRequest
		JobID     string                            `json:"job_id"`
		Source    models.CreateArtifactSourceParams `json:"source"`
		MessageID string                            `json:"message_id"`
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

	fmt.Println("job messageID", req.MessageID)

	serviceID := "enhancement"
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

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	source, err := qw.getSourceData(ctx, req.Source)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid source: ", err)
	}

	if source.mediaURL == "" {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "no media URL found for enhancement", nil)
	}

	// Set media URL for enhancement

	brandContext, err := qw.workspaceRepo.GetPbBrandContext(ctx, workspaceID, qw.db)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "Failed to get brand context", err)
	}

	// CHECK: Cancellation point before major processing
	select {
	case <-jobCtx.Done():
		return qw.respondWithCancellation(ctx, serviceID, req.JobID)
	default:
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 25, nil, nil)

	pbReq := &req.EnhanceRequest
	pbReq.MediaUrl = source.mediaURL
	pbReq.UploadToCloud = true
	pbReq.LogoUrl = brandContext.LogoUrl
	pbReq.JobId = req.JobID

	if len(brandContext.ColorSlice) > 0 {
		pbReq.BrandColor = brandContext.ColorSlice[0]
	}

	result, err := qw.mediaIntelligence.EnhanceMedia(ctx, pbReq)
	select {
	case <-jobCtx.Done():
		return qw.respondWithCancellation(ctx, serviceID, req.JobID)
	default:
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "enhancement failed", err)
		}
	}

	enhancementData := models.JSONMap{
		"enhanced_url":         result.EnhancedUrl,
		"applied_enhancements": result.AppliedEnhancements,
		"quality_score":        result.QualityScore,
		"source_info":          req.Source,
		"original_media_url":   source.mediaURL,
	}

	// Update source to mark enhancement as applied
	enhancedSource := req.Source
	enhancedSource.AppliedServices = append(enhancedSource.AppliedServices, "enhancement")

	enhancedSource.Metadata = map[string]any{
		"enhancement_quality":  req.Quality,
		"enhancements_applied": result.AppliedEnhancements,
		"start_time":           source.startTime,
		"end_time":             source.endTime,
		"asset_url":            result.EnhancedUrl,
		"text_content":         source.content,
	}
	log.Println("enhancedSource", source.testimonialID)

	_, err = qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "enhancement", workspaceID, &source.testimonialID, enhancementData, enhancedSource, nil, qw.db)

	if err != nil {
		qw.logger.Error("Failed to save enhancement artifact", zap.Error(err))
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, enhancementData, nil)

	return nil
}
