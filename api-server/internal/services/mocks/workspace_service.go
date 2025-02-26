package mocks

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/stretchr/testify/mock"
)

type WorkspaceService struct {
	mock.Mock
}

func (m *UserService) CreateWorkspace(ctx context.Context, workspace *models.Workspace) error {
	args := m.Called(ctx, workspace)
	return args.Error(0)
}

func (m *UserService) GetWorkspace(ctx context.Context, id uuid.UUID) (*models.Workspace, error) {
	log.Println("uuid", id)
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Workspace), args.Error(1)
}

func (m *UserService) UpdateWorkspace(ctx context.Context, workspace *models.Workspace, id uuid.UUID) error {
	args := m.Called(ctx, workspace)
	return args.Error(0)
}

func (m *UserService) DeleteWorkspace(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
