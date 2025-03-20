package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/middleware"
)

func RegisterRoutes(
	r chi.Router,
	authMiddleware *middleware.AuthMiddleware,
	healthController *controllers.HealthController,
	userController controllers.UserController,
	swaggerController *controllers.SwaggerController,
	workspaceController *controllers.WorkspaceController,
	teamMemberController *controllers.TeamMemberController,
	onboardingController *controllers.OnboardingController,
	testimonialController *controllers.TestimonialController,
) {
	r.Route("/api/v1", func(r chi.Router) {
		RegisterHealthRoutes(r, healthController)
		RegisterUserRoutes(r, userController, authMiddleware)
		RegisterSwaggerRoute(r, swaggerController)
		RegisterWorkspaceRoutes(r, *workspaceController, authMiddleware)
		RegisterTeamMemberRoutes(r, *teamMemberController, authMiddleware)
		RegisterOnboardingRoutes(r, *onboardingController, authMiddleware)
		RegisterTestimonialRoutes(r, *testimonialController, authMiddleware)
	})
}
