package repositories

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type ContentFolderRepository struct {
	*BaseRepository[models.ContentFolder]
	redis *redis.Client
}

func NewContentFolderRepository(redis *redis.Client) ContentFolderRepository {
	return ContentFolderRepository{
		BaseRepository: NewBaseRepository[models.ContentFolder](redis, "content_folders"),
		redis:          redis,
	}
}

// Create creates a new content folder
func (r *ContentFolderRepository) Create(ctx context.Context, folder *models.ContentFolder, db DB) error {
	query := `
		INSERT INTO content_folders (id, workspace_id, name, description, color, icon, is_default, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at, updated_at
	`

	if folder.ID == uuid.Nil {
		folder.ID = uuid.New()
	}

	err := db.QueryRowContext(ctx, query,
		folder.ID,
		folder.WorkspaceID,
		folder.Name,
		folder.Description,
		folder.Color,
		folder.Icon,
		folder.IsDefault,
		folder.SortOrder,
	).Scan(&folder.CreatedAt, &folder.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create content folder: %w", err)
	}

	// Invalidate cache
	r.InvalidateByWorkspace(ctx, folder.WorkspaceID.String())

	return nil
}

// GetByID retrieves a folder by ID
func (r *ContentFolderRepository) GetByID(ctx context.Context, id uuid.UUID, db DB) (*models.ContentFolder, error) {
	var folder models.ContentFolder
	query := `
		SELECT id, workspace_id, name, description, color, icon, is_default, sort_order,
		       item_count, created_at, updated_at
		FROM content_folders
		WHERE id = $1
	`

	err := db.QueryRowContext(ctx, query, id).Scan(
		&folder.ID,
		&folder.WorkspaceID,
		&folder.Name,
		&folder.Description,
		&folder.Color,
		&folder.Icon,
		&folder.IsDefault,
		&folder.SortOrder,
		&folder.ItemCount,
		&folder.CreatedAt,
		&folder.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get folder by ID: %w", err)
	}

	return &folder, nil
}

// ListByWorkspace retrieves all folders for a workspace
func (r *ContentFolderRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, db DB) ([]models.ContentFolder, error) {
	query := `
		SELECT id, workspace_id, name, description, color, icon, is_default, sort_order,
		       item_count, created_at, updated_at
		FROM content_folders
		WHERE workspace_id = $1
		ORDER BY sort_order ASC, created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to list folders: %w", err)
	}
	defer rows.Close()

	var folders []models.ContentFolder
	for rows.Next() {
		var folder models.ContentFolder
		if err := rows.Scan(
			&folder.ID,
			&folder.WorkspaceID,
			&folder.Name,
			&folder.Description,
			&folder.Color,
			&folder.Icon,
			&folder.IsDefault,
			&folder.SortOrder,
			&folder.ItemCount,
			&folder.CreatedAt,
			&folder.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan folder: %w", err)
		}
		folders = append(folders, folder)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over folders: %w", err)
	}

	return folders, nil
}

// Update updates a folder
func (r *ContentFolderRepository) Update(ctx context.Context, folder *models.ContentFolder, db DB) error {
	query := `
		UPDATE content_folders
		SET name = $1, description = $2, color = $3, icon = $4, sort_order = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at
	`

	err := db.QueryRowContext(ctx, query,
		folder.Name,
		folder.Description,
		folder.Color,
		folder.Icon,
		folder.SortOrder,
		folder.ID,
	).Scan(&folder.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update folder: %w", err)
	}

	// Invalidate cache
	r.InvalidateByWorkspace(ctx, folder.WorkspaceID.String())

	return nil
}

// Delete deletes a folder (will fail if not empty due to FK constraints)
func (r *ContentFolderRepository) Delete(ctx context.Context, id uuid.UUID, workspaceID uuid.UUID, db DB) error {
	query := `DELETE FROM content_folders WHERE id = $1 AND workspace_id = $2 AND is_default = FALSE`

	result, err := db.ExecContext(ctx, query, id, workspaceID)
	if err != nil {
		return fmt.Errorf("failed to delete folder: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("folder not found or is default folder (cannot delete)")
	}

	// Invalidate cache
	r.InvalidateByWorkspace(ctx, workspaceID.String())

	return nil
}

// AddItem adds an artifact to a folder
func (r *ContentFolderRepository) AddItem(ctx context.Context, folderID, artifactID uuid.UUID, db DB) error {
	query := `
		INSERT INTO folder_items (id, folder_id, artifact_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (folder_id, artifact_id) DO NOTHING
	`

	_, err := db.ExecContext(ctx, query, uuid.New(), folderID, artifactID)
	if err != nil {
		return fmt.Errorf("failed to add item to folder: %w", err)
	}

	return nil
}

// RemoveItem removes an artifact from a folder
func (r *ContentFolderRepository) RemoveItem(ctx context.Context, folderID, artifactID uuid.UUID, db DB) error {
	query := `DELETE FROM folder_items WHERE folder_id = $1 AND artifact_id = $2`

	result, err := db.ExecContext(ctx, query, folderID, artifactID)
	if err != nil {
		return fmt.Errorf("failed to remove item from folder: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("item not found in folder")
	}

	return nil
}

// GetFolderItems retrieves all artifact IDs in a folder
func (r *ContentFolderRepository) GetFolderItems(ctx context.Context, folderID uuid.UUID, db DB) ([]uuid.UUID, error) {
	query := `
		SELECT artifact_id
		FROM folder_items
		WHERE folder_id = $1
		ORDER BY added_at DESC
	`

	rows, err := db.QueryContext(ctx, query, folderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get folder items: %w", err)
	}
	defer rows.Close()

	var artifactIDs []uuid.UUID
	for rows.Next() {
		var artifactID uuid.UUID
		if err := rows.Scan(&artifactID); err != nil {
			return nil, fmt.Errorf("failed to scan artifact ID: %w", err)
		}
		artifactIDs = append(artifactIDs, artifactID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over items: %w", err)
	}

	return artifactIDs, nil
}

// GetArtifactFolders retrieves all folders that contain a specific artifact
func (r *ContentFolderRepository) GetArtifactFolders(ctx context.Context, artifactID uuid.UUID, db DB) ([]uuid.UUID, error) {
	query := `
		SELECT folder_id
		FROM folder_items
		WHERE artifact_id = $1
	`

	rows, err := db.QueryContext(ctx, query, artifactID)
	if err != nil {
		return nil, fmt.Errorf("failed to get artifact folders: %w", err)
	}
	defer rows.Close()

	var folderIDs []uuid.UUID
	for rows.Next() {
		var folderID uuid.UUID
		if err := rows.Scan(&folderID); err != nil {
			return nil, fmt.Errorf("failed to scan folder ID: %w", err)
		}
		folderIDs = append(folderIDs, folderID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over folders: %w", err)
	}

	return folderIDs, nil
}

// InvalidateByWorkspace invalidates cache for a workspace
func (r *ContentFolderRepository) InvalidateByWorkspace(ctx context.Context, workspaceID string) {
	cacheKey := fmt.Sprintf("workspace:%s:folders", workspaceID)
	r.DeleteCache(ctx, cacheKey, r.redis)
}
