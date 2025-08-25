// api-server/internal/cache/redis_cache.go
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache is a cache service using Redis
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache creates a new Redis cache service
func NewRedisCache(client *redis.Client) (RedisCache, error) {
	// Create Redis client

	return RedisCache{
		client: client,
	}, nil
}

// Close closes the Redis connection
func (c *RedisCache) Close() error {
	return c.client.Close()
}

// Set sets a value in the cache
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	// Convert value to JSON if it's not a string
	var strValue string
	switch v := value.(type) {
	case string:
		strValue = v
	default:
		jsonBytes, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal value to JSON: %w", err)
		}
		strValue = string(jsonBytes)
	}

	// Set in Redis
	return c.client.Set(ctx, key, strValue, expiration).Err()
}

// Get gets a value from the cache
func (c *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
	// Get from Redis
	strValue, err := c.client.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("key not found")
		}
		return fmt.Errorf("failed to get value from Redis: %w", err)
	}

	// Convert JSON to value if dest is not a string pointer
	switch d := dest.(type) {
	case *string:
		*d = strValue
		return nil
	default:
		return json.Unmarshal([]byte(strValue), dest)
	}
}

// Delete deletes a value from the cache
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// Exists checks if a key exists in the cache
func (c *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	result, err := c.client.Exists(ctx, key).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check if key exists: %w", err)
	}
	return result > 0, nil
}

func (r *RedisCache) GetKeys(ctx context.Context, pattern string) ([]string, error) {
	return r.client.Keys(ctx, pattern).Result()
}

// Publish publishes a message to a channel
func (c *RedisCache) Publish(ctx context.Context, channel string, message interface{}) error {
	// Convert message to JSON if it's not a string
	var strMessage string
	switch m := message.(type) {
	case string:
		strMessage = m
	default:
		jsonBytes, err := json.Marshal(message)
		if err != nil {
			return fmt.Errorf("failed to marshal message to JSON: %w", err)
		}
		strMessage = string(jsonBytes)
	}

	// Publish to channel
	return c.client.Publish(ctx, channel, strMessage).Err()
}

// Subscribe subscribes to a channel
func (c *RedisCache) Subscribe(ctx context.Context, channel string) *redis.PubSub {
	return c.client.Subscribe(ctx, channel)
}
