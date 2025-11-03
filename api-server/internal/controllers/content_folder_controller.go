// internal/controllers/content_folder_controller.go
package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type ContentFolderController struct {
	service services.ContentFolderService
	logger  *zap.Logger
}

func NewContentFolderController(service services.ContentFolderService, logger *zap.Logger) *ContentFolderController {
	return &ContentFolderController{
		service: service,
		logger:  logger,
	}
}

// CreateFolder creates a new content folder
// @Summary Create Content Folder
// @Description Create a new folder for organizing AI-generated content
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param folder body models.CreateFolderRequest true "Folder data"
// @Success 201 {object} models.ContentFolder
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders [post]
func (c *ContentFolderController) CreateFolder(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	var req models.CreateFolderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	folder, err := c.service.CreateFolder(r.Context(), req, workspaceID)
	if err != nil {
		c.logger.Error("Failed to create folder", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, folder)
}

// ListFolders retrieves all folders for a workspace
// @Summary List Content Folders
// @Description Get all folders for a workspace
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Success 200 {array} models.ContentFolder
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders [get]
func (c *ContentFolderController) ListFolders(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	folders, err := c.service.ListFolders(r.Context(), workspaceID)
	if err != nil {
		c.logger.Error("Failed to list folders", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, folders)
}

// GetFolder retrieves a specific folder by ID
// @Summary Get Content Folder
// @Description Get a folder by ID
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param folderID path string true "Folder ID"
// @Success 200 {object} models.ContentFolder
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders/{folderID} [get]
func (c *ContentFolderController) GetFolder(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	folderID, err := uuid.Parse(chi.URLParam(r, "folderID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid folder ID")
		return
	}

	folder, err := c.service.GetFolder(r.Context(), folderID)
	if err != nil {
		c.logger.Error("Failed to get folder", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	// Verify folder belongs to workspace
	if folder.WorkspaceID != workspaceID {
		utils.RespondWithError(w, http.StatusNotFound, "Folder not found")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, folder)
}

// UpdateFolder updates a folder
// @Summary Update Content Folder
// @Description Update a folder's properties
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param folderID path string true "Folder ID"
// @Param folder body models.UpdateFolderRequest true "Folder update data"
// @Success 200 {object} models.ContentFolder
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders/{folderID} [put]
func (c *ContentFolderController) UpdateFolder(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	folderID, err := uuid.Parse(chi.URLParam(r, "folderID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid folder ID")
		return
	}

	var req models.UpdateFolderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	folder, err := c.service.UpdateFolder(r.Context(), folderID, req, workspaceID)
	if err != nil {
		c.logger.Error("Failed to update folder", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, folder)
}

// DeleteFolder deletes a folder
// @Summary Delete Content Folder
// @Description Delete a folder (cannot delete default folder or folder with items)
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param folderID path string true "Folder ID"
// @Success 204 "No Content"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders/{folderID} [delete]
func (c *ContentFolderController) DeleteFolder(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	folderID, err := uuid.Parse(chi.URLParam(r, "folderID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid folder ID")
		return
	}

	err = c.service.DeleteFolder(r.Context(), folderID, workspaceID)
	if err != nil {
		c.logger.Error("Failed to delete folder", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AddItemsToFolder adds artifacts to a folder
// @Summary Add Items to Folder
// @Description Add one or more artifacts to a folder
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param folderID path string true "Folder ID"
// @Param items body models.AddItemsToFolderRequest true "Artifact IDs to add"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders/{folderID}/items [post]
func (c *ContentFolderController) AddItemsToFolder(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	folderID, err := uuid.Parse(chi.URLParam(r, "folderID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid folder ID")
		return
	}

	var req models.AddItemsToFolderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	err = c.service.AddItemsToFolder(r.Context(), folderID, req, workspaceID)
	if err != nil {
		c.logger.Error("Failed to add items to folder", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Items added to folder successfully",
		"count":   len(req.ArtifactIDs),
	})
}

// RemoveItemFromFolder removes an artifact from a folder
// @Summary Remove Item from Folder
// @Description Remove an artifact from a folder
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param folderID path string true "Folder ID"
// @Param artifactID path string true "Artifact ID"
// @Success 204 "No Content"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders/{folderID}/items/{artifactID} [delete]
func (c *ContentFolderController) RemoveItemFromFolder(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	folderID, err := uuid.Parse(chi.URLParam(r, "folderID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid folder ID")
		return
	}

	artifactID, err := uuid.Parse(chi.URLParam(r, "artifactID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid artifact ID")
		return
	}

	err = c.service.RemoveItemFromFolder(r.Context(), folderID, artifactID, workspaceID)
	if err != nil {
		c.logger.Error("Failed to remove item from folder", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetFolderItems retrieves all artifacts in a folder
// @Summary Get Folder Items
// @Description Get all artifacts in a folder
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param folderID path string true "Folder ID"
// @Success 200 {array} models.TestimonialArtifact
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders/{folderID}/items [get]
func (c *ContentFolderController) GetFolderItems(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	folderID, err := uuid.Parse(chi.URLParam(r, "folderID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid folder ID")
		return
	}

	artifacts, err := c.service.GetFolderItems(r.Context(), folderID, workspaceID)
	if err != nil {
		c.logger.Error("Failed to get folder items", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, artifacts)
}

// GetFolderWithItems retrieves a folder with its artifacts
// @Summary Get Folder with Items
// @Description Get a folder along with all its artifacts
// @Tags Content Folders
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param folderID path string true "Folder ID"
// @Success 200 {object} models.FolderWithItems
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders/{folderID}/details [get]
func (c *ContentFolderController) GetFolderWithItems(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	folderID, err := uuid.Parse(chi.URLParam(r, "folderID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid folder ID")
		return
	}

	folderWithItems, err := c.service.GetFolderWithItems(r.Context(), folderID, workspaceID)
	if err != nil {
		c.logger.Error("Failed to get folder with items", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, folderWithItems)
}
