// internal/controllers/content_folder_controller.go
package controllers

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

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

// DownloadFolderAsZip downloads all artifacts in a folder as a zip file
// @Summary Download Folder as ZIP
// @Description Download all artifacts in a folder as a zip file
// @Tags Content Folders
// @Accept json
// @Produce application/zip
// @Param workspaceID path string true "Workspace ID"
// @Param folderID path string true "Folder ID"
// @Success 200 {file} application/zip
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/folders/{folderID}/download [get]
func (c *ContentFolderController) DownloadFolderAsZip(w http.ResponseWriter, r *http.Request) {
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

	// Get folder with items
	folderWithItems, err := c.service.GetFolderWithItems(r.Context(), folderID, workspaceID)
	if err != nil {
		c.logger.Error("Failed to get folder with items", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Check if folder has items
	if len(folderWithItems.Artifacts) == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "Folder is empty")
		return
	}

	// Set headers for zip download
	folderName := sanitizeFilename(folderWithItems.Name)
	timestamp := time.Now().Format("20060102_150405")
	zipFilename := fmt.Sprintf("%s_%s.zip", folderName, timestamp)

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", zipFilename))
	// Don't call WriteHeader yet - let http.ResponseWriter handle it automatically

	// Create zip writer
	zipWriter := zip.NewWriter(w)
	defer func() {
		if err := zipWriter.Close(); err != nil {
			c.logger.Error("Failed to close zip writer", zap.Error(err))
		}
	}()

	// Track filenames to avoid duplicates
	filenameCount := make(map[string]int)

	// Add each artifact to the zip
	for _, artifact := range folderWithItems.Artifacts {
		// Check if this is a clip collection
		if artifact.ProcessingType == "clipping" {
			// Handle clip collection - extract and download all clips
			clips, ok := artifact.Data["generated_clips"]
			if !ok {
				c.logger.Warn("Clip collection has no generated_clips",
					zap.String("artifact_id", artifact.ID.String()))
				continue
			}

			clipsArray, ok := clips.([]interface{})
			if !ok || len(clipsArray) == 0 {
				c.logger.Warn("Invalid or empty clips array",
					zap.String("artifact_id", artifact.ID.String()))
				continue
			}

			// Create a subfolder for this clip collection using the artifact ID
			collectionName := fmt.Sprintf("clip_collection_%s", sanitizeFilename(artifact.ID.String()[:8]))

			// Download each clip in the collection
			for idx, clipInterface := range clipsArray {
				clipMap, ok := clipInterface.(map[string]interface{})
				if !ok {
					continue
				}

				clipURL, ok := clipMap["url"].(string)
				if !ok || clipURL == "" {
					continue
				}

				// Download the clip
				clipResp, err := http.Get(clipURL)
				if err != nil {
					c.logger.Error("Failed to download clip",
						zap.Int("index", idx),
						zap.String("url", clipURL),
						zap.Error(err))
					continue
				}
				defer clipResp.Body.Close()

				if clipResp.StatusCode != http.StatusOK {
					continue
				}

				// Generate filename for clip within subfolder
				clipTitle, _ := clipMap["title"].(string)
				var clipFilename string
				if clipTitle != "" {
					clipFilename = fmt.Sprintf("%s/clip_%03d_%s.mp4", collectionName, idx+1, sanitizeFilename(clipTitle))
				} else {
					clipFilename = fmt.Sprintf("%s/clip_%03d.mp4", collectionName, idx+1)
				}

				// Create file in zip
				clipZipFile, err := zipWriter.Create(clipFilename)
				if err != nil {
					c.logger.Error("Failed to create clip zip entry",
						zap.String("filename", clipFilename),
						zap.Error(err))
					continue
				}

				// Copy clip content to zip
				_, err = io.Copy(clipZipFile, clipResp.Body)
				if err != nil {
					c.logger.Error("Failed to write clip to zip",
						zap.String("filename", clipFilename),
						zap.Error(err))
					continue
				}

				// Flush after each clip
				if err := zipWriter.Flush(); err != nil {
					c.logger.Warn("Failed to flush zip writer",
						zap.String("filename", clipFilename),
						zap.Error(err))
				}

				c.logger.Info("Added clip to zip",
					zap.Int("index", idx),
					zap.String("filename", clipFilename))
			}

			continue // Skip to next artifact
		}

		// Handle regular artifacts (non-clip-collections)
		if artifact.AssetURL == nil || *artifact.AssetURL == "" {
			c.logger.Warn("Skipping artifact with no asset URL",
				zap.String("artifact_id", artifact.ID.String()))
			continue
		}

		assetURL := *artifact.AssetURL

		// Download the file from URL
		resp, err := http.Get(assetURL)
		if err != nil {
			c.logger.Error("Failed to download artifact",
				zap.String("artifact_id", artifact.ID.String()),
				zap.String("url", assetURL),
				zap.Error(err))
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.logger.Error("Failed to download artifact, bad status",
				zap.String("artifact_id", artifact.ID.String()),
				zap.Int("status", resp.StatusCode))
			continue
		}

		// Generate filename
		filename := generateArtifactFilename(artifact, assetURL)
		filename = ensureUniqueFilename(filename, filenameCount)

		// Create file in zip
		zipFile, err := zipWriter.Create(filename)
		if err != nil {
			c.logger.Error("Failed to create zip entry",
				zap.String("filename", filename),
				zap.Error(err))
			continue
		}

		// Copy content to zip
		_, err = io.Copy(zipFile, resp.Body)
		if err != nil {
			c.logger.Error("Failed to write to zip",
				zap.String("filename", filename),
				zap.Error(err))
			continue
		}

		// Flush the zip writer to send data to client progressively
		if err := zipWriter.Flush(); err != nil {
			c.logger.Warn("Failed to flush zip writer",
				zap.String("filename", filename),
				zap.Error(err))
		}

		c.logger.Info("Added artifact to zip",
			zap.String("artifact_id", artifact.ID.String()),
			zap.String("filename", filename))
	}
}

// DownloadClipCollectionAsZip downloads all clips from a clipping artifact as a zip file
// @Summary Download Clip Collection as ZIP
// @Description Download all clips from a clipping artifact as a zip file
// @Tags Content Folders
// @Accept json
// @Produce application/zip
// @Param workspaceID path string true "Workspace ID"
// @Param artifactID path string true "Artifact ID"
// @Success 200 {file} application/zip
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/artifacts/{artifactID}/clips/download [get]
func (c *ContentFolderController) DownloadClipCollectionAsZip(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	artifactID, err := uuid.Parse(chi.URLParam(r, "artifactID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid artifact ID")
		return
	}

	// Get the artifact (we'll need access to the artifact repository)
	// For now, we'll use the service to get artifacts by workspace
	artifacts, err := c.service.GetArtifactsByWorkspace(r.Context(), workspaceID)
	if err != nil {
		c.logger.Error("Failed to get artifacts", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Find the specific artifact
	var targetArtifact *models.TestimonialArtifact
	for i := range artifacts {
		if artifacts[i].ID == artifactID {
			targetArtifact = &artifacts[i]
			break
		}
	}

	if targetArtifact == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Artifact not found")
		return
	}

	// Verify it's a clipping artifact
	if targetArtifact.ProcessingType != "clipping" {
		utils.RespondWithError(w, http.StatusBadRequest, "Artifact is not a clip collection")
		return
	}

	// Extract clips from artifact.Data
	clips, ok := targetArtifact.Data["generated_clips"]
	if !ok {
		utils.RespondWithError(w, http.StatusBadRequest, "No clips found in artifact")
		return
	}

	clipsArray, ok := clips.([]interface{})
	if !ok {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid clips data format")
		return
	}

	if len(clipsArray) == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "Clip collection is empty")
		return
	}

	// Set headers for zip download
	timestamp := time.Now().Format("20060102_150405")
	zipFilename := fmt.Sprintf("clips_%s_%s.zip", targetArtifact.ID.String()[:8], timestamp)

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", zipFilename))
	// Don't call WriteHeader yet - let http.ResponseWriter handle it automatically

	// Create zip writer
	zipWriter := zip.NewWriter(w)
	defer func() {
		if err := zipWriter.Close(); err != nil {
			c.logger.Error("Failed to close zip writer", zap.Error(err))
		}
	}()

	// Add each clip to the zip
	for idx, clipInterface := range clipsArray {
		clipMap, ok := clipInterface.(map[string]interface{})
		if !ok {
			c.logger.Warn("Skipping invalid clip data", zap.Int("index", idx))
			continue
		}

		// Get clip URL
		clipURL, ok := clipMap["url"].(string)
		if !ok || clipURL == "" {
			c.logger.Warn("Skipping clip with no URL", zap.Int("index", idx))
			continue
		}

		// Download the clip
		resp, err := http.Get(clipURL)
		if err != nil {
			c.logger.Error("Failed to download clip",
				zap.Int("index", idx),
				zap.String("url", clipURL),
				zap.Error(err))
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.logger.Error("Failed to download clip, bad status",
				zap.Int("index", idx),
				zap.Int("status", resp.StatusCode))
			continue
		}

		// Generate filename for clip
		clipID, _ := clipMap["id"].(string)
		clipTitle, _ := clipMap["title"].(string)

		var filename string
		if clipTitle != "" {
			filename = fmt.Sprintf("clip_%03d_%s.mp4", idx+1, sanitizeFilename(clipTitle))
		} else if clipID != "" {
			filename = fmt.Sprintf("clip_%03d_%s.mp4", idx+1, clipID[:8])
		} else {
			filename = fmt.Sprintf("clip_%03d.mp4", idx+1)
		}

		// Create file in zip
		zipFile, err := zipWriter.Create(filename)
		if err != nil {
			c.logger.Error("Failed to create zip entry",
				zap.String("filename", filename),
				zap.Error(err))
			continue
		}

		// Copy content to zip
		_, err = io.Copy(zipFile, resp.Body)
		if err != nil {
			c.logger.Error("Failed to write clip to zip",
				zap.String("filename", filename),
				zap.Error(err))
			continue
		}

		// Flush the zip writer to send data to client progressively
		if err := zipWriter.Flush(); err != nil {
			c.logger.Warn("Failed to flush zip writer",
				zap.String("filename", filename),
				zap.Error(err))
		}

		c.logger.Info("Added clip to zip",
			zap.Int("index", idx),
			zap.String("filename", filename))
	}
}

// Helper functions

func sanitizeFilename(name string) string {
	// Remove or replace invalid filename characters
	replacer := strings.NewReplacer(
		"/", "_",
		"\\", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
		" ", "_",
	)
	sanitized := replacer.Replace(name)

	// Limit length
	if len(sanitized) > 50 {
		sanitized = sanitized[:50]
	}

	return sanitized
}

func generateArtifactFilename(artifact models.TestimonialArtifact, assetURL string) string {
	// Try to get file extension from URL
	ext := filepath.Ext(assetURL)
	if ext == "" {
		// Default to mp4 for video content
		if artifact.ContentType == "video/mp4" || strings.Contains(artifact.ProcessingType, "video") {
			ext = ".mp4"
		} else {
			ext = ".bin"
		}
	}

	// Generate filename based on artifact type and ID
	var baseName string
	if artifact.ResultCategory != "" {
		baseName = fmt.Sprintf("%s_%s", artifact.ProcessingType, artifact.ResultCategory)
	} else {
		baseName = artifact.ProcessingType
	}

	// Add artifact ID for uniqueness
	baseName = fmt.Sprintf("%s_%s", baseName, artifact.ID.String()[:8])

	return sanitizeFilename(baseName) + ext
}

func ensureUniqueFilename(filename string, filenameCount map[string]int) string {
	originalFilename := filename
	count, exists := filenameCount[filename]

	if !exists {
		filenameCount[filename] = 1
		return filename
	}

	// File already exists, add counter
	ext := filepath.Ext(filename)
	nameWithoutExt := strings.TrimSuffix(filename, ext)

	for {
		count++
		newFilename := fmt.Sprintf("%s_(%d)%s", nameWithoutExt, count, ext)
		if _, exists := filenameCount[newFilename]; !exists {
			filenameCount[originalFilename] = count
			filenameCount[newFilename] = 1
			return newFilename
		}
	}
}
