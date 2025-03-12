package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware"
)

func RegisterWorkspaceRoutes(r chi.Router, controller controllers.WorkspaceController, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/workspaces", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Get("/", controller.GetWorkspace)
			r.Get("/{id}/testimonials", controller.GetTestimonialsByWorkspaceID)
			r.Post("/create", controller.CreateWorkspace)
			r.Put("/{id}", controller.UpdateWorkspace)
			r.Delete("/{id}", controller.DeleteWorkspace)
		})
	})
}
