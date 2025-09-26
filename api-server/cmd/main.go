package main

import (
	_ "expvar"
	"log"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/ifeanyidike/cenphi/docs" // Import generated Swagger docs
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/app"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"go.uber.org/zap"
)

// @title Cenphi API
// @version 1.0
// @description API documentation for Cenphi.
// @termsOfService http://example.com/terms/

// @host localhost:8081
// @BasePath /api/v1
func main() {
	// Load environment variables
	if os.Getenv("DEBUG_TLS") == "true" {
		os.Setenv("GODEBUG", "x509roots=1,x509cert=1")
	}

	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Error initializing zap logger: %v", err)
	}
	defer logger.Sync()

	config.LoadEnv(".env")

	cfg := config.NewConfig()
	db, redisClient, err := config.InitializeDatabase(cfg)

	if err != nil {
		log.Fatalf("Failed to initialize database and redis: %v", err)
	}

	defer db.Close()
	defer redisClient.Close()

	mediaIntelligence, err := ai.NewGRPCClients(cfg.MediaIntelligence)
	if err != nil {
		logger.Fatal("Failed to initialize gRPC clients", zap.Error(err))
	}
	defer mediaIntelligence.Close()

	cacheService, err := cache.NewRedisCache(redisClient)
	if err != nil {
		logger.Fatal("Failed to initialize cache service", zap.Error(err))
	}

	// Initialize RabbitMQ queue service
	// queueService, err := queue.NewRabbitMQ(cfg.RabbitMQ, logger, cacheService)
	queueService, err := queue.NewRedisQueue(redisClient, cacheService, logger)
	if err != nil {
		logger.Fatal("Failed to initialize queue service", zap.Error(err))
	}
	defer queueService.Close()

	// Health check before starting workers
	if err := queueService.HealthCheck(); err != nil {
		logger.Warn("RabbitMQ health check failed", zap.Error(err))
		// Continue anyway - workers will retry
	} else {
		logger.Info("RabbitMQ health check passed")
	}

	// Initialize the application
	app := app.NewApplication(logger, cfg, db, redisClient, cacheService, queueService, mediaIntelligence)

	// Start the HTTP server
	mux := app.Mount()

	// Create a channel to listen for interrupt signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		logger.Info("Starting server", zap.String("address", cfg.Server.Address))
		if err := app.Run(mux); err != nil {
			logger.Error("Server error", zap.Error(err))
			// Send signal to quit channel if server fails to start
			quit <- syscall.SIGTERM
		}
	}()

	// Block here waiting for shutdown signal
	sig := <-quit
	logger.Info("Received shutdown signal", zap.String("signal", sig.String()))

	// Gracefully shutdown the application
	app.Shutdown()

	logger.Info("Server stopped gracefully")
}
