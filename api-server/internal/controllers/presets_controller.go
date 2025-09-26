package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type PresetController struct {
	service services.PresetService
	logger  *zap.Logger
}

func NewPresetController(service services.PresetService, logger *zap.Logger) PresetController {
	return PresetController{
		service: service,
		logger:  logger,
	}
}

func (c PresetController) GetPresetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	preset, err := c.service.GetPresetByID(r.Context(), id)
	if err != nil {
		c.logger.Error("Failed to get preset", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"preset": preset})
}

func (c PresetController) CreatePreset(w http.ResponseWriter, r *http.Request) {
	var preset repositories.Preset
	if err := json.NewDecoder(r.Body).Decode(&preset); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := c.service.CreatePreset(r.Context(), preset); err != nil {
		c.logger.Error("Failed to create preset", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create preset")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]any{"message": "Preset created successfully"})
}

func (c PresetController) DeletePreset(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := c.service.DeletePreset(r.Context(), id); err != nil {
		c.logger.Error("Failed to delete preset", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete preset")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"message": "Preset deleted successfully"})
}

func (c PresetController) ListPresets(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspace_id")
	id, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	presets, err := c.service.ListPresetsByWorkspace(r.Context(), id)
	if err != nil {
		c.logger.Error("Failed to list presets", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to list presets")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"presets": presets})
}

func (c PresetController) ListServicePresets(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspace_id")
	id, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	serviceIDStr := chi.URLParam(r, "service_id")
	serviceID, err := uuid.Parse(serviceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	presets, err := c.service.ListPresetsByWorkspaceAndService(r.Context(), id, serviceID)
	if err != nil {
		c.logger.Error("Failed to list presets", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to list presets")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"presets": presets})
}

func (c PresetController) UpdatePreset(w http.ResponseWriter, r *http.Request) {
	var preset repositories.Preset
	if err := json.NewDecoder(r.Body).Decode(&preset); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := c.service.UpdatePreset(r.Context(), preset); err != nil {
		c.logger.Error("Failed to update preset", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update preset")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"message": "Preset updated successfully"})
}
func (c PresetController) SetDefaultPreset(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		ServiceID   string `json:"service_id"`
		PresetID    string `json:"preset_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	if err := c.service.SetDefaultPreset(r.Context(), workspaceID, req.ServiceID, req.PresetID); err != nil {
		c.logger.Error("Failed to set default preset", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to set default preset")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"message": "Default preset set successfully"})
}
func (c PresetController) GetDefaultPreset(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "workspace_id")

	preset, err := c.service.GetDefaultPreset(r.Context(), workspaceID)
	if err != nil {
		c.logger.Error("Failed to get default preset", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get default preset")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"preset": preset})
}
