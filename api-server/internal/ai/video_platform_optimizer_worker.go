// internal/ai/video_platform_optimizer_worker.go
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

type platformOptimizationRequest struct {
	WorkspaceID string `json:"workspace_id"`
	Prompt      string `json:"prompt"`
	pb.OptimizeRequest
	JobID  string                            `json:"job_id"`
	Source models.CreateArtifactSourceParams `json:"source"`
}

func (qw *AIQueueWorker) handlePlatformOptimization(ctx context.Context, msg queue.Message) error {
	var req platformOptimizationRequest

	fmt.Println("platform optimization payload")

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal platform optimization job: %v", err),
		}
	}

	if req.JobID == "" {
		req.JobID = msg.ID
	}

	serviceID := "optimization"

	source, err := qw.getSourceData(ctx, req.Source)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid source: ", err)
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "invalid workspace ID", err)
	}

	brandContext := &pb.BrandContext{}

	if req.BrandContext != nil {
		brandContext = req.BrandContext
	} else {
		context, err := qw.workspaceRepo.GetPbBrandContext(ctx, workspaceID, qw.db)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, req.JobID, "Failed to get brand context for optimization", err)
		}
		brandContext = context
	}

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "processing", 30, nil, nil)

	pbReq := &req.OptimizeRequest
	pbReq.BrandContext = brandContext
	pbReq.MediaUrl = source.mediaURL
	pbReq.Transcript = source.content
	pbReq.JobId = req.JobID

	// Handle transcript segments
	if err := qw.handleTranscriptSegments(ctx, source, pbReq, serviceID, req.JobID, req.Source.From); err != nil {
		return err
	}

	mediaOptResult, err := qw.mediaIntelligence.OptimizeMediaForPlatform(ctx, pbReq)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, req.JobID, "platform optimization failed", err)
	}

	optimized_transcript := source.content

	if source.content != "" {
		textOptResult, err := qw.aiService.PlatformOptimizerService.OptimizeForPlatform(ctx, req.WorkspaceID, source.content, brandContext, req.TargetPlatform, req.Prompt)
		if err != nil {
			qw.logger.Error("Failed to optimize text", zap.Error(err))
		} else if textOptResult != nil {
			optimized_transcript = textOptResult.Content
		}
	}

	enhancementData := models.JSONMap{
		"optimized_url": mediaOptResult.OptimizedUrl,
		"text":          optimized_transcript,
		"source_info":   req.Source,
		"start_time":    source.startTime,
		"end_time":      source.endTime,
		"platform":      req.TargetPlatform,
	}

	// Update source to mark enhancement as applied
	enhancedSource := req.Source
	enhancedSource.AppliedServices = append(enhancedSource.AppliedServices, "optimization")
	if req.RemoveNoise {
		enhancedSource.AppliedServices = append(enhancedSource.AppliedServices, "noise_reduction")
	}

	if req.EnableMediaEnhancement {
		enhancedSource.AppliedServices = append(enhancedSource.AppliedServices, "enhancement")
	}

	enhancedSource.Metadata = map[string]any{
		"start_time":   source.startTime,
		"end_time":     source.endTime,
		"asset_url":    mediaOptResult.OptimizedUrl,
		"text_content": source.content,
	}

	_, err = qw.aiService.ArtifactsRepo.CreateArtifactWithLineage(ctx, "video_platform_optimization", workspaceID, &source.testimonialID, enhancementData, enhancedSource, nil, qw.db)

	if err != nil {
		qw.logger.Error("Failed to save optimized url", zap.Error(err))
	}

	fmt.Printf("platform optimization result %#v", mediaOptResult)

	qw.updateJobStatusWithService(ctx, req.JobID, serviceID, "completed", 100, enhancementData, nil)

	return nil
}

// func (qw *AIQueueWorker) handleTranscriptSegments(ctx context.Context, source SourceParam, pbReq *pb.OptimizeRequest, serviceID, jobID string, storyVideoSource bool) error {
// 	if source.transcriptSegments != nil {
// 		// Direct transcript segments available
// 		pbReq.TranscriptSegments, _ = qw.convertModelSegmenttoPb(source.transcriptSegments)
// 		qw.logger.Info("Using direct transcript segments")
// 		return nil
// 	}

// 	if storyVideoSource {
// 		// Story video source - check for saved transcript segments
// 		return qw.handleStoryVideoTranscripts(ctx, source, pbReq, serviceID, jobID)
// 	}

// 	if source.testimonialID != uuid.Nil && source.startTime != nil && source.endTime != nil {
// 		// Regular clip - extract from testimonial
// 		testimonial, err := qw.testimonialRepo.FetchForAIProcessing(ctx, source.testimonialID, qw.db)
// 		if err != nil {
// 			return qw.respondWithFailure(ctx, serviceID, jobID, "invalid testimonial", err)
// 		}
// 		choiceSegments := qw.getTranscriptSegmentByTime(*testimonial.TranscriptSegments, *source.startTime, *source.endTime)
// 		fmt.Println("choice segment", choiceSegments)
// 		pbReq.TranscriptSegments, _ = qw.convertModelSegmenttoPb(choiceSegments)
// 		return nil
// 	}

// 	return qw.respondWithFailure(ctx, serviceID, jobID, "platform optimization failed - invalid segments", nil)
// }

func (qw *AIQueueWorker) handleTranscriptSegments(ctx context.Context, source SourceParam, pbReq *pb.OptimizeRequest, serviceID, jobID string, sourceFrom string) error {
	// First priority: use direct transcript segments if available
	if source.transcriptSegments != nil {
		pbReq.TranscriptSegments, _ = qw.convertModelSegmenttoPb(source.transcriptSegments)
		qw.logger.Info("Using direct transcript segments", zap.Int("segment_count", len(source.transcriptSegments)))
		return nil
	}

	// Second priority: handle based on source.From field
	switch sourceFrom {
	case "story_video":
		qw.logger.Info("Processing story_video source")
		return qw.handleStoryVideoTranscripts(ctx, source, pbReq, serviceID, jobID)

	case "enhancement":
		qw.logger.Info("Processing enhancement source")
		return qw.handleEnhancementSourceTranscripts(ctx, source, pbReq, serviceID, jobID)

	default:
		// Default behavior: extract from testimonial if timing info available
		return qw.handleDefaultTranscriptExtraction(ctx, source, pbReq, serviceID, jobID)
	}
}

func (qw *AIQueueWorker) handleEnhancementSourceTranscripts(ctx context.Context, source SourceParam, pbReq *pb.OptimizeRequest, serviceID, jobID string) error {
	qw.logger.Info("Handling enhancement source transcript segments", zap.String("artifact_id", source.artifactID.String()))

	// Get the enhancement artifact to check its lineage
	enhancementArtifact := source.artifact
	if enhancementArtifact == nil && source.artifactID != uuid.Nil {
		artifact, err := qw.artifactRepo.GetByID(ctx, source.artifactID, qw.db)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, jobID, "failed to get enhancement artifact", err)
		}
		enhancementArtifact = artifact
	}

	if enhancementArtifact == nil {
		return qw.respondWithFailure(ctx, serviceID, jobID, "failed to get enhancement artifact", nil)
	}

	// Check if enhancement is derived from a story video by examining its sources
	isFromStoryVideo, storyArtifact, err := qw.checkIfDerivedFromStoryVideo(ctx, enhancementArtifact)
	if err != nil {
		qw.logger.Warn("Failed to check story video lineage, falling back to default", zap.Error(err))
		return qw.handleDefaultTranscriptExtraction(ctx, source, pbReq, serviceID, jobID)
	}

	if isFromStoryVideo && storyArtifact != nil {
		qw.logger.Info("Enhancement is derived from story video, using story transcript segments",
			zap.String("story_artifact_id", storyArtifact.ID.String()))
		return qw.extractTranscriptFromStoryVideo(ctx, storyArtifact, pbReq, serviceID, jobID)
	}

	// If not from story video, proceed with default extraction
	qw.logger.Info("Enhancement is not from story video, using default transcript extraction")
	return qw.handleDefaultTranscriptExtraction(ctx, source, pbReq, serviceID, jobID)
}

// Helper function to check if an artifact is derived from a story video
func (qw *AIQueueWorker) checkIfDerivedFromStoryVideo(ctx context.Context, artifact *models.TestimonialArtifact) (bool, *models.TestimonialArtifact, error) {
	// Get artifact with its sources to check lineage
	artifactWithSources, err := qw.artifactRepo.GetArtifactWithSources(ctx, artifact.ID, qw.db)
	if err != nil {
		return false, nil, fmt.Errorf("failed to get artifact sources: %w", err)
	}

	// Check each source to see if any is a story video
	for _, source := range artifactWithSources.ArtifactSources {
		if source.SourceArtifactID != nil {
			sourceArtifact, err := qw.artifactRepo.GetByID(ctx, *source.SourceArtifactID, qw.db)
			if err != nil {
				continue // Skip this source if we can't fetch it
			}

			// Check if source artifact is a story video
			if sourceArtifact.ProcessingType == "story_mode_generation" {
				return true, sourceArtifact, nil
			}

			// Recursively check if the source artifact is derived from a story video
			isFromStory, storyArtifact, err := qw.checkIfDerivedFromStoryVideo(ctx, sourceArtifact)
			if err == nil && isFromStory {
				return true, storyArtifact, nil
			}
		}
	}

	return false, nil, nil
}

// Extract transcript segments from a story video artifact
func (qw *AIQueueWorker) extractTranscriptFromStoryVideo(ctx context.Context, storyArtifact *models.TestimonialArtifact, pbReq *pb.OptimizeRequest, serviceID, jobID string) error {
	// Check processing metadata for saved transcript segments
	if storyArtifact.ProcessingMetadata != nil {
		if segmentsData, ok := storyArtifact.ProcessingMetadata["story_transcript_segments"]; ok {
			if segments, ok := segmentsData.(models.TranscriptSegments); ok && len(segments) > 0 {
				pbReq.TranscriptSegments, _ = qw.convertModelSegmenttoPb(segments)
				qw.logger.Info("Using saved story transcript segments", zap.Int("segment_count", len(segments)))
				return nil
			}

			// Try JSON unmarshaling as fallback
			if segmentsJSON, ok := segmentsData.([]byte); ok {
				var segments models.TranscriptSegments
				if err := json.Unmarshal(segmentsJSON, &segments); err == nil && len(segments) > 0 {
					pbReq.TranscriptSegments, _ = qw.convertModelSegmenttoPb(segments)
					qw.logger.Info("Using saved story transcript segments (from JSON)", zap.Int("segment_count", len(segments)))
					return nil
				}
			}
		}
	}

	// If no saved segments, generate fresh transcript from story video URL
	var storyVideoURL string
	if storyArtifact.AssetURL != nil {
		storyVideoURL = *storyArtifact.AssetURL
	} else if storyVideoData, ok := storyArtifact.Data["story_video_url"]; ok {
		if url, ok := storyVideoData.(string); ok {
			storyVideoURL = url
		}
	}

	if storyVideoURL == "" {
		return qw.respondWithFailure(ctx, serviceID, jobID, "story video URL not found", nil)
	}

	qw.logger.Info("No saved transcript segments found, generating fresh transcript", zap.String("story_video_url", storyVideoURL))

	transcriptionResult, err := qw.aiService.AudioTranscriptionService.TranscribeAudio(storyVideoURL)
	if err != nil {
		return qw.respondWithFailure(ctx, serviceID, jobID, "fresh transcription failed", err)
	}

	pbReq.TranscriptSegments, _ = qw.convertModelSegmenttoPb(transcriptionResult.Segments)
	pbReq.Transcript = transcriptionResult.Transcript

	qw.logger.Info("Generated fresh transcript for story video",
		zap.Int("segment_count", len(transcriptionResult.Segments)))

	return nil
}

// Default transcript extraction logic
func (qw *AIQueueWorker) handleDefaultTranscriptExtraction(ctx context.Context, source SourceParam, pbReq *pb.OptimizeRequest, serviceID, jobID string) error {
	if source.testimonialID != uuid.Nil && source.startTime != nil && source.endTime != nil {
		// Regular clip or artifact with timing - extract from testimonial
		testimonial, err := qw.testimonialRepo.FetchForAIProcessing(ctx, source.testimonialID, qw.db)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, jobID, "invalid testimonial", err)
		}

		if testimonial.TranscriptSegments == nil {
			return qw.respondWithFailure(ctx, serviceID, jobID, "testimonial transcript segments missing", nil)
		}

		choiceSegments := qw.getTranscriptSegmentByTime(*testimonial.TranscriptSegments, *source.startTime, *source.endTime)
		fmt.Println("choice segment", choiceSegments)
		pbReq.TranscriptSegments, _ = qw.convertModelSegmenttoPb(choiceSegments)
		qw.logger.Info("Extracted transcript segments from testimonial",
			zap.Int("segment_count", len(choiceSegments)),
			zap.Float64("start_time", *source.startTime),
			zap.Float64("end_time", *source.endTime))
		return nil
	}

	return qw.respondWithFailure(ctx, serviceID, jobID, "platform optimization failed - invalid segments", nil)
}

// Simple lookup for story video transcript segments (existing function, kept for compatibility)
func (qw *AIQueueWorker) handleStoryVideoTranscripts(ctx context.Context, source SourceParam, pbReq *pb.OptimizeRequest, serviceID, jobID string) error {
	qw.logger.Info("Handling story video transcript segments", zap.String("artifact_id", source.artifactID.String()))

	// Get the story artifact
	storyArtifact := source.artifact

	if storyArtifact == nil && source.artifactID != uuid.Nil {
		artifact, err := qw.artifactRepo.GetByID(ctx, source.artifactID, qw.db)
		if err != nil {
			return qw.respondWithFailure(ctx, serviceID, jobID, "failed to get story artifact", err)
		}
		storyArtifact = artifact
	}
	if storyArtifact == nil {
		return qw.respondWithFailure(ctx, serviceID, jobID, "failed to get story artifact", nil)
	}

	return qw.extractTranscriptFromStoryVideo(ctx, storyArtifact, pbReq, serviceID, jobID)
}

func (qw *AIQueueWorker) getTranscriptSegmentByTime(segments models.TranscriptSegments, start, end float64) models.TranscriptSegments {
	if len(segments) == 0 {
		return segments
	}
	choiceSegments := models.TranscriptSegments{}

	for _, s := range segments {
		if s.StartTime >= start && s.EndTime <= end {
			s.StartTime -= start
			s.EndTime -= start

			for i := range s.Words {
				s.Words[i].Start -= start
				s.Words[i].End -= start
			}

			choiceSegments = append(choiceSegments, s)
		}
	}

	return choiceSegments
}
