package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
)

func RegisterRoutes(
	r chi.Router,
	healthController *controllers.HealthController,
	userController controllers.UserController,
	swaggerController *controllers.SwaggerController,
	workspaceController *controllers.WorkspaceController,
) {
	r.Route("/api/v1", func(r chi.Router) {
		RegisterHealthRoutes(r, healthController)
		RegisterUserRoutes(r, userController)
		RegisterSwaggerRoute(r, swaggerController)
		RegisterWorkspaceRoutes(r, *workspaceController)
	})
}
