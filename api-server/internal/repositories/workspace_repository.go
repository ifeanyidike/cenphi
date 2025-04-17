package repositories

//go:generate mockery --name=WorkspaceRepository --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type WorkspaceRepository interface {
	Repository[models.Workspace]
	FindByCustomDomain(ctx context.Context, customDomain string, db DB) (*models.Workspace, error)
	UpdateAny(ctx context.Context, updates map[string]any, id uuid.UUID, db DB) error
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
	)

	return err
}

func (r *workspaceRepository) UpdateAny(ctx context.Context, updates map[string]any, id uuid.UUID, db DB) error {
	var setStatements []string
	var args []interface{}

	// First argument is always the ID
	args = append(args, id)
	argCount := 1

	// Build set statement dynamically based on provided fields
	for field, value := range updates {
		// Map field names to db column names
		var dbField string
		switch field {
		case "name", "website_url", "plan", "custom_domain", "industry":
			dbField = field
		case "settings", "branding_settings", "analytics_settings", "integration_settings":
			// JSON fields
			dbField = field
			// if it's a map or struct, convert to JSON
			if field == "branding_settings" || field == "integration_settings" {
				jsonValue, err := json.Marshal(value)
				if err != nil {
					return fmt.Errorf("failed to marshal JSON for %s: %w", field, err)
				}
				value = jsonValue
			}
		default:
			continue
		}

		argCount++
		setStatements = append(setStatements, fmt.Sprintf("%s = $%d", dbField, argCount))
		args = append(args, value)
	}

	// Add updated_at
	setStatements = append(setStatements, "updated_at = NOW()")

	if len(setStatements) == 0 {
		return nil // Nothing to update
	}

	// Build the final query
	query := fmt.Sprintf("UPDATE workspaces SET %s WHERE id = $1", strings.Join(setStatements, ", "))

	// Debug
	fmt.Println("Query:", query)
	fmt.Println("Args:", args)

	// Execute the query with args expanded correctly
	_, err := db.ExecContext(ctx, query, args...)
	return err
}
