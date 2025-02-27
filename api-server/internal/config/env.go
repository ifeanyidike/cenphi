package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

func LoadEnv() error {
	err := godotenv.Load(".env")
	if err != nil {
		err = godotenv.Load("../.env")
		if err != nil {
			err = godotenv.Load("../../.env")
			if err != nil {
				// If that fails too, try absolute path
				abs, _ := filepath.Abs(".env")
				log.Printf("Could not find .env file in current or parent directory. Looking in: %s", abs)

				// Check if file exists
				if _, err := os.Stat(".env"); os.IsNotExist(err) {
					log.Printf(".env file not found at %s", abs)
				}

				// Not failing here, as we might be using environment variables directly
				log.Printf("Warning: .env file not found, will rely on environment variables")
			}
		}

	}
	return err
}
