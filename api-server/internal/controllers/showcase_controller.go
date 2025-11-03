// internal/controllers/showcase_controller.go
package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type ShowcaseController struct{
	workspaceRepo repositories.WorkspaceRepository
	artifactRepo  repositories.TestimonialArtifactRepository
	db            *sql.DB
	logger        *zap.Logger
}

func NewShowcaseController(
	workspaceRepo repositories.WorkspaceRepository,
	artifactRepo repositories.TestimonialArtifactRepository,
	db *sql.DB,
	logger *zap.Logger,
) *ShowcaseController {
	return &ShowcaseController{
		workspaceRepo: workspaceRepo,
		artifactRepo:  artifactRepo,
		db:            db,
		logger:        logger,
	}
}

type UpdateShowcaseRequest struct {
	Enabled  bool                   `json:"enabled"`
	Slug     string                 `json:"slug"`
	Settings map[string]interface{} `json:"settings"`
}

type ShowcaseResponse struct {
	Workspace interface{} `json:"workspace"`
	Artifacts interface{} `json:"artifacts"`
}

// UpdateShowcaseSettings updates showcase settings for a workspace
// @Summary Update Showcase Settings
// @Description Update showcase settings including slug and enabled status
// @Tags Showcase
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param request body UpdateShowcaseRequest true "Showcase settings"
// @Success 200 {object} map[string]string
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/showcase-settings [put]
func (c *ShowcaseController) UpdateShowcaseSettings(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	var req UpdateShowcaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate slug format (alphanumeric and hyphens only)
	if req.Slug != "" {
		if !utils.IsValidSlug(req.Slug) {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid slug format. Use only lowercase letters, numbers, and hyphens")
			return
		}

		// Check if slug is available
		available, err := c.workspaceRepo.CheckShowcaseSlugAvailability(r.Context(), req.Slug, &workspaceID, c.db)
		if err != nil {
			c.logger.Error("Failed to check slug availability", zap.Error(err))
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to check slug availability")
			return
		}

		if !available {
			utils.RespondWithError(w, http.StatusConflict, "Showcase slug is already taken")
			return
		}
	}

	var slug *string
	if req.Slug != "" {
		slug = &req.Slug
	}

	err = c.workspaceRepo.UpdateShowcaseSettings(r.Context(), workspaceID, req.Enabled, slug, req.Settings, c.db)
	if err != nil {
		c.logger.Error("Failed to update showcase settings", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	showcaseURL := ""
	if req.Enabled && slug != nil {
		showcaseURL = "/showcase/" + *slug
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{
		"message":      "Showcase settings updated successfully",
		"workspace_id": workspaceID.String(),
		"showcase_url": showcaseURL,
	})
}

// GetPublicShowcase retrieves public showcase data for a workspace
// @Summary Get Public Showcase
// @Description Get public showcase page data by workspace slug
// @Tags Showcase
// @Accept json
// @Produce json
// @Param slug path string true "Workspace Showcase Slug"
// @Success 200 {object} ShowcaseResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /public/showcase/{slug} [get]
func (c *ShowcaseController) GetPublicShowcase(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Slug parameter is required")
		return
	}

	// Get workspace by slug
	workspace, err := c.workspaceRepo.GetWorkspaceByShowcaseSlug(r.Context(), slug, c.db)
	if err != nil {
		c.logger.Error("Failed to get workspace by slug", zap.Error(err), zap.String("slug", slug))
		utils.RespondWithError(w, http.StatusNotFound, "Showcase not found")
		return
	}

	// Get public artifacts for this workspace
	artifacts, err := c.artifactRepo.GetPublicArtifacts(r.Context(), workspace.ID, c.db)
	if err != nil {
		c.logger.Error("Failed to get public artifacts", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve showcase content")
		return
	}

	// Return workspace info and artifacts
	utils.RespondWithJSON(w, http.StatusOK, ShowcaseResponse{
		Workspace: map[string]interface{}{
			"id":                workspace.ID,
			"name":              workspace.Name,
			"website_url":       workspace.WebsiteURL,
			"industry":          workspace.Industry,
			"brand_context":     workspace.BrandContext,
			"showcase_settings": workspace.ShowcaseSettings,
		},
		Artifacts: artifacts,
	})
}

// CheckSlugAvailability checks if a showcase slug is available
// @Summary Check Slug Availability
// @Description Check if a showcase slug is available for use
// @Tags Showcase
// @Accept json
// @Produce json
// @Param slug query string true "Slug to check"
// @Success 200 {object} map[string]bool
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /showcase/check-slug [get]
func (c *ShowcaseController) CheckSlugAvailability(w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("slug")
	if slug == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Slug parameter is required")
		return
	}

	if !utils.IsValidSlug(slug) {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid slug format")
		return
	}

	available, err := c.workspaceRepo.CheckShowcaseSlugAvailability(r.Context(), slug, nil, c.db)
	if err != nil {
		c.logger.Error("Failed to check slug availability", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to check slug availability")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]bool{
		"available": available,
	})
}
