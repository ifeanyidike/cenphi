package mocks

import (
	"context"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/stretchr/testify/mock"
)

type WorkspaceRepository struct {
	mock.Mock
}

func (m *WorkspaceRepository) Create(ctx context.Context, workspace *models.Workspace, db repositories.DB) error {
	args := m.Called(ctx, workspace, db)
	return args.Error(0)
}

func (m *WorkspaceRepository) GetByID(ctx context.Context, id uuid.UUID, db repositories.DB) (*models.Workspace, error) {
	args := m.Called(ctx, id, db)
	return args.Get(0).(*models.Workspace), args.Error(1)
}

func (m *WorkspaceRepository) Update(ctx context.Context, workspace *models.Workspace, id uuid.UUID, db repositories.DB) error {
	args := m.Called(ctx, workspace, db)
	return args.Error(0)
}

func (m *WorkspaceRepository) Delete(ctx context.Context, id uuid.UUID, db repositories.DB) error {
	args := m.Called(ctx, id, db)
	return args.Error(0)
}

func (m *WorkspaceRepository) FindByCustomDomain(ctx context.Context, customDomain string, db repositories.DB) (*models.Workspace, error) {
	args := m.Called(ctx, customDomain, db)
	return args.Get(0).(*models.Workspace), args.Error(1)
}
