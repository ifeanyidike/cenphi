package ai

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// PlatformOptimizationStepsWorker handles step-by-step platform optimization
type PlatformOptimizationStepsWorker struct {
	mediaIntelligence    MediaIntelligence
	aiService            *AIServiceManager
	cacheService         cache.RedisCache
	preprocessingCache   *cache.PreprocessingCache
	testimonialRepo      repositories.TestimonialRepository
	workspaceRepo        repositories.WorkspaceRepository
	artifactsRepo        repositories.TestimonialArtifactRepository
	tempStorageService   *storage.TempStorageService
	storageProvider      storage.Provider
	sseManager           *sse.SSEManager
	db                   *sql.DB
	logger               *zap.Logger
}

func NewPlatformOptimizationStepsWorker(
	mediaIntelligence MediaIntelligence,
	aiService *AIServiceManager,
	cacheService cache.RedisCache,
	testimonialRepo repositories.TestimonialRepository,
	workspaceRepo repositories.WorkspaceRepository,
	artifactsRepo repositories.TestimonialArtifactRepository,
	tempStorageService *storage.TempStorageService,
	storageProvider storage.Provider,
	sseManager *sse.SSEManager,
	db *sql.DB,
	logger *zap.Logger,
) *PlatformOptimizationStepsWorker {
	// Initialize preprocessing cache for IMPROVEMENT #7
	preprocessingCache := cache.NewPreprocessingCache(&cacheService, logger)

	return &PlatformOptimizationStepsWorker{
		mediaIntelligence:    mediaIntelligence,
		aiService:            aiService,
		cacheService:         cacheService,
		preprocessingCache:   preprocessingCache,
		testimonialRepo:      testimonialRepo,
		workspaceRepo:        workspaceRepo,
		artifactsRepo:        artifactsRepo,
		tempStorageService:   tempStorageService,
		storageProvider:      storageProvider,
		sseManager:           sseManager,
		db:                   db,
		logger:               logger,
	}
}

// StepContext contains all context needed for a step
type StepContext struct {
	SessionID      uuid.UUID
	TestimonialID  uuid.UUID
	WorkspaceID    uuid.UUID
	StageID        string
	TargetPlatform string
	BrandContext   *pb.BrandContext
	Config         map[string]interface{}
	// Current artifact being processed (output from previous step)
	CurrentArtifactURL string
	// Original testimonial data
	OriginalVideoURL   string
	Transcript         string
	TranscriptSegments models.TranscriptSegments
}

// StepResult contains the output of a step
type StepResult struct {
	OutputArtifactURL   string
	PreviewURL          *string
	TempArtifactID      *uuid.UUID
	Metadata            map[string]interface{}
	AppliedEnhancements []string
}

// HandleCropResize handles the crop/resize step
func (w *PlatformOptimizationStepsWorker) HandleCropResize(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// BUGFIX #13: Validate input media is available
	if stepCtx.CurrentArtifactURL == "" {
		return nil, fmt.Errorf("no input media available for crop/resize step")
	}

	// Get aspect ratio from config
	aspectRatio, ok := stepCtx.Config["aspect_ratio"].(string)
	if !ok || aspectRatio == "" {
		aspectRatio = w.getDefaultAspectRatio(stepCtx.TargetPlatform)
	}

	w.logger.Info("Cropping video",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("aspect_ratio", aspectRatio),
		zap.String("platform", stepCtx.TargetPlatform))

	// IMPROVEMENT #7: Check for cached platform derivative first
	if derivative, exists := w.preprocessingCache.GetPlatformDerivative(ctx, stepCtx.TestimonialID, stepCtx.TargetPlatform, aspectRatio); exists {
		w.logger.Info("Using cached platform derivative",
			zap.String("testimonial_id", stepCtx.TestimonialID.String()),
			zap.String("platform", stepCtx.TargetPlatform),
			zap.String("aspect_ratio", aspectRatio))

		// Emit progress for consistency with non-cached path
		w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Using cached result...")
		w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 90, "Preview ready")

		previewURL := derivative.OutputURL

		w.emitPreviewReady(stepCtx.SessionID, stepCtx.StageID, previewURL, "video", derivative.Duration, map[string]interface{}{
			"aspect_ratio": aspectRatio,
			"platform":     stepCtx.TargetPlatform,
			"cached":       true,
		})

		return &StepResult{
			OutputArtifactURL:   derivative.OutputURL,
			PreviewURL:          &previewURL,
			TempArtifactID:      nil,
			AppliedEnhancements: []string{"crop_resize"},
			Metadata: map[string]interface{}{
				"aspect_ratio": aspectRatio,
				"platform":     stepCtx.TargetPlatform,
				"cached":       true,
				"duration":     derivative.Duration,
			},
		}, nil
	}

	// Cache miss - process normally
	var response *pb.CropResizeResponse

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Processing crop for "+aspectRatio+"...")

	// Build gRPC request for individual CropResize step
	pbReq := &pb.CropResizeRequest{
		TestimonialId:      stepCtx.TestimonialID.String(),
		MediaUrl:           stepCtx.CurrentArtifactURL,
		TargetPlatform:     stepCtx.TargetPlatform,
		AspectRatio:        aspectRatio,
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true, // Upload for interactive preview
	}

	// Call individual CropResize step with retry logic
	err := w.retryGRPCCall(ctx, "CropResize", func() error {
		resp, callErr := w.mediaIntelligence.CropResize(ctx, pbReq)
		if callErr != nil {
			return callErr
		}
		response = resp
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("crop/resize failed after retries: %w", err)
	}

	// Use the cropped_url from CropResizeResponse
	previewURL := response.CroppedUrl

	// Cache the platform derivative for future requests
	derivative := &cache.PlatformDerivative{
		TestimonialID: stepCtx.TestimonialID,
		Platform:      stepCtx.TargetPlatform,
		AspectRatio:   aspectRatio,
		OutputURL:     response.CroppedUrl,
		ProcessedAt:   time.Now(),
		Duration:      response.Duration,
		Width:         0,  // Width/Height not returned by CropResize, will be fetched if needed
		Height:        0,
		Metadata:      map[string]interface{}{"size": response.Size},
	}

	if cacheErr := w.preprocessingCache.SetPlatformDerivative(ctx, derivative); cacheErr != nil {
		w.logger.Warn("Failed to cache platform derivative", zap.Error(cacheErr))
		// Don't fail the request if caching fails
	}

	// Emit preview_ready event
	w.emitPreviewReady(stepCtx.SessionID, stepCtx.StageID, previewURL, "video", response.Duration, map[string]interface{}{
		"aspect_ratio": aspectRatio,
		"platform":     stepCtx.TargetPlatform,
		"size":         response.Size,
		"cached":       false,
	})

	return &StepResult{
		OutputArtifactURL:   response.CroppedUrl,
		PreviewURL:          &previewURL,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"crop_resize"},
		Metadata: map[string]interface{}{
			"aspect_ratio": response.AspectRatio,
			"platform":     stepCtx.TargetPlatform,
			"duration":     response.Duration,
			"size":         response.Size,
		},
	}, nil
}

// HandleBurnCaptions handles burning captions into the video
func (w *PlatformOptimizationStepsWorker) HandleBurnCaptions(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// BUGFIX #13: Validate input media is available
	if stepCtx.CurrentArtifactURL == "" {
		return nil, fmt.Errorf("no input media available for burn captions step")
	}

	// CRITICAL FIX: On-demand transcript generation for story video artifacts
	// If transcript segments are missing AND we have an artifact_id (story video/clip artifact),
	// generate transcript segments on-demand and cache them for future use
	if len(stepCtx.TranscriptSegments) == 0 {
		artifactID, hasArtifactID := stepCtx.Config["artifact_id"].(string)
		if hasArtifactID && artifactID != "" {
			w.logger.Info("No transcript segments found for artifact, generating on-demand",
				zap.String("artifact_id", artifactID),
				zap.String("media_url", stepCtx.CurrentArtifactURL))

			w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 30, "Generating transcript for captions (this may take 30-60 seconds)...")

			// Generate transcript using AudioTranscriptionService
			transcriptionResult, err := w.aiService.AudioTranscriptionService.TranscribeAudio(stepCtx.CurrentArtifactURL)
			if err != nil {
				return nil, fmt.Errorf("failed to generate transcript for artifact: %w", err)
			}

			// Convert TranscriptionResult.Segments to models.TranscriptSegments
			transcriptSegments := make(models.TranscriptSegments, len(transcriptionResult.Segments))
			for i, seg := range transcriptionResult.Segments {
				transcriptSegments[i] = models.TranscriptionSegment{
					Text:      seg.Text,
					StartTime: seg.StartTime,
					EndTime:   seg.EndTime,
					Speaker:   seg.Speaker,
					Words:     seg.Words,
				}
			}

			stepCtx.TranscriptSegments = transcriptSegments

			w.logger.Info("✅ Generated transcript segments on-demand",
				zap.String("artifact_id", artifactID),
				zap.Int("segments_count", len(transcriptSegments)))

			// CRITICAL: Save transcript segments to artifact for caching (async - don't block)
			// Use step orchestrator's saveTranscriptSegmentsToArtifact method
			go func(aid string, segments models.TranscriptSegments) {
				// Create a background context with timeout (not tied to request context)
				saveCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
				defer cancel()

				// Save to artifact's Data field for future reuse
				if saveErr := w.saveTranscriptSegmentsToArtifact(saveCtx, aid, segments); saveErr != nil {
					w.logger.Error("Failed to cache transcript segments to artifact (non-critical)",
						zap.String("artifact_id", aid),
						zap.Error(saveErr))
				}
			}(artifactID, transcriptSegments)

			w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 45, "Transcript generated, burning captions...")
		} else {
			return nil, fmt.Errorf("transcript segments required for caption burn")
		}
	}

	// Get caption style from config, default to "modern"
	captionStyle, _ := stepCtx.Config["caption_style"].(string)
	if captionStyle == "" {
		captionStyle = "modern" // Default style
	}

	// Build BurnCaptions request
	pbReq := &pb.BurnCaptionsRequest{
		TestimonialId:      stepCtx.TestimonialID.String(),
		MediaUrl:           stepCtx.CurrentArtifactURL,
		TranscriptSegments: w.convertToProtobufSegments(stepCtx.TranscriptSegments),
		CaptionStyle:       captionStyle,
		TargetPlatform:     stepCtx.TargetPlatform, // BUGFIX: Add target_platform for platform-specific styling
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true,
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Burning captions into video...")

	// Call individual BurnCaptions step with retry logic
	var response *pb.BurnCaptionsResponse
	err := w.retryGRPCCall(ctx, "BurnCaptions", func() error {
		resp, callErr := w.mediaIntelligence.BurnCaptions(ctx, pbReq)
		if callErr != nil {
			return callErr
		}
		response = resp
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("burn captions failed after retries: %w", err)
	}

	previewURL := response.CaptionedUrl

	// CRITICAL FIX: Carry over aspect_ratio AND platform from previous step (CropResize) so preview displays correctly
	// Previous stage metadata is available in stepCtx.Config (see step_orchestrator.go lines 383-391)
	metadata := map[string]interface{}{
		"captions_burned": true,
		"captions_added":  response.CaptionsAdded,
		"caption_style":   response.CaptionStyle,
		"platform":        stepCtx.TargetPlatform,
		"duration":        response.Duration,
		"size":            response.Size,
		"preview_url":     previewURL, // Add preview_url to metadata
	}

	// Carry over aspect_ratio from previous step (CropResize) if available
	if aspectRatio, ok := stepCtx.Config["aspect_ratio"].(string); ok {
		metadata["aspect_ratio"] = aspectRatio
	}

	w.emitPreviewReady(stepCtx.SessionID, stepCtx.StageID, previewURL, "video", response.Duration, metadata)

	return &StepResult{
		OutputArtifactURL:   response.CaptionedUrl,
		PreviewURL:          &previewURL,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"burn_captions"},
		Metadata:            metadata,
	}, nil
}

// HandleNoiseRemoval handles audio noise removal
func (w *PlatformOptimizationStepsWorker) HandleNoiseRemoval(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// BUGFIX #13: Validate input media is available
	if stepCtx.CurrentArtifactURL == "" {
		return nil, fmt.Errorf("no input media available for noise removal step")
	}

	noiseLevel := "medium"
	if level, ok := stepCtx.Config["noise_level"].(string); ok {
		noiseLevel = level
	}

	pbReq := &pb.NoiseReductionRequest{
		TestimonialId: stepCtx.TestimonialID.String(),
		MediaUrl:      stepCtx.CurrentArtifactURL,
		Level:         noiseLevel,
		JobId:         stepCtx.SessionID.String(),
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Removing background noise...")

	// Call NoiseRemoval with retry logic
	var response *pb.NoiseReductionResponse
	err := w.retryGRPCCall(ctx, "NoiseRemoval", func() error {
		resp, callErr := w.mediaIntelligence.NoiseRemoval(ctx, pbReq)
		if callErr != nil {
			return callErr
		}
		response = resp
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("noise removal failed after retries: %w", err)
	}

	previewURL := response.DenoisedMediaUrl

	// CRITICAL FIX: Carry over aspect_ratio AND platform from previous step
	metadata := map[string]interface{}{
		"noise_removed": true,
		"level":         noiseLevel,
		"preview_url":   previewURL,
	}

	// Carry over platform from previous stage OR use target platform
	platform := stepCtx.TargetPlatform
	if p, ok := stepCtx.Config["platform"].(string); ok && p != "" {
		platform = p
	}
	metadata["platform"] = platform

	// Carry over aspect_ratio from previous stage OR derive from platform
	aspectRatio := ""
	if ar, ok := stepCtx.Config["aspect_ratio"].(string); ok && ar != "" {
		aspectRatio = ar
	} else {
		aspectRatio = w.getDefaultAspectRatio(platform)
	}
	metadata["aspect_ratio"] = aspectRatio

	w.emitPreviewReady(stepCtx.SessionID, stepCtx.StageID, previewURL, "video", 0, metadata)

	return &StepResult{
		OutputArtifactURL:   response.DenoisedMediaUrl,
		PreviewURL:          &previewURL,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"noise_removal"},
		Metadata:            metadata,
	}, nil
}

// HandleMixMusic handles mixing background music
func (w *PlatformOptimizationStepsWorker) HandleMixMusic(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// BUGFIX #13: Validate input media is available
	if stepCtx.CurrentArtifactURL == "" {
		return nil, fmt.Errorf("no input media available for mix music step")
	}

	backgroundMusic, _ := stepCtx.Config["background_music"].(string)
	musicVolume, _ := stepCtx.Config["music_volume"].(string)
	if musicVolume == "" {
		musicVolume = "0.3" // 30% volume default
	}

	// Build MixMusic request
	pbReq := &pb.MixMusicRequest{
		TestimonialId:      stepCtx.TestimonialID.String(),
		MediaUrl:           stepCtx.CurrentArtifactURL,
		MusicTrack:         backgroundMusic,
		MusicVolume:        musicVolume,
		FadeInDuration:     2.0, // 2 second fade in
		FadeOutDuration:    2.0, // 2 second fade out
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true,
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Mixing background music...")

	// Call individual MixMusic step with retry logic
	var response *pb.MixMusicResponse
	err := w.retryGRPCCall(ctx, "MixMusic", func() error {
		resp, callErr := w.mediaIntelligence.MixMusic(ctx, pbReq)
		if callErr != nil {
			return callErr
		}
		response = resp
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("music mixing failed after retries: %w", err)
	}

	previewURL := response.MusicMixedUrl

	// CRITICAL FIX: Carry over aspect_ratio AND platform from previous step
	metadata := map[string]interface{}{
		"music_added": true,
		"music_track": response.MusicTrack,
		"volume":      musicVolume,
		"preview_url": previewURL, // Add preview_url to metadata
	}

	// Carry over platform from previous stage OR use target platform
	platform := stepCtx.TargetPlatform
	if p, ok := stepCtx.Config["platform"].(string); ok && p != "" {
		platform = p
	}
	metadata["platform"] = platform

	// Carry over aspect_ratio from previous stage OR derive from platform
	aspectRatio := ""
	if ar, ok := stepCtx.Config["aspect_ratio"].(string); ok && ar != "" {
		aspectRatio = ar
	} else {
		// Fallback: derive aspect ratio from platform
		aspectRatio = w.getDefaultAspectRatio(platform)
		w.logger.Info("No aspect_ratio in Config, derived from platform",
			zap.String("platform", platform),
			zap.String("aspect_ratio", aspectRatio))
	}
	metadata["aspect_ratio"] = aspectRatio

	w.emitPreviewReady(stepCtx.SessionID, stepCtx.StageID, previewURL, "video", response.Duration, metadata)

	return &StepResult{
		OutputArtifactURL:   response.MusicMixedUrl,
		PreviewURL:          &previewURL,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"mix_music"},
		Metadata:            metadata,
	}, nil
}

// HandleApplyBranding handles adding logo and watermark
func (w *PlatformOptimizationStepsWorker) HandleApplyBranding(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// BUGFIX #13: Validate input media is available
	if stepCtx.CurrentArtifactURL == "" {
		return nil, fmt.Errorf("no input media available for branding step")
	}

	logoPosition, _ := stepCtx.Config["logo_position"].(string)
	watermarkPosition, _ := stepCtx.Config["watermark_position"].(string)

	if logoPosition == "" {
		logoPosition = "bottom-right"
	}
	if watermarkPosition == "" {
		watermarkPosition = "bottom-right"
	}

	// Fetch workspace once to get both name and brand context (avoid duplicate DB calls)
	workspace, err := w.workspaceRepo.GetByID(ctx, stepCtx.WorkspaceID, w.db)
	if err != nil {
		w.logger.Warn("Failed to get workspace, using empty branding", zap.Error(err))
	}

	// Extract watermark text from workspace name
	watermarkText := ""
	if workspace != nil && workspace.Name != "" {
		watermarkText = workspace.Name
	}

	// Extract logo URL and brand color from workspace brand context
	logoURL := ""
	brandColor := ""
	if workspace != nil && workspace.BrandContext != nil {
		// Parse brand context JSON
		var brandContext pb.BrandContext
		if err := json.Unmarshal(workspace.BrandContext, &brandContext); err == nil {
			if brandContext.LogoUrl != "" {
				logoURL = brandContext.LogoUrl
			}
			// Extract first brand color
			if brandContext.BrandColors != nil {
				for k := range brandContext.BrandColors {
					brandColor = brandContext.BrandColors[k]
					break
				}
			}
		}
	}

	w.logger.Info("ApplyBranding request",
		zap.String("logo_url", logoURL),
		zap.String("watermark_text", watermarkText),
		zap.String("brand_color", brandColor))

	// Build ApplyBranding request
	pbReq := &pb.ApplyBrandingRequest{
		TestimonialId:      stepCtx.TestimonialID.String(),
		MediaUrl:           stepCtx.CurrentArtifactURL,
		LogoUrl:            logoURL,
		WatermarkText:      watermarkText,
		WatermarkPosition:  watermarkPosition,
		BrandColor:         brandColor,
		LogoPosition:       logoPosition,
		LogoScale:          1.0, // Normal size
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true,
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Applying branding...")

	// Call individual ApplyBranding step with retry logic
	var response *pb.ApplyBrandingResponse
	err = w.retryGRPCCall(ctx, "ApplyBranding", func() error {
		resp, callErr := w.mediaIntelligence.ApplyBranding(ctx, pbReq)
		if callErr != nil {
			return callErr
		}
		response = resp
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("branding failed after retries: %w", err)
	}

	previewURL := response.BrandedUrl

	// CRITICAL FIX: Carry over aspect_ratio AND platform from previous step
	metadata := map[string]interface{}{
		"branding_applied": true,
		"logo_position":    logoPosition,
		"applied_elements": response.AppliedElements,
		"preview_url":      previewURL,
	}

	// Carry over platform from previous stage OR use target platform
	platform := stepCtx.TargetPlatform
	if p, ok := stepCtx.Config["platform"].(string); ok && p != "" {
		platform = p
	}
	metadata["platform"] = platform

	// CRITICAL BUGFIX: Properly preserve aspect_ratio from previous stage
	// Priority 1: Use aspect_ratio from previous stage if available
	// Priority 2: Calculate from width/height from previous stage
	// Priority 3: NEVER use platform defaults - they're unreliable for actual video dimensions
	aspectRatio := ""
	width := 0
	height := 0

	// Try aspect_ratio from Config (previous stage metadata)
	if ar, ok := stepCtx.Config["aspect_ratio"].(string); ok && ar != "" {
		aspectRatio = ar
		w.logger.Info("Using aspect_ratio from previous stage",
			zap.String("aspect_ratio", aspectRatio))
	}

	// Try width/height from Config (previous stage metadata)
	if aspectRatio == "" {
		if w, ok := stepCtx.Config["width"].(float64); ok && w > 0 {
			width = int(w)
		} else if w, ok := stepCtx.Config["width"].(int); ok && w > 0 {
			width = w
		}

		if h, ok := stepCtx.Config["height"].(float64); ok && h > 0 {
			height = int(h)
		} else if h, ok := stepCtx.Config["height"].(int); ok && h > 0 {
			height = h
		}

		if width > 0 && height > 0 {
			// Calculate aspect ratio from dimensions
			ratio := float64(width) / float64(height)
			if ratio > 1.7 && ratio < 1.9 { // 16:9 range
				aspectRatio = "16:9"
			} else if ratio > 0.5 && ratio < 0.6 { // 9:16 range
				aspectRatio = "9:16"
			} else if ratio > 0.95 && ratio < 1.05 { // 1:1 range
				aspectRatio = "1:1"
			} else if ratio > 0.75 && ratio < 0.85 { // 4:5 range
				aspectRatio = "4:5"
			} else {
				aspectRatio = fmt.Sprintf("%d:%d", width, height)
			}
			w.logger.Info("Calculated aspect_ratio from dimensions",
				zap.Int("width", width),
				zap.Int("height", height),
				zap.String("aspect_ratio", aspectRatio))
		}
	}

	// If still no aspect ratio, log warning and use default
	// This should NEVER happen if metadata is flowing correctly
	if aspectRatio == "" {
		w.logger.Warn("No aspect_ratio or dimensions in previous stage metadata, using default 16:9",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.String("stage_id", stepCtx.StageID),
			zap.Any("config", stepCtx.Config))
		aspectRatio = "16:9" // Safe default - most common for story videos
	}

	metadata["aspect_ratio"] = aspectRatio

	// Also store width/height if we have them
	if width > 0 {
		metadata["width"] = width
	}
	if height > 0 {
		metadata["height"] = height
	}

	w.emitPreviewReady(stepCtx.SessionID, stepCtx.StageID, previewURL, "video", response.Duration, metadata)

	return &StepResult{
		OutputArtifactURL:   response.BrandedUrl,
		PreviewURL:          &previewURL,
		TempArtifactID:      nil,
		AppliedEnhancements: response.AppliedElements,
		Metadata:            metadata,
	}, nil
}

// HandleEnhance handles video enhancement (final video processing)
func (w *PlatformOptimizationStepsWorker) HandleEnhance(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// BUGFIX #13: Validate input media is available
	if stepCtx.CurrentArtifactURL == "" {
		return nil, fmt.Errorf("no input media available for enhancement step")
	}

	quality := "high"
	if q, ok := stepCtx.Config["quality"].(string); ok {
		quality = q
	}

	// Use the step-by-step EnhanceVideo method which properly uses temp files
	pbReq := &pb.EnhanceVideoRequest{
		TestimonialId:      stepCtx.TestimonialID.String(),
		MediaUrl:           stepCtx.CurrentArtifactURL,
		TargetPlatform:     stepCtx.TargetPlatform,
		EnhancementLevel:   quality,
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true,
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Enhancing video quality...")

	// Call EnhanceVideo (step-by-step method that uses temp files) with retry logic
	var response *pb.EnhanceVideoResponse
	err := w.retryGRPCCall(ctx, "EnhanceVideo", func() error {
		resp, callErr := w.mediaIntelligence.EnhanceVideo(ctx, pbReq)
		if callErr != nil {
			return callErr
		}
		response = resp
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("enhancement failed after retries: %w", err)
	}

	previewURL := response.EnhancedUrl

	// CRITICAL FIX: Carry over aspect_ratio AND platform from previous step
	metadata := map[string]interface{}{
		"enhanced":      true,
		"quality":       quality,
		"quality_score": response.QualityScore,
		"preview_url":   previewURL,
	}

	// Carry over platform from previous stage OR use target platform
	platform := stepCtx.TargetPlatform
	if p, ok := stepCtx.Config["platform"].(string); ok && p != "" {
		platform = p
	}
	metadata["platform"] = platform

	// Carry over aspect_ratio from previous stage OR derive from platform
	aspectRatio := ""
	if ar, ok := stepCtx.Config["aspect_ratio"].(string); ok && ar != "" {
		aspectRatio = ar
	} else {
		aspectRatio = w.getDefaultAspectRatio(platform)
	}
	metadata["aspect_ratio"] = aspectRatio

	w.emitPreviewReady(stepCtx.SessionID, stepCtx.StageID, previewURL, "video", response.Duration, metadata)

	return &StepResult{
		OutputArtifactURL:   response.EnhancedUrl,
		PreviewURL:          &previewURL,
		TempArtifactID:      nil,
		AppliedEnhancements: response.AppliedEnhancements,
		Metadata:            metadata,
	}, nil
}

// HandleTextOptimization handles text content optimization (no video processing)
func (w *PlatformOptimizationStepsWorker) HandleTextOptimization(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	if stepCtx.Transcript == "" {
		return nil, fmt.Errorf("transcript required for text optimization")
	}

	// Get custom prompt if any
	customPrompt, _ := stepCtx.Config["custom_prompt"].(string)

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 30, "Optimizing text for "+stepCtx.TargetPlatform+"...")

	// Stream the text optimization response
	optimizedContent := ""
	currentHashtags := []string{}
	currentSpecs := map[string]string{}
	currentTiming := ""

	err := w.aiService.PlatformOptimizerService.OptimizeForPlatformStream(
		ctx,
		stepCtx.WorkspaceID.String(),
		stepCtx.Transcript,
		stepCtx.BrandContext,
		stepCtx.TargetPlatform,
		customPrompt,
		func(chunk string, isComplete bool, result *OptimizationResult) error {
			if isComplete && result != nil {
				// Final result received
				optimizedContent = result.Content
				currentHashtags = result.Hashtags
				currentSpecs = result.Specifications
				currentTiming = result.OptimalTiming

				w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 100, "Text optimization complete")

				// IMPORTANT: Emit text_optimization_complete instead of preview_ready
				// to avoid creating a preview artifact that replaces the video
				w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
					Type:      "text_optimization_complete",
					SessionID: stepCtx.SessionID.String(),
					StageID:   &stepCtx.StageID,
					Timestamp: time.Now(),
					Data: map[string]interface{}{
						"optimized_text":  result.Content,
						"hashtags":        result.Hashtags,
						"optimal_timing":  result.OptimalTiming,
						"specifications":  result.Specifications,
						"character_count": len(result.Content),
						"platform":        stepCtx.TargetPlatform,
						"can_regenerate":  true, // User can regenerate if not satisfied
					},
				})
			} else if chunk != "" {
				// Stream progress update
				optimizedContent += chunk
				w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
					Type:      "text_stream",
					SessionID: stepCtx.SessionID.String(),
					StageID:   &stepCtx.StageID,
					Timestamp: time.Now(),
					Data: map[string]interface{}{
						"chunk":     chunk,
						"stage_id":  stepCtx.StageID,
						"is_final":  false,
						"platform":  stepCtx.TargetPlatform,
					},
				})
			}
			return nil
		},
	)

	if err != nil {
		return nil, fmt.Errorf("text optimization failed: %w", err)
	}

	// Return result without temp artifacts (text stays in memory until user saves)
	return &StepResult{
		OutputArtifactURL:   "", // No video output for text optimization
		PreviewURL:          nil,
		TempArtifactID:      nil, // No temp artifact - text only exists in SSE stream
		AppliedEnhancements: []string{"text_optimization"},
		Metadata: map[string]interface{}{
			"optimized_text": optimizedContent,
			"hashtags":       currentHashtags,
			"optimal_timing": currentTiming,
			"specifications": currentSpecs,
		},
	}, nil
}

// Helper methods

// retryGRPCCall wraps a gRPC call with retry logic for transient failures
// Returns early if context is cancelled or error is non-retryable
func (w *PlatformOptimizationStepsWorker) retryGRPCCall(
	ctx context.Context,
	operation string,
	fn func() error,
) error {
	const (
		maxRetries     = 3
		initialBackoff = 1 * time.Second
		maxBackoff     = 8 * time.Second
	)

	var lastErr error
	backoff := initialBackoff

	for attempt := 0; attempt < maxRetries; attempt++ {
		// Check context before attempting
		if ctx.Err() != nil {
			return ctx.Err()
		}

		lastErr = fn()
		if lastErr == nil {
			return nil
		}

		// Determine if error is retryable
		if !w.isRetryableGRPCError(lastErr) {
			return lastErr
		}

		// Don't sleep after final attempt
		if attempt == maxRetries-1 {
			break
		}

		w.logger.Warn("gRPC call failed, retrying",
			zap.String("operation", operation),
			zap.Int("attempt", attempt+1),
			zap.Int("max_retries", maxRetries),
			zap.Duration("backoff", backoff),
			zap.Error(lastErr))

		// Sleep with context cancellation support
		select {
		case <-time.After(backoff):
			// Continue to next attempt
		case <-ctx.Done():
			return ctx.Err()
		}

		// Exponential backoff with cap
		backoff *= 2
		if backoff > maxBackoff {
			backoff = maxBackoff
		}
	}

	return fmt.Errorf("max retries (%d) exceeded for %s: %w", maxRetries, operation, lastErr)
}

// isRetryableGRPCError determines if a gRPC error should be retried
func (w *PlatformOptimizationStepsWorker) isRetryableGRPCError(err error) bool {
	if err == nil {
		return false
	}

	// Check gRPC status codes
	st, ok := status.FromError(err)
	if ok {
		switch st.Code() {
		case codes.Unavailable, // Service temporarily unavailable
			codes.DeadlineExceeded,  // Timeout (might succeed with retry)
			codes.ResourceExhausted, // Rate limiting
			codes.Aborted:           // Conflict (might resolve)
			return true
		case codes.Canceled, // Client cancelled - don't retry
			codes.InvalidArgument,  // Bad request - won't succeed
			codes.NotFound,         // Missing resource - won't succeed
			codes.PermissionDenied, // Auth failure - won't succeed
			codes.Unimplemented:    // Method not supported - won't succeed
			return false
		default:
			// For unknown codes, check error message
		}
	}

	// Fallback to string matching for network errors
	errMsg := strings.ToLower(err.Error())
	retryablePatterns := []string{
		"connection refused",
		"connection reset",
		"broken pipe",
		"timeout",
		"temporary failure",
		"try again",
	}

	for _, pattern := range retryablePatterns {
		if strings.Contains(errMsg, pattern) {
			return true
		}
	}

	return false
}

func (w *PlatformOptimizationStepsWorker) emitProgress(sessionID uuid.UUID, stageID string, progress int, message string) {
	// CRITICAL BUGFIX: Update SSE session AND persist to database so progress survives reconnections
	// UpdateStageProgress does both in-memory update and database persistence
	w.sseManager.UpdateStageProgress(sessionID.String(), stageID, progress, message, nil)

	// Emit SSE event to connected clients
	w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "step_progress",
		SessionID: sessionID.String(),
		StageID:   &stageID,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"progress": progress,
			"message":  message,
		},
	})
}

func (w *PlatformOptimizationStepsWorker) emitPreviewReady(sessionID uuid.UUID, stageID, previewURL, previewType string, _ float64, metadata map[string]interface{}) {
	// BUGFIX: Include metadata in Preview AND Data for frontend to access aspect_ratio
	preview := &sse.PreviewData{
		Type:       previewType,
		Content:    previewURL, // Keep for backwards compatibility
		PreviewURL: previewURL, // Add explicit preview_url field
		URL:        previewURL, // Add url alias
		Quality:    1.0,
		StageID:    stageID,
		Metadata:   metadata, // CRITICAL: Include metadata so frontend can access aspect_ratio
	}

	w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "preview_ready",
		SessionID: sessionID.String(),
		StageID:   &stageID,
		Timestamp: time.Now(),
		Preview:   preview,
		Data:      metadata, // Keep for backwards compatibility
	})
}

func (w *PlatformOptimizationStepsWorker) getDefaultAspectRatio(platform string) string {
	ratios := map[string]string{
		"instagram_reels":  "9:16",
		"instagram_story":  "9:16",
		"instagram_feed":   "1:1",
		"tiktok":           "9:16",
		"youtube_shorts":   "9:16",
		"youtube_standard": "16:9",
		"facebook":         "16:9",
		"linkedin":         "16:9",
		"twitter":          "16:9",
	}

	if ratio, ok := ratios[platform]; ok {
		return ratio
	}
	return "16:9" // default
}

func (w *PlatformOptimizationStepsWorker) convertToProtobufSegments(segments models.TranscriptSegments) []*pb.TranscriptSegment {
	if segments == nil {
		return nil
	}

	pbSegments := make([]*pb.TranscriptSegment, len(segments))
	for i, seg := range segments {
		pbSegments[i] = &pb.TranscriptSegment{
			Text:      seg.Text,
			StartTime: seg.StartTime,
			EndTime:   seg.EndTime,
			Speaker:   seg.Speaker,
			Words:     w.convertToProtobufWords(seg.Words),
		}
	}
	return pbSegments
}

func (w *PlatformOptimizationStepsWorker) convertToProtobufWords(words []models.Word) []*pb.Word {
	if words == nil {
		return nil
	}

	pbWords := make([]*pb.Word, len(words))
	for i, word := range words {
		pbWords[i] = &pb.Word{
			Text:       word.Text,
			Start:      word.Start,
			End:        word.End,
			Confidence: word.Confidence,
			Speaker:    word.Speaker,
		}
	}
	return pbWords
}

// saveTranscriptSegmentsToArtifact saves generated transcript segments to artifact's Data field for caching
func (w *PlatformOptimizationStepsWorker) saveTranscriptSegmentsToArtifact(ctx context.Context, artifactID string, segments models.TranscriptSegments) error {
	// Parse artifact ID
	aid, err := uuid.Parse(artifactID)
	if err != nil {
		return fmt.Errorf("invalid artifact_id: %w", err)
	}

	// Use repository method for proper JSONB handling
	err = w.artifactsRepo.UpdateTranscriptSegments(ctx, aid, segments, w.db)
	if err != nil {
		return fmt.Errorf("failed to update artifact with transcript segments: %w", err)
	}

	w.logger.Info("✅ Saved transcript segments to artifact for caching",
		zap.String("artifact_id", artifactID),
		zap.Int("segments_count", len(segments)))

	return nil
}
