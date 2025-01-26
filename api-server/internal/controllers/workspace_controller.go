package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type WorkspaceController interface {
	GetWorkspace(w http.ResponseWriter, r *http.Request)
	CreateWorkspace(w http.ResponseWriter, r *http.Request)
}

type workspaceController struct {
	logger  *zap.Logger
	service services.WorkspaceService
}

func NewWorkspaceController(service services.WorkspaceService, logger *zap.Logger) WorkspaceController {
	return &workspaceController{logger: logger, service: service}
}

// GetWorkspace retrieves a user by ID.
// @Summary Get Workspace
// @Description Fetch a workspace by their ID.
// @Tags Workspaces
// @Accept json
// @Produce json
// @Param id query string true "User ID"
// @Success 200 {object} models.Workspace
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /users [get]
func (c *workspaceController) GetWorkspace(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	user, err := c.service.GetWorkspace(r.Context(), id)
	if err != nil {
		c.logger.Error("failed to get user", zap.String("userID", id), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, user)
}

// CreateWorkspace creates a new workspace.
// @Summary Create Workspace
// @Description Create a new workspace.
// @Tags Workspaces
// @Accept json
// @Produce json
// @Param user body models.Workspace true "Workspace data"
// @Success 201 {string} string "Workspace created successfully"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /users [post]
func (c *workspaceController) CreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var workspace models.Workspace

	// Parse and validate the input
	if err := json.NewDecoder(r.Body).Decode(&workspace); err != nil {
		c.logger.Error("invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if workspace.Name == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "The workspace data is malformed: Invalid workspace")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := c.service.CreateWorkspace(ctx, &workspace); err != nil {
		c.logger.Error("failed to create workspace", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create workspace")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, "Workspace created successfully")
}
