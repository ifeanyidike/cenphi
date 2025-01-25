package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
)

func RegisterHealthRoutes(r chi.Router, healthController *controllers.HealthController) {
	r.Get("/health", healthController.HealthCheck)
}
