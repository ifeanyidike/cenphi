package config

import (
	"context"
	"database/sql"
	"fmt"
	"log"
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

func retryConnection(dsn string, maxRetries int, delay time.Duration) (*sql.DB, error) {
	var lastErr error
	for i := 0; i < maxRetries; i++ {
		db, err := sql.Open("postgres", dsn)
		if err != nil {
			lastErr = err
			log.Printf("Database open failed: dsn: %v, %v. Retrying in %v...", dsn, err, delay)
			time.Sleep(delay)
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		pingErr := db.PingContext(ctx)
		cancel() // Cancel the context right after using it

		if pingErr != nil {
			lastErr = pingErr
			log.Printf("Database ping failed: %v. Retrying in %v...", pingErr, delay)
			db.Close() // Make sure to close the connection if ping fails
			time.Sleep(delay)
			continue
		}

		// Connection successful
		db.SetMaxOpenConns(30)
		db.SetConnMaxIdleTime(15 * time.Minute) // Use time.Minute for clarity
		db.SetMaxIdleConns(30)
		return db, nil
	}

	return nil, fmt.Errorf("failed to connect to the db after %d retries: %v", maxRetries, lastErr)
}

func InitializeDatabase(cfg *Config) (*sql.DB, *redis.Client, error) {
	db, err := retryConnection(cfg.Database.DSN, 5, 1*time.Second)
	if err != nil {
		return nil, nil, err
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Redis.Host, cfg.Redis.Port),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Println("Failed to connect to the redis server:", err)
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
