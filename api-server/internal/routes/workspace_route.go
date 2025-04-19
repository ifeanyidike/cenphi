package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware"
)

func RegisterWorkspaceRoutes(r chi.Router, controller controllers.WorkspaceController, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/workspaces", func(r chi.Router) {
		// Apply auth middleware to all workspace routes
		r.Use(authMiddleware.VerifyToken)

		// Workspace CRUD operations
		r.Post("/", controller.CreateWorkspace)       // Create a new workspace
		r.Get("/", controller.GetWorkspace)           // Get all workspaces for the user
		r.Get("/{id}", controller.GetWorkspace)       // Get a specific workspace
		r.Put("/{id}", controller.UpdateWorkspace)    // Update a workspace
		r.Delete("/{id}", controller.DeleteWorkspace) // Delete a workspace

		// Testimonial operations for a workspace
		r.Route("/{workspaceID}/testimonials", func(r chi.Router) {
			r.Get("/", controller.GetTestimonialsByWorkspaceID)  // Get all testimonials for a workspace
			r.Get("/{testimonialID}", controller.GetTestimonial) // Get a specific testimonial within a workspace
		})
	})
}
