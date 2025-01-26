package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

// Repository defines a generic interface for basic CRUD operations.
type Repository[T any] interface {
	GetByID(ctx context.Context, id string) (*T, error)
	Create(ctx context.Context, entity *T) error
	Update(ctx context.Context, entity *T) error
	Delete(ctx context.Context, id string) error
}

type BaseRepository[T any] struct {
	db        *sql.DB
	tableName string
}

func NewBaseRepository[T any](db *sql.DB, tableName string) *BaseRepository[T] {
	return &BaseRepository[T]{db: db, tableName: tableName}
}

func (r *BaseRepository[T]) GetByID(ctx context.Context, id string) (*T, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id = ?", r.tableName)
	row := r.db.QueryRow(query, id)

	var entity T
	err := row.Scan(&entity)
	if err != nil {
		return nil, err
	}
	return &entity, nil
}

func (r *BaseRepository[T]) Create(ctx context.Context, entity *T) error {
	return errors.New("Create must be implemented in the specific repository")
}

func (r *BaseRepository[T]) Update(ctx context.Context, entity *T) error {
	return errors.New("Update must be implemented in the specific repository")
}

func (r *BaseRepository[T]) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id = ?", r.tableName)
	_, err := r.db.Exec(query, id)
	return err
}
