// internal/controllers/health.go
package controllers

import (
	"net/http"

	"go.uber.org/zap"
)

type HealthController struct {
	logger *zap.Logger
}

func NewHealthController(logger *zap.Logger) *HealthController {
	return &HealthController{
		logger: logger,
	}
}

// HealthCheck godoc
// @Summary Health Check
// @Description Returns the health status of the application
// @Tags Health
// @Accept json
// @Produce plain
// @Success 200 {string} string "Healthy"
// @Failure 500 {string} string "Unhealthy"
// @Router /health [get]
func (h *HealthController) HealthCheck(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Health check requested")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Healthy"))
}
