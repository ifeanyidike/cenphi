package services

import (
	"context"

	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type WorkspaceService interface {
	GetWorkspace(ctx context.Context, id string) (*models.Workspace, error)
	CreateWorkspace(ctx context.Context, workspace *models.Workspace) error
}

type workspaceService struct {
	repo repositories.WorkspaceRepository
}

func NewWorkspaceService(repo repositories.WorkspaceRepository) WorkspaceService {
	return &workspaceService{repo: repo}
}

func (s *workspaceService) GetWorkspace(ctx context.Context, id string) (*models.Workspace, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *workspaceService) CreateWorkspace(ctx context.Context, workspace *models.Workspace) error {
	return s.repo.Create(ctx, workspace)
}
