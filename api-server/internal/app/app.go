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

	midware "github.com/ifeanyidike/cenphi/internal/middleware"
	"go.uber.org/zap"
)

type Application struct {
	Config                *config.Config
	Logger                *zap.Logger
	DB                    *sql.DB
	AuthMiddleware        *midware.AuthMiddleware
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

	authMiddleware, err := midware.NewAuthMiddleware(cfg.Server.FirebaseProjectID, logger)
	if err != nil {
		log.Fatalf("failed to create auth middleware: %v", err)
	}
	// token := &oauth2.Token{
	// 	AccessToken:  cfg.Providers.Google.AccessToken,
	// 	RefreshToken: cfg.Providers.Google.RefreshToken,
	// 	Expiry:       time.Now().Add(1 * time.Hour),
	// }

	// initialize repositories
	repo := repositories.NewRepositoryManager(redisClient)
	userRepo := repositories.NewUserRepository(redisClient)
	teamMemberRepo := repositories.NewTeamMemberRepository(redisClient)
	testimonialRepo := repositories.NewTestimonialRepository(redisClient)
	workspaceRepo := repositories.NewWorkspaceRepository(redisClient)
	customerProfileRepo := repositories.NewCustomerProfileRepository(redisClient)
	providerRepo := repositories.NewProviderConfigRepository(redisClient)

	// initialize OAuth service
	oauthService := services.NewOAuthService(
		redisClient,
		cfg.Server.BaseURL+"/api/v1/oauth/callback",
		cfg,
	)

	// initialize sentiment service
	sentimentService := services.NewSentimentService(
		grpcClient,
		cfg.Services.OpenAI.APIKey,
		true,
	)

	// // initialize providers
	// twitter := providers.NewTwitterProvider(
	// 	cfg.Providers.Twitter.BearerToken,
	// 	cfg.Providers.Twitter.Username,
	// 	cfg.Providers.Twitter.APIKey,
	// 	cfg.Providers.Twitter.APISecret,
	// 	customerProfileRepo,
	// 	db,
	// )
	// instagram := providers.NewInstagramProvider(
	// 	cfg.Providers.Instagram.AccessToken,
	// 	cfg.Providers.Instagram.UserID,
	// 	customerProfileRepo,
	// 	db,
	// )
	facebook := providers.NewFacebookProvider(
		cfg.Providers.Facebook.ClientID,
		cfg.Providers.Facebook.ClientSecret,
		oauthService,
		sentimentService,
		customerProfileRepo,
		db,
	)
	// trustpilot := providers.NewTrustpilotProvider(
	// 	cfg.Providers.Trustpilot.APIKey,
	// 	cfg.Providers.Trustpilot.BusinessID,
	// 	customerProfileRepo,
	// 	db,
	// )
	// yelp := providers.NewYelpProvider(
	// 	cfg.Providers.Yelp.APIKey,
	// 	cfg.Providers.Yelp.BusinessID,
	// 	customerProfileRepo,
	// 	db,
	// )
	// google := providers.NewGoogleProvider(
	// 	cfg.Providers.Google.ClientID,
	// 	cfg.Providers.Google.ClientSecret,
	// 	cfg.Providers.Google.AccountName,
	// 	token,
	// 	customerProfileRepo,
	// 	db,
	// )

	// providers := []providers.Provider{twitter, instagram, facebook, trustpilot, yelp, google}
	providers := []providers.Provider{facebook}

	// initialize services
	userService := services.NewUserService(userRepo, db)
	teamMemberService := services.NewTeamMemberService(teamMemberRepo, db)
	onboardingService := services.NewOnboardingService(repo, db)
	testimonialService := services.NewTestimonialService(testimonialRepo, db)
	workspaceService := services.NewWorkspaceService(workspaceRepo, db)
	providerService := services.NewProviderService(
		providers,
		ratelimit.NewRedisLimiter(redisClient),
		testimonialRepo,
		customerProfileRepo,
		providerRepo,
		oauthService,
		sentimentService,
		db,
	)

	// initialize controllers
	userController := controllers.NewUserController(userService, logger)
	teamMemberController := controllers.NewTeamMemberController(teamMemberService, userService, logger)
	onboardingController := controllers.NewOnboardingController(onboardingService, logger)
	healthController := controllers.NewHealthController(logger)
	swaggerController := controllers.NewSwaggerController()
	testimonialController := controllers.NewTestimonialController(testimonialService, *providerService, logger)
	workspaceController := controllers.NewWorkspaceController(workspaceService, testimonialService, logger)

	return &Application{
		Config:                cfg,
		Logger:                logger,
		AuthMiddleware:        authMiddleware,
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
	app.Logger.Info("environment log", zap.String("environment", app.Config.Server.Environment))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		app.Logger.Error("server encountered an error", zap.Error(err))
		return err
	}
	return nil
}

// func (app *Application) Run(mux http.Handler) error {
// 	server := &http.Server{
// 		Addr:         app.Config.Server.Address, // e.g., ":8081"
// 		Handler:      mux,
// 		WriteTimeout: 10 * time.Second,
// 		ReadTimeout:  10 * time.Second,
// 		IdleTimeout:  30 * time.Second,
// 	}

// 	app.Logger.Info("server started", zap.String("address", app.Config.Server.Address))

// 	if app.Config.Server.Environment == "production" {
// 		// Read certificate and key paths from environment variables
// 		certFile := os.Getenv("SSL_CERT_FILE") // e.g., "/etc/ssl/certs/fullchain.pem"
// 		keyFile := os.Getenv("SSL_KEY_FILE")   // e.g., "/etc/ssl/certs/privkey.pem"
// 		app.Logger.Info("Running in production mode with HTTPS")
// 		if err := server.ListenAndServeTLS(certFile, keyFile); err != nil && err != http.ErrServerClosed {
// 			app.Logger.Error("server encountered an error", zap.Error(err))
// 			return err
// 		}
// 	} else {
// 		app.Logger.Info("Running in development mode with HTTP")
// 		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
// 			app.Logger.Error("server encountered an error", zap.Error(err))
// 			return err
// 		}
// 	}
// 	return nil
// }

func (app *Application) Mount() http.Handler {
	r := chi.NewRouter()

	m := midware.NewMiddleware(app.Logger)

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
		app.AuthMiddleware,
		app.HealthController,
		*app.UserController,
		app.SwaggerController,
		app.WorkspaceController,
		app.TeamMemberController,
		app.OnboardingController,
		app.TestimonialController,
	)

	return r
}
