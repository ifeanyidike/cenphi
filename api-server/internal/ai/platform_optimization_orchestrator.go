package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"maps"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

// RegisterPlatformOptimizationHandlers registers all platform optimization step handlers
func (o *StepOrchestrator) RegisterPlatformOptimizationHandlers(worker *PlatformOptimizationStepsWorker) {
	// Register each step handler
	o.registerHandler("platform_optimization", "crop_resize", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleCropResize(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("platform_optimization", "burn_captions", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleBurnCaptions(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("platform_optimization", "text_overlay", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleTextOverlay(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("platform_optimization", "apply_broll", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleApplyBroll(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("platform_optimization", "noise_removal", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleNoiseRemoval(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("platform_optimization", "mix_music", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleMixMusic(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("platform_optimization", "apply_branding", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleApplyBranding(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("platform_optimization", "enhance", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleEnhance(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("platform_optimization", "text_optimization", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}

		result, err := worker.HandleTextOptimization(ctx, stepCtx)
		if err != nil {
			return nil, err
		}

		return o.convertToStepOutput(result), nil
	})
}

// RegisterCustomPipelineHandlers registers all custom pipeline step handlers
// Custom pipeline reuses the same handlers as platform_optimization since operations are identical
func (o *StepOrchestrator) RegisterCustomPipelineHandlers(worker *PlatformOptimizationStepsWorker) {
	// Register each step handler for custom_pipeline
	// These are identical to platform_optimization handlers but registered under "custom_pipeline" type

	o.registerHandler("custom_pipeline", "crop_resize", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		result, err := worker.HandleCropResize(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("custom_pipeline", "burn_captions", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		result, err := worker.HandleBurnCaptions(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("custom_pipeline", "text_overlay", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		result, err := worker.HandleTextOverlay(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("custom_pipeline", "apply_broll", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		result, err := worker.HandleApplyBroll(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("custom_pipeline", "noise_removal", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		result, err := worker.HandleNoiseRemoval(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("custom_pipeline", "mix_music", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		result, err := worker.HandleMixMusic(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("custom_pipeline", "apply_branding", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		result, err := worker.HandleApplyBranding(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("custom_pipeline", "enhance", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		result, err := worker.HandleEnhance(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})

	o.registerHandler("custom_pipeline", "audio_normalization", func(ctx context.Context, input *StepInput) (*StepOutput, error) {
		stepCtx, err := o.buildStepContext(ctx, input)
		if err != nil {
			return nil, err
		}
		// Audio normalization uses noise removal handler (can be same implementation or separate)
		result, err := worker.HandleNoiseRemoval(ctx, stepCtx)
		if err != nil {
			return nil, err
		}
		return o.convertToStepOutput(result), nil
	})
}

// buildStoryVideoStepContext builds StepContext for story video steps (doesn't require testimonialID)
func (o *StepOrchestrator) buildStoryVideoStepContext(ctx context.Context, input *StepInput) (*StepContext, error) {
	// Get brand context
	var brandContext *pb.BrandContext
	var err error

	if input.BrandContext != nil {
		var ok bool
		brandContext, ok = input.BrandContext.(*pb.BrandContext)
		if !ok {
			o.logger.Warn("Invalid BrandContext type in input, fetching from workspace")
			brandContext = nil
		}
	}

	if brandContext == nil {
		// Fetch from workspace
		brandContext, err = o.workspaceRepo.GetPbBrandContext(ctx, input.WorkspaceID, o.db)
		if err != nil {
			o.logger.Warn("Failed to get brand context, using empty",
				zap.String("workspace_id", input.WorkspaceID.String()),
				zap.Error(err))
			brandContext = &pb.BrandContext{}
		}
	}

	// Determine current artifact URL from input or config
	currentArtifactURL := ""
	if input.InputArtifactPath != nil {
		currentArtifactURL = *input.InputArtifactPath
	}

	// CRITICAL FIX: Load previous stage metadata and merge into Config
	mergedConfig := make(map[string]any)
	maps.Copy(mergedConfig, input.Config)

	if input.PreviousStageMetadata != nil {
		for k, v := range input.PreviousStageMetadata {
			if _, exists := mergedConfig[k]; !exists {
				mergedConfig[k] = v
			}
		}
	}

	// For story video, testimonial ID is optional (nil for multi-testimonial)
	var testimonialID uuid.UUID
	if input.TestimonialID != nil {
		testimonialID = *input.TestimonialID
	}

	stepCtx := &StepContext{
		SessionID:          input.SessionID,
		TestimonialID:      testimonialID,
		WorkspaceID:        input.WorkspaceID,
		StageID:            input.StageID,
		BrandContext:       brandContext,
		Config:             mergedConfig,
		CurrentArtifactURL: currentArtifactURL,
		OriginalVideoURL:   currentArtifactURL,
	}

	return stepCtx, nil
}

// buildStepContext builds the StepContext from StepInput
func (o *StepOrchestrator) buildStepContext(ctx context.Context, input *StepInput) (*StepContext, error) {
	// For story video operations, testimonialID might be nil or a zero UUID
	// In that case, we work with the artifact passed from previous stage
	var testimonialData *models.TestimonialAIData
	var err error

	if input.TestimonialID != nil && *input.TestimonialID != uuid.Nil {
		testimonialData, err = o.testimonialRepo.FetchForAIProcessing(ctx, *input.TestimonialID, o.db)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch testimonial: %w", err)
		}
	}

	// Get brand context
	var brandContext *pb.BrandContext
	if input.BrandContext != nil {
		var ok bool
		brandContext, ok = input.BrandContext.(*pb.BrandContext)
		if !ok {
			o.logger.Warn("Invalid BrandContext type in input, fetching from workspace")
			brandContext = nil
		}
	}

	if brandContext == nil {
		// Fetch from workspace
		brandContext, err = o.workspaceRepo.GetPbBrandContext(ctx, input.WorkspaceID, o.db)
		if err != nil {
			o.logger.Warn("Failed to get brand context, using empty",
				zap.String("workspace_id", input.WorkspaceID.String()),
				zap.Error(err))
			brandContext = &pb.BrandContext{}
		}
	}

	// Get target platform from config
	targetPlatform, _ := input.Config["target_platform"].(string)
	if targetPlatform == "" {
		// Check if this is a story_video session - if so, don't set a default platform
		sessionType, _ := input.Config["session_type"].(string)
		if sessionType != "story_video" {
			targetPlatform = "instagram_reels" // default for platform_optimization only
		}
		// For story_video, targetPlatform remains empty (no platform assigned)
	}

	// Determine current artifact URL and duration
	// CRITICAL FIX: Support clip_url and clip_duration directly from config
	currentArtifactURL := ""
	var clipDuration *float64 // Track clip duration for B-roll calculations

	if input.InputArtifactPath != nil {
		currentArtifactURL = *input.InputArtifactPath
	} else {
		// PRIORITY 1: Check for clip_url directly in config (fastest, most reliable)
		if clipURL, ok := input.Config["clip_url"].(string); ok && clipURL != "" {
			currentArtifactURL = clipURL
			o.logger.Info("Using clip_url from config for processing",
				zap.String("clip_url", clipURL))

			// Also get clip_duration if provided
			if dur, ok := input.Config["clip_duration"].(float64); ok && dur > 0 {
				clipDuration = &dur
				o.logger.Info("Using clip_duration from config",
					zap.Float64("clip_duration", dur))
			}
		} else {
			// PRIORITY 2: Try clip_id (fetch from database)
			clipID, hasClipID := input.Config["clip_id"].(string)
			if hasClipID && clipID != "" {
				// Fetch clip URL and metadata from artifacts
				clipURL, err := o.getClipURL(ctx, input.TestimonialID, clipID)
				if err != nil {
					o.logger.Warn("Failed to fetch clip URL, falling back to testimonial",
						zap.String("clip_id", clipID),
						zap.Error(err))
					if testimonialData != nil && testimonialData.MediaURL != nil {
						currentArtifactURL = *testimonialData.MediaURL
					}
				} else {
					currentArtifactURL = clipURL

					// Also fetch clip metadata for duration
					clipMeta, err := o.getClipMetadata(ctx, input.TestimonialID, clipID)
					if err == nil && clipMeta != nil {
						clipDuration = &clipMeta.Duration
						o.logger.Info("Using clip from database",
							zap.String("clip_id", clipID),
							zap.String("clip_url", clipURL),
							zap.Float64("clip_duration", clipMeta.Duration))
					} else {
						o.logger.Info("Using clip URL (duration unknown)",
							zap.String("clip_id", clipID),
							zap.String("clip_url", clipURL))
					}
				}
			} else if testimonialData != nil && testimonialData.MediaURL != nil {
				// PRIORITY 3: Fallback to full testimonial
				currentArtifactURL = *testimonialData.MediaURL
				o.logger.Info("Using full testimonial video for processing")
			}
		}
	}

	// Store clip duration in config for use by stages (especially B-roll)
	if clipDuration != nil {
		input.Config["actual_video_duration"] = *clipDuration
	}

	// Get transcript data
	transcript := ""
	var transcriptSegments models.TranscriptSegments
	if testimonialData != nil {
		if testimonialData.Content != nil {
			transcript = *testimonialData.Content
		}
		if testimonialData.TranscriptSegments != nil {
			transcriptSegments = *testimonialData.TranscriptSegments

			// CRITICAL FIX: When processing a clip, filter and adjust transcript segments
			// to match the clip's time range
			clipID, hasClipID := input.Config["clip_id"].(string)
			if hasClipID && clipID != "" {
				// Fetch clip metadata (start_time, end_time, duration)
				clipMetadata, err := o.getClipMetadata(ctx, input.TestimonialID, clipID)
				if err != nil {
					o.logger.Warn("Failed to fetch clip metadata for transcript filtering",
						zap.String("clip_id", clipID),
						zap.Error(err))
				} else {
					// Use the correct logic from video_platform_optimizer_worker.go
					// Extract segments that fall WITHIN the clip's time range (start >= clipStart AND end <= clipEnd)
					filteredSegments := o.getTranscriptSegmentsByTime(
						transcriptSegments,
						clipMetadata.StartTime,
						clipMetadata.EndTime,
					)

					o.logger.Info("Filtered transcript segments for clip using time-based extraction",
						zap.String("clip_id", clipID),
						zap.Int("original_segments", len(*testimonialData.TranscriptSegments)),
						zap.Int("filtered_segments", len(filteredSegments)),
						zap.Float64("clip_start", clipMetadata.StartTime),
						zap.Float64("clip_end", clipMetadata.EndTime),
						zap.Float64("clip_duration", clipMetadata.Duration))

					if len(filteredSegments) == 0 {
						o.logger.Warn("No transcript segments found for clip time range - using full parent transcript",
							zap.String("clip_id", clipID),
							zap.Float64("clip_start", clipMetadata.StartTime),
							zap.Float64("clip_end", clipMetadata.EndTime))
						// Keep original transcriptSegments
					} else {
						transcriptSegments = filteredSegments
					}
				}
			}
		}
	}

	// CRITICAL FIX: Handle story video artifacts (or other artifacts without testimonialData)
	// If processing an artifact (like story video) that needs transcript segments for burn_captions
	// Check if artifact_id is provided in config → load from artifact's Data field or generate on-demand
	if testimonialData == nil || (testimonialData.TranscriptSegments == nil && currentArtifactURL != "") {
		artifactID, hasArtifactID := input.Config["artifact_id"].(string)
		if hasArtifactID && artifactID != "" {
			// Load transcript segments from artifact's Data field (cached from previous burn_captions)
			segments, err := o.getTranscriptSegmentsFromArtifact(ctx, artifactID)
			if err != nil {
				o.logger.Warn("Failed to load cached transcript segments from artifact",
					zap.String("artifact_id", artifactID),
					zap.Error(err))
			} else if len(segments) > 0 {
				transcriptSegments = segments
				o.logger.Info("✅ Loaded cached transcript segments from artifact",
					zap.String("artifact_id", artifactID),
					zap.Int("segments_count", len(segments)))
			} else {
				o.logger.Info("No cached transcript segments found in artifact, will need on-demand generation",
					zap.String("artifact_id", artifactID))
			}
		}
	}

	// CRITICAL FIX: Load previous stage metadata and merge into Config
	// This ensures aspect_ratio, platform, and other metadata propagate through the pipeline
	mergedConfig := make(map[string]any)

	// First, copy user-provided config
	maps.Copy(mergedConfig, input.Config)

	// Then, load and merge previous stage metadata if available
	if input.PreviousStageMetadata != nil {
		// Merge previous stage metadata into config
		// This allows handlers to access aspect_ratio, platform, etc.
		for k, v := range input.PreviousStageMetadata {
			// Only merge if not already set in user config (user config takes precedence)
			if _, exists := mergedConfig[k]; !exists {
				mergedConfig[k] = v
			}
		}
	}

	// For story video operations, testimonialID might be nil
	var testimonialID uuid.UUID
	if input.TestimonialID != nil {
		testimonialID = *input.TestimonialID
	}

	stepCtx := &StepContext{
		SessionID:          input.SessionID,
		TestimonialID:      testimonialID,
		WorkspaceID:        input.WorkspaceID,
		StageID:            input.StageID,
		TargetPlatform:     targetPlatform,
		BrandContext:       brandContext,
		Config:             mergedConfig, // Use merged config with previous stage metadata
		CurrentArtifactURL: currentArtifactURL,
		OriginalVideoURL:   currentArtifactURL,
		Transcript:         transcript,
		TranscriptSegments: transcriptSegments,
	}

	return stepCtx, nil
}

// convertToStepOutput converts StepResult to StepOutput
func (o *StepOrchestrator) convertToStepOutput(result *StepResult) *StepOutput {
	output := &StepOutput{
		Metadata: result.Metadata,
	}

	if result.OutputArtifactURL != "" {
		output.TempArtifactPath = &result.OutputArtifactURL
	}

	if result.PreviewURL != nil {
		output.PreviewURL = result.PreviewURL
	}

	return output
}

// Handler registry
var handlerRegistry = make(map[string]map[string]StepHandler)

func (o *StepOrchestrator) registerHandler(pipelineType, stageID string, handler StepHandler) {
	if handlerRegistry[pipelineType] == nil {
		handlerRegistry[pipelineType] = make(map[string]StepHandler)
	}
	handlerRegistry[pipelineType][stageID] = handler
}

func (o *StepOrchestrator) getStepHandler(pipelineType, stageID string) StepHandler {
	if handlers, ok := handlerRegistry[pipelineType]; ok {
		return handlers[stageID]
	}
	return nil
}

// ClipMetadata holds timing information for a clip
type ClipMetadata struct {
	StartTime float64
	EndTime   float64
	Duration  float64
}

// getClipURL fetches the URL of a specific clip from testimonial artifacts
func (o *StepOrchestrator) getClipURL(ctx context.Context, testimonialID *uuid.UUID, clipID string) (string, error) {
	if testimonialID == nil {
		return "", fmt.Errorf("testimonial_id is required")
	}

	// Query testimonial_artifacts for clipping artifacts
	query := `
		SELECT data
		FROM testimonial_artifacts
		WHERE testimonial_id = $1
		AND processing_type = 'clipping'
		ORDER BY created_at DESC
	`

	rows, err := o.db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return "", fmt.Errorf("failed to query clips: %w", err)
	}
	defer rows.Close()

	// Iterate through artifacts to find the clip
	for rows.Next() {
		var dataJSON []byte
		if err := rows.Scan(&dataJSON); err != nil {
			continue
		}

		// Parse the artifact data
		var artifactData struct {
			GeneratedClips []struct {
				ID  string `json:"id"`
				URL string `json:"url"`
			} `json:"generated_clips"`
		}

		if err := json.Unmarshal(dataJSON, &artifactData); err != nil {
			o.logger.Warn("Failed to parse artifact data for clip URL",
				zap.Error(err),
				zap.String("clip_id", clipID))
			continue
		}

		// Find the specific clip by ID
		for _, clip := range artifactData.GeneratedClips {
			if clip.ID == clipID {
				o.logger.Info("✅ Found clip URL in database",
					zap.String("clip_id", clipID),
					zap.String("clip_url", clip.URL))
				return clip.URL, nil
			}
		}
	}

	return "", fmt.Errorf("clip not found: %s", clipID)
}

// getClipMetadata fetches timing metadata for a specific clip
func (o *StepOrchestrator) getClipMetadata(ctx context.Context, testimonialID *uuid.UUID, clipID string) (*ClipMetadata, error) {
	if testimonialID == nil {
		return nil, fmt.Errorf("testimonial_id is required")
	}

	// Query testimonial_artifacts for clipping artifacts
	query := `
		SELECT data
		FROM testimonial_artifacts
		WHERE testimonial_id = $1
		AND processing_type = 'clipping'
		ORDER BY created_at DESC
	`

	rows, err := o.db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, fmt.Errorf("failed to query clips: %w", err)
	}
	defer rows.Close()

	// Iterate through artifacts to find the clip
	for rows.Next() {
		var dataJSON []byte
		if err := rows.Scan(&dataJSON); err != nil {
			continue
		}

		// Parse the artifact data with timing information
		var artifactData struct {
			GeneratedClips []struct {
				ID        string  `json:"id"`
				URL       string  `json:"url"`
				StartTime float64 `json:"start_time"`
				EndTime   float64 `json:"end_time"`
				Duration  float64 `json:"duration"`
			} `json:"generated_clips"`
		}

		if err := json.Unmarshal(dataJSON, &artifactData); err != nil {
			continue
		}

		// Find the specific clip by ID
		for _, clip := range artifactData.GeneratedClips {
			if clip.ID == clipID {
				return &ClipMetadata{
					StartTime: clip.StartTime,
					EndTime:   clip.EndTime,
					Duration:  clip.Duration,
				}, nil
			}
		}
	}

	return nil, fmt.Errorf("clip metadata not found: %s", clipID)
}

// getTranscriptSegmentsByTime extracts transcript segments that fall within the specified time range
// This is the same logic as video_platform_optimizer_worker.go's getTranscriptSegmentByTime
// Segments must be FULLY WITHIN the time range (segment.start >= start AND segment.end <= end)
// Timestamps are adjusted relative to the start time and converted from milliseconds to seconds
func (o *StepOrchestrator) getTranscriptSegmentsByTime(segments models.TranscriptSegments, start, end float64) models.TranscriptSegments {
	if len(segments) == 0 {
		return segments
	}

	filteredSegments := models.TranscriptSegments{}

	for _, segment := range segments {
		// Check if segment is FULLY within the time range
		if segment.StartTime >= start && segment.EndTime <= end {
			adjustedSegment := segment

			// Adjust timestamps relative to start time (so clip starts at 0)
			adjustedSegment.StartTime -= start
			adjustedSegment.EndTime -= start

			// Convert from milliseconds to seconds for AI service compatibility
			adjustedSegment.StartTime /= 1000.0
			adjustedSegment.EndTime /= 1000.0

			// Adjust word timestamps if present
			if len(adjustedSegment.Words) > 0 {
				for i := range adjustedSegment.Words {
					adjustedSegment.Words[i].Start -= start
					adjustedSegment.Words[i].End -= start
					// Convert word timestamps to seconds as well
					adjustedSegment.Words[i].Start /= 1000.0
					adjustedSegment.Words[i].End /= 1000.0
				}
			}

			filteredSegments = append(filteredSegments, adjustedSegment)
		}
	}

	return filteredSegments
}

// getTranscriptSegmentsFromArtifact loads cached transcript segments from an artifact's Data field
func (o *StepOrchestrator) getTranscriptSegmentsFromArtifact(ctx context.Context, artifactID string) (models.TranscriptSegments, error) {
	// Parse artifact ID
	aid, err := uuid.Parse(artifactID)
	if err != nil {
		return nil, fmt.Errorf("invalid artifact_id: %w", err)
	}

	// Use repository method for proper JSONB handling
	segments, err := o.artifactsRepo.GetTranscriptSegments(ctx, aid, o.db)
	if err != nil {
		return nil, fmt.Errorf("failed to query artifact transcript segments: %w", err)
	}

	return segments, nil
}
