package repositories

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type WorkspaceRepository interface {
	Repository[models.Workspace]
	FindByCustomDomain(ctx context.Context, customDomain string, db DB) (*models.Workspace, error)
}

type workspaceRepository struct {
	*BaseRepository[models.Workspace]
}

func NewWorkspaceRepository(redis *redis.Client) WorkspaceRepository {
	return &workspaceRepository{
		BaseRepository: NewBaseRepository[models.Workspace](redis, "workspaces"),
	}
}

func (r *workspaceRepository) FindByCustomDomain(ctx context.Context, customDomain string, db DB) (*models.Workspace, error) {
	query :=
		`
        SELECT 
            id, name, plan, settings, branding_settings, custom_domain, industry, analytics_settings, integration_settings, created_at, updated_at
        FROM workspaces
        WHERE custom_domain = $1
        `
	row := db.QueryRowContext(ctx, query, customDomain)

	var workspace models.Workspace
	err := row.Scan(&workspace.ID, &workspace.Name, &workspace.Plan, &workspace.Settings, &workspace.BrandingSettings, &workspace.CustomDomain, &workspace.Industry, &workspace.AnalyticsSettings, &workspace.IntegrationSettings, &workspace.CreatedAt, &workspace.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &workspace, nil
}

func (r *workspaceRepository) GetByID(ctx context.Context, id uuid.UUID, db DB) (*models.Workspace, error) {
	query :=
		`
        SELECT 
            id, name, plan, custom_domain, industry, website_url, created_at, updated_at
        FROM workspaces
        WHERE id = $1
        `
	row := db.QueryRowContext(ctx, query, id)

	var workspace models.Workspace
	var customDomain sql.NullString

	err := row.Scan(&workspace.ID, &workspace.Name, &workspace.Plan, &customDomain, &workspace.Industry, &workspace.WebsiteURL, &workspace.CreatedAt, &workspace.UpdatedAt)

	if err != nil {
		return nil, err
	}

	if customDomain.Valid {
		workspace.CustomDomain = customDomain.String
	} else {
		workspace.CustomDomain = ""
	}

	return &workspace, nil
}

func (r *workspaceRepository) Create(ctx context.Context, workspace *models.Workspace, db DB) error {

	query := `
		INSERT INTO workspaces 
			(id, name, website_url, industry, plan) 
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := db.ExecContext(ctx, query,
		workspace.ID,
		workspace.Name,
		workspace.WebsiteURL,
		workspace.Industry,
		workspace.Plan,
	)

	return err
}

func (r *workspaceRepository) Update(ctx context.Context, workspace *models.Workspace, id uuid.UUID, db DB) error {
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
        SET name = $2, website_url = $3, plan = $4, custom_domain = $5, industry = $6, updated_at = NOW()
        WHERE id = $1
    `

	// Execute the query with the marshaled JSON values
	_, err := db.ExecContext(ctx, query,
		id,
		workspace.Name,
		workspace.WebsiteURL,
		workspace.Plan,
		workspace.CustomDomain,
		workspace.Industry,
		// settingsJSON,            // Pass marshaled JSON for settings
		// brandingSettingsJSON,    // Pass marshaled JSON for branding settings
		// analyticsSettingsJSON,   // Pass marshaled JSON for analytics settings
		// integrationSettingsJSON, // Pass marshaled JSON for integration settings
	)

	return err
}
