package models

import "time"

// BaseModel is a shared structure for common fields.
type BaseModel struct {
	ID        int64     `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Repository is a common interface for model operations.
type Repository[T any] interface {
	GetByID(id int64) (*T, error)
	Create(model *T) error
	Update(model *T) error
	Delete(id int64) error
}
