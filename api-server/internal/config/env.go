package config

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strconv"
	"time"

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
		fileInfo, err := os.Stat(path)
		if err == nil && !fileInfo.IsDir() { // Check that it's a file, not a directory
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

func LoadEnv(envFile string) error {
	path, err := FindFile(envFile)

	if err != nil {
		slog.Warn("Warning: .env file not found, will rely on environment variables")
		return nil // Not failing, as we might be using environment variables directly
	}

	return godotenv.Load(path)
}

// Helper functions for environment variables
func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}

	return intValue
}

func getEnvBool(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		return defaultValue
	}

	return boolValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		return defaultValue
	}

	return duration
}

func getEnvInt64(key string, defaultValue int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return defaultValue
	}

	return intValue
}

// Environment-specific defaults
//
//	func getDefaultGRPCAddress(env string) string {
//		if env == "production" {
//			return os.Getenv("GRPC_PRODUCTION_ADDRESS") // Set in production .env
//		}
//		return "ai-service:8000" // Docker compose service name
//	}
// func getDefaultConnectTimeout(env string) time.Duration {
// 	if env == "production" {
// 		return 45 * time.Second // Shorter timeout for production
// 	}
// 	return 5 * time.Minute // Longer timeout for local development (container startup)
// }
