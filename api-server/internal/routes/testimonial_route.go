package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware"
)

func RegisterTestimonialRoutes(r chi.Router, controller controllers.TestimonialController, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/testimonials", func(r chi.Router) {
		// In your routes setup function
		r.Post("/fetch/{provider}/{workspaceID}", controller.FetchFromProvider)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Get("/{workspaceID}", controller.GetByWorkspaceID)
		})
	})
}
