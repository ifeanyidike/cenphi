package repositories

//go:generate mockery --name=WorkspaceRepository --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/pb"
	"github.com/redis/go-redis/v9"
)

type WorkspaceRepository interface {
	Repository[models.Workspace]
	// UpdateAny(ctx context.Context, updates map[string]any, id uuid.UUID, db DB) error
	GetModelBrandContext(ctx context.Context, workspaceID uuid.UUID, db DB) (*models.BrandContext, error)
	GetPbBrandContext(ctx context.Context, workspaceID uuid.UUID, db DB) (*pb.BrandContext, error)
	GetBrandContextFromWorkspace(workspace *models.Workspace) (*pb.BrandContext, error)
	UpdateShowcaseSettings(ctx context.Context, workspaceID uuid.UUID, enabled bool, slug *string, settings map[string]interface{}, db DB) error
	GetWorkspaceByShowcaseSlug(ctx context.Context, slug string, db DB) (*models.Workspace, error)
	CheckShowcaseSlugAvailability(ctx context.Context, slug string, excludeWorkspaceID *uuid.UUID, db DB) (bool, error)
}

type workspaceRepository struct {
	*BaseRepository[models.Workspace]
}

func NewWorkspaceRepository(redis *redis.Client) WorkspaceRepository {
	return &workspaceRepository{
		BaseRepository: NewBaseRepository[models.Workspace](redis, "workspaces"),
	}
}

func (r *workspaceRepository) GetByID(ctx context.Context, id uuid.UUID, db DB) (*models.Workspace, error) {
	query :=
		`
        SELECT
            id, name, plan, industry, website_url, settings, brand_context,
            vector_store_id, total_testimonials, showcase_enabled, showcase_slug,
            showcase_settings, created_at, updated_at
        FROM workspaces
        WHERE id = $1
        `
	row := db.QueryRowContext(ctx, query, id)

	var workspace models.Workspace

	err := row.Scan(
		&workspace.ID,
		&workspace.Name,
		&workspace.Plan,
		&workspace.Industry,
		&workspace.WebsiteURL,
		&workspace.Settings,
		&workspace.BrandContext,
		&workspace.VectorStoreID,
		&workspace.TotalTestimonials,
		&workspace.ShowcaseEnabled,
		&workspace.ShowcaseSlug,
		&workspace.ShowcaseSettings,
		&workspace.CreatedAt,
		&workspace.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &workspace, nil
}

func (r *workspaceRepository) GetBrandContextByID(ctx context.Context, id uuid.UUID, db DB) (json.RawMessage, error) {
	query :=
		`
        SELECT 
            brand_context
        FROM workspaces
        WHERE id = $1
        `
	var bc json.RawMessage

	if err := db.QueryRowContext(ctx, query, id).Scan(&bc); err != nil {
		return nil, err
	}

	return bc, nil
}

func (r *workspaceRepository) Create(ctx context.Context, workspace *models.Workspace, db DB) error {
	query := `
		INSERT INTO workspaces 
			(id, name, website_url, industry, brand_context, plan) 
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := db.ExecContext(ctx, query,
		workspace.ID,
		workspace.Name,
		workspace.WebsiteURL,
		workspace.Industry,
		string(workspace.BrandContext),
		workspace.Plan,
	)

	return err
}

func (r *workspaceRepository) Update(ctx context.Context, workspace *models.Workspace, id uuid.UUID, db DB) error {

	query := `
        UPDATE workspaces 
        SET name = $2, website_url = $3, plan = $4, industry = $5, updated_at = NOW()
        WHERE id = $1
    `

	// Execute the query with the marshaled JSON values
	_, err := db.ExecContext(ctx, query,
		id,
		workspace.Name,
		workspace.WebsiteURL,
		workspace.Plan,
		workspace.Industry,
	)

	return err
}

// func (r *workspaceRepository) UpdateAny(ctx context.Context, updates map[string]any, id uuid.UUID, db DB) error {
// 	var setStatements []string
// 	var args []any

// 	// First argument is always the ID
// 	args = append(args, id)
// 	argCount := 1

// 	// Build set statement dynamically based on provided fields
// 	for field, value := range updates {
// 		// Map field names to db column names
// 		var dbField string
// 		switch field {
// 		case "name", "website_url", "plan", "industry":
// 			dbField = field
// 		case "settings", "brand_context":
// 			// JSON fields
// 			dbField = field
// 		default:
// 			continue
// 		}

// 		argCount++
// 		setStatements = append(setStatements, fmt.Sprintf("%s = $%d", dbField, argCount))
// 		args = append(args, value)
// 	}

// 	// Add updated_at
// 	setStatements = append(setStatements, "updated_at = NOW()")

// 	if len(setStatements) == 0 {
// 		return nil // Nothing to update
// 	}

// 	// Build the final query
// 	query := fmt.Sprintf("UPDATE workspaces SET %s WHERE id = $1", strings.Join(setStatements, ", "))

// 	// Debug
// 	fmt.Println("Query:", query)
// 	fmt.Println("Args:", args)

// 	// Execute the query with args expanded correctly
// 	_, err := db.ExecContext(ctx, query, args...)
// 	return err
// }

func (s *workspaceRepository) GetModelBrandContext(ctx context.Context, workspaceID uuid.UUID, db DB) (*models.BrandContext, error) {
	c, err := s.GetBrandContextByID(ctx, workspaceID, db)

	if err != nil {
		return nil, err
	}

	var bc *models.BrandContext

	if err := json.Unmarshal(c, bc); err != nil {
		return nil, fmt.Errorf("failed to decode brand context JSON: %w", err)
	}

	return bc, nil
}

func (s *workspaceRepository) GetPbBrandContext(ctx context.Context, workspaceID uuid.UUID, db DB) (*pb.BrandContext, error) {
	fmt.Println("getting brand context")
	c, err := s.GetBrandContextByID(ctx, workspaceID, db)

	if err != nil {
		return nil, err
	}

	bc := &pb.BrandContext{}

	// First unmarshal to a generic map to handle complex extracted_data field
	var rawData map[string]interface{}
	if err := json.Unmarshal(c, &rawData); err != nil {
		return nil, fmt.Errorf("failed to decode brand context JSON: %w", err)
	}

	// Handle extracted_data field specially - it might be nested objects in DB
	// but protobuf expects map[string]string, so we'll just omit it for now
	// since it's not used in clipping anyway
	if _, ok := rawData["extracted_data"]; ok {
		delete(rawData, "extracted_data")
	}

	// Re-marshal without extracted_data and unmarshal into protobuf struct
	cleanedJSON, err := json.Marshal(rawData)
	if err != nil {
		return nil, fmt.Errorf("failed to re-marshal cleaned brand context: %w", err)
	}

	if err := json.Unmarshal(cleanedJSON, bc); err != nil {
		return nil, fmt.Errorf("failed to decode cleaned brand context JSON: %w", err)
	}

	return bc, nil
}

func (s *workspaceRepository) GetBrandContextFromWorkspace(workspace *models.Workspace) (*pb.BrandContext, error) {
	c := workspace.BrandContext

	if c == nil {
		return &pb.BrandContext{}, nil
	}

	bc := &pb.BrandContext{}

	// First unmarshal to a generic map to handle complex extracted_data field
	var rawData map[string]interface{}
	if err := json.Unmarshal(c, &rawData); err != nil {
		return nil, fmt.Errorf("failed to decode brand context JSON: %w", err)
	}

	// Handle extracted_data field specially - it might be nested objects in DB
	// but protobuf expects map[string]string, so we'll just omit it for now
	if _, ok := rawData["extracted_data"]; ok {
		delete(rawData, "extracted_data")
	}

	// Re-marshal without extracted_data and unmarshal into protobuf struct
	cleanedJSON, err := json.Marshal(rawData)
	if err != nil {
		return nil, fmt.Errorf("failed to re-marshal cleaned brand context: %w", err)
	}

	if err := json.Unmarshal(cleanedJSON, bc); err != nil {
		return nil, fmt.Errorf("failed to decode cleaned brand context JSON: %w", err)
	}

	return bc, nil
}

// Showcase-related methods

// UpdateShowcaseSettings updates the showcase settings for a workspace
func (r *workspaceRepository) UpdateShowcaseSettings(
	ctx context.Context,
	workspaceID uuid.UUID,
	enabled bool,
	slug *string,
	settings map[string]interface{},
	db DB,
) error {
	var settingsStr string
	if settings != nil {
		settingsJSON, err := json.Marshal(settings)
		if err != nil {
			return fmt.Errorf("failed to marshal showcase settings: %w", err)
		}
		settingsStr = string(settingsJSON)
	} else {
		settingsStr = "{}"
	}

	query := `
		UPDATE workspaces
		SET showcase_enabled = $1,
			showcase_slug = $2,
			showcase_settings = $3::jsonb,
			updated_at = NOW()
		WHERE id = $4
	`

	result, err := db.ExecContext(ctx, query, enabled, slug, settingsStr, workspaceID)
	if err != nil {
		return fmt.Errorf("failed to update showcase settings: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("workspace not found: %s", workspaceID)
	}

	// Invalidate workspace cache
	cacheKey := fmt.Sprintf("workspace:%s", workspaceID.String())
	_ = r.redis.Del(ctx, cacheKey).Err() // Best effort cache invalidation

	return nil
}

// GetWorkspaceByShowcaseSlug retrieves a workspace by its showcase slug
func (r *workspaceRepository) GetWorkspaceByShowcaseSlug(
	ctx context.Context,
	slug string,
	db DB,
) (*models.Workspace, error) {
	cacheKey := fmt.Sprintf("workspace:slug:%s", slug)

	// Try cache first
	var cached models.Workspace
	cachedData, err := r.redis.Get(ctx, cacheKey).Bytes()
	if err == nil {
		if err := json.Unmarshal(cachedData, &cached); err == nil {
			return &cached, nil
		}
	}

	query := `
		SELECT id, name, website_url, industry, plan, settings, brand_context, 
			   vector_store_id, total_testimonials, showcase_enabled, showcase_slug, 
			   showcase_settings, created_at, updated_at
		FROM workspaces 
		WHERE showcase_slug = $1 AND showcase_enabled = true
	`

	var workspace models.Workspace
	err = db.QueryRowContext(ctx, query, slug).Scan(
		&workspace.ID,
		&workspace.Name,
		&workspace.WebsiteURL,
		&workspace.Industry,
		&workspace.Plan,
		&workspace.Settings,
		&workspace.BrandContext,
		&workspace.VectorStoreID,
		&workspace.TotalTestimonials,
		&workspace.ShowcaseEnabled,
		&workspace.ShowcaseSlug,
		&workspace.ShowcaseSettings,
		&workspace.CreatedAt,
		&workspace.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("workspace not found with slug: %s", slug)
		}
		return nil, fmt.Errorf("failed to get workspace by slug: %w", err)
	}

	// Cache for 15 minutes
	if workspaceJSON, err := json.Marshal(workspace); err == nil {
		r.redis.Set(ctx, cacheKey, workspaceJSON, 15*time.Minute)
	}

	return &workspace, nil
}

// CheckShowcaseSlugAvailability checks if a showcase slug is available
func (r *workspaceRepository) CheckShowcaseSlugAvailability(
	ctx context.Context,
	slug string,
	excludeWorkspaceID *uuid.UUID,
	db DB,
) (bool, error) {
	query := `
		SELECT COUNT(*) 
		FROM workspaces 
		WHERE showcase_slug = $1
	`
	args := []interface{}{slug}

	if excludeWorkspaceID != nil {
		query += " AND id != $2"
		args = append(args, excludeWorkspaceID)
	}

	var count int
	err := db.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check slug availability: %w", err)
	}

	return count == 0, nil
}
