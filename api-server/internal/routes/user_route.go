package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware" // adjust import as needed
)

func RegisterUserRoutes(r chi.Router, controller controllers.UserController, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/users", func(r chi.Router) {
		// Public route: no auth required
		r.Post("/register", controller.RegisterUser)

		// Protected routes: apply the auth middleware to this group
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Get("/{id}", controller.GetUser)
			r.Put("/{uid}", controller.UpdateUser)
		})
	})
}
