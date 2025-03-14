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

type TestimonialController interface {
	HandleAPISubmission(w http.ResponseWriter, r *http.Request)
	TriggerSync(w http.ResponseWriter, r *http.Request)
	GetByWorkspaceID(w http.ResponseWriter, r *http.Request)
}

type testimonialController struct {
	svc         services.TestimonialService
	providerSvc services.ProviderService
	logger      *zap.Logger
}

func NewTestimonialController(svc services.TestimonialService, providerSvc services.ProviderService, logger *zap.Logger) TestimonialController {
	return &testimonialController{
		svc:         svc,
		providerSvc: providerSvc,
		logger:      logger,
	}
}

func (c *testimonialController) HandleAPISubmission(w http.ResponseWriter, r *http.Request) {
	var testimonial models.Testimonial

	if err := json.NewDecoder(r.Body).Decode(&testimonial); err != nil {
		c.logger.Error("invalid request payload", zap.Error(err))
	}

	if err := c.svc.ProcessTestimonials(r.Context(), []models.Testimonial{testimonial}); err != nil {
		c.logger.Error("failed to process testimonials", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to process testimonials")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, "Testimonial is processed successfully")

}

func (c *testimonialController) TriggerSync(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if err := c.providerSvc.SyncProvider(r.Context(), provider); err != nil {
		c.logger.Error("failed to sync provider", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to sync provider")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, "sync initiated")
}

func (c *testimonialController) GetByWorkspaceID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "workspaceID")
	id, err := uuid.Parse(idStr)
	if err != nil || id == uuid.Nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace ID", idStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid or missing ID")
		return
	}

	queryParams := r.URL.Query()
	filters := models.GetFilterFromParam(queryParams)

	testimonials, err := c.svc.FetchByWorkspaceID(r.Context(), id, filters)
	if err != nil {
		c.logger.Error("failed to get testimonial", zap.String("testimonial ID", id.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, testimonials)
}
