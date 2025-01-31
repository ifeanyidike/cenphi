package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
)

func RegisterOnboardingRoutes(r chi.Router, controller controllers.OnboardingController) {
	r.Route("/onboard", func(r chi.Router) {
		r.Post("/", controller.OnboardOwner)
	})
}
