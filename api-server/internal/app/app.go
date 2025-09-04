// internal/app/enhanced_app.go
package app

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/controllers"
	"github.com/ifeanyidike/cenphi/internal/mailing"
	"github.com/ifeanyidike/cenphi/internal/mailing/providers/brevo"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/routes"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/sharing"
	"github.com/ifeanyidike/cenphi/internal/storage"

	"github.com/redis/go-redis/v9"

	midware "github.com/ifeanyidike/cenphi/internal/middleware"
	"go.uber.org/zap"
)

type App struct {
	Config config.Config
	Logger *zap.Logger
	DB     *sql.DB
	Redis  *redis.Client
	// AIClient ai.Intelligence
	AIClient ai.AIClient

	// Middleware
	AuthMiddleware midware.AuthMiddleware

	// Controllers
	HealthController      controllers.HealthController
	UserController        controllers.UserController
	SwaggerController     controllers.SwaggerController
	WorkspaceController   controllers.WorkspaceController
	TeamMemberController  controllers.TeamMemberController
	OnboardingController  controllers.OnboardingController
	TestimonialController controllers.TestimonialController
	// CampaignController     *controllers.CampaignController
	// BrandContextController *controllers.BrandContextController
	// WebsocketController    *controllers.WebsocketController
	AITestController                controllers.AITestController
	SocialController                *controllers.SocialController
	TestimonialRequestController    controllers.TestimonialRequestController
	TestimonialCollectionController controllers.TestimonialCollectionController
	GoogleDriveController           controllers.GoogleDriveController
	SSETestimonialMonitor           *controllers.SSETestimonialMonitor
	AIProcessorController           controllers.AIProcessorController
	TestController                  controllers.TestController
	// Services
	StorageService storage.StorageFactory
	RateLimiter    *midware.RateLimiter

	// Workers
	// AIJobWorker *workers.AIJobWorker
	QueueWorkers []queue.Worker

	// WebSocket Hub
	// WSHub *services.WSHub

	ctx    context.Context
	cancel context.CancelFunc
}

func NewApplication(logger *zap.Logger, cfg config.Config, db *sql.DB, redisClient *redis.Client, cacheService cache.RedisCache, queueService queue.Service, media_intelligence ai.MediaIntelligence) *App {
	// Create application context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())

	// Initialize auth middleware
	authMiddleware, err := midware.NewAuthMiddleware(cfg.Server.FirebaseProjectID, logger)
	if err != nil {
		log.Fatalf("failed to create auth middleware: %v", err)
	}

	// Initialize ai client
	aiClient := ai.NewClient(cfg.AI)

	// Initialize storage service
	storageService, err := storage.NewStorageFactory(ctx, storage.StorageType(cfg.Storage.Provider), cfg, logger)
	if err != nil {
		logger.Error("Failed to initialize storage service", zap.Error(err))
		// Continue anyway, storage operations will use local fallback
	}

	audioExtractor := storage.NewAudioExtractor(logger, "/tmp/cenphi_audio")
	rateLimiter := midware.NewRateLimiter(redisClient, logger)

	if err != nil {
		logger.Error("Failed to connect to AI service", zap.Error(err))
		// Continue anyway, AI operations will fail gracefully
	}

	// Initialize repositories
	userRepo := repositories.NewUserRepository(redisClient)
	teamMemberRepo := repositories.NewTeamMemberRepository(redisClient)
	testimonialRepo := repositories.NewTestimonialRepository(redisClient)
	workspaceRepo := repositories.NewWorkspaceRepository(redisClient)
	socialAccountRepository := repositories.NewSocialAccountRepository(redisClient)
	socialPostRepository := repositories.NewSocialPostRepository(redisClient)
	testimonialReqRepo := repositories.NewTestimonialRequestRepository(db)
	jobRepo := repositories.NewJobRepository(redisClient)
	artifactsRepo := repositories.NewTestimonialArtifactRepository(redisClient)
	driveRepo := repositories.NewGoogleDriveRepository(redisClient)

	aiServiceManager := ai.NewAIServiceManager(cfg, cacheService, aiClient, audioExtractor, artifactsRepo, workspaceRepo, testimonialRepo, jobRepo, db, logger)
	testimonialService := services.NewTestimonialService(testimonialRepo, storageService, db, redisClient, logger)
	userService := services.NewUserService(userRepo, db, logger)
	teamMemberService := services.NewTeamMemberService(teamMemberRepo, db, logger)
	onboardingService := services.NewOnboardingService(db, logger, aiServiceManager)
	workspaceService := services.NewWorkspaceService(workspaceRepo, teamMemberRepo, testimonialRepo, db, redisClient, logger)
	linkedinService := sharing.NewLinkedInClient(cfg.Social, logger, cacheService)
	sharingService := sharing.NewSharingClient(
		cfg.Social,
		db,
		cacheService,
		queueService,
		logger,
		socialAccountRepository,
		socialPostRepository,
		linkedinService,
	)
	templateRenderer := mailing.NewTemplateRenderer(testimonialReqRepo, logger)
	brevoProvider := brevo.NewProvider(cfg.Mailing.BrevoAPIKey, logger)
	if err := brevoProvider.ValidateConfiguration(context.Background()); err != nil {
		logger.Error("Mailing provider validation failed", zap.Error(err))
	}

	mailingService := mailing.NewService(
		brevoProvider,
		templateRenderer,
		testimonialReqRepo,
		logger,
		db,
		mailing.Config{
			BaseURL:          cfg.Server.BaseURL,
			DefaultFromName:  cfg.Mailing.FromName,
			DefaultFromEmail: cfg.Mailing.FromEmail,
		},
	)
	driveService := services.NewDriveService(cfg.Google.Drive, cacheService, driveRepo, db, logger)
	testimonialCollService := services.NewTestimonialCollectionService(
		testimonialRepo, jobRepo, storageService, driveService, &mailingService, queueService, db, redisClient, logger)

	// Initialize WebSocket hub
	// wsHub := services.NewWSHub(logger, aiClient, testimonialService)
	// go wsHub.Run()

	// Initialize AI job worker
	// aiJobWorker := workers.NewAIJobWorker(testimonialService, aiClient, logger, 5)

	// Initialize controllers
	healthController := controllers.NewHealthController(logger)
	swaggerController := controllers.NewSwaggerController()
	userController := controllers.NewUserController(userService, logger)
	teamMemberController := controllers.NewTeamMemberController(teamMemberService, userService, logger)
	onboardingController := controllers.NewOnboardingController(onboardingService, logger)
	testimonialController := controllers.NewTestimonialController(testimonialService, logger)
	workspaceController := controllers.NewWorkspaceController(workspaceService, testimonialService, logger)

	socialController := controllers.NewSocialController(sharingService, logger, &cfg)

	aiTestController := controllers.NewAITestController(aiServiceManager, queueService, logger, cacheService)

	testimonialReqController := controllers.NewTestimonialRequestController(mailingService, logger)

	googleDriveController := controllers.NewGoogleDriveController(cfg, driveService, testimonialCollService, logger)
	testimonialCollController := controllers.NewTestimonialCollectionController(testimonialCollService, *driveService, logger)
	sseTestimonialMonitor := controllers.NewSSETestimonialMonitor(cacheService, logger)
	aiProcessorController := controllers.NewAIProcessorController(aiServiceManager, queueService, logger, cacheService)
	// testimonialCollController := controllers.NewTestimonialCollectionController(testimonialCollService, logger)
	testController := controllers.NewTestController(driveService, sharingService, logger)
	var queueWorkers []queue.Worker
	aiWorkers := ai.NewAIQueueWorker(ctx, queueService, aiServiceManager,
		media_intelligence, cacheService, db, workspaceRepo, testimonialRepo, artifactsRepo, jobRepo, logger)

	sharingWorker := sharing.NewSharingWorker(
		cfg.Social,
		db,
		cacheService,
		queueService,
		logger,
		socialAccountRepository,
		socialPostRepository,
		linkedinService,
		sharingService,
	)
	queueWorkers = append(queueWorkers, aiWorkers)
	queueWorkers = append(queueWorkers, sharingWorker)

	go queue.StartAll(queueWorkers, logger)

	return &App{
		Config:                          cfg,
		Logger:                          logger,
		DB:                              db,
		Redis:                           redisClient,
		AIClient:                        aiClient,
		AuthMiddleware:                  *authMiddleware,
		HealthController:                *healthController,
		UserController:                  userController,
		SwaggerController:               *swaggerController,
		WorkspaceController:             workspaceController,
		TeamMemberController:            teamMemberController,
		OnboardingController:            onboardingController,
		TestimonialController:           testimonialController,
		TestimonialRequestController:    testimonialReqController,
		TestimonialCollectionController: *testimonialCollController,
		GoogleDriveController:           googleDriveController,
		SSETestimonialMonitor:           sseTestimonialMonitor,
		AIProcessorController:           *aiProcessorController,
		AITestController:                *aiTestController,
		TestController:                  testController,
		StorageService:                  *storageService,
		QueueWorkers:                    queueWorkers,
		// WSHub:                  wsHub,
		SocialController: socialController,
		RateLimiter:      rateLimiter,
		ctx:              ctx,
		cancel:           cancel,
	}
}

func (app *App) Run(mux http.Handler) error {
	server := &http.Server{
		Addr:           app.Config.Server.Address,
		Handler:        mux,
		WriteTimeout:   app.Config.Server.WriteTimeout, // FIXED: Use config-driven timeouts
		ReadTimeout:    app.Config.Server.ReadTimeout,  // FIXED: Use config-driven timeouts
		IdleTimeout:    app.Config.Server.IdleTimeout,  // FIXED: Use config-driven timeouts
		MaxHeaderBytes: 32 << 20,                       // 32MB for headers (videos can have large headers)
	}

	// Start AI job worker
	// app.AIJobWorker.Start()

	app.Logger.Info("Enhanced server started",
		zap.String("address", app.Config.Server.Address),
		zap.String("environment", app.Config.Server.Environment))

	// Graceful shutdown logic
	go func() {
		<-app.ctx.Done() // Wait for context to be canceled
		app.Logger.Info("Shutting down application...")
		queue.StopAll(app.QueueWorkers, app.Logger)
		app.Logger.Info("Application shutdown complete")
	}()

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		app.Logger.Error("server encountered an error", zap.Error(err))
		return err
	}
	return nil
}

func (app *App) Mount() http.Handler {
	r := chi.NewRouter()

	m := midware.NewMiddleware(app.Logger)

	r.Use(m.Logging)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*", "http://localhost:8081", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// r.Use(middleware.Timeout(240 * time.Second))
	r.Use(middleware.Timeout(900 * time.Second))

	routes.RegisterRoutes(r,
		app.AuthMiddleware,
		app.HealthController,
		app.UserController,
		app.SwaggerController,
		app.WorkspaceController,
		app.TeamMemberController,
		app.OnboardingController,
		app.TestimonialController,
		app.SocialController,
		app.AITestController,
		app.TestimonialRequestController,
		app.TestimonialCollectionController,
		*app.SSETestimonialMonitor,
		app.GoogleDriveController,
		app.AIProcessorController,
		app.TestController,
		*app.RateLimiter,
	)

	return r
}

func (app *App) Shutdown() {
	app.cancel()
}
