package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type WorkspaceController interface {
	GetWorkspace(w http.ResponseWriter, r *http.Request)
	GetTestimonialsByWorkspaceID(w http.ResponseWriter, r *http.Request)
	GetTestimonial(w http.ResponseWriter, r *http.Request)
	CreateWorkspace(w http.ResponseWriter, r *http.Request)
	UpdateWorkspace(w http.ResponseWriter, r *http.Request)
	DeleteWorkspace(w http.ResponseWriter, r *http.Request)
}

type workspaceController struct {
	logger         *zap.Logger
	service        services.WorkspaceService
	testimonialSvc services.TestimonialService
}

func NewWorkspaceController(service services.WorkspaceService, testimonialSvc services.TestimonialService, logger *zap.Logger) WorkspaceController {
	return &workspaceController{logger: logger, service: service, testimonialSvc: testimonialSvc}
}

// GetWorkspace retrieves a workspace by ID.
// @Summary Get Workspace
// @Description Fetch a workspace by their ID.
// @Tags Workspaces
// @Accept json
// @Produce json
// @Param id path string true "Workspace ID"
// @Success 200 {object} models.Workspace
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /workspaces [get]
func (c *workspaceController) GetWorkspace(w http.ResponseWriter, r *http.Request) {
	// id, err := uuid.Parse(r.URL.Query().Get("id"))
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, apperrors.ErrInvalidWorkspaceID.Error())
		return
	}
	if id == uuid.Nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Workspace ID is required")
		return
	}

	workspace, err := c.service.GetWorkspace(r.Context(), id)
	if err != nil {
		c.logger.Error("failed to get workspace", zap.String("WorkspaceID", id.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, workspace)
}

// CreateWorkspace creates a new workspace.
// @Summary Create Workspace
// @Description Create a new workspace.
// @Tags Workspaces
// @Accept json
// @Produce json
// @Param workspace body models.Workspace true "Workspace data"
// @Success 201 {string} string "Workspace created successfully"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces [post]
func (c *workspaceController) CreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var workspace models.Workspace

	// Parse and validate the input
	if err := json.NewDecoder(r.Body).Decode(&workspace); err != nil {
		c.logger.Error("invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	// if workspace.Name == "" {
	// 	utils.RespondWithError(w, http.StatusBadRequest, "The workspace data is malformed: Invalid workspace")
	// 	return
	// }

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := c.service.CreateWorkspace(ctx, &workspace); err != nil {
		c.logger.Error("failed to create workspace", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create workspace")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, "Workspace created successfully")
}

// UpdateWorkspace updates workspace by its ID.
// @Summary Update Workspace by ID
// @Description Update workspace using the provided path parameter `id`.
// @Tags Workspaces
// @Accept json
// @Produce json
// @Param id path string true "The ID of the workspace to update"
// @Param workspace body models.Workspace true "Workspace data to update"
// @Success 200 {object} models.Workspace "Updated workspace"
// @Failure 400 {object} utils.ErrorResponse "Invalid input or bad request"
// @Failure 404 {object} utils.ErrorResponse "Workspace not found"
// @Failure 500 {object} utils.ErrorResponse "Internal server error"
// @Router /workspaces/{id} [put]

func (c *workspaceController) UpdateWorkspace(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, apperrors.ErrInvalidWorkspaceID.Error())
		return
	}

	// var workspace *models.Workspace
	var workspace map[string]any
	if id == uuid.Nil {
		utils.RespondWithError(w, http.StatusBadRequest, apperrors.ErrInvalidWorkspaceID.Error())
		return
	}
	// Parse and validate the input
	if err := json.NewDecoder(r.Body).Decode(&workspace); err != nil {
		c.logger.Error("invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "invalid request payload")
		return
	}

	if websiteURL, ok := workspace["website_url"].(string); ok {
		workspace["website_url"] = models.PrepareURL(websiteURL)
	}

	if err := models.ValidateWorkspace(workspace); err != nil {
		c.logger.Error("validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := c.service.UpdateWorkspace(ctx, id, workspace); err != nil {
		c.logger.Error("failed to update workspace", zap.String("workspaceID", id.String()), zap.Error(err))
		switch {
		case errors.Is(err, apperrors.ErrWorkspaceNotFound):
			utils.RespondWithError(w, http.StatusNotFound, apperrors.ErrWorkspaceNotFound.Error())
		default:
			utils.RespondWithError(w, http.StatusInternalServerError, apperrors.ErrorWorkspaceUpdateFailed.Error())
		}
		return
	}
}

// DeleteWorkspace deletes workspace by ID.
//
// @Summary Delete workspace by ID
// @Description Delete workspace using the provided path parameter `id`.
// @Tags Workspaces
// @Param id path string true "The ID of the workspace to delete"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{} "Bad Request"
// @Failure 404 {object} map[string]interface{} "Not Found"
// @Router /workspaces/{id} [delete]
func (c *workspaceController) DeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, apperrors.ErrInvalidWorkspaceID.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	if err := c.service.DeleteWorkspace(ctx, id); err != nil {
		c.logger.Error("failed to delete workspace", zap.String("workspaceID", id.String()), zap.Error(err))
		switch {
		case errors.Is(err, apperrors.ErrWorkspaceNotFound):
			utils.RespondWithError(w, http.StatusNotFound, apperrors.ErrWorkspaceNotFound.Error())
		default:
			utils.RespondWithError(w, http.StatusInternalServerError, apperrors.ErrorWorkspaceDeleteFailed.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (c *workspaceController) GetTestimonialsByWorkspaceID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "workspaceID")
	id, err := uuid.Parse(idStr)
	if err != nil || id == uuid.Nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace ID", idStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid or missing ID")
		return
	}

	queryParams := r.URL.Query()
	filters := models.GetFilterFromParam(queryParams)

	testimonials, err := c.testimonialSvc.FetchByWorkspaceID(r.Context(), id, filters)
	if err != nil {
		c.logger.Error("failed to get testimonial", zap.String("testimonial ID", id.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, testimonials)
}

func (c *workspaceController) GetTestimonial(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "testimonialID")
	id, err := uuid.Parse(idStr)
	if err != nil || id == uuid.Nil {
		c.logger.Error("invalid testimonial ID", zap.String("testimonial ID", idStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid or missing ID")
		return
	}

	testimonials, err := c.testimonialSvc.FetchByID(r.Context(), id)
	if err != nil {
		c.logger.Error("failed to get testimonial", zap.String("testimonial ID", id.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, testimonials)
}
