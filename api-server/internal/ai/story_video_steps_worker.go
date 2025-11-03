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
)

// StoryVideoStepsWorker handles step-by-step story video generation
type StoryVideoStepsWorker struct {
	mediaIntelligence  MediaIntelligence
	aiService          *AIServiceManager
	cacheService       cache.RedisCache
	testimonialRepo    repositories.TestimonialRepository
	workspaceRepo      repositories.WorkspaceRepository
	artifactsRepo      repositories.TestimonialArtifactRepository
	tempStorageService *storage.TempStorageService
	storageProvider    storage.Provider
	sseManager         *sse.SSEManager
	db                 *sql.DB
	logger             *zap.Logger
}

func NewStoryVideoStepsWorker(
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
) *StoryVideoStepsWorker {
	return &StoryVideoStepsWorker{
		mediaIntelligence:  mediaIntelligence,
		aiService:          aiService,
		cacheService:       cacheService,
		testimonialRepo:    testimonialRepo,
		workspaceRepo:      workspaceRepo,
		artifactsRepo:      artifactsRepo,
		tempStorageService: tempStorageService,
		storageProvider:    storageProvider,
		sseManager:         sseManager,
		db:                 db,
		logger:             logger,
	}
}

// HandleCollectClips collects clips from testimonials using the new 3-step gRPC API
func (w *StoryVideoStepsWorker) HandleCollectClips(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	w.logger.Info("Starting clip collection",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("workspace_id", stepCtx.WorkspaceID.String()))

	// Build request for AI service
	collectReq := &pb.CollectClipsRequest{
		SessionId:          stepCtx.SessionID.String(),
		WorkspaceId:        stepCtx.WorkspaceID.String(),
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true, // Upload clips to temp storage for preview
	}

	// Declare testimonialIDs early to avoid goto issues
	testimonialIDs := []uuid.UUID{}

	// Option 0: Check for moments from frontend (NEW: moment-based workflow)
	// Frontend sends full moment objects via MomentSelectionStep → AIOrderingStep → config
	if momentsData, ok := stepCtx.Config["moments"]; ok {
		if momentsSlice, ok := momentsData.([]interface{}); ok {
			w.logger.Info("Converting frontend moments to testimonial segments",
				zap.String("session_id", stepCtx.SessionID.String()),
				zap.Int("moments_count", len(momentsSlice)))

			// Group moments by testimonial_id
			momentsByTestimonial := make(map[string][]*pb.HighlightMoment)

			for _, momentData := range momentsSlice {
				if momentMap, ok := momentData.(map[string]interface{}); ok {
					testimonialID := getStringValue(momentMap, "testimonial_id")
					if testimonialID == "" {
						continue
					}

					// Convert moment to HighlightMoment protobuf
					highlight := &pb.HighlightMoment{
						Id:                 getStringValue(momentMap, "id"),
						StartTime:          getFloat64Value(momentMap, "start_time"),
						EndTime:            getFloat64Value(momentMap, "end_time"),
						Text:               getStringValue(momentMap, "text"),
						Theme:              getStringValue(momentMap, "theme"),
						ImportanceScore:    getFloat64Value(momentMap, "importance_score"),
						EngagementScore:    getFloat64Value(momentMap, "engagement_score"),
						HighlightType:      getStringValue(momentMap, "type"),
						EnhanceClip:        true,
						IncludeLogo:        true,
						Quality:            "high",
						AddBackgroundMusic: true,
						RemoveNoise:        true,
					}

					// Parse keywords if present
					if keywordsData, ok := momentMap["keywords"]; ok {
						if keywordsSlice, ok := keywordsData.([]interface{}); ok {
							for _, kw := range keywordsSlice {
								if kwStr, ok := kw.(string); ok {
									highlight.Keywords = append(highlight.Keywords, kwStr)
								}
							}
						}
					}

					momentsByTestimonial[testimonialID] = append(momentsByTestimonial[testimonialID], highlight)
				}
			}

			// Convert grouped moments into TestimonialSegments
			for testimonialID, highlights := range momentsByTestimonial {
				tid, err := uuid.Parse(testimonialID)
				if err != nil {
					w.logger.Warn("Invalid testimonial ID in moments",
						zap.String("testimonial_id", testimonialID),
						zap.Error(err))
					continue
				}

				// Fetch testimonial data for media_url
				testimonialData, err := w.testimonialRepo.FetchForAIProcessing(ctx, tid, w.db)
				if err != nil {
					w.logger.Warn("Failed to fetch testimonial for moments",
						zap.String("testimonial_id", testimonialID),
						zap.Error(err))
					continue
				}

				if testimonialData.MediaURL == nil || *testimonialData.MediaURL == "" {
					w.logger.Warn("Testimonial has no media URL",
						zap.String("testimonial_id", testimonialID))
					continue
				}

				segment := &pb.TestimonialSegment{
					TestimonialId: testimonialID,
					MediaUrl:      *testimonialData.MediaURL,
					Highlights:    highlights,
				}
				collectReq.TestimonialSegments = append(collectReq.TestimonialSegments, segment)
			}

			w.logger.Info("Converted moments to testimonial segments",
				zap.String("session_id", stepCtx.SessionID.String()),
				zap.Int("segments_count", len(collectReq.TestimonialSegments)),
				zap.Int("total_highlights", len(momentsSlice)))

			// Skip other options if moments were provided
			goto executeCollection
		}
	}

	// Option 1: Check for pre-selected clip IDs from frontend
	if clipIdsData, ok := stepCtx.Config["clip_ids"]; ok {
		var clipIDs []string

		// Handle both string (comma-separated) and array formats
		if clipIdsStr, ok := clipIdsData.(string); ok {
			clipIDs = strings.Split(clipIdsStr, ",")
		} else if clipIdsSlice, ok := clipIdsData.([]interface{}); ok {
			for _, idData := range clipIdsSlice {
				if idStr, ok := idData.(string); ok {
					clipIDs = append(clipIDs, strings.TrimSpace(idStr))
				}
			}
		}

		// Fetch clip data from database/artifacts
		for _, clipID := range clipIDs {
			clipID = strings.TrimSpace(clipID)
			if clipID == "" {
				continue
			}

			// Find clip in testimonial's clipping artifacts
			clipData, err := w.findClipInArtifacts(ctx, stepCtx.TestimonialID, clipID)
			if err != nil {
				w.logger.Warn("Failed to find clip in artifacts",
					zap.String("clip_id", clipID),
					zap.Error(err))
				continue
			}

			if clipData != nil {
				clipInfo := &pb.ClipInfo{
					ClipId:        clipID,
					TestimonialId: stepCtx.TestimonialID.String(),
					StoragePath:   clipData["url"].(string),
					PreviewUrl:    clipData["url"].(string),
					StartTime:     getFloat64Value(clipData, "start_time"),
					EndTime:       getFloat64Value(clipData, "end_time"),
					Duration:      getFloat64Value(clipData, "duration"),
					HighlightType: getStringValue(clipData, "theme"),
					TextContent:   getStringValue(clipData, "title"),
				}
				collectReq.ExistingClips = append(collectReq.ExistingClips, clipInfo)
			}
		}

		w.logger.Info("Using pre-selected clip IDs from frontend",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Int("clips_count", len(collectReq.ExistingClips)))
	}

	// Option 1b: Check for full clip data objects from frontend
	if clipsData, ok := stepCtx.Config["clips"]; ok {
		if clipsSlice, ok := clipsData.([]interface{}); ok {
			for _, clipData := range clipsSlice {
				if clipMap, ok := clipData.(map[string]interface{}); ok {
					// Convert to ClipInfo protobuf
					clipInfo := &pb.ClipInfo{
						ClipId:        getStringValue(clipMap, "clip_id"),
						TestimonialId: getStringValue(clipMap, "testimonial_id"),
						StoragePath:   getStringValue(clipMap, "storage_path"),
						PreviewUrl:    getStringValue(clipMap, "preview_url"),
						StartTime:     getFloat64Value(clipMap, "start_time"),
						EndTime:       getFloat64Value(clipMap, "end_time"),
						Duration:      getFloat64Value(clipMap, "duration"),
						HighlightType: getStringValue(clipMap, "highlight_type"),
						TextContent:   getStringValue(clipMap, "text_content"),
					}
					collectReq.ExistingClips = append(collectReq.ExistingClips, clipInfo)
				}
			}

			w.logger.Info("Using pre-selected clip objects from frontend",
				zap.String("session_id", stepCtx.SessionID.String()),
				zap.Int("clips_count", len(collectReq.ExistingClips)))
		}
	}

	// Option 2: Extract new clips from testimonials
	if stepCtx.TestimonialID != uuid.Nil {
		// Single testimonial mode
		testimonialIDs = append(testimonialIDs, stepCtx.TestimonialID)
	} else if idsData, ok := stepCtx.Config["testimonial_ids"]; ok {
		// Multiple testimonials mode
		if idsSlice, ok := idsData.([]interface{}); ok {
			for _, idData := range idsSlice {
				if idStr, ok := idData.(string); ok {
					if id, err := uuid.Parse(idStr); err == nil {
						testimonialIDs = append(testimonialIDs, id)
					}
				}
			}
		}
	}

	// Build testimonial segments for extraction
	if len(testimonialIDs) > 0 {
		w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 30, fmt.Sprintf("Preparing %d testimonials for clip extraction...", len(testimonialIDs)))

		for _, testimonialID := range testimonialIDs {
			// Get highlights for this testimonial
			highlights, err := w.getOrGenerateHighlights(ctx, testimonialID, stepCtx)
			if err != nil {
				w.logger.Warn("Failed to get highlights for testimonial",
					zap.String("testimonial_id", testimonialID.String()),
					zap.Error(err))
				continue
			}

			// Get testimonial data
			testimonialData, err := w.testimonialRepo.FetchForAIProcessing(ctx, testimonialID, w.db)
			if err != nil {
				w.logger.Warn("Failed to fetch testimonial",
					zap.String("testimonial_id", testimonialID.String()),
					zap.Error(err))
				continue
			}

			// Build testimonial segment
			segment := &pb.TestimonialSegment{
				TestimonialId: testimonialID.String(),
				MediaUrl:      *testimonialData.MediaURL,
				Highlights:    highlights,
			}
			collectReq.TestimonialSegments = append(collectReq.TestimonialSegments, segment)
		}

		w.logger.Info("Prepared testimonial segments for clip extraction",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Int("segment_count", len(collectReq.TestimonialSegments)))
	}

executeCollection:
	// Validate we have something to process
	if len(collectReq.ExistingClips) == 0 && len(collectReq.TestimonialSegments) == 0 {
		return nil, fmt.Errorf("no clips or testimonials specified for story video generation")
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 60, "Extracting clips...")

	// Call AI service CollectClips
	collectResp, err := w.mediaIntelligence.CollectClips(ctx, collectReq)
	if err != nil {
		w.logger.Error("Failed to collect clips",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Error(err))
		return nil, fmt.Errorf("failed to collect clips: %w", err)
	}

	w.logger.Info("Clips collected successfully",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.Int("total_clips", int(collectResp.TotalClips)),
		zap.Float64("total_duration", collectResp.TotalDuration))

	// Convert clips to map format for metadata
	clipsData := []map[string]interface{}{}
	for _, clip := range collectResp.Clips {
		clipMap := map[string]interface{}{
			"clip_id":        clip.ClipId,
			"testimonial_id": clip.TestimonialId,
			"storage_path":   clip.StoragePath,
			"preview_url":    clip.PreviewUrl,
			"start_time":     clip.StartTime,
			"end_time":       clip.EndTime,
			"duration":       clip.Duration,
			"highlight_type": clip.HighlightType,
			"text_content":   clip.TextContent,
		}
		clipsData = append(clipsData, clipMap)

		// Stream individual clip preview to frontend
		w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
			Type:      "preview_ready",
			SessionID: stepCtx.SessionID.String(),
			StageID:   &stepCtx.StageID,
			Timestamp: time.Now(),
			Preview: &sse.PreviewData{
				Type:       "video",
				Content:    clip.PreviewUrl,
				PreviewURL: clip.PreviewUrl,
				URL:        clip.PreviewUrl,
				Quality:    1.0,
				StageID:    stepCtx.StageID,
			},
			Data: map[string]interface{}{
				"clip_id":        clip.ClipId,
				"testimonial_id": clip.TestimonialId,
				"duration":       clip.Duration,
				"highlight_type": clip.HighlightType,
			},
		})
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 100, "Clips collected successfully")

	return &StepResult{
		OutputArtifactURL:   "",
		PreviewURL:          nil,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"collect_clips"},
		Metadata: map[string]interface{}{
			"clips_count":        int(collectResp.TotalClips),
			"clips":              clipsData,
			"total_duration":     collectResp.TotalDuration,
			"testimonials_count": len(testimonialIDs),
		},
	}, nil
}

// HandleAIOrdering uses AI to order clips into a compelling narrative
func (w *StoryVideoStepsWorker) HandleAIOrdering(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// Get clips from previous step
	var clips []map[string]interface{}
	if clipsData, ok := stepCtx.Config["clips"]; ok {
		if clipsSlice, ok := clipsData.([]interface{}); ok {
			for _, clipData := range clipsSlice {
				if clipMap, ok := clipData.(map[string]interface{}); ok {
					clips = append(clips, clipMap)
				}
			}
		}
	}

	if len(clips) == 0 {
		return nil, fmt.Errorf("no clips available for ordering")
	}

	// Check if user wants to use their own order (skip AI ordering)
	useUserOrder, _ := stepCtx.Config["use_user_order"].(bool)
	if useUserOrder {
		w.logger.Info("Using user-provided clip order (skipping AI ordering)",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Int("clips_count", len(clips)))

		return &StepResult{
			OutputArtifactURL:   "",
			PreviewURL:          nil,
			TempArtifactID:      nil,
			AppliedEnhancements: []string{"user_order_preserved"},
			Metadata: map[string]interface{}{
				"ordered_clips":       clips, // Use clips as-is
				"narrative_structure": "User-defined order",
				"clips_count":         len(clips),
				"source":              "user_provided",
			},
		}, nil
	}

	w.logger.Info("Ordering clips using AI",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.Int("clips_count", len(clips)))

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 30, "Preparing clips for AI ordering...")

	// Convert clips to protobuf ClipInfo format
	var clipInfos []*pb.ClipInfo
	for _, clipMap := range clips {
		clipInfo := &pb.ClipInfo{
			ClipId:        getStringValue(clipMap, "clip_id"),
			TestimonialId: getStringValue(clipMap, "testimonial_id"),
			StoragePath:   getStringValue(clipMap, "storage_path"),
			PreviewUrl:    getStringValue(clipMap, "preview_url"),
			StartTime:     getFloat64Value(clipMap, "start_time"),
			EndTime:       getFloat64Value(clipMap, "end_time"),
			Duration:      getFloat64Value(clipMap, "duration"),
			HighlightType: getStringValue(clipMap, "highlight_type"),
			TextContent:   getStringValue(clipMap, "text_content"),
		}
		clipInfos = append(clipInfos, clipInfo)
	}

	// Get ordering strategy from config
	orderingStrategy, _ := stepCtx.Config["ordering_strategy"].(string)
	if orderingStrategy == "" {
		orderingStrategy = "narrative" // Default strategy
	}

	// Get brand context from workspace
	brandContext := ""
	if workspace, err := w.workspaceRepo.GetByID(ctx, stepCtx.WorkspaceID, w.db); err == nil && workspace != nil {
		if workspace.Name != "" {
			brandContext = workspace.Name
		}
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 60, fmt.Sprintf("AI is ordering clips using %s strategy...", orderingStrategy))

	// Call AI service AIOrdering RPC
	orderingReq := &pb.AIOrderingRequest{
		SessionId:        stepCtx.SessionID.String(),
		Clips:            clipInfos,
		OrderingStrategy: orderingStrategy,
		BrandContext:     brandContext,
		JobId:            stepCtx.SessionID.String(),
	}

	orderingResp, err := w.mediaIntelligence.AIOrdering(ctx, orderingReq)
	if err != nil {
		w.logger.Error("Failed to order clips with AI",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Error(err))
		// Fallback: use original order
		return &StepResult{
			OutputArtifactURL:   "",
			PreviewURL:          nil,
			TempArtifactID:      nil,
			AppliedEnhancements: []string{"ai_ordering_fallback"},
			Metadata: map[string]interface{}{
				"ordered_clips":       clips,
				"narrative_structure": "Failed to order clips, using original order",
				"clips_count":         len(clips),
				"error":               err.Error(),
			},
		}, nil
	}

	if orderingResp.Error != "" {
		w.logger.Warn("AI ordering returned error",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.String("error", orderingResp.Error))
		// Fallback: use original order
		return &StepResult{
			OutputArtifactURL:   "",
			PreviewURL:          nil,
			TempArtifactID:      nil,
			AppliedEnhancements: []string{"ai_ordering_fallback"},
			Metadata: map[string]interface{}{
				"ordered_clips":       clips,
				"narrative_structure": fmt.Sprintf("AI ordering failed: %s. Using original order", orderingResp.Error),
				"clips_count":         len(clips),
			},
		}, nil
	}

	// Convert ordered clips back to map format
	orderedClips := []map[string]interface{}{}
	for _, clip := range orderingResp.OrderedClips {
		clipMap := map[string]interface{}{
			"clip_id":        clip.ClipId,
			"testimonial_id": clip.TestimonialId,
			"storage_path":   clip.StoragePath,
			"preview_url":    clip.PreviewUrl,
			"start_time":     clip.StartTime,
			"end_time":       clip.EndTime,
			"duration":       clip.Duration,
			"highlight_type": clip.HighlightType,
			"text_content":   clip.TextContent,
		}
		orderedClips = append(orderedClips, clipMap)
	}

	w.logger.Info("Clips ordered successfully by AI",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("strategy", orderingStrategy),
		zap.String("rationale", orderingResp.OrderingRationale),
		zap.Float64("confidence", orderingResp.ConfidenceScore))

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 100, "Clips ordered successfully")

	return &StepResult{
		OutputArtifactURL:   "",
		PreviewURL:          nil,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"ai_ordering"},
		Metadata: map[string]interface{}{
			"ordered_clips":       orderedClips,
			"narrative_structure": orderingResp.OrderingRationale,
			"clips_count":         len(orderedClips),
			"ordering_strategy":   orderingStrategy,
			"confidence_score":    orderingResp.ConfidenceScore,
		},
	}, nil
}

// HandleAssembleDraft assembles ordered clips into a draft video
func (w *StoryVideoStepsWorker) HandleAssembleDraft(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// Get clips from previous step (either ordered_clips from AI ordering or clips if AI ordering was skipped)
	var orderedClips []map[string]interface{}
	if clipsData, ok := stepCtx.Config["ordered_clips"]; ok {
		// AI ordering was used
		if clipsSlice, ok := clipsData.([]interface{}); ok {
			for _, clipData := range clipsSlice {
				if clipMap, ok := clipData.(map[string]interface{}); ok {
					orderedClips = append(orderedClips, clipMap)
				}
			}
		}
	} else if clipsData, ok := stepCtx.Config["clips"]; ok {
		// AI ordering was skipped, use clips directly
		if clipsSlice, ok := clipsData.([]interface{}); ok {
			for _, clipData := range clipsSlice {
				if clipMap, ok := clipData.(map[string]interface{}); ok {
					orderedClips = append(orderedClips, clipMap)
				}
			}
		}
	}

	if len(orderedClips) == 0 {
		return nil, fmt.Errorf("no clips available for assembly")
	}

	w.logger.Info("Assembling draft story video",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.Int("clips_count", len(orderedClips)))

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 30, "Preparing clips for assembly...")

	// Convert orderedClips to protobuf ClipInfo format
	var clipInfos []*pb.ClipInfo
	for _, clipMap := range orderedClips {
		clipInfo := &pb.ClipInfo{
			ClipId:        getStringValue(clipMap, "clip_id"),
			TestimonialId: getStringValue(clipMap, "testimonial_id"),
			StoragePath:   getStringValue(clipMap, "storage_path"),
			PreviewUrl:    getStringValue(clipMap, "preview_url"),
			StartTime:     getFloat64Value(clipMap, "start_time"),
			EndTime:       getFloat64Value(clipMap, "end_time"),
			Duration:      getFloat64Value(clipMap, "duration"),
			HighlightType: getStringValue(clipMap, "highlight_type"),
			TextContent:   getStringValue(clipMap, "text_content"),
		}
		clipInfos = append(clipInfos, clipInfo)
	}

	// Get transition preferences from config
	transitionType, _ := stepCtx.Config["transition_type"].(string)
	if transitionType == "" {
		transitionType = "fade" // Default transition
	}

	transitionDuration := 0.2 // Default 0.2 seconds
	if dur, ok := stepCtx.Config["transition_duration"].(float64); ok && dur > 0 {
		transitionDuration = dur
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Assembling clips into story video...")

	// Build AssembleDraft request
	assembleReq := &pb.AssembleDraftRequest{
		SessionId:          stepCtx.SessionID.String(),
		TestimonialId:      stepCtx.TestimonialID.String(),
		Clips:              clipInfos,
		TransitionType:     transitionType,
		TransitionDuration: transitionDuration,
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true, // Upload to cloud for preview
	}

	// CRITICAL: Start heartbeat goroutine to prevent "stuck" detection during long assembly operation
	// Assembly can take 5-10 minutes for multiple clips - send progress updates every 30 seconds
	heartbeatDone := make(chan struct{})
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		progress := 55         // Start at 55% after initial setup
		progressIncrement := 5 // Increase by 5% every 30 seconds

		for {
			select {
			case <-ticker.C:
				if progress < 85 { // Cap at 85% before completion
					progress += progressIncrement
					w.emitProgress(stepCtx.SessionID, stepCtx.StageID, progress,
						fmt.Sprintf("Still assembling... (%d clips, this may take several minutes)", len(clipInfos)))
					w.logger.Debug("Heartbeat progress update sent",
						zap.String("session_id", stepCtx.SessionID.String()),
						zap.Int("progress", progress))
				}
			case <-heartbeatDone:
				return
			}
		}
	}()

	// Call AI service AssembleDraft
	assembleResp, err := w.mediaIntelligence.AssembleDraft(ctx, assembleReq)

	// Stop heartbeat immediately after gRPC call completes
	close(heartbeatDone)

	if err != nil {
		w.logger.Error("Failed to assemble draft video",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Error(err))
		return nil, fmt.Errorf("failed to assemble draft video: %w", err)
	}

	if assembleResp.Error != "" {
		w.logger.Error("Assembly returned error",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.String("error", assembleResp.Error))
		return nil, fmt.Errorf("assembly error: %s", assembleResp.Error)
	}

	w.logger.Info("Draft video assembled successfully",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("assembled_url", assembleResp.AssembledUrl),
		zap.Float64("duration", assembleResp.Duration),
		zap.Int32("clips_assembled", assembleResp.ClipsAssembled))

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 90, "Assembled video ready for preview")

	// Emit preview_ready SSE event with the assembled video
	w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "preview_ready",
		SessionID: stepCtx.SessionID.String(),
		StageID:   &stepCtx.StageID,
		Timestamp: time.Now(),
		Preview: &sse.PreviewData{
			Type:       "video",
			Content:    assembleResp.AssembledUrl,
			PreviewURL: assembleResp.AssembledUrl,
			URL:        assembleResp.AssembledUrl,
			Quality:    1.0,
			StageID:    stepCtx.StageID,
			Metadata: map[string]interface{}{
				"width":        assembleResp.Width,
				"height":       assembleResp.Height,
				"aspect_ratio": assembleResp.AspectRatio,
				"duration":     assembleResp.Duration,
			},
		},
		Data: map[string]interface{}{
			"assembled_url":   assembleResp.AssembledUrl,
			"duration":        assembleResp.Duration,
			"size_mb":         assembleResp.Size,
			"clips_assembled": assembleResp.ClipsAssembled,
			"transition_type": transitionType,
			"width":           assembleResp.Width,
			"height":          assembleResp.Height,
			"aspect_ratio":    assembleResp.AspectRatio,
		},
	})

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 100, "Story video assembled successfully")

	return &StepResult{
		OutputArtifactURL:   assembleResp.AssembledUrl,
		PreviewURL:          &assembleResp.AssembledUrl,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"assemble_draft"},
		Metadata: map[string]interface{}{
			"assembled_url":   assembleResp.AssembledUrl,
			"local_path":      assembleResp.LocalPath,
			"duration":        assembleResp.Duration,
			"size_mb":         assembleResp.Size,
			"clips_assembled": assembleResp.ClipsAssembled,
			"transition_type": transitionType,
			// CRITICAL FIX: Include width/height/aspect_ratio in metadata so next stage (apply_branding) can preserve it
			"width":        assembleResp.Width,
			"height":       assembleResp.Height,
			"aspect_ratio": assembleResp.AspectRatio,
		},
	}, nil
}

// HandleCollectClips collects clips from testimonials using the new 3-step gRPC API
func (w *StoryVideoStepsWorker) HandleCollectAndAssembleClips(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	w.logger.Info("Starting clip collection and assembly",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("workspace_id", stepCtx.WorkspaceID.String()))

	// Build request for AI service
	assembleReq := &pb.CollectAndAssembleClipsRequest{
		SessionId:          stepCtx.SessionID.String(),
		WorkspaceId:        stepCtx.WorkspaceID.String(),
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true, // Upload clips to temp storage for preview
	}

	// Declare testimonialIDs early to avoid goto issues
	testimonialIDs := []uuid.UUID{}

	// Option 0: Check for moments from frontend (NEW: moment-based workflow)
	// Frontend sends full moment objects via MomentSelectionStep → AIOrderingStep → config
	if momentsData, ok := stepCtx.Config["moments"]; ok {
		if momentsSlice, ok := momentsData.([]interface{}); ok {
			w.logger.Info("Converting frontend moments to testimonial segments or existing clips",
				zap.String("session_id", stepCtx.SessionID.String()),
				zap.Int("moments_count", len(momentsSlice)))

			// Check if moments are from existing clips (have clip_artifact_id/storage_path)
			// OR if they need to be extracted from testimonials (have start_time/end_time only)
			existingClips := []*pb.ClipInfo{}
			momentsByTestimonial := make(map[string][]*pb.HighlightMoment)

			for _, momentData := range momentsSlice {
				if momentMap, ok := momentData.(map[string]interface{}); ok {
					testimonialID := getStringValue(momentMap, "testimonial_id")
					if testimonialID == "" {
						continue
					}

					// CRITICAL FIX: Check if this moment references an existing clip
					clipArtifactID := getStringValue(momentMap, "clip_artifact_id")
					storagePath := getStringValue(momentMap, "storage_path")

					if clipArtifactID != "" && storagePath != "" {
						// This is a moment from an existing clip - use it directly!
						w.logger.Info("Using existing clip from moment",
							zap.String("clip_artifact_id", clipArtifactID),
							zap.String("testimonial_id", testimonialID))

						clipInfo := &pb.ClipInfo{
							ClipId:        clipArtifactID,
							TestimonialId: testimonialID,
							StoragePath:   storagePath,
							PreviewUrl:    getStringValue(momentMap, "preview_url"),
							StartTime:     getFloat64Value(momentMap, "start_time"),
							EndTime:       getFloat64Value(momentMap, "end_time"),
							Duration:      getFloat64Value(momentMap, "duration"),
							HighlightType: getStringValue(momentMap, "type"),
							TextContent:   getStringValue(momentMap, "text"),
						}
						existingClips = append(existingClips, clipInfo)
					} else {
						// This is a moment that needs extraction - convert to HighlightMoment
						highlight := &pb.HighlightMoment{
							Id:                 getStringValue(momentMap, "id"),
							StartTime:          getFloat64Value(momentMap, "start_time"),
							EndTime:            getFloat64Value(momentMap, "end_time"),
							Text:               getStringValue(momentMap, "text"),
							Theme:              getStringValue(momentMap, "theme"),
							ImportanceScore:    getFloat64Value(momentMap, "importance_score"),
							EngagementScore:    getFloat64Value(momentMap, "engagement_score"),
							HighlightType:      getStringValue(momentMap, "type"),
							EnhanceClip:        true,
							IncludeLogo:        true,
							Quality:            "high",
							AddBackgroundMusic: true,
							RemoveNoise:        true,
						}

						// Parse keywords if present
						if keywordsData, ok := momentMap["keywords"]; ok {
							if keywordsSlice, ok := keywordsData.([]interface{}); ok {
								for _, kw := range keywordsSlice {
									if kwStr, ok := kw.(string); ok {
										highlight.Keywords = append(highlight.Keywords, kwStr)
									}
								}
							}
						}

						momentsByTestimonial[testimonialID] = append(momentsByTestimonial[testimonialID], highlight)
					}
				}
			}

			// Add existing clips to request
			if len(existingClips) > 0 {
				assembleReq.ExistingClips = existingClips
				w.logger.Info("Added existing clips to assembly request",
					zap.String("session_id", stepCtx.SessionID.String()),
					zap.Int("existing_clips_count", len(existingClips)))
			}

			// Convert grouped moments (needing extraction) into TestimonialSegments
			for testimonialID, highlights := range momentsByTestimonial {
				tid, err := uuid.Parse(testimonialID)
				if err != nil {
					w.logger.Warn("Invalid testimonial ID in moments",
						zap.String("testimonial_id", testimonialID),
						zap.Error(err))
					continue
				}

				// Fetch testimonial data for media_url
				testimonialData, err := w.testimonialRepo.FetchForAIProcessing(ctx, tid, w.db)
				if err != nil {
					w.logger.Warn("Failed to fetch testimonial for moments",
						zap.String("testimonial_id", testimonialID),
						zap.Error(err))
					continue
				}

				if testimonialData.MediaURL == nil || *testimonialData.MediaURL == "" {
					w.logger.Warn("Testimonial has no media URL",
						zap.String("testimonial_id", testimonialID))
					continue
				}

				segment := &pb.TestimonialSegment{
					TestimonialId: testimonialID,
					MediaUrl:      *testimonialData.MediaURL,
					Highlights:    highlights,
				}
				assembleReq.TestimonialSegments = append(assembleReq.TestimonialSegments, segment)
			}

			w.logger.Info("Converted moments to testimonial segments and existing clips",
				zap.String("session_id", stepCtx.SessionID.String()),
				zap.Int("segments_count", len(assembleReq.TestimonialSegments)),
				zap.Int("existing_clips_count", len(existingClips)),
				zap.Int("total_moments", len(momentsSlice)))

			// Skip other options if moments were provided
			goto executeCollection
		}
	}

	// Option 1: Check for pre-selected clip IDs from frontend
	if clipIdsData, ok := stepCtx.Config["clip_ids"]; ok {
		var clipIDs []string

		// Handle both string (comma-separated) and array formats
		if clipIdsStr, ok := clipIdsData.(string); ok {
			clipIDs = strings.Split(clipIdsStr, ",")
		} else if clipIdsSlice, ok := clipIdsData.([]interface{}); ok {
			for _, idData := range clipIdsSlice {
				if idStr, ok := idData.(string); ok {
					clipIDs = append(clipIDs, strings.TrimSpace(idStr))
				}
			}
		}

		// Fetch clip data from database/artifacts
		for _, clipID := range clipIDs {
			clipID = strings.TrimSpace(clipID)
			if clipID == "" {
				continue
			}

			// Find clip in testimonial's clipping artifacts
			clipData, err := w.findClipInArtifacts(ctx, stepCtx.TestimonialID, clipID)
			if err != nil {
				w.logger.Warn("Failed to find clip in artifacts",
					zap.String("clip_id", clipID),
					zap.Error(err))
				continue
			}

			if clipData != nil {
				clipInfo := &pb.ClipInfo{
					ClipId:        clipID,
					TestimonialId: stepCtx.TestimonialID.String(),
					StoragePath:   clipData["url"].(string),
					PreviewUrl:    clipData["url"].(string),
					StartTime:     getFloat64Value(clipData, "start_time"),
					EndTime:       getFloat64Value(clipData, "end_time"),
					Duration:      getFloat64Value(clipData, "duration"),
					HighlightType: getStringValue(clipData, "theme"),
					TextContent:   getStringValue(clipData, "title"),
				}
				assembleReq.ExistingClips = append(assembleReq.ExistingClips, clipInfo)
			}
		}

		w.logger.Info("Using pre-selected clip IDs from frontend",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Int("clips_count", len(assembleReq.ExistingClips)))
	}

	// Option 1b: Check for full clip data objects from frontend
	if clipsData, ok := stepCtx.Config["clips"]; ok {
		if clipsSlice, ok := clipsData.([]interface{}); ok {
			for _, clipData := range clipsSlice {
				if clipMap, ok := clipData.(map[string]interface{}); ok {
					// Convert to ClipInfo protobuf
					clipInfo := &pb.ClipInfo{
						ClipId:        getStringValue(clipMap, "clip_id"),
						TestimonialId: getStringValue(clipMap, "testimonial_id"),
						StoragePath:   getStringValue(clipMap, "storage_path"),
						PreviewUrl:    getStringValue(clipMap, "preview_url"),
						StartTime:     getFloat64Value(clipMap, "start_time"),
						EndTime:       getFloat64Value(clipMap, "end_time"),
						Duration:      getFloat64Value(clipMap, "duration"),
						HighlightType: getStringValue(clipMap, "highlight_type"),
						TextContent:   getStringValue(clipMap, "text_content"),
					}
					assembleReq.ExistingClips = append(assembleReq.ExistingClips, clipInfo)
				}
			}

			w.logger.Info("Using pre-selected clip objects from frontend",
				zap.String("session_id", stepCtx.SessionID.String()),
				zap.Int("clips_count", len(assembleReq.ExistingClips)))
		}
	}

	// Option 2: Extract new clips from testimonials
	if stepCtx.TestimonialID != uuid.Nil {
		// Single testimonial mode
		testimonialIDs = append(testimonialIDs, stepCtx.TestimonialID)
	} else if idsData, ok := stepCtx.Config["testimonial_ids"]; ok {
		// Multiple testimonials mode
		if idsSlice, ok := idsData.([]interface{}); ok {
			for _, idData := range idsSlice {
				if idStr, ok := idData.(string); ok {
					if id, err := uuid.Parse(idStr); err == nil {
						testimonialIDs = append(testimonialIDs, id)
					}
				}
			}
		}
	}

	// Build testimonial segments for extraction
	if len(testimonialIDs) > 0 {
		w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 30, fmt.Sprintf("Preparing %d testimonials for clip extraction...", len(testimonialIDs)))

		for _, testimonialID := range testimonialIDs {
			// Get highlights for this testimonial
			highlights, err := w.getOrGenerateHighlights(ctx, testimonialID, stepCtx)
			if err != nil {
				w.logger.Warn("Failed to get highlights for testimonial",
					zap.String("testimonial_id", testimonialID.String()),
					zap.Error(err))
				continue
			}

			// Get testimonial data
			testimonialData, err := w.testimonialRepo.FetchForAIProcessing(ctx, testimonialID, w.db)
			if err != nil {
				w.logger.Warn("Failed to fetch testimonial",
					zap.String("testimonial_id", testimonialID.String()),
					zap.Error(err))
				continue
			}

			// Build testimonial segment
			segment := &pb.TestimonialSegment{
				TestimonialId: testimonialID.String(),
				MediaUrl:      *testimonialData.MediaURL,
				Highlights:    highlights,
			}
			assembleReq.TestimonialSegments = append(assembleReq.TestimonialSegments, segment)
		}

		w.logger.Info("Prepared testimonial segments for clip extraction",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Int("segment_count", len(assembleReq.TestimonialSegments)))
	}

executeCollection:
	// Validate we have something to process
	if len(assembleReq.ExistingClips) == 0 && len(assembleReq.TestimonialSegments) == 0 {
		return nil, fmt.Errorf("no clips or testimonials specified for story video generation")
	}

	// Get transition preferences from config
	transitionType, _ := stepCtx.Config["transition_type"].(string)
	if transitionType == "" {
		transitionType = "fade" // Default transition
	}
	assembleReq.TransitionType = transitionType

	transitionDuration := 0.2 // Default 0.2 seconds
	if dur, ok := stepCtx.Config["transition_duration"].(float64); ok && dur > 0 {
		transitionDuration = dur
	}
	assembleReq.TransitionDuration = transitionDuration

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 60, "Extracting clips...")

	// Call AI service CollectClips
	assembleResp, err := w.mediaIntelligence.CollectAndAssembleClips(ctx, assembleReq)
	if err != nil {
		w.logger.Error("Failed to assemble draft video",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Error(err))
		return nil, fmt.Errorf("failed to assemble draft video: %w", err)
	}

	if assembleResp.Error != "" {
		w.logger.Error("Assembly returned error",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.String("error", assembleResp.Error))
		return nil, fmt.Errorf("assembly error: %s", assembleResp.Error)
	}

	w.logger.Info("Draft video assembled successfully",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("assembled_url", assembleResp.AssembledUrl),
		zap.Float64("duration", assembleResp.Duration),
		zap.Int32("clips_assembled", assembleResp.ClipsAssembled))

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 90, "Assembled video ready for preview")

	// Emit preview_ready SSE event with the assembled video
	w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "preview_ready",
		SessionID: stepCtx.SessionID.String(),
		StageID:   &stepCtx.StageID,
		Timestamp: time.Now(),
		Preview: &sse.PreviewData{
			Type:       "video",
			Content:    assembleResp.AssembledUrl,
			PreviewURL: assembleResp.AssembledUrl,
			URL:        assembleResp.AssembledUrl,
			Quality:    1.0,
			StageID:    stepCtx.StageID,
			Metadata: map[string]interface{}{
				"width":        assembleResp.Width,
				"height":       assembleResp.Height,
				"aspect_ratio": assembleResp.AspectRatio,
				"duration":     assembleResp.Duration,
			},
		},
		Data: map[string]any{
			"assembled_url":   assembleResp.AssembledUrl,
			"duration":        assembleResp.Duration,
			"size_mb":         assembleResp.Size,
			"clips_assembled": assembleResp.ClipsAssembled,
			"transition_type": transitionType,
			"width":           assembleResp.Width,
			"height":          assembleResp.Height,
			"aspect_ratio":    assembleResp.AspectRatio,
		},
	})

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 100, "Story video assembled successfully")

	return &StepResult{
		OutputArtifactURL:   assembleResp.AssembledUrl,
		PreviewURL:          &assembleResp.AssembledUrl,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"assemble_clips"},
		Metadata: map[string]interface{}{
			"assembled_url":   assembleResp.AssembledUrl,
			"local_path":      assembleResp.LocalPath,
			"duration":        assembleResp.Duration,
			"size_mb":         assembleResp.Size,
			"clips_assembled": assembleResp.ClipsAssembled,
			"transition_type": transitionType,
			// CRITICAL FIX: Include width/height/aspect_ratio in metadata so next stage (apply_branding) can preserve it
			"width":        assembleResp.Width,
			"height":       assembleResp.Height,
			"aspect_ratio": assembleResp.AspectRatio,
		},
	}, nil
}

// HandleAddIntroOutro adds intro and/or outro to the story video
func (w *StoryVideoStepsWorker) HandleAddIntroOutro(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	currentVideoURL := stepCtx.CurrentArtifactURL
	if currentVideoURL == "" {
		return nil, fmt.Errorf("no video available for adding intro/outro")
	}

	addIntro, _ := stepCtx.Config["add_intro"].(bool)
	addOutro, _ := stepCtx.Config["add_outro"].(bool)
	introText, _ := stepCtx.Config["intro_text"].(string)
	outroText, _ := stepCtx.Config["outro_text"].(string)

	w.logger.Info("Intro/outro config",
		zap.Bool("add_intro", addIntro),
		zap.Bool("add_outro", addOutro),
		zap.String("intro_text", introText),
		zap.String("outro_text", outroText))

	// Skip if BOTH are disabled
	if !addIntro && !addOutro {
		w.logger.Info("Skipping intro/outro - both disabled")
		return &StepResult{
			OutputArtifactURL:   currentVideoURL,
			PreviewURL:          &currentVideoURL,
			TempArtifactID:      nil,
			AppliedEnhancements: []string{"intro_outro_skipped"},
			Metadata: map[string]interface{}{
				"video_url": currentVideoURL,
			},
		}, nil
	}

	w.logger.Info("Adding intro/outro to story video",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.Bool("add_intro", addIntro),
		zap.Bool("add_outro", addOutro))

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 30, "Preparing intro/outro...")

	// Retrieve workspace for name and brand context
	workspace, err := w.workspaceRepo.GetByID(ctx, stepCtx.WorkspaceID, w.db)
	if err != nil {
		w.logger.Warn("Failed to retrieve workspace for intro/outro, using defaults",
			zap.String("workspace_id", stepCtx.WorkspaceID.String()),
			zap.Error(err))
	}

	var workspaceName string
	var brandContext *pb.BrandContext

	if workspace != nil {
		workspaceName = workspace.Name
		// Use brand context from step context if available, otherwise use workspace brand context
		if stepCtx.BrandContext != nil {
			brandContext = stepCtx.BrandContext
		} else if workspace.BrandContext != nil {
			brandContext, _ = w.workspaceRepo.GetBrandContextFromWorkspace(workspace)

		}
	}

	w.logger.Info("Workspace context for intro/outro",
		zap.String("workspace_name", workspaceName),
		zap.Bool("has_brand_context", brandContext != nil),
		zap.String("logo_url", func() string {
			if brandContext != nil {
				return brandContext.LogoUrl
			}
			return ""
		}()))

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Adding intro/outro to video...")

	introOutroReq := &pb.IntroOutroRequest{
		TestimonialId:      stepCtx.TestimonialID.String(),
		MediaUrl:           currentVideoURL,
		AddIntro:           addIntro,
		AddOutro:           addOutro,
		IntroText:          introText,
		OutroText:          outroText,
		JobId:              stepCtx.SessionID.String(),
		UploadIntermediate: true,
		BrandContext:       brandContext,
		WorkspaceName:      workspaceName,
	}

	// CRITICAL: Start heartbeat goroutine for intro/outro generation (can take 5-10 minutes with voiceover)
	heartbeatDone := make(chan struct{})
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		progress := 55         // Start at 55% after initial setup
		progressIncrement := 5 // Increase by 5% every 30 seconds

		for {
			select {
			case <-ticker.C:
				if progress < 85 { // Cap at 85% before completion
					progress += progressIncrement
					statusMsg := "Generating intro/outro"
					if addIntro && addOutro {
						statusMsg += " (with voiceover narration)"
					} else if addIntro {
						statusMsg += " (creating intro)"
					} else {
						statusMsg += " (creating outro)"
					}
					w.emitProgress(stepCtx.SessionID, stepCtx.StageID, progress, statusMsg+"...")
					w.logger.Debug("Heartbeat progress update sent",
						zap.String("session_id", stepCtx.SessionID.String()),
						zap.Int("progress", progress))
				}
			case <-heartbeatDone:
				return
			}
		}
	}()

	// Call AI service AddIntroOutro RPC
	introOutroResp, err := w.mediaIntelligence.AddIntroOutro(ctx, introOutroReq)

	// Stop heartbeat immediately after gRPC call completes
	close(heartbeatDone)

	if err != nil {
		w.logger.Error("Failed to add intro/outro",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Error(err))
		return nil, fmt.Errorf("failed to add intro/outro: %w", err)
	}

	if introOutroResp.Error != "" {
		w.logger.Error("Intro/outro returned error",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.String("error", introOutroResp.Error))
		return nil, fmt.Errorf("intro/outro error: %s", introOutroResp.Error)
	}

	w.logger.Info("Intro/outro added successfully",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("output_url", introOutroResp.OutputUrl),
		zap.Float64("duration", introOutroResp.Duration))

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 90, "Intro/outro video ready for preview")

	// Emit preview_ready SSE event with the video with intro/outro
	w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "preview_ready",
		SessionID: stepCtx.SessionID.String(),
		StageID:   &stepCtx.StageID,
		Timestamp: time.Now(),
		Preview: &sse.PreviewData{
			Type:       "video",
			Content:    introOutroResp.OutputUrl,
			PreviewURL: introOutroResp.OutputUrl,
			URL:        introOutroResp.OutputUrl,
			Quality:    1.0,
			StageID:    stepCtx.StageID,
			Metadata: map[string]interface{}{
				"width":        introOutroResp.Width,
				"height":       introOutroResp.Height,
				"aspect_ratio": introOutroResp.AspectRatio,
				"duration":     introOutroResp.Duration,
			},
		},
		Data: map[string]interface{}{
			"output_url":   introOutroResp.OutputUrl,
			"duration":     introOutroResp.Duration,
			"size_mb":      introOutroResp.Size,
			"add_intro":    addIntro,
			"add_outro":    addOutro,
			"width":        introOutroResp.Width,
			"height":       introOutroResp.Height,
			"aspect_ratio": introOutroResp.AspectRatio,
		},
	})

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 100, "Intro/outro added successfully")

	return &StepResult{
		OutputArtifactURL:   introOutroResp.OutputUrl,
		PreviewURL:          &introOutroResp.OutputUrl,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"add_intro_outro"},
		Metadata: map[string]interface{}{
			"output_url": introOutroResp.OutputUrl,
			"local_path": introOutroResp.LocalPath,
			"duration":   introOutroResp.Duration,
			"size_mb":    introOutroResp.Size,
			"add_intro":  addIntro,
			"add_outro":  addOutro,
			// CRITICAL FIX: Include width/height/aspect_ratio in metadata so next stage (apply_branding) can preserve it
			"width":        introOutroResp.Width,
			"height":       introOutroResp.Height,
			"aspect_ratio": introOutroResp.AspectRatio,
		},
	}, nil
}

// Helper methods

func (w *StoryVideoStepsWorker) emitProgress(sessionID uuid.UUID, stageID string, progress int, message string) {
	// CRITICAL BUGFIX: Update SSE session AND persist to database so progress survives reconnections
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

// getOrGenerateHighlights retrieves existing highlights or generates new ones
func (w *StoryVideoStepsWorker) getOrGenerateHighlights(ctx context.Context, testimonialID uuid.UUID, stepCtx *StepContext) ([]*pb.HighlightMoment, error) {
	// Check for existing highlights
	artifacts, err := w.artifactsRepo.GetHighlights(ctx, testimonialID, w.db)
	if err == nil && len(artifacts) > 0 {
		// Use latest general highlights
		for i := range artifacts {
			a := &artifacts[i]
			if a.ProcessingType == "highlight_extraction" && a.Data != nil {
				if raw, ok := a.Data["highlights"]; ok {
					b, _ := json.Marshal(raw)
					var highlights []*pb.HighlightMoment
					if err := json.Unmarshal(b, &highlights); err == nil && len(highlights) > 0 {
						return highlights, nil
					}
				}
			}
		}
	}

	// Generate new highlights
	testimonialData, err := w.testimonialRepo.FetchForAIProcessing(ctx, testimonialID, w.db)
	if err != nil {
		return nil, err
	}

	if testimonialData.Content == nil || testimonialData.TranscriptSegments == nil {
		return nil, fmt.Errorf("testimonial content/transcript is nil")
	}

	highlightRequest := HighlightRequest{
		TestimonialID: testimonialID,
		Text:          *testimonialData.Content,
		Segments:      *testimonialData.TranscriptSegments,
		MaxHighlights: 5,
		HighlightType: HighlightTypeGeneral,
	}

	highlights, err := w.aiService.HighlightService.ExtractHighlightsByType(ctx, highlightRequest)
	if err != nil {
		return nil, err
	}

	// Save for future use
	artifact := &models.TestimonialArtifact{
		ID:             uuid.New(),
		TestimonialID:  &testimonialID,
		ProcessingType: "highlight_extraction",
		ResultCategory: "content",
		Data: models.JSONMap{
			"highlights":     highlights,
			"highlight_type": "general",
		},
		ContentType: "highlights",
		IsStreamed:  false,
	}

	_ = w.artifactsRepo.Create(ctx, artifact, w.db)

	return highlights, nil
}

// findClipInArtifacts searches for a clip by ID in testimonial's clipping artifacts
func (w *StoryVideoStepsWorker) findClipInArtifacts(ctx context.Context, testimonialID uuid.UUID, clipID string) (map[string]interface{}, error) {
	// Get all artifacts for this testimonial
	artifacts, err := w.artifactsRepo.GetByTestimonialID(ctx, testimonialID, w.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get artifacts: %w", err)
	}

	// Search through clipping artifacts
	for _, artifact := range artifacts {
		if artifact.ProcessingType != "smart_clipping" {
			continue
		}

		// Look for the clip in the artifact data
		// NOTE: generated_clips is a direct array, not an object with a clips property
		if clips, ok := artifact.Data["generated_clips"].([]interface{}); ok {
			for _, clipData := range clips {
				if clipMap, ok := clipData.(map[string]interface{}); ok {
					if clipMap["id"] == clipID {
						return clipMap, nil
					}
				}
			}
		}
	}

	return nil, fmt.Errorf("clip not found: %s", clipID)
}
