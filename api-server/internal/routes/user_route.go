package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
)

func RegisterUserRoutes(r chi.Router, controller controllers.UserController) {
	r.Route("/users", func(r chi.Router) {
		r.Get("/", controller.GetUser)
		r.Post("/", controller.RegisterUser)
	})
}
