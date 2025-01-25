package services

import (
	"errors"

	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type UserService interface {
	GetUser(id string) (*models.User, error)
	RegisterUser(user *models.User) error
}

type userService struct {
	repo repositories.UserRepository
}

func NewUserService(repo repositories.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetUser(id string) (*models.User, error) {
	user, err := s.repo.GetByID(id)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) RegisterUser(user *models.User) error {
	return s.repo.Create(user)
}
