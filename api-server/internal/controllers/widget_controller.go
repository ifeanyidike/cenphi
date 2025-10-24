package controllers

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type WidgetController struct {
	repo            repositories.PublicShareRepository
	testimonialRepo repositories.TestimonialRepository
	artifactRepo    repositories.TestimonialArtifactRepository
	db              repositories.DB
	logger          *zap.Logger
}

func NewWidgetController(
	repo repositories.PublicShareRepository,
	testimonialRepo repositories.TestimonialRepository,
	artifactRepo    repositories.TestimonialArtifactRepository,
	db              repositories.DB,
	logger          *zap.Logger,
) WidgetController {
	return WidgetController{
		repo:            repo,
		testimonialRepo: testimonialRepo,
		artifactRepo:    artifactRepo,
		db:              db,
		logger:          logger,
	}
}

// GetWidgetConfig gets widget configuration for embedding
// GET /api/widget/config/{shareId}
// This is called by the share-widget.js file at line 303
func (c WidgetController) GetWidgetConfig(w http.ResponseWriter, r *http.Request) {
	shareID := chi.URLParam(r, "shareId")
	id, err := uuid.Parse(shareID)
	if err != nil {
		c.logger.Error("Invalid share ID", zap.Error(err), zap.String("shareId", shareID))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	// Get share with content
	db := c.db
	shareWithContent, err := c.repo.GetWithContent(r.Context(), id, db)
	if err != nil {
		c.logger.Error("Failed to get share with content", zap.Error(err), zap.String("shareId", shareID))
		utils.RespondWithError(w, http.StatusNotFound, "Share not found")
		return
	}

	// Check if share is active
	if !shareWithContent.IsActive {
		utils.RespondWithError(w, http.StatusForbidden, "Share is no longer active")
		return
	}

	// Prepare widget config response
	// This matches the structure expected by share-widget.js renderWidget function (line 319)
	widgetConfig := map[string]interface{}{
		"share_id":   shareWithContent.ID,
		"share_type": shareWithContent.ShareType,
		"branding":   shareWithContent.CustomBranding,
	}

	// Add description if present
	if shareWithContent.Description != nil {
		widgetConfig["description"] = *shareWithContent.Description
	}

	// Add testimonial data if available (line 330 expects data.testimonial)
	if shareWithContent.Testimonial != nil {
		testimonialData := map[string]interface{}{
			"id":   shareWithContent.Testimonial.ID,
			"type": shareWithContent.Testimonial.Type,
		}

		if shareWithContent.Testimonial.AuthorName != nil {
			testimonialData["author_name"] = *shareWithContent.Testimonial.AuthorName
		}
		if shareWithContent.Testimonial.AuthorEmail != nil {
			testimonialData["author_email"] = *shareWithContent.Testimonial.AuthorEmail
		}
		if shareWithContent.Testimonial.AuthorCompany != nil {
			testimonialData["author_company"] = *shareWithContent.Testimonial.AuthorCompany
		}
		if shareWithContent.Testimonial.AuthorTitle != nil {
			// Widget expects both author_role and author_title
			testimonialData["author_role"] = *shareWithContent.Testimonial.AuthorTitle
			testimonialData["author_title"] = *shareWithContent.Testimonial.AuthorTitle
		}
		if shareWithContent.Testimonial.MediaURL != nil {
			// Widget checks for video_url (line 413) and media_url (line 413)
			if shareWithContent.Testimonial.Type == "video" {
				testimonialData["video_url"] = *shareWithContent.Testimonial.MediaURL
			}
			testimonialData["media_url"] = *shareWithContent.Testimonial.MediaURL
		}
		if shareWithContent.Testimonial.Content != nil {
			// Widget checks for text_content (line 439) and content (line 439)
			testimonialData["text_content"] = *shareWithContent.Testimonial.Content
			testimonialData["content"] = *shareWithContent.Testimonial.Content
		}
		if shareWithContent.Testimonial.Rating != nil {
			testimonialData["rating"] = *shareWithContent.Testimonial.Rating
		}

		widgetConfig["testimonial"] = testimonialData
	}

	// Add artifact data if available (line 338 expects data.artifact)
	if shareWithContent.Artifact != nil {
		artifactData := map[string]interface{}{
			"id":              shareWithContent.Artifact.ID,
			"processing_type": shareWithContent.Artifact.ProcessingType,
			"asset_url":       shareWithContent.Artifact.AssetURL,
			"content_type":    shareWithContent.Artifact.ContentType,
		}

		if shareWithContent.Artifact.Platform != nil {
			artifactData["platform"] = *shareWithContent.Artifact.Platform
		}

		if shareWithContent.Artifact.TextContent != nil {
			artifactData["text_content"] = *shareWithContent.Artifact.TextContent
		}

		widgetConfig["artifact"] = artifactData
	}

	utils.RespondWithJSON(w, http.StatusOK, widgetConfig)
}

// GetWidgetEmbed generates HTML embed code for a share
// GET /api/widget/embed/{shareId}
func (c WidgetController) GetWidgetEmbed(w http.ResponseWriter, r *http.Request) {
	shareID := chi.URLParam(r, "shareId")
	id, err := uuid.Parse(shareID)
	if err != nil {
		c.logger.Error("Invalid share ID", zap.Error(err), zap.String("shareId", shareID))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID")
		return
	}

	// Verify share exists and is active
	db := c.db
	share, err := c.repo.GetByID(r.Context(), id, db)
	if err != nil {
		c.logger.Error("Failed to get share", zap.Error(err), zap.String("shareId", shareID))
		utils.RespondWithError(w, http.StatusNotFound, "Share not found")
		return
	}

	if !share.IsActive {
		utils.RespondWithError(w, http.StatusForbidden, "Share is no longer active")
		return
	}

	// Get base URL from request (for absolute URLs)
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	baseURL := scheme + "://" + r.Host

	// Generate embed code that works when embedded in any webpage
	// The widget is wrapped in an IIFE (Immediately Invoked Function Expression)
	// and uses window.CenphiShareWidget for global access
	embedCode := fmt.Sprintf(`<!-- Cenphi Share Widget -->
<div id="cenphi-widget-%s"></div>
<script src="%s/api/share-widget.js"></script>
<script>
  // Wait for the widget script to load
  (function() {
    if (typeof window.CenphiShareWidget !== 'undefined') {
      window.CenphiShareWidget.init({
        container: '#cenphi-widget-%s',
        shareId: '%s',
        apiUrl: '%s',
        variant: 'premium',
        theme: 'light',
        autoplay: false,
        showBranding: true,
        width: '100%%',
        maxWidth: '720px',
        enableAnimations: true,
        showSocialShare: true
      });
    } else {
      console.error('CenphiShareWidget not loaded');
    }
  })();
</script>`,
		shareID,
		baseURL,
		shareID,
		shareID,
		baseURL,
	)

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"share_id":   shareID,
		"embed_code": embedCode,
		"message":    "Embed code generated successfully",
	})
}
