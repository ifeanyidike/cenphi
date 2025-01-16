package main

import (
	"log"

	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/routes"
	"github.com/joho/godotenv"
)

func main() {

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
	}
	mux := app.Mount()
	log.Fatal(app.Run(mux))

}
