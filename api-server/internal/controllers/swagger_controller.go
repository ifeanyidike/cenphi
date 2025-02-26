package controllers

import (
	"net/http"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type SwaggerController struct{}

func NewSwaggerController() *SwaggerController {
	return &SwaggerController{}
}

func (s *SwaggerController) SwaggerHandler(w http.ResponseWriter, r *http.Request) {
	httpSwagger.Handler(
		httpSwagger.URL("http://localhost:8081/api/v1/swagger/doc.json"),
	).ServeHTTP(w, r)
}
