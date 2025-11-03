package controllers

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

// SaveStageResult saves a specific stage's result to permanent storage
// This allows users to save individual stages without finalizing the entire session
func (c StudioController) SaveStageResult(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	stageIDStr := chi.URLParam(r, "stageID")

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	c.logger.Info("🔍 [SAVE-STAGE] Saving individual stage result",
		zap.String("session_id", sessionIDStr),
		zap.String("stage_id", stageIDStr))

	// Get session from database
	session, err := c.sessionRepo.GetByID(r.Context(), sessionID, c.db)
	if err != nil {
		c.logger.Error("🚨 [SAVE-STAGE] Failed to get session", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "session not found")
		return
	}

	// Note: testimonial_id may be nil for multi-testimonial story video sessions
	// We'll handle both cases appropriately
	if session.TestimonialID == nil {
		c.logger.Warn("⚠️  [SAVE-STAGE] Session has no testimonial_id (multi-testimonial session?)",
			zap.String("session_id", sessionIDStr),
			zap.String("session_type", session.SessionType))
	}

	// Get the specific stage
	stage, err := c.stageRepo.GetBySessionAndStageID(r.Context(), sessionID, stageIDStr, c.db)
	if err != nil {
		c.logger.Error("🚨 [SAVE-STAGE] Failed to get stage", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "stage not found")
		return
	}

	// Verify stage has completed successfully
	if stage.Status != models.StageStatusCompleted &&
		stage.Status != models.StageStatusAccepted &&
		stage.Status != models.StageStatusReviewing {
		c.logger.Warn("🚨 [SAVE-STAGE] Stage is not in saveable state",
			zap.String("stage_id", stageIDStr),
			zap.String("status", string(stage.Status)))
		utils.RespondWithError(w, http.StatusBadRequest,
			fmt.Sprintf("stage must be completed, accepted, or reviewing (current: %s)", stage.Status))
		return
	}

	// Verify stage has an artifact URL
	if stage.Message == nil || *stage.Message == "" {
		c.logger.Warn("🚨 [SAVE-STAGE] Stage has no artifact URL",
			zap.String("stage_id", stageIDStr))
		utils.RespondWithError(w, http.StatusBadRequest, "stage has no artifact to save")
		return
	}

	artifactURL := *stage.Message

	c.logger.Info("🔍 [SAVE-STAGE] Stage has artifact",
		zap.String("stage_id", stageIDStr),
		zap.String("artifact_url", artifactURL),
		zap.Bool("is_temp_path", strings.Contains(artifactURL, "/temp/")))

	// Copy temp file to permanent storage if needed
	if strings.Contains(artifactURL, "/temp/") {
		c.logger.Info("🔄 [SAVE-STAGE] Copying temp artifact to permanent storage",
			zap.String("stage_id", stageIDStr),
			zap.String("temp_url", artifactURL))

		// For multi-testimonial sessions, use workspace_id as the base path
		// For single-testimonial sessions, use testimonial_id
		var baseID uuid.UUID
		if session.TestimonialID != nil {
			baseID = *session.TestimonialID
		} else {
			// Use workspace_id for multi-testimonial sessions
			baseID = session.WorkspaceID
			c.logger.Info("🔍 [SAVE-STAGE] Using workspace_id as base path (no testimonial_id)",
				zap.String("workspace_id", session.WorkspaceID.String()))
		}

		permanentURL, err := c.tempStorageService.CopyToPermanentStorage(r.Context(), artifactURL, baseID)
		if err != nil {
			c.logger.Error("🚨 [SAVE-STAGE] Failed to copy to permanent storage",
				zap.Error(err),
				zap.String("stage_id", stageIDStr),
				zap.String("temp_url", artifactURL))
			utils.RespondWithError(w, http.StatusInternalServerError,
				fmt.Sprintf("failed to copy artifact to permanent storage: %v", err))
			return
		}
		artifactURL = permanentURL
		c.logger.Info("✅ [SAVE-STAGE] Successfully copied to permanent storage",
			zap.String("stage_id", stageIDStr),
			zap.String("permanent_url", permanentURL))
	}

	// Extract text content if this is optimize_text stage
	var textContent *string
	if stage.StageID == "optimize_text" && stage.Metadata != nil {
		if optimizedText, ok := stage.Metadata["optimized_text"].(string); ok && optimizedText != "" {
			textContent = &optimizedText
			c.logger.Info("🔍 [SAVE-STAGE] Found optimized text content",
				zap.Int("text_length", len(optimizedText)))
		}
	}

	// Prepare processing metadata
	processingMetadata := models.JSONMap{
		"session_type":  session.SessionType,
		"session_id":    sessionID.String(),
		"stage_id":      stageIDStr,
		"stage_name":    stage.StageName,
		"saved_from_ui": true, // Mark as individually saved
		"saved_at":      time.Now().Format(time.RFC3339),
	}

	// Extract platform and aspect_ratio from stage metadata
	var platformStr *string
	var aspectRatio string

	if stage.Metadata != nil {
		// Look for platform in metadata (from crop_resize or other stages)
		if platform, ok := stage.Metadata["platform"].(string); ok && platform != "" {
			platformStr = &platform
			c.logger.Info("🔍 [SAVE-STAGE] Found platform in stage metadata",
				zap.String("platform", platform))
		}

		// Look for aspect_ratio in metadata (from crop_resize)
		if ar, ok := stage.Metadata["aspect_ratio"].(string); ok && ar != "" {
			aspectRatio = ar
			c.logger.Info("🔍 [SAVE-STAGE] Found aspect_ratio in stage metadata",
				zap.String("aspect_ratio", ar))
		}
	}

	// If no platform found yet, try to get it from crop_resize stage metadata
	if platformStr == nil {
		cropStage, err := c.stageRepo.GetBySessionAndStageID(r.Context(), sessionID, "crop_resize", c.db)
		if err == nil && cropStage != nil && cropStage.Metadata != nil {
			if platform, ok := cropStage.Metadata["platform"].(string); ok && platform != "" {
				platformStr = &platform
				c.logger.Info("🔍 [SAVE-STAGE] Found platform in crop_resize stage",
					zap.String("platform", platform))
			}
			if ar, ok := cropStage.Metadata["aspect_ratio"].(string); ok && ar != "" && aspectRatio == "" {
				aspectRatio = ar
				c.logger.Info("🔍 [SAVE-STAGE] Found aspect_ratio in crop_resize stage",
					zap.String("aspect_ratio", ar))
			}
		}
	}

	// Default aspect ratio to 16:9 if not found
	if aspectRatio == "" {
		aspectRatio = "16:9"
		c.logger.Info("🔍 [SAVE-STAGE] Defaulting aspect_ratio to 16:9")
	}

	// Add aspect_ratio to processing metadata
	processingMetadata["aspect_ratio"] = aspectRatio

	// Add stage metadata if available
	if stage.Metadata != nil {
		for k, v := range stage.Metadata {
			// Skip large fields like clips array
			if k != "clips" && k != "clip_data" {
				processingMetadata[k] = v
			}
		}
	}

	// Add text optimization metadata if available
	if textContent != nil {
		if stage.Metadata != nil {
			if hashtags, ok := stage.Metadata["hashtags"]; ok {
				processingMetadata["hashtags"] = hashtags
			}
			if platform, ok := stage.Metadata["platform"]; ok {
				processingMetadata["platform"] = platform
			}
			if optimalTiming, ok := stage.Metadata["optimal_timing"]; ok {
				processingMetadata["optimal_timing"] = optimalTiming
			}
			if specs, ok := stage.Metadata["specifications"]; ok {
				processingMetadata["specifications"] = specs
			}
		}
	}

	// Determine correct processing type
	// Map session types to artifact processing types
	processingType := session.SessionType
	switch processingType {
	case "platform_optimization":
		processingType = "video_platform_optimization"
	case "story_video":
		processingType = "story_mode_generation"
	case "clipping":
		// clipping stays as "clipping"
	default:
		c.logger.Warn("🔍 [SAVE-STAGE] Unknown session type, using as-is",
			zap.String("session_type", session.SessionType))
	}

	// Determine result category and content type
	resultCategory := "processed_video"
	contentType := "video/mp4"
	var assetURLPtr *string

	if artifactURL != "" {
		assetURLPtr = &artifactURL
	}

	// If this is text-only optimization (no video artifact)
	if textContent != nil && artifactURL == "" {
		resultCategory = "text_optimization"
		contentType = "text/plain"
	}

	// Extract metadata for video artifacts (duration + thumbnail uploaded to OCI)
	var duration *float64
	var thumbnailURL *string

	if artifactURL != "" && contentType == "video/mp4" {
		// Use background context with custom timeout for thumbnail extraction
		thumbnailCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		metadata, err := utils.ExtractVideoMetadataWithOCI(thumbnailCtx, artifactURL, session.WorkspaceID.String(), c.storageProvider)
		if err != nil {
			c.logger.Warn("Failed to extract video metadata for stage save",
				zap.Error(err),
				zap.String("artifact_url", artifactURL))
		} else {
			duration = &metadata.Duration
			thumbnailURL = &metadata.ThumbnailURL
			c.logger.Info("✅ [SAVE-STAGE] Extracted video metadata",
				zap.Float64("duration", metadata.Duration),
				zap.String("thumbnail_url", metadata.ThumbnailURL))
		}
	}

	artifact := &models.TestimonialArtifact{
		TestimonialID:      session.TestimonialID,
		WorkspaceID:        session.WorkspaceID,
		ProcessingType:     processingType,
		ResultCategory:     resultCategory,
		AssetURL:           assetURLPtr,
		Duration:           duration,
		ThumbnailURL:       thumbnailURL,
		TextContent:        textContent,
		ContentType:        contentType,
		Platform:           platformStr, // Set platform from crop_resize or stage metadata
		IsUserSaved:        true,
		IsStreamed:         false,
		ProcessingMetadata: processingMetadata,
	}

	// Log artifact creation details
	logFields := []zap.Field{
		zap.String("stage_id", stageIDStr),
		zap.String("workspace_id", session.WorkspaceID.String()),
		zap.String("processing_type", processingType),
		zap.String("result_category", resultCategory),
		zap.Bool("has_asset_url", assetURLPtr != nil),
		zap.Bool("has_text_content", textContent != nil),
		zap.String("aspect_ratio", aspectRatio),
	}
	if platformStr != nil {
		logFields = append(logFields, zap.String("platform", *platformStr))
	} else {
		logFields = append(logFields, zap.String("platform", "nil"))
	}
	if session.TestimonialID != nil {
		logFields = append(logFields, zap.String("testimonial_id", session.TestimonialID.String()))
	} else {
		logFields = append(logFields, zap.String("testimonial_id", "nil (multi-testimonial)"))
	}
	c.logger.Info("🔍 [SAVE-STAGE] Creating artifact record", logFields...)

	if err := c.artifactsRepo.Create(r.Context(), artifact, c.db); err != nil {
		errorLogFields := []zap.Field{
			zap.Error(err),
			zap.String("stage_id", stageIDStr),
		}
		if session.TestimonialID != nil {
			errorLogFields = append(errorLogFields, zap.String("testimonial_id", session.TestimonialID.String()))
		}
		c.logger.Error("🚨 [SAVE-STAGE] Failed to create artifact in database", errorLogFields...)
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to save artifact")
		return
	}

	c.logger.Info("✅ [SAVE-STAGE] Successfully created artifact",
		zap.String("artifact_id", artifact.ID.String()),
		zap.String("stage_id", stageIDStr),
		zap.String("processing_type", processingType),
		zap.String("permanent_url", artifactURL))

	// Update session activity
	c.updateSessionActivity(r.Context(), sessionID)

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":         "Stage result saved successfully",
		"artifact_id":     artifact.ID,
		"artifact_url":    artifactURL,
		"stage_id":        stageIDStr,
		"saved_at":        time.Now(),
		"result_category": resultCategory,
	})
}
