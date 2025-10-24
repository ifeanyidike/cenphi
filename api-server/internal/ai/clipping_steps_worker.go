package ai

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
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

// ClippingStepsWorker handles step-by-step clipping
type ClippingStepsWorker struct {
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

func NewClippingStepsWorker(
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
) *ClippingStepsWorker {
	return &ClippingStepsWorker{
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

// HandleGenerateHighlights generates highlights if they don't exist
func (w *ClippingStepsWorker) HandleGenerateHighlights(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	// PATH 1: Check if highlights were provided directly from frontend
	if highlightsData, ok := stepCtx.Config["highlights"]; ok {
		// Highlights already provided, just return them
		w.logger.Info("Using highlights provided from frontend",
			zap.String("session_id", stepCtx.SessionID.String()))

		highlightPreviews := highlightsData.([]interface{})

		return &StepResult{
			OutputArtifactURL:   "",
			PreviewURL:          nil,
			TempArtifactID:      nil,
			AppliedEnhancements: []string{"highlights_provided"},
			Metadata: map[string]interface{}{
				"highlights_count": len(highlightPreviews),
				"highlights":       highlightPreviews,
				"source":           "frontend_provided",
			},
		}, nil
	}

	// Check highlight type from config (default to "general")
	highlightType, ok := stepCtx.Config["highlight_type"].(string)
	if !ok || highlightType == "" {
		highlightType = "general"
	}

	w.logger.Info("Checking for existing highlights",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("highlight_type", highlightType),
		zap.String("testimonial_id", stepCtx.TestimonialID.String()))

	// PATH 2: Check if highlights already exist in artifacts DB
	artifacts, err := w.artifactsRepo.GetHighlights(ctx, stepCtx.TestimonialID, w.db)
	if err != nil {
		w.logger.Warn("Failed to check for existing highlights", zap.Error(err))
	}

	// Find the latest highlights artifact matching the requested type
	var latestArtifact *models.TestimonialArtifact
	for i := range artifacts {
		a := &artifacts[i]
		if a.ProcessingType == "highlight_extraction" {
			// Check if this artifact matches the requested highlight type
			if a.Data != nil {
				if typeVal, ok := a.Data["highlight_type"]; ok {
					if typeStr, ok := typeVal.(string); ok && typeStr == highlightType {
						if latestArtifact == nil || a.CreatedAt.After(latestArtifact.CreatedAt) {
							latestArtifact = a
						}
					}
				} else if highlightType == "general" {
					// If no type specified in artifact, assume it's general
					if latestArtifact == nil || a.CreatedAt.After(latestArtifact.CreatedAt) {
						latestArtifact = a
					}
				}
			}
		}
	}

	var existingHighlights []*pb.HighlightMoment
	if latestArtifact != nil && latestArtifact.Data != nil {
		if raw, ok := latestArtifact.Data["highlights"]; ok {
			b, err := json.Marshal(raw)
			if err == nil {
				if err := json.Unmarshal(b, &existingHighlights); err != nil {
					w.logger.Warn("Failed to unmarshal highlights from artifact", zap.Error(err))
				}
			}
		}
	}

	if len(existingHighlights) > 0 {
		// Highlights already exist, use them
		w.logger.Info("Found existing highlights",
			zap.String("highlight_type", highlightType),
			zap.Int("count", len(existingHighlights)))

		w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Using existing highlights...")

		// Convert to preview format
		highlightPreviews := make([]map[string]interface{}, len(existingHighlights))
		for i, hl := range existingHighlights {
			highlightPreviews[i] = map[string]interface{}{
				"id":                  hl.Id,
				"start_time":          hl.StartTime,
				"end_time":            hl.EndTime,
				"text":                hl.Text,
				"theme":               hl.Theme,
				"importance_score":    hl.ImportanceScore,
				"highlight_type":      hl.HighlightType,
				"suggested_title":     hl.SuggestedTitle,
				"emotional_intensity": hl.EmotionalIntensity,
			}
		}

		// Emit preview with existing highlights
		w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
			Type:      "preview_ready",
			SessionID: stepCtx.SessionID.String(),
			StageID:   &stepCtx.StageID,
			Timestamp: time.Now(),
			Preview: &sse.PreviewData{
				Type:    "json",
				Content: highlightPreviews,
				Quality: 1.0,
				StageID: stepCtx.StageID,
			},
			Data: map[string]interface{}{
				"highlights_count": len(existingHighlights),
				"highlight_type":   highlightType,
				"highlights":       highlightPreviews,
				"source":           "existing",
			},
		})

		return &StepResult{
			OutputArtifactURL:   "",
			PreviewURL:          nil,
			TempArtifactID:      nil,
			AppliedEnhancements: []string{"highlights_existing"},
			Metadata: map[string]interface{}{
				"highlights_count": len(existingHighlights),
				"highlight_type":   highlightType,
				"highlights":       highlightPreviews,
				"source":           "existing",
			},
		}, nil
	}

	// PATH 3: No existing highlights, generate new ones
	// Get testimonial data for generating highlights
	testimonialData, err := w.testimonialRepo.FetchForAIProcessing(ctx, stepCtx.TestimonialID, w.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch testimonial: %w", err)
	}

	if testimonialData.Content == nil || testimonialData.TranscriptSegments == nil {
		return nil, fmt.Errorf("testimonial content/transcript is nil; cannot extract highlights")
	}

	// Generate highlights using ExtractHighlightsByType
	highlightRequest := HighlightRequest{
		TestimonialID: stepCtx.TestimonialID,
		Text:          *testimonialData.Content,
		Segments:      *testimonialData.TranscriptSegments,
		MaxHighlights: 5,
		HighlightType: HighlightType(highlightType),
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Generating new "+highlightType+" highlight moments...")

	highlightResult, err := w.aiService.HighlightService.ExtractHighlightsByType(ctx, highlightRequest)
	if err != nil {
		return nil, fmt.Errorf("highlight generation failed: %w", err)
	}

	// Save highlights to artifacts DB
	artifact := &models.TestimonialArtifact{
		ID:             uuid.New(),
		TestimonialID:  &stepCtx.TestimonialID,
		WorkspaceID:    stepCtx.WorkspaceID,
		ProcessingType: "highlight_extraction",
		ResultCategory: "content",
		Data: models.JSONMap{
			"highlights":     highlightResult,
			"highlight_type": highlightType,
		},
		ContentType: "highlights",
		IsStreamed:  false,
	}

	if err := w.artifactsRepo.Create(ctx, artifact, w.db); err != nil {
		w.logger.Warn("Failed to save highlights artifact", zap.Error(err))
		// Continue anyway, highlights are still in memory
	}

	// Convert highlights to preview format
	highlightPreviews := make([]map[string]interface{}, len(highlightResult))
	for i, hl := range highlightResult {
		highlightPreviews[i] = map[string]interface{}{
			"id":                  hl.Id,
			"start_time":          hl.StartTime,
			"end_time":            hl.EndTime,
			"text":                hl.Text,
			"theme":               hl.Theme,
			"importance_score":    hl.ImportanceScore,
			"highlight_type":      hl.HighlightType,
			"suggested_title":     hl.SuggestedTitle,
			"emotional_intensity": hl.EmotionalIntensity,
		}
	}

	// Emit preview with generated highlights
	w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "preview_ready",
		SessionID: stepCtx.SessionID.String(),
		StageID:   &stepCtx.StageID,
		Timestamp: time.Now(),
		Preview: &sse.PreviewData{
			Type:    "json",
			Content: highlightPreviews,
			Quality: 1.0,
			StageID: stepCtx.StageID,
		},
		Data: map[string]interface{}{
			"highlights_count": len(highlightResult),
			"highlight_type":   highlightType,
			"highlights":       highlightPreviews,
			"source":           "generated",
		},
	})

	return &StepResult{
		OutputArtifactURL:   "",
		PreviewURL:          nil,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"generate_highlights"},
		Metadata: map[string]interface{}{
			"highlights_count": len(highlightResult),
			"highlight_type":   highlightType,
			"highlights":       highlightPreviews,
			"source":           "generated",
		},
	}, nil
}

// HandleExtractClips extracts clips based on highlights
func (w *ClippingStepsWorker) HandleExtractClips(ctx context.Context, stepCtx *StepContext) (*StepResult, error) {
	w.logger.Info("HandleExtractClips called",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.String("testimonial_id", stepCtx.TestimonialID.String()),
		zap.Int("config_keys", len(stepCtx.Config)))

	// Get highlights from previous step or config
	var pbHighlights []*pb.HighlightMoment

	// Option 1: Check for moments from frontend (NEW: moment-based workflow)
	if momentsData, ok := stepCtx.Config["moments"]; ok {
		w.logger.Info("Found moments in config (new moment-based workflow)",
			zap.String("type", fmt.Sprintf("%T", momentsData)))

		if momentsSlice, ok := momentsData.([]interface{}); ok {
			w.logger.Info("Converting frontend moments to highlights", zap.Int("count", len(momentsSlice)))

			for _, momentData := range momentsSlice {
				if momentMap, ok := momentData.(map[string]interface{}); ok {
					// Convert moment to HighlightMoment protobuf
					highlight := &pb.HighlightMoment{
						Id:              getStringValue(momentMap, "id"),
						StartTime:       getFloat64Value(momentMap, "start_time"),
						EndTime:         getFloat64Value(momentMap, "end_time"),
						Text:            getStringValue(momentMap, "text"),
						Theme:           getStringValue(momentMap, "theme"),
						ImportanceScore: getFloat64Value(momentMap, "importance_score"),
						EngagementScore: getFloat64Value(momentMap, "engagement_score"),
						HighlightType:   getStringValue(momentMap, "type"),
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

					pbHighlights = append(pbHighlights, highlight)
				}
			}

			w.logger.Info("Converted moments to highlights",
				zap.Int("count", len(pbHighlights)))
		}
	} else if highlightsData, ok := stepCtx.Config["highlights"]; ok {
		// Option 2: Legacy highlights format
		w.logger.Info("Found highlights in config", zap.String("type", fmt.Sprintf("%T", highlightsData)))

		// Highlights passed from previous step or frontend
		if highlightsSlice, ok := highlightsData.([]interface{}); ok {
			w.logger.Info("Highlights is a slice", zap.Int("length", len(highlightsSlice)))

			for _, hlData := range highlightsSlice {
				if hlMap, ok := hlData.(map[string]interface{}); ok {
					hl := &pb.HighlightMoment{
						Id:        getStringValue(hlMap, "id"),
						StartTime: getFloat64Value(hlMap, "start_time"),
						EndTime:   getFloat64Value(hlMap, "end_time"),
						Text:      getStringValue(hlMap, "text"),
						Theme:     getStringValue(hlMap, "theme"),
					}
					pbHighlights = append(pbHighlights, hl)
				}
			}
		} else {
			w.logger.Warn("Highlights is not a slice", zap.String("type", fmt.Sprintf("%T", highlightsData)))
		}
	} else {
		w.logger.Warn("No highlights found in config",
			zap.Strings("config_keys", getMapKeys(stepCtx.Config)))
	}

	if len(pbHighlights) == 0 {
		w.logger.Error("No highlights available for clipping",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Int("config_size", len(stepCtx.Config)))
		return nil, fmt.Errorf("no highlights available for clipping - run generate_highlights first or provide highlights")
	}

	w.logger.Info("Successfully parsed highlights for clipping", zap.Int("count", len(pbHighlights)))

	// Filter highlights based on min_clip_duration and max_clips settings
	filteredHighlights := w.filterHighlightsByDurationAndLimit(pbHighlights, stepCtx.Config)

	if len(filteredHighlights) == 0 {
		w.logger.Warn("No highlights met the filtering criteria",
			zap.String("session_id", stepCtx.SessionID.String()),
			zap.Int("original_count", len(pbHighlights)))
		return nil, fmt.Errorf("no highlights met the minimum duration requirement")
	}

	if len(filteredHighlights) < len(pbHighlights) {
		w.logger.Info("Filtered highlights",
			zap.Int("original_count", len(pbHighlights)),
			zap.Int("filtered_count", len(filteredHighlights)))
	}

	pbHighlights = filteredHighlights

	w.logger.Info("Extracting clips",
		zap.String("session_id", stepCtx.SessionID.String()),
		zap.Int("highlights_count", len(pbHighlights)),
		zap.String("testimonial_id", stepCtx.TestimonialID.String()))

	// ========== PRE-GENERATION CHECK: Check for existing clips BEFORE calling AI service ==========
	// This prevents generating clips that already exist, saving time and resources
	highlightType := "general" // default
	if ht, ok := stepCtx.Config["highlight_type"].(string); ok && ht != "" {
		highlightType = ht
	}

	w.logger.Info("Checking for existing clips before generation",
		zap.String("highlight_type", highlightType),
		zap.String("testimonial_id", stepCtx.TestimonialID.String()))

	// Get existing artifacts for this testimonial
	artifacts, err := w.artifactsRepo.GetByTestimonialID(ctx, stepCtx.TestimonialID, w.db)
	if err != nil {
		w.logger.Warn("Failed to check for existing clips", zap.Error(err))
		// Continue anyway - we'll just generate all clips
	}

	// Find existing clips artifact for this highlight type
	var existingClipIDs map[string]bool
	var existingClipsCount int
	var existingClips []map[string]interface{} // Declare here so it's available outside loop
	existingClipIDs = make(map[string]bool)

	for i := range artifacts {
		if artifacts[i].ProcessingType == "clipping" && artifacts[i].ResultCategory == highlightType {
			// Extract existing clip IDs from generated_clips
			if genClips, ok := artifacts[i].Data["generated_clips"]; ok {
				w.logger.Info("Found existing clips artifact",
					zap.String("artifact_id", artifacts[i].ID.String()),
					zap.String("result_category", artifacts[i].ResultCategory))

				// Parse existing clips - handle both []interface{} and []map[string]interface{}
				switch v := genClips.(type) {
				case []interface{}:
					for _, item := range v {
						if clipMap, ok := item.(map[string]interface{}); ok {
							existingClips = append(existingClips, clipMap)
						}
					}
				case []map[string]interface{}:
					existingClips = v
				default:
					// Try JSON round-trip as fallback
					clipsJSON, err := json.Marshal(genClips)
					if err == nil {
						json.Unmarshal(clipsJSON, &existingClips)
					}
				}

				// Build map of existing clip IDs
				// CRITICAL: Clip ID = Highlight ID (set in AI service), so we can compare directly
				for _, clip := range existingClips {
					if clipID, ok := clip["id"].(string); ok && clipID != "" {
						existingClipIDs[clipID] = true
						existingClipsCount++
					}
				}

				w.logger.Info("Extracted existing clip IDs (which are highlight IDs)",
					zap.Int("count", existingClipsCount),
					zap.Strings("clip_ids", getMapStringKeys(existingClipIDs)))
			}
			break // Found the artifact for this highlight type
		}
	}

	// Filter highlights to only include those without existing clips
	var newHighlights []*pb.HighlightMoment
	var alreadyExistingHighlights []*pb.HighlightMoment

	for _, hl := range pbHighlights {
		if existingClipIDs[hl.Id] {
			alreadyExistingHighlights = append(alreadyExistingHighlights, hl)
		} else {
			newHighlights = append(newHighlights, hl)
		}
	}

	w.logger.Info("Pre-generation check complete",
		zap.Int("total_requested", len(pbHighlights)),
		zap.Int("already_exist", len(alreadyExistingHighlights)),
		zap.Int("need_to_generate", len(newHighlights)))

	// Notify user about existing clips via SSE with detailed clip information
	if len(alreadyExistingHighlights) > 0 {
		// Build detailed information about existing clips
		existingClipDetails := make([]map[string]interface{}, 0, len(alreadyExistingHighlights))

		// Re-scan existing clips to find URLs for the existing highlights
		// Since clip.id = highlight.id, we can match directly
		for _, hl := range alreadyExistingHighlights {
			for _, clip := range existingClips {
				if clipID, ok := clip["id"].(string); ok && clipID == hl.Id {
					clipDetail := map[string]interface{}{
						"id":       clip["id"],
						"title":    clip["title"],
						"url":      clip["url"],
						"theme":    clip["theme"],
						"duration": clip["duration"],
					}
					existingClipDetails = append(existingClipDetails, clipDetail)
					break
				}
			}
		}

		message := fmt.Sprintf("%d clip(s) already exist for this highlight type. Proceeding with %d new clip(s).",
			len(alreadyExistingHighlights), len(newHighlights))

		if len(newHighlights) == 0 {
			message = fmt.Sprintf("All %d requested clips have already been generated. You can view them in the clips tab.",
				len(alreadyExistingHighlights))
		}

		stageID := stepCtx.StageID
		w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
			Type:      "clips_already_exist",
			SessionID: stepCtx.SessionID.String(),
			StageID:   &stageID,
			Timestamp: time.Now(),
			Data: map[string]interface{}{
				"existing_count":    len(alreadyExistingHighlights),
				"new_count":         len(newHighlights),
				"total_requested":   len(pbHighlights),
				"message":           message,
				"existing_clips":    existingClipDetails, // Full clip details with URLs
				"highlight_type":    highlightType,
				"show_clips_button": true, // Signal frontend to show "View Existing Clips" button
			},
		})

		w.logger.Info("Emitted clips_already_exist notification",
			zap.Int("existing_count", len(alreadyExistingHighlights)),
			zap.Int("new_count", len(newHighlights)))
	}

	// If all clips exist, skip generation BUT still emit preview_ready events for existing clips
	// This allows the frontend to display them for user acceptance/saving
	if len(newHighlights) == 0 {
		w.logger.Info("All clips already exist, emitting previews for existing clips",
			zap.Int("existing_count", len(alreadyExistingHighlights)))

		w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, "Loading existing clips...")

		// Emit preview_ready events for each existing clip
		stageID := stepCtx.StageID
		for i, clip := range existingClips {
			// Only emit for clips that match the requested highlights
			clipID, ok := clip["id"].(string)
			if !ok {
				continue
			}

			// Check if this clip is one of the requested highlights
			isRequested := false
			for _, hl := range alreadyExistingHighlights {
				if hl.Id == clipID {
					isRequested = true
					break
				}
			}

			if !isRequested {
				continue // Skip clips that weren't requested
			}

			w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
				ID:        fmt.Sprintf("event_%d_%d", time.Now().UnixNano(), i),
				Type:      "preview_ready",
				SessionID: stepCtx.SessionID.String(),
				JobID:     stepCtx.SessionID.String(),
				StageID:   &stageID,
				Timestamp: time.Now(),
				Preview: &sse.PreviewData{
					Type:       "video",
					Content:    getStringValue(clip, "url"),
					PreviewURL: getStringValue(clip, "url"),
					URL:        getStringValue(clip, "url"),
					Quality:    1.0,
					StageID:    stepCtx.StageID,
					Metadata: map[string]interface{}{
						"duration": getFloat64Value(clip, "duration"),
						"size":     getFloat64Value(clip, "size"),
					},
				},
				Data: map[string]interface{}{
					"clip_index":     i,
					"clip_id":        clipID,
					"clip_title":     getStringValue(clip, "title"),
					"duration":       getFloat64Value(clip, "duration"),
					"total_clips":    len(alreadyExistingHighlights),
					"from_existing":  true, // Flag to indicate this is an existing clip
				},
			})

			w.logger.Info("Emitted preview_ready event for existing clip",
				zap.Int("clip_index", i),
				zap.String("clip_id", clipID),
				zap.String("clip_url", getStringValue(clip, "url")))
		}

		w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 100, "All clips loaded")

		// Convert existing clips to preview format for metadata with proper flag
		clipPreviews := make([]map[string]interface{}, 0, len(alreadyExistingHighlights))
		for _, clip := range existingClips {
			clipID, ok := clip["id"].(string)
			if !ok {
				continue
			}

			// Only include clips that were requested
			isRequested := false
			for _, hl := range alreadyExistingHighlights {
				if hl.Id == clipID {
					isRequested = true
					break
				}
			}

			if isRequested {
				// Mark existing clips with a flag for frontend filtering
				existingClip := make(map[string]interface{})
				for k, v := range clip {
					existingClip[k] = v
				}
				existingClip["existing_artifact"] = true // ✅ Flag for frontend to identify existing clips
				clipPreviews = append(clipPreviews, existingClip)
			}
		}

		// Return metadata with existing clips
		return &StepResult{
			OutputArtifactURL:   "",
			PreviewURL:          nil,
			TempArtifactID:      nil,
			AppliedEnhancements: []string{"clips_already_exist"},
			Metadata: map[string]interface{}{
				"clips_count":        len(clipPreviews),
				"clips":              clipPreviews, // ✅ Return existing clips data
				"existing_count":     len(alreadyExistingHighlights),
				"skipped_generation": true,
				"message":            "All requested clips have already been generated",
				"highlight_type":     highlightType,
				"clips_are_new":      false, // ✅ Flag to indicate these are existing clips
				"clips_source":       "existing",
			},
		}, nil
	}

	// Update pbHighlights to only include new clips that need to be generated
	pbHighlights = newHighlights
	w.logger.Info("Proceeding with generation of new clips only",
		zap.Int("clips_to_generate", len(pbHighlights)))

	// Get brand context
	brandContext, err := w.workspaceRepo.GetPbBrandContext(ctx, stepCtx.WorkspaceID, w.db)
	if err != nil {
		w.logger.Warn("Failed to get brand context", zap.Error(err))
		brandContext = &pb.BrandContext{}
	}

	// BUGFIX #15: Safe map access with default value
	primaryColor := ""
	if brandContext.BrandColors != nil {
		if color, ok := brandContext.BrandColors["primary"]; ok {
			primaryColor = color
		}
	}

	// Build clipping request
	pbReq := &pb.ClippingRequest{
		TestimonialId:    stepCtx.TestimonialID.String(),
		MediaUrl:         stepCtx.CurrentArtifactURL,
		HighlightMoments: pbHighlights,
		Branding: &pb.BrandingOptions{
			LogoUrl:    brandContext.LogoUrl,
			BrandColor: primaryColor,
		},
		JobId:     stepCtx.SessionID.String(),
		SessionId: stepCtx.SessionID.String(), // Add session ID for temp storage paths
	}

	w.emitProgress(stepCtx.SessionID, stepCtx.StageID, 50, fmt.Sprintf("Extracting %d clips...", len(pbHighlights)))

	// Call AI service to generate NEW clips only
	response, err := w.mediaIntelligence.GenerateClips(ctx, pbReq)
	if err != nil {
		return nil, fmt.Errorf("clip extraction failed: %w", err)
	}

	// CRITICAL DEBUG: Log response details to diagnose missing clips
	w.logger.Info("🔍 AI service response received",
		zap.Int("clips_count", len(response.Clips)),
		zap.String("detection_method", response.DetectionMethod),
		zap.Float64("average_quality", response.AverageQuality))

	if len(response.Clips) == 0 {
		w.logger.Error("❌ AI service returned ZERO clips even though it should have generated clips",
			zap.Int("highlights_sent", len(pbHighlights)),
			zap.String("testimonial_id", stepCtx.TestimonialID.String()))
		return nil, fmt.Errorf("AI service returned no clips - expected %d clips", len(pbHighlights))
	}

	// Log details of each clip
	for i, clip := range response.Clips {
		w.logger.Info("📹 Clip received from AI service",
			zap.Int("index", i),
			zap.String("clip_id", clip.Id),
			zap.String("url", clip.Url),
			zap.String("title", clip.Title),
			zap.Float64("duration", clip.Duration))
	}

	// Convert NEW clips to preview format
	clipPreviews := make([]map[string]interface{}, len(response.Clips))
	for i, clip := range response.Clips {
		// Find the corresponding highlight to get engagement_score
		var engagementScore float64 = 0.8 // Default fallback
		for _, hl := range pbHighlights {
			if hl.Id == clip.HighlightId {
				engagementScore = hl.EngagementScore
				break
			}
		}

		clipPreviews[i] = map[string]interface{}{
			"id":               clip.Id,
			"url":              clip.Url,
			"start_time":       clip.StartTime,
			"end_time":         clip.EndTime,
			"title":            clip.Title,
			"text":             clip.Text,
			"theme":            clip.Theme,
			"duration":         clip.Duration,
			"size":             clip.Size,
			"highlight_id":     clip.HighlightId,     // CRITICAL: Store highlight ID for tracking
			"engagement_score": engagementScore,      // CRITICAL: Add engagement score from highlight
		}

		// Emit individual clip preview for NEW clips
		stageID := stepCtx.StageID
		w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
			ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
			Type:      "preview_ready",
			SessionID: stepCtx.SessionID.String(),
			JobID:     stepCtx.SessionID.String(),
			StageID:   &stageID,
			Timestamp: time.Now(),
			Preview: &sse.PreviewData{
				Type:       "video",
				Content:    clip.Url,
				PreviewURL: clip.Url,
				URL:        clip.Url,
				Quality:    1.0,
				StageID:    stepCtx.StageID,
				Metadata: map[string]interface{}{
					"duration": clip.Duration,
					"size":     clip.Size,
				},
			},
			Data: map[string]interface{}{
				"clip_index":    i,
				"clip_id":       clip.Id,
				"clip_title":    clip.Title,
				"duration":      clip.Duration,
				"total_clips":   len(response.Clips) + len(alreadyExistingHighlights),
				"from_existing": false, // Flag to indicate this is a NEW clip
			},
		})

		w.logger.Info("Emitted preview_ready event for NEW clip",
			zap.Int("clip_index", i),
			zap.String("clip_id", clip.Id),
			zap.String("clip_url", clip.Url))
	}

	// ✅ ALSO emit preview_ready events for existing clips (if any)
	// This ensures the frontend shows ALL clips (both new and existing) for user acceptance
	if len(alreadyExistingHighlights) > 0 {
		w.logger.Info("Emitting preview_ready events for existing clips in mixed scenario",
			zap.Int("existing_count", len(alreadyExistingHighlights)))

		stageID := stepCtx.StageID
		for i, clip := range existingClips {
			clipID, ok := clip["id"].(string)
			if !ok {
				continue
			}

			// Only emit for clips that were requested
			isRequested := false
			for _, hl := range alreadyExistingHighlights {
				if hl.Id == clipID {
					isRequested = true
					break
				}
			}

			if !isRequested {
				continue
			}

			w.sseManager.BroadcastStudioEvent(sse.StudioEvent{
				ID:        fmt.Sprintf("event_%d_%d", time.Now().UnixNano(), i),
				Type:      "preview_ready",
				SessionID: stepCtx.SessionID.String(),
				JobID:     stepCtx.SessionID.String(),
				StageID:   &stageID,
				Timestamp: time.Now(),
				Preview: &sse.PreviewData{
					Type:       "video",
					Content:    getStringValue(clip, "url"),
					PreviewURL: getStringValue(clip, "url"),
					URL:        getStringValue(clip, "url"),
					Quality:    1.0,
					StageID:    stepCtx.StageID,
					Metadata: map[string]interface{}{
						"duration": getFloat64Value(clip, "duration"),
						"size":     getFloat64Value(clip, "size"),
					},
				},
				Data: map[string]interface{}{
					"clip_index":    i + len(response.Clips), // Offset by new clips count
					"clip_id":       clipID,
					"clip_title":    getStringValue(clip, "title"),
					"duration":      getFloat64Value(clip, "duration"),
					"total_clips":   len(response.Clips) + len(alreadyExistingHighlights),
					"from_existing": true, // Flag to indicate this is an EXISTING clip
				},
			})

			w.logger.Info("Emitted preview_ready event for EXISTING clip in mixed scenario",
				zap.Int("clip_index", i),
				zap.String("clip_id", clipID),
				zap.String("clip_url", getStringValue(clip, "url")))
		}
	}

	// Combine new clips + existing clips for complete metadata
	allClips := make([]map[string]interface{}, 0, len(clipPreviews)+len(alreadyExistingHighlights))
	allClips = append(allClips, clipPreviews...) // Add new clips first

	// Add existing clips with proper flag
	for _, clip := range existingClips {
		clipID, ok := clip["id"].(string)
		if !ok {
			continue
		}

		// Only include clips that were requested
		isRequested := false
		for _, hl := range alreadyExistingHighlights {
			if hl.Id == clipID {
				isRequested = true
				break
			}
		}

		if isRequested {
			// Mark existing clips with a flag for frontend filtering
			existingClip := make(map[string]interface{})
			for k, v := range clip {
				existingClip[k] = v
			}
			existingClip["existing_artifact"] = true // ✅ Flag for frontend to identify existing clips
			allClips = append(allClips, existingClip)
		}
	}

	// Determine clip source and scenario
	hasNewClips := len(response.Clips) > 0
	hasExistingClips := len(alreadyExistingHighlights) > 0
	isMixedScenario := hasNewClips && hasExistingClips

	var clipsSource string
	if isMixedScenario {
		clipsSource = "mixed"
	} else if hasNewClips {
		clipsSource = "new"
	} else {
		clipsSource = "existing"
	}

	return &StepResult{
		OutputArtifactURL:   "", // Multiple clips, not a single artifact
		PreviewURL:          nil,
		TempArtifactID:      nil,
		AppliedEnhancements: []string{"extract_clips"},
		Metadata: map[string]interface{}{
			"clips_count":          len(allClips),                   // Total clips (new + existing)
			"new_clips_count":      len(response.Clips),             // New clips generated
			"existing_clips_count": len(alreadyExistingHighlights),  // Existing clips loaded
			"clips":                allClips,                        // Combined clips array
			"detection_method":     response.DetectionMethod,
			"average_quality":      response.AverageQuality,
			"highlight_type":       highlightType,
			"clips_are_new":        hasNewClips && !hasExistingClips, // ✅ FIXED: Only true if ALL clips are new
			"has_mixed_clips":      isMixedScenario,                  // ✅ NEW: Flag for mixed scenario
			"clips_source":         clipsSource,                      // ✅ "new", "existing", or "mixed"
		},
	}, nil
}

// Helper methods

func (w *ClippingStepsWorker) emitProgress(sessionID uuid.UUID, stageID string, progress int, message string) {
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

// Helper functions for type assertions
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func getMapStringKeys(m map[string]bool) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func getStringValue(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getFloat64Value(m map[string]interface{}, key string) float64 {
	if val, ok := m[key]; ok {
		switch v := val.(type) {
		case float64:
			return v
		case float32:
			return float64(v)
		case int:
			return float64(v)
		case int64:
			return float64(v)
		}
	}
	return 0.0
}

// filterHighlightsByDurationAndLimit filters highlights based on minimum duration and maximum count
// Returns highlights sorted by importance score (highest first) and limited to max_clips
func (w *ClippingStepsWorker) filterHighlightsByDurationAndLimit(
	highlights []*pb.HighlightMoment,
	config map[string]interface{},
) []*pb.HighlightMoment {
	// Get min_clip_duration from config (in seconds)
	// If nil or not set, accept all durations
	var minDurationMs float64
	if minDuration, ok := config["min_clip_duration"]; ok && minDuration != nil {
		switch v := minDuration.(type) {
		case float64:
			minDurationMs = v * 1000 // Convert seconds to milliseconds
		case int:
			minDurationMs = float64(v) * 1000
		case int64:
			minDurationMs = float64(v) * 1000
		}
	}

	// Get max_clips from config
	// If nil or not set, accept all clips
	var maxClips int
	hasMaxClips := false
	if maxClipsVal, ok := config["max_clips"]; ok && maxClipsVal != nil {
		hasMaxClips = true
		switch v := maxClipsVal.(type) {
		case float64:
			maxClips = int(v)
		case int:
			maxClips = v
		case int64:
			maxClips = int(v)
		}
	}

	w.logger.Info("Filtering highlights",
		zap.Float64("min_duration_ms", minDurationMs),
		zap.Int("max_clips", maxClips),
		zap.Bool("has_max_clips", hasMaxClips),
		zap.Int("input_count", len(highlights)))

	// Step 1: Filter by minimum duration
	var filtered []*pb.HighlightMoment
	for _, hl := range highlights {
		duration := hl.EndTime - hl.StartTime // Already in milliseconds
		if minDurationMs > 0 && duration < minDurationMs {
			w.logger.Debug("Filtered out highlight due to duration",
				zap.Float64("duration_ms", duration),
				zap.Float64("min_duration_ms", minDurationMs),
				zap.String("text", hl.Text))
			continue
		}
		filtered = append(filtered, hl)
	}

	w.logger.Info("After duration filtering",
		zap.Int("count", len(filtered)),
		zap.Int("removed", len(highlights)-len(filtered)))

	// Step 2: Sort by importance score (highest first)
	// Use importance_score if available, otherwise use engagement_score
	type scoredHighlight struct {
		highlight *pb.HighlightMoment
		score     float64
	}

	scored := make([]scoredHighlight, len(filtered))
	for i, hl := range filtered {
		score := hl.ImportanceScore
		if score == 0 {
			// Fallback to engagement score if importance score is not set
			score = 0.5 // Default medium score
		}
		scored[i] = scoredHighlight{highlight: hl, score: score}
	}

	// Sort by score descending
	for i := 0; i < len(scored); i++ {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].score > scored[i].score {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}

	// Step 3: Limit to max_clips (take top N)
	result := make([]*pb.HighlightMoment, 0, len(scored))
	for i, sh := range scored {
		if hasMaxClips && i >= maxClips {
			w.logger.Debug("Reached max clips limit",
				zap.Int("max_clips", maxClips),
				zap.Int("total_available", len(scored)))
			break
		}
		result = append(result, sh.highlight)
	}

	w.logger.Info("Final filtered highlights",
		zap.Int("count", len(result)),
		zap.Int("original_count", len(highlights)))

	return result
}
