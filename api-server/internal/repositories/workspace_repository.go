package repositories

//go:generate mockery --name=WorkspaceRepository --output=./mocks --case=underscore

import (
	"context"
	"encoding/json"
	"fmt"

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
            id, name, plan, industry, website_url, brand_context, created_at, updated_at
        FROM workspaces
        WHERE id = $1
        `
	row := db.QueryRowContext(ctx, query, id)

	var workspace models.Workspace

	err := row.Scan(&workspace.ID, &workspace.Name, &workspace.Plan, &workspace.Industry, &workspace.WebsiteURL, &workspace.BrandContext, &workspace.CreatedAt, &workspace.UpdatedAt)

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

	if err := json.Unmarshal(c, bc); err != nil {
		return nil, fmt.Errorf("failed to decode brand context JSON: %w", err)
	}

	return bc, nil
}
