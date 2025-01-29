package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type WorkspaceService interface {
	GetWorkspace(ctx context.Context, id uuid.UUID) (*models.Workspace, error)
	CreateWorkspace(ctx context.Context, workspace *models.Workspace) error
	UpdateWorkspace(ctx context.Context, id uuid.UUID, workspace *models.Workspace) error
	DeleteWorkspace(ctx context.Context, id uuid.UUID) error
}

type workspaceService struct {
	repo repositories.WorkspaceRepository
}

func NewWorkspaceService(repo repositories.WorkspaceRepository) WorkspaceService {
	return &workspaceService{repo: repo}
}

func (w *workspaceService) GetWorkspace(ctx context.Context, id uuid.UUID) (*models.Workspace, error) {
	return w.repo.GetByID(ctx, id)
}

func (w *workspaceService) CreateWorkspace(ctx context.Context, workspace *models.Workspace) error {
	return w.repo.Create(ctx, workspace)
}

func (w *workspaceService) UpdateWorkspace(ctx context.Context, id uuid.UUID, workspace *models.Workspace) error {
	return w.repo.Update(ctx, workspace, id)
}

func (w *workspaceService) DeleteWorkspace(ctx context.Context, id uuid.UUID) error {
	return w.repo.Delete(ctx, id)
}
