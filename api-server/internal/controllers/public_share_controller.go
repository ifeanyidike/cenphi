package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ffmpeg"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type PublicShareController struct {
	repo            repositories.PublicShareRepository
	testimonialRepo repositories.TestimonialRepository
	artifactRepo    repositories.TestimonialArtifactRepository
	db              repositories.DB
	logger          *zap.Logger
	storageService  storage.StorageFactory
}

func NewPublicShareController(
	repo repositories.PublicShareRepository,
	testimonialRepo repositories.TestimonialRepository,
	artifactRepo repositories.TestimonialArtifactRepository,
	db repositories.DB,
	storageService storage.StorageFactory,
	logger *zap.Logger,
) PublicShareController {
	return PublicShareController{
		repo:            repo,
		testimonialRepo: testimonialRepo,
		artifactRepo:    artifactRepo,
		db:              db,
		storageService:  storageService,
		logger:          logger,
	}
}

// CreateShare creates a new public share link
// POST /api/shares
func (c PublicShareController) CreateShare(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePublicShareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if req.ShareType != "testimonial" && req.ShareType != "artifact" {
		utils.RespondWithError(w, http.StatusBadRequest, "share_type must be 'testimonial' or 'artifact'")
		return
	}

	if req.ShareType == "testimonial" && req.TestimonialID == nil {
		utils.RespondWithError(w, http.StatusBadRequest, "testimonial_id required for testimonial shares")
		return
	}

	if req.ShareType == "artifact" && req.ArtifactID == nil {
		utils.RespondWithError(w, http.StatusBadRequest, "artifact_id required for artifact shares")
		return
	}

	// Validate workspace ID
	if req.WorkspaceID == uuid.Nil {
		c.logger.Error("Invalid workspace ID: nil UUID")
		utils.RespondWithError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	// Initialize custom branding if nil
	customBranding := req.CustomBranding
	if customBranding == nil {
		customBranding = models.JSONB{}
	}

	// Create share
	share := &models.PublicShare{
		WorkspaceID:       req.WorkspaceID,
		ShareType:         req.ShareType,
		TestimonialID:     req.TestimonialID,
		ArtifactID:        req.ArtifactID,
		Description:       req.Description,
		IsPublic:          true,
		IsActive:          true,
		PasswordProtected: false,
		ExpiresAt:         req.ExpiresAt,
		CustomBranding:    customBranding,
	}

	if err := c.repo.Create(r.Context(), share, c.db); err != nil {
		c.logger.Error("Failed to create share", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create share")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, share)
}

// GetShare gets a public share by ID
// GET /api/shares/:id
func (c PublicShareController) GetShare(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	db := c.db
	share, err := c.repo.GetByID(r.Context(), id, db)
	if err != nil {
		c.logger.Error("Failed to get share", zap.Error(err), zap.String("id", idStr))
		utils.RespondWithError(w, http.StatusNotFound, "Share not found")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"share":   share,
		"message": "Share retrieved successfully",
	})
}

// GetShareWithContent gets a share with its content (for public view page)
// GET /api/share/:id/view
func (c PublicShareController) GetShareWithContent(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	db := c.db
	shareWithContent, err := c.repo.GetWithContent(r.Context(), id, db)
	if err != nil {
		c.logger.Error("Failed to get share with content", zap.Error(err), zap.String("id", idStr))
		utils.RespondWithError(w, http.StatusNotFound, "Share not found")
		return
	}

	// Check if share is active
	if !shareWithContent.IsActive {
		utils.RespondWithError(w, http.StatusForbidden, "Share is no longer active")
		return
	}

	// Check if share has expired
	if shareWithContent.ExpiresAt != nil && shareWithContent.ExpiresAt.Before(time.Now()) {
		utils.RespondWithError(w, http.StatusForbidden, "Share has expired")
		return
	}

	// Map testimonial fields to frontend expectations
	var testimonialResponse interface{}
	if shareWithContent.Testimonial != nil {
		testimonialResponse = mapTestimonialForPublic(shareWithContent.Testimonial)
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"share":       shareWithContent.PublicShare,
		"testimonial": testimonialResponse,
		"artifact":    shareWithContent.Artifact,
		"message":     "Share content retrieved successfully",
	})
}

// mapTestimonialForPublic maps backend Testimonial model to frontend expected format
func mapTestimonialForPublic(t *models.Testimonial) map[string]interface{} {
	result := map[string]interface{}{
		"id":         t.ID,
		"created_at": t.CreatedAt,
	}

	// Map author fields
	if t.AuthorName != nil {
		result["author_name"] = *t.AuthorName
	}
	if t.AuthorEmail != nil {
		result["author_email"] = *t.AuthorEmail
	}
	if t.AuthorCompany != nil {
		result["author_company"] = *t.AuthorCompany
	}
	if t.AuthorTitle != nil {
		result["author_role"] = *t.AuthorTitle // Frontend expects author_role
	}

	// Map media URL - MediaURL can be video or audio
	if t.MediaURL != nil {
		if t.Type == "video" {
			result["video_url"] = *t.MediaURL
		} else if t.Type == "audio" {
			result["audio_url"] = *t.MediaURL
		}
	}

	// Map content
	if t.Content != nil {
		result["text_content"] = *t.Content
	}

	// Map rating
	if t.Rating != nil {
		result["rating"] = *t.Rating
	}

	// Extract transcript from TranscriptSegments
	if t.TranscriptSegments != nil && len(*t.TranscriptSegments) > 0 {
		var transcriptText string
		for _, segment := range *t.TranscriptSegments {
			if len(transcriptText) > 0 {
				transcriptText += " "
			}
			transcriptText += segment.Text
		}
		result["transcript"] = transcriptText
	}

	return result
}

// GetWorkspaceShares gets all shares for a workspace with metrics
// GET /api/workspaces/:workspaceId/shares
func (c PublicShareController) GetWorkspaceShares(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceId")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	db := c.db
	shares, err := c.repo.GetByWorkspace(r.Context(), workspaceID, db)
	if err != nil {
		c.logger.Error("Failed to get workspace shares", zap.Error(err), zap.String("workspace_id", workspaceIDStr))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get shares")
		return
	}

	// Fetch metrics for each share
	sharesWithMetrics := make([]map[string]interface{}, len(shares))
	for i, share := range shares {
		shareMap := map[string]interface{}{
			"id":                 share.ID,
			"workspace_id":       share.WorkspaceID,
			"share_type":         share.ShareType,
			"testimonial_id":     share.TestimonialID,
			"artifact_id":        share.ArtifactID,
			"description":        share.Description,
			"is_public":          share.IsPublic,
			"is_active":          share.IsActive,
			"password_protected": share.PasswordProtected,
			"password_hash":      share.PasswordHash,
			"expires_at":         share.ExpiresAt,
			"custom_branding":    share.CustomBranding,
			"created_at":         share.CreatedAt,
			"updated_at":         share.UpdatedAt,
		}

		// Fetch metrics for this share
		metrics, err := c.repo.GetMetrics(r.Context(), share.ID, db)
		if err != nil {
			// Log warning but don't fail the request
			c.logger.Warn("Failed to get metrics for share",
				zap.Error(err),
				zap.String("share_id", share.ID.String()))
			shareMap["metrics"] = nil
		} else {
			shareMap["metrics"] = metrics
		}

		sharesWithMetrics[i] = shareMap
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"shares":  sharesWithMetrics,
		"total":   len(sharesWithMetrics),
		"message": "Shares retrieved successfully",
	})
}

// GetTestimonialShares gets all shares for a testimonial
// GET /api/testimonials/:testimonialId/shares
func (c PublicShareController) GetTestimonialShares(w http.ResponseWriter, r *http.Request) {
	testimonialIDStr := chi.URLParam(r, "testimonialId")
	testimonialID, err := uuid.Parse(testimonialIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid testimonial ID")
		return
	}

	db := c.db
	shares, err := c.repo.GetByTestimonial(r.Context(), testimonialID, db)
	if err != nil {
		c.logger.Error("Failed to get testimonial shares", zap.Error(err), zap.String("testimonial_id", testimonialIDStr))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get shares")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"shares":  shares,
		"total":   len(shares),
		"message": "Shares retrieved successfully",
	})
}

// GetArtifactShares gets all shares for an artifact
// GET /api/artifacts/:artifactId/shares
func (c PublicShareController) GetArtifactShares(w http.ResponseWriter, r *http.Request) {
	artifactIDStr := chi.URLParam(r, "artifactId")
	artifactID, err := uuid.Parse(artifactIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid artifact ID")
		return
	}

	db := c.db
	shares, err := c.repo.GetByArtifact(r.Context(), artifactID, db)
	if err != nil {
		c.logger.Error("Failed to get artifact shares", zap.Error(err), zap.String("artifact_id", artifactIDStr))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get shares")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"shares":  shares,
		"total":   len(shares),
		"message": "Shares retrieved successfully",
	})
}

// UpdateShare updates a share's settings
// PUT /api/shares/:id
func (c PublicShareController) UpdateShare(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	var req struct {
		Description    *string      `json:"description"`
		IsActive       *bool        `json:"is_active"`
		IsPublic       *bool        `json:"is_public"`
		ExpiresAt      *time.Time   `json:"expires_at"`
		CustomBranding models.JSONB `json:"custom_branding"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	db := c.db
	share, err := c.repo.GetByID(r.Context(), id, db)
	if err != nil {
		utils.RespondWithError(w, http.StatusNotFound, "Share not found")
		return
	}

	// Update fields
	if req.Description != nil {
		share.Description = req.Description
	}
	if req.IsActive != nil {
		share.IsActive = *req.IsActive
	}
	if req.IsPublic != nil {
		share.IsPublic = *req.IsPublic
	}
	if req.ExpiresAt != nil {
		share.ExpiresAt = req.ExpiresAt
	}
	if len(req.CustomBranding) > 0 {
		share.CustomBranding = req.CustomBranding
	}

	if err := c.repo.Update(r.Context(), share, db); err != nil {
		c.logger.Error("Failed to update share", zap.Error(err), zap.String("id", idStr))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update share")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"share":   share,
		"message": "Share updated successfully",
	})
}

// DeleteShare deletes a share
// DELETE /api/shares/:id
func (c PublicShareController) DeleteShare(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	db := c.db
	if err := c.repo.Delete(r.Context(), id, db); err != nil {
		c.logger.Error("Failed to delete share", zap.Error(err), zap.String("id", idStr))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete share")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Share deleted successfully",
	})
}

// TrackEvent tracks a share event (view, play, share, etc.)
// POST /api/share/:id/track
func (c PublicShareController) TrackEvent(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.logger.Error("error passing uuid", zap.Error(err), zap.String("id", idStr))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	var req models.TrackEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Failed to decode body", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Normalize event type to match database function expectations
	// Database function expects: view, play, download, copy_link, share_*
	eventType := req.EventType

	// Map alternative event type names to canonical names
	eventTypeMap := map[string]string{
		"view":            "view",
		"play":            "play",
		"download":        "download",
		"copy_link":       "copy_link",
		"copy":            "copy_link", // Normalize 'copy' to 'copy_link'
		"share_linkedin":  "share_linkedin",
		"linkedin_share":  "share_linkedin", // Normalize to share_linkedin
		"share_twitter":   "share_twitter",
		"twitter_share":   "share_twitter", // Normalize to share_twitter
		"share_facebook":  "share_facebook",
		"facebook_share":  "share_facebook", // Normalize to share_facebook
		"share_whatsapp":  "share_whatsapp",
		"whatsapp_share":  "share_whatsapp", // Normalize to share_whatsapp
		"share_email":     "share_email",
		"email_share":     "share_email", // Normalize to share_email
	}

	normalizedEventType, valid := eventTypeMap[eventType]
	if !valid {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid event type")
		return
	}

	// Extract visitor info from request
	// Extract IP address without port
	ipAddress := r.RemoteAddr
	if host, _, err := net.SplitHostPort(ipAddress); err == nil {
		ipAddress = host
	}
	userAgent := r.UserAgent()

	event := &models.PublicShareEvent{
		PublicShareID: id,
		EventType:     normalizedEventType, // Use normalized event type
		VisitorID:     req.VisitorID,
		IPAddress:     &ipAddress,
		UserAgent:     &userAgent,
		Referrer:      req.Referrer,
		Metadata:      req.Metadata,
	}

	db := c.db
	if err := c.repo.TrackEvent(r.Context(), event, db); err != nil {
		c.logger.Error("Failed to track event",
			zap.Error(err),
			zap.String("share_id", idStr),
			zap.String("original_event_type", req.EventType),
			zap.String("normalized_event_type", normalizedEventType),
			zap.Any("visitor_id", req.VisitorID),
			zap.String("ip_address", ipAddress))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to track event")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Event tracked successfully",
	})
}

// GetMetrics gets metrics for a share
// GET /api/shares/:id/metrics
func (c PublicShareController) GetMetrics(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	db := c.db
	metrics, err := c.repo.GetMetrics(r.Context(), id, db)
	if err != nil {
		c.logger.Error("Failed to get metrics", zap.Error(err), zap.String("id", idStr))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get metrics")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"metrics": metrics,
		"message": "Metrics retrieved successfully",
	})
}

// GetEvents gets events for a share
// GET /api/shares/:id/events
func (c PublicShareController) GetEvents(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	// Optional filters
	eventType := r.URL.Query().Get("event_type")
	limit := 100 // Default limit

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	db := c.db
	events, err := c.repo.GetEvents(r.Context(), id, eventType, limit, db)
	if err != nil {
		c.logger.Error("Failed to get events", zap.Error(err), zap.String("id", idStr))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get events")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"events":  events,
		"total":   len(events),
		"message": "Events retrieved successfully",
	})
}

// ExportToGIF exports a testimonial or artifact to GIF format
// POST /api/export/gif
func (c PublicShareController) ExportToGIF(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TestimonialID *uuid.UUID `json:"testimonial_id"`
		ArtifactID    *uuid.UUID `json:"artifact_id"`
		StartTime     float64    `json:"start_time"`     // Start time in seconds
		Duration      float64    `json:"duration"`       // Duration in seconds
		Width         int        `json:"width"`          // GIF width in pixels
		FPS           int        `json:"fps"`            // Frames per second
		Quality       string     `json:"quality"`        // "high", "medium", "low"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate that either testimonial_id or artifact_id is provided
	if req.TestimonialID == nil && req.ArtifactID == nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Either testimonial_id or artifact_id is required")
		return
	}

	if req.TestimonialID != nil && req.ArtifactID != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Cannot provide both testimonial_id and artifact_id")
		return
	}

	// Set default values
	if req.Width <= 0 {
		req.Width = 480
	}
	if req.FPS <= 0 || req.FPS > 30 {
		req.FPS = 15
	}
	if req.Duration <= 0 {
		req.Duration = 5.0
	}
	if req.Quality == "" {
		req.Quality = "medium"
	}

	// Validate quality parameter
	validQualities := map[string]bool{"high": true, "medium": true, "low": true}
	if !validQualities[req.Quality] {
		utils.RespondWithError(w, http.StatusBadRequest, "Quality must be 'high', 'medium', or 'low'")
		return
	}

	// Get the media URL based on source type
	var mediaURL string
	var sourceType string

	if req.TestimonialID != nil {
		// Get testimonial
		testimonial, err := c.testimonialRepo.GetByID(r.Context(), *req.TestimonialID, c.db)
		if err != nil {
			c.logger.Error("Failed to get testimonial", zap.Error(err), zap.String("testimonial_id", req.TestimonialID.String()))
			utils.RespondWithError(w, http.StatusNotFound, "Testimonial not found")
			return
		}

		if testimonial.Type != "video" {
			utils.RespondWithError(w, http.StatusBadRequest, "Only video testimonials can be exported to GIF")
			return
		}

		if testimonial.MediaURL == nil || *testimonial.MediaURL == "" {
			utils.RespondWithError(w, http.StatusBadRequest, "Testimonial has no media URL")
			return
		}

		mediaURL = *testimonial.MediaURL
		sourceType = "testimonial"
	} else {
		// Get artifact
		artifact, err := c.artifactRepo.GetByID(r.Context(), *req.ArtifactID, c.db)
		if err != nil {
			c.logger.Error("Failed to get artifact", zap.Error(err), zap.String("artifact_id", req.ArtifactID.String()))
			utils.RespondWithError(w, http.StatusNotFound, "Artifact not found")
			return
		}

		if artifact.ContentType != "video/mp4" && artifact.ContentType != "video" {
			utils.RespondWithError(w, http.StatusBadRequest, "Only video artifacts can be exported to GIF")
			return
		}

		if artifact.AssetURL == nil || *artifact.AssetURL == "" {
			utils.RespondWithError(w, http.StatusBadRequest, "Artifact has no asset URL")
			return
		}

		mediaURL = *artifact.AssetURL
		sourceType = "artifact"
	}

	c.logger.Info("Processing GIF export request",
		zap.String("media_url", mediaURL),
		zap.String("source_type", sourceType),
		zap.Float64("start_time", req.StartTime),
		zap.Float64("duration", req.Duration),
		zap.Int("width", req.Width),
		zap.Int("fps", req.FPS),
		zap.String("quality", req.Quality))

	// Initialize FFmpeg processor
	processor := ffmpeg.NewProcessor(c.logger, c.storageService.Provider)
	defer processor.Stop()

	// Download media if it's a remote URL
	// Use Background context to avoid being cancelled by request timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	localPath, err := processor.DownloadMediaWithCleanup(ctx, mediaURL, 3)
	if err != nil {
		c.logger.Error("Failed to download media", zap.Error(err), zap.String("media_url", mediaURL))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to download media: "+err.Error())
		return
	}

	// Export to GIF
	result, err := processor.ExportToGIF(ctx, localPath, req.StartTime, req.Duration, req.Width, req.FPS, req.Quality)
	if err != nil {
		c.logger.Error("Failed to export to GIF", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to export to GIF: "+err.Error())
		return
	}

	// Upload GIF to storage
	sourceID := ""
	if req.TestimonialID != nil {
		sourceID = req.TestimonialID.String()
	} else {
		sourceID = req.ArtifactID.String()
	}

	storagePath := fmt.Sprintf("exports/gifs/%s/%s_%s.gif", sourceType, sourceID, uuid.New().String()[:8])
	gifURL, err := c.storageService.Provider.Upload(ctx, result.OutputPath, storagePath, "image/gif")
	if err != nil {
		c.logger.Error("Failed to upload GIF to storage", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to upload GIF: "+err.Error())
		return
	}

	// Clean up local files
	processor.CleanupTempFiles(localPath, result.OutputPath)

	c.logger.Info("GIF export completed successfully",
		zap.String("gif_url", gifURL),
		zap.Int64("file_size", result.FileSize),
		zap.Float64("processing_time", result.ProcessingTime))

	// Return GIF information
	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"gif_url":         gifURL,
		"file_size":       result.FileSize,
		"width":           result.Width,
		"duration":        result.Duration,
		"fps":             req.FPS,
		"quality":         req.Quality,
		"processing_time": result.ProcessingTime,
		"message":         "GIF exported successfully",
	})
}
