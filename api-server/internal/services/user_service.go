package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type UserService interface {
	GetUser(ctx context.Context, id uuid.UUID) (*models.User, error)
	FindByUID(ctx context.Context, uid string) (*models.User, error)
	RegisterUser(ctx context.Context, user *models.User) error
}

type userService struct {
	repo repositories.UserRepository
}

func NewUserService(repo repositories.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetUser(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) FindByUID(ctx context.Context, uid string) (*models.User, error) {
	user, err := s.repo.FindByUID(ctx, uid)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) RegisterUser(ctx context.Context, user *models.User) error {
	return s.repo.Create(ctx, user)
}
