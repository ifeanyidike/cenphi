package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type Preset struct {
	ID          uuid.UUID       `json:"id" db:"id"`
	WorkspaceID uuid.UUID       `json:"workspace_id" db:"workspace_id"`
	Name        string          `json:"name" db:"name"`
	Config      json.RawMessage `json:"config" db:"config"`
	ServiceID   string          `json:"service_id" db:"service_id"`
	IsDefault   bool            `json:"is_default" db:"is_default"`
	CreatedAt   string          `json:"created_at"`
	UpdatedAt   string          `json:"updated_at"`
}

type PresetRepository struct {
	*BaseRepository[models.Testimonial]
}

func NewPresetRepository(redis *redis.Client) PresetRepository {
	return PresetRepository{
		BaseRepository: NewBaseRepository[models.Testimonial](redis, "presets"),
	}
}

func (pr *PresetRepository) Create(ctx context.Context, preset Preset, db DB) error {

	query := `
		INSERT INTO presets (id, workspace_id, name, config, service_id, is_default)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at
	`
	err := db.QueryRowContext(ctx, query,
		preset.ID,
		preset.WorkspaceID,
		preset.Name,
		string(preset.Config),
		preset.ServiceID,
		preset.IsDefault,
	).Scan(&preset.CreatedAt, &preset.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create preset: %w", err)
	}
	return nil
}

func (pr *PresetRepository) GetByID(ctx context.Context, id string, db DB) (Preset, error) {
	var preset Preset
	query := `SELECT id, workspace_id, name, config, service_id, is_default, created_at, updated_at FROM presets WHERE id = $1::uuid`
	err := db.QueryRowContext(ctx, query, id).Scan(
		&preset.ID,
		&preset.WorkspaceID,
		&preset.Name,
		&preset.Config,
		&preset.ServiceID,
		&preset.IsDefault,
		&preset.CreatedAt,
		&preset.UpdatedAt,
	)
	if err != nil {
		return preset, fmt.Errorf("failed to get preset by ID: %w", err)
	}
	return preset, nil
}

func (pr *PresetRepository) GetDefault(ctx context.Context, workspaceID string, db DB) (Preset, error) {
	var preset Preset
	query := `SELECT id, workspace_id, name, config, service_id, is_default, created_at, 
	updated_at FROM presets WHERE workspace_id = $1::uuid AND is_default = TRUE LIMIT 1`
	err := db.QueryRowContext(ctx, query, workspaceID).Scan(
		&preset.ID,
		&preset.WorkspaceID,
		&preset.Name,
		&preset.Config,
		&preset.ServiceID,
		&preset.IsDefault,
		&preset.CreatedAt,
		&preset.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return preset, nil // No default preset found
		}
		return preset, fmt.Errorf("failed to get default preset: %w", err)
	}
	return preset, nil
}

func (pr *PresetRepository) ListByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, db DB) ([]Preset, error) {
	query := `
		SELECT id, workspace_id, name, config, service_id, is_default, created_at, updated_at
		FROM presets
		WHERE workspace_id = $1		
		ORDER BY created_at DESC
	`
	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to list presets: %w", err)
	}
	defer rows.Close()

	var presets []Preset
	for rows.Next() {
		var preset Preset
		if err := rows.Scan(
			&preset.ID,
			&preset.WorkspaceID,
			&preset.Name,
			&preset.Config,
			&preset.ServiceID,
			&preset.IsDefault,
			&preset.CreatedAt,
			&preset.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan preset: %w", err)
		}
		presets = append(presets, preset)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over presets: %w", err)
	}
	return presets, nil
}

func (pr *PresetRepository) ListByWorkspaceAndService(ctx context.Context, workspaceID, serviceID uuid.UUID, db DB) ([]Preset, error) {
	query := `
		SELECT id, workspace_id, name, config, service_id, is_default, created_at, updated_at
		FROM presets
		WHERE workspace_id = $1::uuid AND service_id = $2
		ORDER BY created_at DESC
	`
	rows, err := db.QueryContext(ctx, query, workspaceID, serviceID)
	if err != nil {
		return nil, fmt.Errorf("failed to list presets: %w", err)
	}
	defer rows.Close()

	var presets []Preset
	for rows.Next() {
		var preset Preset
		if err := rows.Scan(
			&preset.ID,
			&preset.WorkspaceID,
			&preset.Name,
			&preset.Config,
			&preset.ServiceID,
			&preset.IsDefault,
			&preset.CreatedAt,
			&preset.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan preset: %w", err)
		}
		presets = append(presets, preset)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over presets: %w", err)
	}

	return presets, nil
}
func (pr *PresetRepository) Delete(ctx context.Context, id string, db DB) error {
	query := `DELETE FROM presets WHERE id = $1`
	result, err := db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete preset: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}
func (pr *PresetRepository) SetDefault(ctx context.Context, workspaceID uuid.UUID, serviceID, presetID string, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	// Unset previous default
	unsetQuery := `UPDATE presets SET is_default = FALSE WHERE workspace_id = $1 AND service_id = $2 AND is_default = TRUE`
	if _, err = tx.ExecContext(ctx, unsetQuery, workspaceID, serviceID); err != nil {
		return fmt.Errorf("failed to unset previous default preset: %w", err)
	}

	// Set new default
	setQuery := `UPDATE presets SET is_default = TRUE WHERE id = $1 AND workspace_id = $2 AND service_id = $3`
	result, err := tx.ExecContext(ctx, setQuery, presetID, workspaceID, serviceID)
	if err != nil {
		return fmt.Errorf("failed to set new default preset: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (pr *PresetRepository) Update(ctx context.Context, preset Preset, db DB) error {
	query := `
		UPDATE presets
		SET name = $1, config = $2, is_default = $3, updated_at = NOW()
		WHERE id = $4
		RETURNING updated_at
	`
	err := db.QueryRowContext(ctx, query,
		preset.Name,
		preset.Config,
		preset.IsDefault,
		preset.ID,
	).Scan(&preset.UpdatedAt)

	return fmt.Errorf("failed to update preset: %w", err)
}

func (pr *PresetRepository) Upsert(ctx context.Context, preset Preset, db DB) error {
	query := `
		INSERT INTO presets (id, workspace_id, name, config, service_id, is_default)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			config = EXCLUDED.config,
			is_default = EXCLUDED.is_default,
			updated_at = NOW()
		RETURNING created_at, updated_at
	`
	err := db.QueryRowContext(ctx, query,
		preset.ID,
		preset.WorkspaceID,
		preset.Name,
		preset.Config,
		preset.ServiceID,
		preset.IsDefault,
	).Scan(&preset.CreatedAt, &preset.UpdatedAt)

	return fmt.Errorf("failed to upsert preset: %w", err)
}

func (pr *PresetRepository) ClearAll(ctx context.Context, workspace_id string, db DB) error {
	query := `DELETE FROM presets WHERE workspace_id = $1`
	_, err := db.ExecContext(ctx, query, workspace_id)
	if err != nil {
		return fmt.Errorf("failed to clear all presets: %w", err)
	}
	return nil
}
