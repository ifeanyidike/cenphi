package routes

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/ifeanyidike/cenphi/internal/config"
	mmiddleware "github.com/ifeanyidike/cenphi/internal/middleware"
	"go.uber.org/zap"
)

type Application struct {
	*config.Config
	Logger *zap.Logger
}

func (app *Application) Run(mux http.Handler) error {
	srv := &http.Server{
		Addr:         app.Server.Address,
		Handler:      mux,
		WriteTimeout: time.Minute * 10,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}
	app.Logger.Info("server started", zap.String("address", app.Server.Address))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		app.Logger.Error("server encountered an error", zap.Error(err))
		return err
	}
	return nil
}

func (app *Application) Mount() http.Handler {
	r := chi.NewRouter()

	m := mmiddleware.NewMiddleware(app.Logger)

	r.Use(m.Logging)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		// AllowedOrigins:   []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins: []string{"https://*", "http://*"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	r.Use(middleware.Timeout(60 * time.Second))

	r.Get("/health", app.HealthCheck)
	return r

}
