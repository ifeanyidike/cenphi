package main

import (
	"log"
	"os"

	_ "github.com/ifeanyidike/cenphi/docs" // Import generated Swagger docs
	"github.com/ifeanyidike/cenphi/internal/app"
	"github.com/ifeanyidike/cenphi/internal/config"
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
	// if err := config.LoadEnv(); err != nil {
	// 	log.Fatalf("Error loading .env file: %v", err)
	// }
	if os.Getenv("DEBUG_TLS") == "true" {
		os.Setenv("GODEBUG", "x509roots=1,x509cert=1")
	}

	config.LoadEnv()

	cfg := config.NewConfig()
	db, redisClient, err := config.InitializeDatabase(cfg)

	if err != nil {
		log.Fatalf("Failed to initialize database and redis: %v", err)
	}

	grpc := config.NewIntelligence()
	grpcConn, err := grpc.ConnectToService()
	if err != nil {
		log.Fatalf("Error connecting to intelligence service: %v", err)
	}
	// grpcClient := grpc.GetClient()

	defer grpcConn.Close()
	defer db.Close()
	defer redisClient.Close()

	// Initialize the application
	app := app.NewApplication(cfg, db, redisClient, grpc.GetClient())
	defer app.Logger.Sync()

	// Start the server
	if err := app.Run(app.Mount()); err != nil {
		app.Logger.Fatal("server failed to start", zap.Error(err))
		os.Exit(1)
	}
}
