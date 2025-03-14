package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware"
)

func RegisterOnboardingRoutes(r chi.Router, controller controllers.OnboardingController, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/onboard", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Post("/", controller.OnboardOwner)
			r.Post("/partial", controller.OnboardOwner)
		})

	})
}
