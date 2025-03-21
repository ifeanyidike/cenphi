package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware"
)

func RegisterProviderRoutes(r chi.Router, controller controllers.ProviderController, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/providers", func(r chi.Router) {
		// In your routes setup function
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			// In your routes setup
			r.Post("/setup/{provider}/{workspaceID}", controller.SetupProvider)
			r.Get("/status/{workspaceID}", controller.GetProviderStatus)
		})
	})
}
