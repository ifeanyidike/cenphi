package repositories

import (
	"context"
	"database/sql"

	"github.com/ifeanyidike/cenphi/internal/models"
)

type WorkspaceRepository interface {
	Repository[models.Workspace]
	FindByCustomDomain(ctx context.Context, customDomain string) (*models.Workspace, error)
}

type workspaceRepository struct {
	*BaseRepository[models.Workspace]
}

func NewWorkspaceRepository(db *sql.DB) WorkspaceRepository {
	return &workspaceRepository{
		BaseRepository: NewBaseRepository[models.Workspace](db, "workspaces"),
	}
}

func (r *workspaceRepository) FindByCustomDomain(ctx context.Context, customDomain string) (*models.Workspace, error) {
	query :=
		`
        SELECT 
            id, name, plan, settings, branding_settings, custom_domain, analytics_settings, integration_settings, created_at, updated_at
        FROM workspaces
        WHERE custom_domain = ?
        `
	row := r.db.QueryRow(query, customDomain)

	var workspace models.Workspace
	err := row.Scan(&workspace.ID, &workspace.Name, &workspace.Plan, &workspace.Settings, &workspace.BrandingSettings, &workspace.CustomDomain, &workspace.AnalyticsSettings, &workspace.IntegrationSettings, &workspace.CreatedAt, &workspace.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &workspace, nil
}
