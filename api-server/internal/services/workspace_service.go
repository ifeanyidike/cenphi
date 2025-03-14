package services

//go:generate mockery --name=WorkspaceService --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
)

type WorkspaceService interface {
	GetWorkspace(ctx context.Context, id uuid.UUID) (*models.Workspace, error)
	CreateWorkspace(ctx context.Context, workspace *models.Workspace) error
	UpdateWorkspace(ctx context.Context, id uuid.UUID, updates map[string]any) error
	DeleteWorkspace(ctx context.Context, id uuid.UUID) error
}

type workspaceService struct {
	repo repositories.WorkspaceRepository
	db   *sql.DB
}

func NewWorkspaceService(repo repositories.WorkspaceRepository, db *sql.DB) WorkspaceService {
	return &workspaceService{repo: repo, db: db}
}

func (w *workspaceService) GetWorkspace(ctx context.Context, id uuid.UUID) (*models.Workspace, error) {
	return w.repo.GetByID(ctx, id, w.db)
}

func (w *workspaceService) CreateWorkspace(ctx context.Context, workspace *models.Workspace) error {
	return w.repo.Create(ctx, workspace, w.db)
}

func (w *workspaceService) UpdateWorkspace(ctx context.Context, id uuid.UUID, updates map[string]any) error {
	fmt.Println("id", id, "workspace", updates)
	return w.repo.UpdateAny(ctx, updates, id, w.db)
}

func (w *workspaceService) DeleteWorkspace(ctx context.Context, id uuid.UUID) error {
	return w.repo.Delete(ctx, id, w.db)
}
