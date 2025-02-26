package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"

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
