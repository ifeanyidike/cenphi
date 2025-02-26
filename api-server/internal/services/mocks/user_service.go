package mocks

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/stretchr/testify/mock"
)

type UserService struct {
	mock.Mock
}

func (m *UserService) RegisterUser(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *UserService) GetUser(ctx context.Context, id uuid.UUID) (*models.User, error) {
	log.Println("uuid", id)
	args := m.Called(ctx, id)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *UserService) FindByUID(ctx context.Context, uid string) (*models.User, error) {
	log.Println("uuid", uid)
	args := m.Called(ctx, uid)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *UserService) UpdateUser(ctx context.Context, user *models.User, id uuid.UUID) error {
	args := m.Called(ctx, user, id)
	return args.Error(0)
}

func (m *UserService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
