package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
)

func RegisterWorkspaceRoutes(r chi.Router, controller controllers.WorkspaceController) {
	r.Route("/workspaces", func(r chi.Router) {
		r.Get("/", controller.GetWorkspace)
		r.Post("/", controller.CreateWorkspace)
		r.Put("/{id}", controller.UpdateWorkspace)
		r.Delete("/{id}", controller.DeleteWorkspace)
	})
}
