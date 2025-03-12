package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware"
)

func RegisterTeamMemberRoutes(r chi.Router, controller controllers.TeamMemberController, authMiddleware *middleware.AuthMiddleware) {
	r.Route("/team-member", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.VerifyToken)
			r.Get("/{id}", controller.GetTeamMember)
			r.Get("/user/{id}", controller.GetTeamMemberByUserID)
			r.Get("/firebase_uid/{id}", controller.GetTeamMemberByFirebaseUID)

			r.Post("/", controller.CreateTeamMember)
			r.Delete("/{id}", controller.DeleteTeamMember)
			r.Get("/", controller.GetTeamMembers)
		})

	})
}
