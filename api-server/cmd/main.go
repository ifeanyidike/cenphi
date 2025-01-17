package main

import (
	"log"

	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/routes"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Error initializing zap logger: %v", err)
	}
	defer logger.Sync()

	if err := godotenv.Load(); err != nil {
		log.Fatalf("Error loading.env file %v", err)
	}

	cfg := config.NewConfig()
	db, redisClient, err := config.InitializeDatabase(cfg)

	if err != nil {
		log.Fatalf("Failed to initialize database and redis: %v", err)
		log.Panic(err)
	}

	defer db.Close()
	defer redisClient.Close()

	app := &routes.Application{
		Config: cfg,
		Logger: logger,
	}

	if err := app.Run(app.Mount()); err != nil {
		app.Logger.Fatal("server failed to start", zap.Error(err))
	}

}
