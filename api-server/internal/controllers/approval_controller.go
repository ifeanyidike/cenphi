// internal/controllers/approval_controller.go
package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type ApprovalController struct {
	artifactRepo repositories.TestimonialArtifactRepository
	db           repositories.DB
	logger       *zap.Logger
}

func NewApprovalController(
	artifactRepo repositories.TestimonialArtifactRepository,
	db repositories.DB,
	logger *zap.Logger,
) *ApprovalController {
	return &ApprovalController{
		artifactRepo: artifactRepo,
		db:           db,
		logger:       logger,
	}
}

type ApprovalRequest struct {
	Status string `json:"status"` // approved, rejected, pending, draft
}

type BulkApprovalRequest struct {
	ArtifactIDs []string `json:"artifact_ids"`
	Status      string   `json:"status"`
}

// ApproveArtifact approves a single artifact
// @Summary Approve Artifact
// @Description Approve an artifact for public display
// @Tags Approval
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param artifactID path string true "Artifact ID"
// @Param request body ApprovalRequest true "Approval data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/artifacts/{artifactID}/approve [post]
func (c *ApprovalController) ApproveArtifact(w http.ResponseWriter, r *http.Request) {
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

	var req ApprovalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		"approved": true,
		"rejected": true,
		"pending":  true,
		"draft":    true,
	}
	if !validStatuses[req.Status] {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid approval status")
		return
	}

	// Get user ID from context (set by auth middleware)
	userIDStr := utils.GetUserID(r)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.logger.Error("Invalid user ID in context", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Invalid user session")
		return
	}

	err = c.artifactRepo.UpdateApprovalStatus(r.Context(), workspaceID, artifactID, req.Status, userID, c.db)
	if err != nil {
		c.logger.Error("Failed to update approval status", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{
		"message":      "Artifact approval status updated",
		"artifact_id":  artifactID.String(),
		"status":       req.Status,
		"workspace_id": workspaceID.String(),
	})
}

// BulkApproveArtifacts approves multiple artifacts at once
// @Summary Bulk Approve Artifacts
// @Description Approve multiple artifacts at once
// @Tags Approval
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param request body BulkApprovalRequest true "Bulk approval data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/artifacts/bulk-approve [post]
func (c *ApprovalController) BulkApproveArtifacts(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	var req BulkApprovalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		"approved": true,
		"rejected": true,
		"pending":  true,
		"draft":    true,
	}
	if !validStatuses[req.Status] {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid approval status")
		return
	}

	// Parse artifact IDs
	artifactIDs := make([]uuid.UUID, 0, len(req.ArtifactIDs))
	for _, idStr := range req.ArtifactIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid artifact ID: "+idStr)
			return
		}
		artifactIDs = append(artifactIDs, id)
	}

	// Get user ID from context
	userIDStr := utils.GetUserID(r)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.logger.Error("Invalid user ID in context", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Invalid user session")
		return
	}

	err = c.artifactRepo.BulkUpdateApprovalStatus(r.Context(), workspaceID, artifactIDs, req.Status, userID, c.db)
	if err != nil {
		c.logger.Error("Failed to bulk update approval status", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":      "Artifacts approval status updated",
		"count":        len(artifactIDs),
		"status":       req.Status,
		"workspace_id": workspaceID.String(),
	})
}

// GetArtifactsByStatus retrieves artifacts filtered by approval status
// @Summary Get Artifacts By Status
// @Description Get artifacts filtered by approval status
// @Tags Approval
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param status query string true "Approval status" Enums(approved, rejected, pending, draft)
// @Success 200 {array} models.TestimonialArtifact
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /workspaces/{workspaceID}/artifacts/by-status [get]
func (c *ApprovalController) GetArtifactsByStatus(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	status := r.URL.Query().Get("status")
	if status == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Status parameter is required")
		return
	}

	artifacts, err := c.artifactRepo.GetArtifactsByApprovalStatus(r.Context(), workspaceID, status, c.db)
	if err != nil {
		c.logger.Error("Failed to get artifacts by status", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, artifacts)
}
