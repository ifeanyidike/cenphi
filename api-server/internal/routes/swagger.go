package routes

import (
	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/controllers"
)

func RegisterSwaggerRoute(r chi.Router, controller *controllers.SwaggerController) {
	r.Get("/swagger/*", controller.SwaggerHandler)
}
