// internal/controllers/health.go
package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/ifeanyidike/cenphi/internal/ai"
	"go.uber.org/zap"
)

type HealthController struct {
	logger      *zap.Logger
	grpcClients ai.MediaIntelligence
}

func NewHealthController(logger *zap.Logger, grpcClients ai.MediaIntelligence) *HealthController {
	return &HealthController{
		logger:      logger,
		grpcClients: grpcClients,
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

// GRPCHealthCheck godoc
// @Summary gRPC Health Check
// @Description Tests the gRPC connection to the AI service
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "gRPC connection is healthy"
// @Failure 500 {object} map[string]interface{} "gRPC connection failed"
// @Router /health/grpc [get]
func (h *HealthController) GRPCHealthCheck(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("gRPC health check requested")

	// Test the connection with a timeout
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	response := map[string]interface{}{
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	// Check if grpcClients is initialized
	if h.grpcClients == nil {
		h.logger.Error("gRPC clients not initialized")
		response["status"] = "unhealthy"
		response["error"] = "gRPC clients not initialized"
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Try to get the connection state
	state := h.grpcClients.GetConnectionState(ctx)

	response["status"] = "healthy"
	response["connection_state"] = state.String()
	response["message"] = "gRPC connection to AI service is working"

	h.logger.Info("gRPC health check passed", zap.String("state", state.String()))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
