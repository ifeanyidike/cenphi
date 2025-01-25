package app

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/routes"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/redis/go-redis/v9"

	mmiddleware "github.com/ifeanyidike/cenphi/internal/middleware"
	"go.uber.org/zap"
)

type Application struct {
	Config            *config.Config
	Logger            *zap.Logger
	DB                *sql.DB
	RedisClient       *redis.Client
	HealthController  *controllers.HealthController
	UserController    *controllers.UserController
	SwaggerController *controllers.SwaggerController
}

func NewApplication(cfg *config.Config, db *sql.DB, redisClient *redis.Client) *Application {
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Error initializing zap logger: %v", err)
	}

	// Initialize controllers
	userRepo := repositories.NewUserRepository(db)
	userService := services.NewUserService(userRepo)
	userController := controllers.NewUserController(userService, logger)

	healthController := controllers.NewHealthController(logger)
	swaggerController := controllers.NewSwaggerController()

	return &Application{
		Config:            cfg,
		Logger:            logger,
		HealthController:  healthController,
		UserController:    &userController,
		SwaggerController: swaggerController,
	}
}

func (app *Application) Run(mux http.Handler) error {

	server := &http.Server{
		Addr:         app.Config.Server.Address,
		Handler:      mux,
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	app.Logger.Info("server started", zap.String("address", app.Config.Server.Address))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
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
		AllowedOrigins: []string{"https://*", "http://*", "http://localhost:8081"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	r.Use(middleware.Timeout(60 * time.Second))

	routes.RegisterRoutes(r,
		app.HealthController,
		app.UserController,
		app.SwaggerController,
	)
	return r
}
