package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"reflect"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

// Repository defines a generic interface for basic CRUD operations.

type DB interface {
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
}
type Repository[T any] interface {
	GetByID(ctx context.Context, id uuid.UUID, db DB) (*T, error)
	Create(ctx context.Context, entity *T, db DB) error
	Update(ctx context.Context, entity *T, id uuid.UUID, db DB) error
	Delete(ctx context.Context, id uuid.UUID, db DB) error
	UpdateAny(ctx context.Context, id uuid.UUID, updates map[string]any, db *sql.DB) error
}

type BaseRepository[T any] struct {
	redis     *redis.Client
	tableName string
}

func NewBaseRepository[T any](redis *redis.Client, tableName string) *BaseRepository[T] {

	return &BaseRepository[T]{redis: redis, tableName: tableName}
}

func (r *BaseRepository[T]) GetByID(ctx context.Context, id uuid.UUID, db DB) (*T, error) {
	log.Println("in get by id in base")
	query := fmt.Sprintf("SELECT * FROM %s WHERE id = $1", r.tableName)
	row := db.QueryRowContext(ctx, query, id)

	var entity T
	err := row.Scan(&entity)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, err
	}
	return &entity, nil
}

func (r *BaseRepository[T]) Create(ctx context.Context, entity *T, db DB) error {
	return errors.New("Create must be implemented in the specific repository")
}

func (r *BaseRepository[T]) Update(ctx context.Context, entity *T, id uuid.UUID, db DB) error {
	return errors.New("Update must be implemented in the specific repository")
}

func (r *BaseRepository[T]) Delete(ctx context.Context, id uuid.UUID, db DB) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id = $1", r.tableName)
	_, err := db.ExecContext(ctx, query, id)
	return err
}

func (r *BaseRepository[T]) UpdateAny(ctx context.Context, id uuid.UUID, updates map[string]any, db *sql.DB) error {
	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	// Always update updated_at
	updates["updated_at"] = time.Now().UTC()

	// Optional: whitelist updatable columns (recommended)
	// allowed := map[string]struct{}{"data":{}, "result_category":{}, "updated_at":{}, ...}
	// if you want, validate keys here and return an error if unknown key.

	// Build deterministic order
	keys := make([]string, 0, len(updates))
	for k := range updates {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	setParts := make([]string, 0, len(keys))
	args := make([]any, 0, len(keys)+1)
	for i, field := range keys {
		value := updates[field]

		// dereference pointer if pointer
		rv := reflect.ValueOf(value)
		if rv.Kind() == reflect.Ptr {
			if rv.IsNil() {
				value = nil
			} else {
				value = rv.Elem().Interface()
			}
		}

		// If field needs JSON serialization (slice, map, struct) -> marshal
		if needsJSONSerialization(value) {
			if value == nil {
				// leave nil
			} else {
				b, err := json.Marshal(value)
				if err != nil {
					return fmt.Errorf("failed to marshal field %s: %w", field, err)
				}
				value = string(b)
			}
		}

		placeholder := fmt.Sprintf("$%d", i+1)
		setParts = append(setParts, fmt.Sprintf("%s = %s", field, placeholder))
		args = append(args, value)
	}

	// Add id as last arg
	args = append(args, id)
	wherePlaceholder := fmt.Sprintf("$%d", len(args))

	query := fmt.Sprintf("UPDATE %s SET %s WHERE id = %s RETURNING id",
		pq.QuoteIdentifier(r.tableName), strings.Join(setParts, ", "), wherePlaceholder)

	// // log for debugging (structured)
	// slog.Info("UpdateAny executing query",
	// 	slog.String("query", query),
	// 	slog.Any("args", args))

	// Use QueryRowContext so we can RETURNING and detect if a row was returned
	var returnedID uuid.UUID
	err := db.QueryRowContext(ctx, query, args...).Scan(&returnedID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("%s not found (ID: %s)", r.tableName, id)
		}
		return fmt.Errorf("failed to update %s (ID: %s): %w", r.tableName, id, err)
	}

	return nil
}

// Get retrieves a cached entity from Redis
func (r *BaseRepository[T]) Get(ctx context.Context, key string, redisClient *redis.Client) (*T, error) {
	val, err := redisClient.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("cache miss")
		}
		return nil, fmt.Errorf("redis get error: %w", err)
	}

	var entity T
	if err := json.Unmarshal([]byte(val), &entity); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cached entity: %w", err)
	}

	return &entity, nil
}

// Set caches an entity in Redis with expiration
func (r *BaseRepository[T]) Set(ctx context.Context, key string, entity *T, expiration time.Duration, redisClient *redis.Client) error {
	data, err := json.Marshal(entity)
	if err != nil {
		return fmt.Errorf("failed to marshal entity: %w", err)
	}

	if err := redisClient.Set(ctx, key, data, expiration).Err(); err != nil {
		return fmt.Errorf("redis set error: %w", err)
	}

	return nil
}

// DeleteCache removes a cached entity from Redis
func (r *BaseRepository[T]) DeleteCache(ctx context.Context, key string, redisClient *redis.Client) error {
	if err := redisClient.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("redis delete error: %w", err)
	}
	return nil
}

// DeleteCachePattern removes cached entities matching a pattern from Redis
func (r *BaseRepository[T]) DeleteCachePattern(ctx context.Context, pattern string, redisClient *redis.Client) error {
	iter := redisClient.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := redisClient.Del(ctx, iter.Val()).Err(); err != nil {
			return fmt.Errorf("redis delete pattern error: %w", err)
		}
	}
	if err := iter.Err(); err != nil {
		return fmt.Errorf("redis scan error: %w", err)
	}
	return nil
}
