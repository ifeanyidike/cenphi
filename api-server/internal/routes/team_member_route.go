package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
)

func RegisterTeamMemberRoutes(r chi.Router, controller controllers.TeamMemberController) {
	r.Route("/team-member", func(r chi.Router) {
		r.Get("/{id}", controller.GetTeamMember)
		r.Post("/", controller.CreateTeamMember)
		r.Delete("/{id}", controller.DeleteTeamMember)
		r.Get("/", controller.GetTeamMembers)
	})
}
