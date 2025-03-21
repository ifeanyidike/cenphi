// controllers/provider_controller.go
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

type ProviderController interface {
	SetupProvider(w http.ResponseWriter, r *http.Request)
	GetProviderStatus(w http.ResponseWriter, r *http.Request)
}

type providerController struct {
	providerSvc services.ProviderService
	logger      *zap.Logger
}

func NewProviderController(providerSvc services.ProviderService, logger *zap.Logger) ProviderController {
	return &providerController{
		providerSvc: providerSvc,
		logger:      logger,
	}
}

func (c *providerController) SetupProvider(w http.ResponseWriter, r *http.Request) {
	providerName := chi.URLParam(r, "provider")
	workspaceIDStr := chi.URLParam(r, "workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil || workspaceID == uuid.Nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace ID", workspaceIDStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	var config models.ProviderConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		c.logger.Error("invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid configuration format")
		return
	}

	config.ProviderName = providerName
	config.WorkspaceID = workspaceID

	if err := c.providerSvc.ConfigureProvider(r.Context(), config); err != nil {
		c.logger.Error("failed to configure provider", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to configure provider")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "Provider configured successfully"})
}

func (c *providerController) GetProviderStatus(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil || workspaceID == uuid.Nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace ID", workspaceIDStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	configs, err := c.providerSvc.GetWorkspaceProviders(r.Context(), workspaceID)
	if err != nil {
		c.logger.Error("failed to get provider status", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get provider status")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, configs)
}
