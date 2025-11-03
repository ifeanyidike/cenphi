package controllers

import (
	"fmt"
	"net/http"
	"strings"

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
		if shareWithContent.Testimonial.AuthorAvatarURL != nil {
			testimonialData["author_avatar"] = *shareWithContent.Testimonial.AuthorAvatarURL
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
			"content_type":    shareWithContent.Artifact.ContentType,
		}

		// Add asset_url if present
		if shareWithContent.Artifact.AssetURL != nil {
			artifactData["asset_url"] = *shareWithContent.Artifact.AssetURL
		}

		if shareWithContent.Artifact.Platform != nil {
			artifactData["platform"] = *shareWithContent.Artifact.Platform
		}

		if shareWithContent.Artifact.TextContent != nil {
			artifactData["text_content"] = *shareWithContent.Artifact.TextContent
		}

		// Special handling for clipping artifacts - extract clips from data.generated_clips
		if shareWithContent.Artifact.ProcessingType == "clipping" && shareWithContent.Artifact.Data != nil {
			if generatedClips, ok := shareWithContent.Artifact.Data["generated_clips"].([]interface{}); ok && len(generatedClips) > 0 {
				artifactData["clips"] = generatedClips
				artifactData["clips_count"] = len(generatedClips)

				// For backward compatibility, set asset_url to first clip's URL
				if firstClip, ok := generatedClips[0].(map[string]interface{}); ok {
					if url, ok := firstClip["url"].(string); ok {
						artifactData["asset_url"] = url
						artifactData["content_type"] = "video/mp4"
					}
				}
			}
		}

		widgetConfig["artifact"] = artifactData
	}

	utils.RespondWithJSON(w, http.StatusOK, widgetConfig)
}

// GetWidgetEmbed generates HTML embed code for a share
// GET /api/widget/embed/{shareId}?embedStyle=classic&compact=false
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

	// Get customization options from query params
	embedStyle := r.URL.Query().Get("embedStyle")
	if embedStyle == "" {
		embedStyle = "cinematic" // Default to cinematic
	}
	// Validate embedStyle
	validEmbedStyles := map[string]bool{"cinematic": true, "magazine": true, "floating": true, "minimal": true}
	if !validEmbedStyles[embedStyle] {
		embedStyle = "cinematic"
	}

	compact := r.URL.Query().Get("compact")
	compactStr := "false"
	if compact == "true" {
		compactStr = "true"
	}

	// Get base URL from request (for absolute URLs)
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	baseURL := scheme + "://" + r.Host

	// Generate embed code with selected style
	embedCode := fmt.Sprintf(`<!-- Cenphi Share Widget -->
<div id="cenphi-widget-%s"></div>
<script src="%s/share-widget.js"></script>
<script>
  (function() {
    if (typeof window.CenphiShareWidget !== 'undefined') {
      window.CenphiShareWidget.init({
        container: '#cenphi-widget-%s',
        shareId: '%s',
        apiUrl: '%s',
        embedStyle: '%s',
        theme: 'light',
        compact: %s,
        showBranding: true,
        enableAnimations: true,
        showRating: true,
        showAvatar: true
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
		embedStyle,
		compactStr,
	)

	// Return plain text embed code (not JSON) for ShareModal to display correctly
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(embedCode))
}

// GetCarouselEmbed generates HTML embed code for multiple shares in a carousel
// GET /api/widget/embed/carousel?shareIds=id1,id2,id3&embedStyle=classic&carouselStyle=slide
func (c WidgetController) GetCarouselEmbed(w http.ResponseWriter, r *http.Request) {
	shareIDsParam := r.URL.Query().Get("shareIds")
	if shareIDsParam == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "shareIds query parameter is required")
		return
	}

	// Parse comma-separated share IDs
	shareIDStrs := strings.Split(shareIDsParam, ",")
	if len(shareIDStrs) == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "At least one share ID is required")
		return
	}

	// Validate all share IDs
	for _, idStr := range shareIDStrs {
		idStr = strings.TrimSpace(idStr)
		_, err := uuid.Parse(idStr)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid share ID: "+idStr)
			return
		}
	}

	// Get customization options from query params
	embedStyle := r.URL.Query().Get("embedStyle")
	if embedStyle == "" {
		embedStyle = "cinematic" // Default to cinematic
	}
	// Validate embedStyle
	validEmbedStyles := map[string]bool{"cinematic": true, "magazine": true, "floating": true, "minimal": true}
	if !validEmbedStyles[embedStyle] {
		embedStyle = "cinematic"
	}

	carouselStyle := r.URL.Query().Get("carouselStyle")
	if carouselStyle == "" {
		carouselStyle = "slide" // Default to slide
	}
	// Validate carouselStyle
	validCarouselStyles := map[string]bool{"slide": true, "stack": true, "fade": true, "multiItem": true}
	if !validCarouselStyles[carouselStyle] {
		carouselStyle = "slide"
	}

	// Get base URL from request
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	baseURL := scheme + "://" + r.Host

	// Generate carousel embed code with selected styles
	shareIDsJSON := `["` + strings.Join(shareIDStrs, `","`) + `"]`
	carouselID := "carousel-" + strings.TrimSpace(shareIDStrs[0])

	embedCode := fmt.Sprintf(`<!-- Cenphi Carousel Widget -->
<div id="cenphi-%s"></div>
<script src="%s/share-widget.js"></script>
<script>
  (function() {
    if (typeof window.CenphiShareWidget !== 'undefined') {
      window.CenphiShareWidget.init({
        container: '#cenphi-%s',
        mode: 'carousel',
        shareIds: %s,
        apiUrl: '%s',
        embedStyle: '%s',
        carouselStyle: '%s',
        theme: 'light',
        showBranding: true,
        enableAnimations: true,
        carouselAutoplay: true,
        carouselInterval: 6000,
        showRating: true,
        showAvatar: true,
        disableTracking: false
      });
    } else {
      console.error('CenphiShareWidget not loaded');
    }
  })();
</script>`,
		carouselID,
		baseURL,
		carouselID,
		shareIDsJSON,
		baseURL,
		embedStyle,
		carouselStyle,
	)

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(embedCode))
}
