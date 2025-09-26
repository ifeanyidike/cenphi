// internal/ai/clipping_worker.go
package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

func (qw *AIQueueWorker) handleClippingJob(ctx context.Context, msg queue.Message) error {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.ClippingRequest
		JobID              string                            `json:"job_id"`
		Source             models.CreateArtifactSourceParams `json:"source"`
		IncludeLogo        bool                              `json:"include_logo"`
		IncludeWatermark   bool                              `json:"include_watermark"`
		AddBackgroundMusic bool                              `json:"add_background_music"`
		RemoveNoise        bool                              `json:"remove_noise"`
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

	serviceID := "clipping"

	if req.Source.Type != models.TestimonialTypeSource {
		return qw.respondWithFailure(ctx, serviceID, req.JobID,
			"clipping can only be performed on original testimonials",
			fmt.Errorf("invalid source type: %s", req.Source.Type))
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 20, nil, nil)

	// if req.TestimonialId == "" || req.MediaUrl == "" {
	// 	return qw.respondWithFailure(ctx, serviceID, req.JobID, "clipping failed - no media url or testimonial id", nil)
	// }

	if req.TestimonialId == "" {
		req.TestimonialId = req.Source.Data.(string)
		if req.TestimonialId == "" {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "clipping failed - testimonial id", nil)
		}

	}

	testimonialID, err := uuid.Parse(req.TestimonialId)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid testimonial ID", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	testimonial, err := qw.testimonialRepo.FetchForAIProcessing(ctx, testimonialID, qw.db)
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
				words := make([]string, 0, len(moments[i].Words))
				for _, w := range moments[i].Words {
					words = append(words, w.Text)
				}
				moments[i] = &pb.HighlightMoment{
					StartTime:          moments[i].StartTime,
					EndTime:            moments[i].EndTime,
					Theme:              moments[i].Theme,
					Text:               strings.Join(words, " "),
					IncludeLogo:        req.IncludeLogo,
					IncludeWatermark:   req.IncludeWatermark,
					AddBackgroundMusic: req.AddBackgroundMusic,
					RemoveNoise:        req.RemoveNoise,
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
		BackgroundMusic:  req.BackgroundMusic,
		MusicVolume:      req.MusicVolume,
		Branding:         branding,
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 40, nil, nil)

	clips, err := qw.mediaIntelligence.GenerateClips(ctx, &pbReq)
	if err != nil {
		// Check if it's a non-retryable error
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "clip generation failed", err)
	}

	result := models.JSONMap{
		"generated_clips": clips,
		"source_info":     req.Source,
	}
	enhancedSource := req.Source
	enhancedSource.AppliedServices = append(enhancedSource.AppliedServices, "clipping")
	enhancedSource.Metadata = map[string]any{
		"clips_generated": len(clips.Clips),
		"original_source": req.Source.Type,
	}

	if _, err := qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "clipping", workspaceID, &testimonialID, result, enhancedSource, nil, qw.db); err != nil {
		qw.logger.Error("Failed to save clipping artifact", zap.Error(err))
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, result, nil)

	qw.logger.Info("✅ Smart clipping completed",
		zap.String("job_id", req.JobID),
		zap.String("testimonial_id", req.TestimonialId),
		zap.Int("clips_generated", len(clips.Clips)))
	return nil
}

func (qw *AIQueueWorker) getStoryHighlightSegments(ctx context.Context, testimonialId uuid.UUID, testimonial *models.TestimonialAIData) ([]*pb.HighlightMoment, error) {
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
