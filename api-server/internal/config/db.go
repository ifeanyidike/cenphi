package config

import (
	"context"
	"crypto/tls"
	"database/sql"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type Database interface {
	GetDB() *sql.DB
	GetRedisClient() *redis.Client
}

type database struct {
	db    *sql.DB
	redis *redis.Client
}

var DB Database

// ensureBinaryParameters ensures the DSN contains binary_parameters=yes (for lib/pq)
func ensureBinaryParameters(dsn string) string {
	if strings.Contains(dsn, "binary_parameters=") {
		return dsn
	}

	u, err := url.Parse(dsn)
	if err == nil && u.Scheme != "" {
		q := u.Query()
		q.Set("binary_parameters", "yes")
		u.RawQuery = q.Encode()
		return u.String()
	}

	// Fallback: append param if not a URL-style DSN (key=value style)
	if strings.Contains(dsn, "?") {
		return dsn + "&binary_parameters=yes"
	}
	return dsn + "?binary_parameters=yes"
}

func retryConnection(dsn string, maxRetries int, delay time.Duration) (*sql.DB, error) {
	var lastErr error
	for i := range maxRetries {
		db, err := sql.Open("postgres", dsn)
		if err != nil {
			lastErr = err
			log.Printf("Database open failed (attempt %d/%d): %v. Retrying in %v...", i+1, maxRetries, err, delay)
			time.Sleep(delay)
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		pingErr := db.PingContext(ctx)
		cancel()

		if pingErr != nil {
			lastErr = pingErr
			_ = db.Close() // close failed connection before retry
			log.Printf("Database ping failed (attempt %d/%d): %v. Retrying in %v...", i+1, maxRetries, pingErr, delay)
			time.Sleep(delay)
			continue
		}

		// Connection successful — configure pool
		db.SetMaxOpenConns(50)
		db.SetMaxIdleConns(20)
		db.SetConnMaxIdleTime(5 * time.Minute)
		db.SetConnMaxLifetime(30 * time.Minute)

		return db, nil
	}

	return nil, fmt.Errorf("failed to connect to the db after %d retries: %v", maxRetries, lastErr)
}

func InitializeDatabase(cfg Config) (*sql.DB, *redis.Client, error) {
	dsn := ensureBinaryParameters(cfg.Database.DSN)

	db, err := retryConnection(dsn, 5, 1*time.Second)
	if err != nil {
		return nil, nil, err
	}

	redisOptions := &redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Redis.Host, cfg.Redis.Port),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	}

	// Enable TLS if configured (required for Upstash)
	if cfg.Redis.TLSEnabled {
		redisOptions.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
		log.Println("Redis TLS enabled")
	}

	redisClient := redis.NewClient(redisOptions)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Println("Failed to connect to the redis server:", err)
		_ = db.Close()
		return nil, nil, err
	}

	DB = &database{
		db:    db,
		redis: redisClient,
	}

	return db, redisClient, nil
}

func (d *database) GetDB() *sql.DB {
	return d.db
}

func (d *database) GetRedisClient() *redis.Client {
	return d.redis
}
