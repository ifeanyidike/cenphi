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
	"github.com/ifeanyidike/cenphi/internal/providers"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/routes"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/pb"
	"github.com/ifeanyidike/cenphi/pkg/ratelimit"
	"github.com/redis/go-redis/v9"
	"golang.org/x/oauth2"

	mmiddleware "github.com/ifeanyidike/cenphi/internal/middleware"
	"go.uber.org/zap"
)

type Application struct {
	Config                *config.Config
	Logger                *zap.Logger
	DB                    *sql.DB
	RedisClient           *redis.Client
	GrpcClient            *pb.IntelligenceClient
	HealthController      *controllers.HealthController
	UserController        *controllers.UserController
	SwaggerController     *controllers.SwaggerController
	WorkspaceController   *controllers.WorkspaceController
	TeamMemberController  *controllers.TeamMemberController
	OnboardingController  *controllers.OnboardingController
	TestimonialController *controllers.TestimonialController
}

func NewApplication(cfg *config.Config, db *sql.DB, redisClient *redis.Client, grpcClient *pb.IntelligenceClient) *Application {
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Error initializing zap logger: %v", err)
	}

	// Initialize controllers
	repo := repositories.NewRepositoryManager(redisClient)

	userRepo := repositories.NewUserRepository(redisClient)
	userService := services.NewUserService(userRepo, db)
	userController := controllers.NewUserController(userService, logger)

	workspaceRepo := repositories.NewWorkspaceRepository(redisClient)
	workspaceService := services.NewWorkspaceService(workspaceRepo, db)
	workspaceController := controllers.NewWorkspaceController(workspaceService, logger)

	teamMemberRepo := repositories.NewTeamMemberRepository(redisClient)
	teamMemberService := services.NewTeamMemberService(teamMemberRepo, db)
	teamMemberController := controllers.NewTeamMemberController(teamMemberService, logger)

	onboardingService := services.NewOnboardingService(repo, db)
	onboardingController := controllers.NewOnboardingController(onboardingService, logger)

	healthController := controllers.NewHealthController(logger)
	swaggerController := controllers.NewSwaggerController()

	twitter := providers.NewTwitterProvider(cfg.Providers.Twitter.BearerToken, cfg.Providers.Twitter.Username, cfg.Providers.Twitter.APIKey, cfg.Providers.Twitter.APISecret)
	instagram := providers.NewInstagramProvider(cfg.Providers.Instagram.AccessToken, cfg.Providers.Instagram.UserID)
	facebook := providers.NewFacebookProvider(cfg.Providers.Facebook.AccessToken, cfg.Providers.Facebook.PageID)
	trustpilot := providers.NewTrustpilotProvider(cfg.Providers.Trustpilot.APIKey, cfg.Providers.Trustpilot.BusinessID)
	yelp := providers.NewYelpProvider(cfg.Providers.Yelp.APIKey, cfg.Providers.Yelp.BusinessID)

	token := &oauth2.Token{
		AccessToken:  cfg.Providers.Google.AccessToken,
		RefreshToken: cfg.Providers.Google.RefreshToken,
		Expiry:       time.Now().Add(1 * time.Hour),
	}
	google := providers.NewGoogleProvider(cfg.Providers.Google.ClientID, cfg.Providers.Google.ClientSecret, cfg.Providers.Google.AccountName, token)

	providers := []providers.Provider{
		twitter, instagram, facebook, trustpilot, yelp, google,
	}
	testimonialRepo := repositories.NewTestimonialRepository(redisClient, db)
	testimonialService := services.NewTestimonialService(testimonialRepo, db)

	// Create service
	providerService := services.NewProviderService(
		providers,
		ratelimit.NewRedisLimiter(redisClient),
		repositories.NewTestimonialRepository(redisClient, db),
		db,
	)

	testimonialController := controllers.NewTestimonialController(testimonialService, *providerService, logger)

	return &Application{
		Config:                cfg,
		Logger:                logger,
		HealthController:      healthController,
		UserController:        &userController,
		SwaggerController:     swaggerController,
		WorkspaceController:   &workspaceController,
		TeamMemberController:  &teamMemberController,
		OnboardingController:  &onboardingController,
		TestimonialController: &testimonialController,
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
	if app.Config.Server.Environment == "production" {
		// In production, use HTTPS
		if err := server.ListenAndServeTLS(app.Config.Server.CertFile, app.Config.Server.KeyFile); err != nil && err != http.ErrServerClosed {
			app.Logger.Error("server encountered an error", zap.Error(err))
			return err
		}
	} else {
		// In development, use HTTP
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			app.Logger.Error("server encountered an error", zap.Error(err))
			return err
		}
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
		*app.UserController,
		app.SwaggerController,
		app.WorkspaceController,
		app.TeamMemberController,
		app.OnboardingController,
	)

	return r
}
