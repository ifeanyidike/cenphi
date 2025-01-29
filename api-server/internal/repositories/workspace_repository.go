package repositories

import (
	"context"
	"database/sql"
	"log"

	"github.com/google/uuid"
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
        WHERE custom_domain = $1
        `
	row := r.db.QueryRow(query, customDomain)

	var workspace models.Workspace
	err := row.Scan(&workspace.ID, &workspace.Name, &workspace.Plan, &workspace.Settings, &workspace.BrandingSettings, &workspace.CustomDomain, &workspace.AnalyticsSettings, &workspace.IntegrationSettings, &workspace.CreatedAt, &workspace.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &workspace, nil
}

func (r *workspaceRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Workspace, error) {
	log.Println("id to get", id)
	query :=
		`
        SELECT 
            id, name, plan, custom_domain, website_url, created_at, updated_at
        FROM workspaces
        WHERE id = $1
        `
	row := r.db.QueryRowContext(ctx, query, id)

	var workspace models.Workspace
	err := row.Scan(&workspace.ID, &workspace.Name, &workspace.Plan, &workspace.CustomDomain, &workspace.WebsiteURL, &workspace.CreatedAt, &workspace.UpdatedAt)
	log.Println("error occurred in get", err)
	if err != nil {
		return nil, err
	}
	return &workspace, nil
}

func (r *workspaceRepository) Create(ctx context.Context, workspace *models.Workspace) error {

	query := `
		INSERT INTO workspaces 
			(id, name, website_url, plan, custom_domain) 
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.ExecContext(ctx, query,
		workspace.ID,
		workspace.Name,
		workspace.WebsiteURL,
		workspace.Plan,
		workspace.CustomDomain,
	)

	return err
}

func (r *workspaceRepository) Update(ctx context.Context, workspace *models.Workspace, id uuid.UUID) error {
	// settingsJSON, err := json.Marshal(workspace.Settings)
	// if err != nil {
	// 	return err
	// }

	// brandingSettingsJSON, err := json.Marshal(workspace.BrandingSettings)
	// if err != nil {
	// 	return err
	// }

	// analyticsSettingsJSON, err := json.Marshal(workspace.AnalyticsSettings)
	// if err != nil {
	// 	return err
	// }

	// integrationSettingsJSON, err := json.Marshal(workspace.IntegrationSettings)
	// if err != nil {
	// 	return err
	// }

	// The actual SQL query for updating the workspace
	query := `
        UPDATE workspaces 
        SET name = $2, website_url = $3, plan = $4, custom_domain = $5, updated_at = NOW()
        WHERE id = $1
    `

	// Execute the query with the marshaled JSON values
	_, err := r.db.ExecContext(ctx, query,
		id,
		workspace.Name,
		workspace.WebsiteURL,
		workspace.Plan,
		workspace.CustomDomain,
		// settingsJSON,            // Pass marshaled JSON for settings
		// brandingSettingsJSON,    // Pass marshaled JSON for branding settings
		// analyticsSettingsJSON,   // Pass marshaled JSON for analytics settings
		// integrationSettingsJSON, // Pass marshaled JSON for integration settings
	)

	return err
}
