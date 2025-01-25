package repositories

import (
	"database/sql"
	"errors"
	"fmt"
)

// Repository defines a generic interface for basic CRUD operations.
type Repository[T any] interface {
	GetByID(id string) (*T, error)
	Create(entity *T) error
	Update(entity *T) error
	Delete(id string) error
}

// BaseRepository provides common methods for interacting with the database.
type BaseRepository[T any] struct {
	db        *sql.DB
	tableName string
}

// NewBaseRepository creates a new BaseRepository for the specified table.
func NewBaseRepository[T any](db *sql.DB, tableName string) *BaseRepository[T] {
	return &BaseRepository[T]{db: db, tableName: tableName}
}

// GetByID retrieves a record by its ID (generic implementation).
func (r *BaseRepository[T]) GetByID(id string) (*T, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id = ?", r.tableName)
	row := r.db.QueryRow(query, id)

	var entity T
	err := row.Scan(&entity) // Assume struct mapping with tags (needs customization per model)
	if err != nil {
		return nil, err
	}
	return &entity, nil
}

// Create inserts a new record (generic implementation).
func (r *BaseRepository[T]) Create(entity *T) error {
	return errors.New("Create must be implemented in the specific repository")
}

// Update modifies an existing record (generic implementation).
func (r *BaseRepository[T]) Update(entity *T) error {
	return errors.New("Update must be implemented in the specific repository")
}

// Delete removes a record by its ID (generic implementation).
func (r *BaseRepository[T]) Delete(id string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id = ?", r.tableName)
	_, err := r.db.Exec(query, id)
	return err
}
