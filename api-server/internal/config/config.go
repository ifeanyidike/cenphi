package config

import (
	"fmt"
	"os"
	"sync"
)

type Config struct {
	Server    ServerConfig
	Database  DatabaseConfig
	Redis     RedisConfig
	AWS       AWSConfig
	Providers ProviderConfig
	Services  ServicesConfig
}

type ServerConfig struct {
	Address           string
	MaxUploadSize     int64
	CertFile          string
	KeyFile           string
	Environment       string
	FirebaseProjectID string
	BaseURL           string
}

type ServicesConfig struct {
	OpenAI
}

type OpenAI struct {
	APIKey string
}

type DatabaseConfig struct {
	DSN string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type AWSConfig struct {
	Region     string
	BucketName string
}

var (
	once sync.Once
	Cfg  *Config
)

func NewConfig() *Config {
	once.Do(func() {
		Cfg = &Config{
			Server: ServerConfig{
				Address:           os.Getenv("SERVER_ADDRESS"),
				MaxUploadSize:     10 * 1024 * 1024, // 10MB
				Environment:       os.Getenv("GO_ENV"),
				FirebaseProjectID: os.Getenv("FIREBASE_PROJECT_ID"),
				BaseURL:           os.Getenv("BASE_URL"),
			},
			Database: DatabaseConfig{
				DSN: fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
					os.Getenv("DB_USERNAME"),
					os.Getenv("DB_PASSWORD"),
					os.Getenv("DB_HOST"),
					os.Getenv("DB_PORT"),
					os.Getenv("DB_NAME"),
					os.Getenv("DB_SSL_MODE"),
				),
			},
			Redis: RedisConfig{
				Host:     os.Getenv("REDIS_HOST"),
				Port:     os.Getenv("REDIS_PORT"),
				Password: os.Getenv("REDIS_PASSWORD"),
				DB:       0,
			},
			AWS: AWSConfig{
				Region:     os.Getenv("AWS_REGION"),
				BucketName: os.Getenv("AWS_BUCKET_NAME"),
			},
			Services: ServicesConfig{
				OpenAI: OpenAI{
					APIKey: os.Getenv("OPENAI_APIKEY"),
				},
			},
		}
	})
	return Cfg
}
