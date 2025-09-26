package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"reflect"
	"strings"
	"time"

	"github.com/google/uuid"
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

	// Always update the updated_at field
	updates["updated_at"] = time.Now()

	// Build dynamic query
	setParts := make([]string, 0, len(updates))
	args := make([]any, 0, len(updates)+1)
	argIndex := 1

	for field, value := range updates {
		slog.Debug("Processing field for update",
			slog.String("attr", field),
			slog.String("value_type", fmt.Sprintf("%T", value)),
			slog.Bool("needs_json", needsJSONSerialization(value)))

		// Handle special types that need JSON serialization
		if needsJSONSerialization(value) {
			// Dereference pointer if it's a pointer
			actualValue := value
			if reflect.ValueOf(value).Kind() == reflect.Ptr {
				if reflect.ValueOf(value).IsNil() {
					actualValue = nil
				} else {
					actualValue = reflect.ValueOf(value).Elem().Interface()
				}
			}

			if actualValue != nil {
				jsonBytes, err := json.Marshal(actualValue)
				if err != nil {
					return fmt.Errorf("failed to marshal field %s: %w", field, err)
				}
				value = string(jsonBytes)
				slog.Debug("Serialized field to JSON",
					slog.String("field", field),
					slog.String("json", string(jsonBytes)))
			}
		} else {
			// Handle pointers to basic types
			if reflect.ValueOf(value).Kind() == reflect.Ptr {
				if reflect.ValueOf(value).IsNil() {
					value = nil
				} else {
					value = reflect.ValueOf(value).Elem().Interface()
				}
			}
		}

		setParts = append(setParts, fmt.Sprintf("%s = $%d", field, argIndex))
		args = append(args, value)
		argIndex++
	}

	// Add ID as the last argument
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE %s 
		SET %s 
		WHERE id = $%d
	`, r.tableName, strings.Join(setParts, ", "), argIndex)

	result, err := db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update %s (ID: %s): %w", r.tableName, id, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("%s not found (ID: %s)", r.tableName, id)
	}

	return nil
}
