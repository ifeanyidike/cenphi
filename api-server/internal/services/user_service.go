// user_service.go
package services

//go:generate mockery --name=UserService --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type UserService interface {
	GetUser(ctx context.Context, id uuid.UUID) (*models.User, error)
	FindByUID(ctx context.Context, uid string) (*models.User, error)
	RegisterUser(ctx context.Context, user *models.User) error
	UpdateUser(ctx context.Context, uid string, updates map[string]any) error
}

type userService struct {
	repo repositories.UserRepository
	db   *sql.DB
}

func NewUserService(repo repositories.UserRepository, db *sql.DB) UserService {
	return &userService{repo: repo, db: db}
}

func (s *userService) GetUser(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, id, s.db)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) FindByUID(ctx context.Context, uid string) (*models.User, error) {
	user, err := s.repo.FindByUID(ctx, uid, s.db)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) RegisterUser(ctx context.Context, user *models.User) error {
	return s.repo.Create(ctx, user, s.db)
}

func (s *userService) UpdateUser(ctx context.Context, uid string, updates map[string]any) error {
	return s.repo.UpdateAny(ctx, updates, uid, s.db)
}
