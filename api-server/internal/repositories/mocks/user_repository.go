package mocks

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/stretchr/testify/mock"
)

type UserRepository struct {
	mock.Mock
}

func (m *UserRepository) Create(ctx context.Context, user *models.User, db repositories.DB) error {
	args := m.Called(ctx, user, db)
	return args.Error(0)
}

func (m *UserRepository) GetByID(ctx context.Context, id uuid.UUID, db repositories.DB) (*models.User, error) {
	log.Println("before calling args")
	args := m.Called(ctx, id, db)
	log.Println("args", args)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}

	return args.Get(0).(*models.User), args.Error(1)
}

func (m *UserRepository) Update(ctx context.Context, user *models.User, id uuid.UUID, db repositories.DB) error {
	args := m.Called(ctx, user, id, db)
	return args.Error(0)
}

func (m *UserRepository) Delete(ctx context.Context, id uuid.UUID, db repositories.DB) error {
	args := m.Called(ctx, id, db)
	return args.Error(0)
}

func (m *UserRepository) FindByEmail(ctx context.Context, email string, db repositories.DB) (*models.User, error) {
	args := m.Called(ctx, email, db)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *UserRepository) FindByUID(ctx context.Context, uid string, db repositories.DB) (*models.User, error) {
	args := m.Called(ctx, uid, db)
	return args.Get(0).(*models.User), args.Error(1)
}
