package controllers

import (
	"encoding/json"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type PublicShareController struct {
	repo            repositories.PublicShareRepository
	testimonialRepo repositories.TestimonialRepository
	artifactRepo    repositories.TestimonialArtifactRepository
	db              repositories.DB
	logger          *zap.Logger
}

func NewPublicShareController(
	repo repositories.PublicShareRepository,
	testimonialRepo repositories.TestimonialRepository,
	artifactRepo repositories.TestimonialArtifactRepository,
	db repositories.DB,
	logger *zap.Logger,
) PublicShareController {
	return PublicShareController{
		repo:            repo,
		testimonialRepo: testimonialRepo,
		artifactRepo:    artifactRepo,
		db:              db,
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

// GetWorkspaceShares gets all shares for a workspace
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

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"shares":  shares,
		"total":   len(shares),
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

	// Validate event type
	validEventTypes := map[string]bool{
		"view":            true,
		"play":            true,
		"download":        true,
		"copy_link":       true,
		"copy":            true,
		"share_linkedin":  true,
		"linkedin_share":  true,
		"share_twitter":   true,
		"twitter_share":   true,
		"share_facebook":  true,
		"facebook_share":  true,
		"share_whatsapp":  true,
		"whatsapp_share":  true,
		"share_email":     true,
		"email_share":     true,
	}

	if !validEventTypes[req.EventType] {
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
		EventType:     req.EventType,
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
			zap.String("event_type", req.EventType))
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
