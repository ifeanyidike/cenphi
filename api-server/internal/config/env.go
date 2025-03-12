package config

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

func FindFile(filename string) (string, error) {
	// Possible locations to check
	paths := []string{
		filename,                         // Current directory
		filepath.Join("..", filename),    // Parent directory
		filepath.Join("../..", filename), // Grandparent directory
	}

	for _, path := range paths {
		if _, err := os.Stat(path); err == nil {
			absPath, _ := filepath.Abs(path)
			slog.Debug(fmt.Sprintf("File found %s", absPath))

			return path, nil
		}
	}

	// File not found in any location
	absPath, _ := filepath.Abs(filename)
	slog.Warn("File not found in any location", "filename: ", filename, " looked_at ", absPath)
	return "", fmt.Errorf("file %s not found in any location", filename)
}

// func LoadEnv() error {
// 	err := godotenv.Load(".env")
// 	if err != nil {
// 		err = godotenv.Load("../.env")
// 		if err != nil {
// 			err = godotenv.Load("../../.env")
// 			if err != nil {
// 				// If that fails too, try absolute path
// 				abs, _ := filepath.Abs(".env")
// 				log.Printf("Could not find .env file in current or parent directory. Looking in: %s", abs)

// 				// Check if file exists
// 				if _, err := os.Stat(".env"); os.IsNotExist(err) {
// 					log.Printf(".env file not found at %s", abs)
// 				}

// 				// Not failing here, as we might be using environment variables directly
// 				log.Printf("Warning: .env file not found, will rely on environment variables")
// 			}
// 		}

// 	}
// 	return err
// }

func LoadEnv() error {
	envFile := ".env"
	path, err := FindFile(envFile)

	if err != nil {
		slog.Warn("Warning: .env file not found, will rely on environment variables")
		return nil // Not failing, as we might be using environment variables directly
	}

	return godotenv.Load(path)
}
