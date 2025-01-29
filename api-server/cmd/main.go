package main

import (
	"log"
	"os"

	_ "github.com/ifeanyidike/cenphi/docs" // Import generated Swagger docs
	"github.com/ifeanyidike/cenphi/internal/app"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/joho/godotenv"
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
	if err := godotenv.Load(); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	cfg := config.NewConfig()
	db, redisClient, err := config.InitializeDatabase(cfg)

	if err != nil {
		log.Fatalf("Failed to initialize database and redis: %v", err)
	}

	defer db.Close()
	defer redisClient.Close()

	// Initialize the application
	app := app.NewApplication(cfg, db, redisClient)
	defer app.Logger.Sync()

	// Start the server
	if err := app.Run(app.Mount()); err != nil {
		app.Logger.Fatal("server failed to start", zap.Error(err))
		os.Exit(1)
	}
}
