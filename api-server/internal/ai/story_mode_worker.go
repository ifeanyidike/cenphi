// internal/ai/story_mode_worker.go
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

type storyVideoRequest struct {
	WorkspaceID string `json:"workspace_id"`
	pb.StoryModeRequest
	JobID            string                            `json:"job_id"`
	Source           models.CreateArtifactSourceParams `json:"source"`
	IncludeLogo      bool                              `json:"include_logo"`
	IncludeWatermark bool                              `json:"include_watermark"`
}

func (qw *AIQueueWorker) handleStoryVideoGeneration(ctx context.Context, msg queue.Message) error {
	var req storyVideoRequest

	fmt.Printf("story video generation payload %#v\n", msg)

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal story video generation job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "story-video"

	var testimonialId *uuid.UUID
	parentTestimonialId, err := uuid.Parse(req.Source.ParentTestimonialId)

	if err != nil {
		qw.logger.Warn("invalid parent testimonial ID, ignoring", zap.String("parent_testimonial_id", req.Source.ParentTestimonialId))
	} else {
		testimonialId = &parentTestimonialId
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 20, nil, nil)

	processedSegments := []*pb.ProcessedSegment{}
	segments := []*pb.TestimonialSegment{}

	log.Println("source type", req.Source.Type)
	var textParts []string
	var clips []models.ClipSource
	var transcriptStrategy StoryTranscriptStrategy

	if req.Source.Type == models.ClipsTypeSource {
		fmt.Printf("DEBUG: req.Source.Data type is: %T, value: %+v\n", req.Source.Data, req.Source.Data)

		clips, err = models.ExtractClipSourcesData(req.Source.Data)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, err.Error(), nil)
		}

		fmt.Printf("DEBUG: db type in story mode: %T\n", qw.db)
		if ctx.Err() != nil {
			return fmt.Errorf("context already cancelled: %w", ctx.Err())
		}

		// Determine transcript strategy (but don't generate yet)
		transcriptStrategy = qw.determineTranscriptStrategy(ctx, clips)
		qw.logger.Info("Determined transcript strategy for story video",
			zap.String("strategy", string(transcriptStrategy)),
			zap.Int("clip_count", len(clips)))

		if req.Source.RawData != nil {
			fmt.Println("using raw data")
			processedSegments, textParts = qw.getProcessedSegmentsFromRawData(req.Source.RawData)

		} else {
			processedSegments, textParts, err = qw.getProcessedSegmentsFromTranscripts(ctx,
				req.Source.Data, serviceID, req.JobID)
			if err != nil {
				return err
			}
		}

	} else {
		segments, textParts, err = qw.getTestimonialSegmentsFromTranscripts(
			ctx, serviceID, req.JobID, req.IncludeLogo, req.IncludeWatermark, req.TestimonialSegments)
		if err != nil {
			return err
		}
	}

	// Generate story video first
	storyVideoResult, err := qw.generateStoryVideo(ctx, &req, processedSegments, segments, workspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "story video generation failed", err)
	}

	enhancementData := models.JSONMap{
		"story_video_url": storyVideoResult.StoryVideoUrl,
		"source_info":     req.Source,
	}

	if processedSegments != nil {
		enhancementData["processed_segments"] = processedSegments
	}

	enhancedSource := req.Source
	enhancedSource.AppliedServices = append(enhancedSource.AppliedServices, "story_mode_generation")

	enhancedSource.Metadata = map[string]any{
		"asset_url":    storyVideoResult.StoryVideoUrl,
		"text_content": strings.Join(textParts, " "),
	}

	var testimonialsIds []uuid.UUID
	if req.Source.Type == models.BestStoryMoments {
		for _, s := range req.TestimonialSegments {
			id, err := uuid.Parse(s.TestimonialId)
			if err != nil {
				continue
			}
			testimonialsIds = append(testimonialsIds, id)
		}
	}

	// Create artifact with processing metadata containing transcript segments
	artifactID, err := qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "story_mode_generation",
		workspaceID, testimonialId, enhancementData, enhancedSource, testimonialsIds, qw.db)

	if err != nil {
		qw.logger.Error("Failed to save video generation artifact", zap.Error(err))
	}

	fmt.Printf("story video generation result %#v", storyVideoResult)
	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, enhancementData, nil)

	if req.Source.Type == models.ClipsTypeSource {
		artifactUUID, parseErr := uuid.Parse(artifactID)
		if parseErr == nil {
			go qw.generateTranscriptSegmentsInBackground(context.Background(), clips, transcriptStrategy,
				storyVideoResult.StoryVideoUrl, strings.Join(textParts, " "), artifactUUID, testimonialId)
		}
	}

	return nil
}

func (qw *AIQueueWorker) getTestimonialSegmentsFromTranscripts(
	ctx context.Context, serviceID, jobID string, includeLogo, includeWatermark bool, rawSegments []*pb.TestimonialSegment,
) ([]*pb.TestimonialSegment, []string, error) {
	segments := []*pb.TestimonialSegment{}
	var textParts []string
	for _, s := range rawSegments {
		fmt.Println("testimonial ID", s.TestimonialId)
		if s.MediaUrl == "" && s.TestimonialId == "" {
			continue
		}

		if s.Highlights == nil && s.TestimonialId == "" {
			continue
		}

		highlights := s.Highlights

		if s.Highlights == nil && s.TestimonialId != "" {
			testimonialID, err := uuid.Parse(s.TestimonialId)
			if err != nil {
				return nil, nil, qw.respondWithFailure(ctx, serviceID, jobID, "invalid testimonial ID", err)
			}

			testimonial, err := qw.testimonialRepo.FetchForAIProcessing(ctx, testimonialID, qw.db)
			if err != nil {
				return nil, nil, qw.respondWithFailure(ctx, serviceID, jobID, "invalid testimonial", err)
			}
			if testimonial.MediaURL == nil {
				qw.logger.Info("testimonial has no media URL", zap.String("testimonialID", s.TestimonialId))
				continue
			}
			s.MediaUrl = *testimonial.MediaURL

			highlights, err = qw.getStoryHighlightSegments(ctx, testimonialID, testimonial)
			if err != nil {
				return nil, nil, qw.respondWithFailure(ctx, serviceID, jobID, "Failed to get highlight moments", err)
			}

			for i := range highlights {
				textParts = append(textParts, highlights[i].Text)
				highlights[i].IncludeLogo = includeLogo
				highlights[i].IncludeWatermark = includeWatermark
			}
		}

		s.Highlights = highlights
		segments = append(segments, s)
	}

	return segments, textParts, nil
}

func (qw *AIQueueWorker) getProcessedSegmentsFromTranscripts(
	ctx context.Context, sourceData any, serviceID, jobID string,
) ([]*pb.ProcessedSegment, []string, error) {
	processedSegments := []*pb.ProcessedSegment{}

	var clips []models.ClipSource
	var textParts []string

	switch data := sourceData.(type) {
	case []models.ClipSource:
		clips = data
	case []map[string]any:
		b, _ := json.Marshal(data)
		if err := json.Unmarshal(b, &clips); err != nil {
			return nil, nil, qw.respondWithFailure(ctx, serviceID, jobID, "failed to unmarshal clip source", err)
		}
	default:
		return nil, nil, qw.respondWithFailure(ctx, serviceID, jobID, fmt.Sprintf("unexpected data type for source.Data: %T", sourceData), nil)
	}

	for _, clipSource := range clips {
		// Fetch highlights from each clip artifact
		artifact, err := qw.artifactRepo.GetByID(ctx, clipSource.ArtifactID, qw.db)
		if err != nil {
			return nil, nil, qw.respondWithFailure(ctx, serviceID, jobID, "Failed to fetch clip artifact", err)
		}

		if data, ok := artifact.Data["generated_clips"]; ok {
			var resp pb.ClippingResponse
			if b, err := json.Marshal(data); err == nil {
				if err := json.Unmarshal(b, &resp); err == nil {
					fmt.Println("decoded ClippingResponse", &resp)

					for _, clip := range resp.Clips {
						if clip.Id == clipSource.ClipID.String() {
							s := pb.ProcessedSegment{}
							fmt.Println("found clip", clip.Id)
							s.MediaUrl = clip.Url
							s.StartTime = clip.StartTime
							s.EndTime = clip.EndTime
							s.Duration = clip.Duration
							s.Theme = clip.Theme
							if clip.Text != "" {
								s.TextContent = clip.Text
								textParts = append(textParts, clip.Text)
							}

							processedSegments = append(processedSegments, &s)
						}
					}
				} else {
					fmt.Println("failed to unmarshal into ClippingResponse:", err)
				}
			}
		}
	}

	return processedSegments, textParts, nil
}

func (qw *AIQueueWorker) getProcessedSegmentsFromRawData(rawData any) ([]*pb.ProcessedSegment, []string) {
	processedSegments := []*pb.ProcessedSegment{}
	var clips []*pb.Clip
	var textParts []string
	if c, err := json.Marshal(rawData); err == nil {
		if err := json.Unmarshal(c, &clips); err == nil {
			for _, clip := range clips {
				s := pb.ProcessedSegment{}
				fmt.Println("found clip", clip.Id)
				s.MediaUrl = clip.Url
				s.StartTime = clip.StartTime
				s.EndTime = clip.EndTime
				s.Duration = clip.Duration
				s.Theme = clip.Theme
				if clip.Text != "" {
					s.TextContent = clip.Text
					textParts = append(textParts, clip.Text)
				}

				processedSegments = append(processedSegments, &s)

			}
		}
	}

	return processedSegments, textParts
}

func (qw *AIQueueWorker) generateStoryVideo(ctx context.Context, req *storyVideoRequest, processedSegments []*pb.ProcessedSegment,
	segments []*pb.TestimonialSegment, workspaceID uuid.UUID) (*pb.StoryModeResponse, error) {

	brandContext := &pb.BrandContext{}

	if req.BrandContext != nil {
		brandContext = req.BrandContext
	} else {
		context, err := qw.workspaceRepo.GetPbBrandContext(ctx, workspaceID, qw.db)
		if err != nil {
			return nil, fmt.Errorf("failed to get brand context: %w", err)
		}
		brandContext = context
	}

	pbReq := pb.StoryModeRequest{
		JobId:               req.JobID,
		TestimonialSegments: segments,
		ProcessedSegments:   processedSegments,
		BrandContext:        brandContext,
		OutputFormat:        req.OutputFormat,
		MusicVolume:         req.BackgroundMusic,
		Prompt:              req.Prompt,
		IntroImageUrl:       req.IntroImageUrl,
		OutroImageUrl:       req.OutroImageUrl,
		AddBackgroundMusic:  req.AddBackgroundMusic,
		BackgroundMusic:     req.BackgroundMusic,
		AutoOrder:           req.AutoOrder,
		CompanyName:         "Cenphi",
		Type:                string(req.Source.Type),
	}

	qw.updateJobStatusWithService(ctx, req.JobID, "story-video", "processing", 40, nil, nil)

	return qw.mediaIntelligence.GenerateStoryVideo(ctx, &pbReq)
}

func (qw *AIQueueWorker) generateTranscriptSegmentsInBackground(ctx context.Context, clips []models.ClipSource,
	strategy StoryTranscriptStrategy, storyVideoURL, combinedText string, artifactID uuid.UUID, testimonialId *uuid.UUID) {

	qw.logger.Info("Starting background transcript generation for story video",
		zap.String("strategy", string(strategy)),
		zap.String("artifact_id", artifactID.String()))

	var transcriptSegments models.TranscriptSegments
	var err error

	switch strategy {
	case ReuseExistingSegments:
		transcriptSegments, err = qw.buildConsolidatedSegments(ctx, clips)
		if err != nil {
			qw.logger.Error("Failed to build consolidated segments in background", zap.Error(err))
			return
		}
		qw.logger.Info("Built consolidated transcript segments in background",
			zap.Int("segment_count", len(transcriptSegments)))

	case FreshTranscription:
		// Now we have the story video URL for fresh transcription
		transcriptionResult, err := qw.aiService.AudioTranscriptionService.TranscribeAudio(storyVideoURL)
		if err != nil {
			qw.logger.Error("Failed to generate fresh transcript in background", zap.Error(err))
			return
		}
		transcriptSegments = transcriptionResult.Segments
		qw.logger.Info("Generated fresh transcript segments in background",
			zap.Int("segment_count", len(transcriptSegments)))

	default:
		qw.logger.Error("Unknown transcript strategy in background processing", zap.String("strategy", string(strategy)))
		return
	}

	var testimonialIdList []string
	if testimonialId != nil {
		testimonialIdList = append(testimonialIdList, testimonialId.String())
	}

	// Update artifact with transcript segments
	updateData := map[string]any{
		"story_transcript_segments":      transcriptSegments,
		"transcript_generation_strategy": string(strategy),
		"combined_text":                  combinedText,
		"transcript_generated_at":        "background_process",
		"testimonial_ids":                testimonialIdList,
	}

	if err := qw.artifactRepo.UpdateProcessingMetadata(ctx, artifactID, updateData, qw.db); err != nil {
		qw.logger.Error("Failed to save background transcript segments",
			zap.Error(err),
			zap.String("artifact_id", artifactID.String()))
	} else {
		qw.logger.Info("Successfully saved transcript segments in background",
			zap.String("artifact_id", artifactID.String()),
			zap.Int("segment_count", len(transcriptSegments)),
			zap.String("strategy", string(strategy)))
	}
}
