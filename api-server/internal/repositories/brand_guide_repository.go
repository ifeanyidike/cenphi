// repositories/brand_guide_repository.go
package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type BrandGuideRepository interface {
	// Create(ctx context.Context, guide *models.BrandGuide, db DB) error
	// Update(ctx context.Context, guide *models.BrandGuide, db DB) error
	// FetchByID(ctx context.Context, id uuid.UUID, db DB) (*models.BrandGuide, error)
	// FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, db DB) ([]models.BrandGuide, error)
	// FetchDefault(ctx context.Context, workspaceID uuid.UUID, db DB) (*models.BrandGuide, error)
	// SetDefault(ctx context.Context, id uuid.UUID, workspaceID uuid.UUID, db DB) error
	// Delete(ctx context.Context, id uuid.UUID, db DB) error
}

type brandGuideRepository struct {
	*BaseRepository[models.BrandGuide]
}

func NewBrandGuideRepository(redis *redis.Client) BrandGuideRepository {
	return &brandGuideRepository{
		BaseRepository: NewBaseRepository[models.BrandGuide](redis, "brand_guides"),
	}
}

func (r *brandGuideRepository) Create(ctx context.Context, guide *models.BrandGuide, db DB) error {
	query := `
		INSERT INTO brand_guides (
			workspace_id, name, colors, typography, testimonial_style, testimonial_shape,
			testimonial_layout, show_rating, show_avatar, show_date, show_company,
			animation, shadow, border, rating_style, voice, ui_settings, is_default
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
		) RETURNING id, created_at, updated_at
	`

	return db.QueryRowContext(ctx, query,
		guide.WorkspaceID, guide.Name, guide.Colors, guide.Typography, guide.TestimonialStyle,
		guide.TestimonialShape, guide.TestimonialLayout, guide.ShowRating, guide.ShowAvatar,
		guide.ShowDate, guide.ShowCompany, guide.Animation, guide.Shadow, guide.Border,
		guide.RatingStyle, guide.Voice, guide.UISettings, guide.IsDefault,
	).Scan(&guide.ID, &guide.CreatedAt, &guide.UpdatedAt)
}

func (r *brandGuideRepository) FetchDefault(ctx context.Context, workspaceID uuid.UUID, db DB) (*models.BrandGuide, error) {
	query := `
		SELECT 
			id, workspace_id, name, colors, typography, testimonial_style, testimonial_shape,
			testimonial_layout, show_rating, show_avatar, show_date, show_company,
			animation, shadow, border, rating_style, voice, ui_settings, is_default,
			created_at, updated_at
		FROM brand_guides
		WHERE workspace_id = $1 AND is_default = true
	`

	var guide models.BrandGuide
	err := db.QueryRowContext(ctx, query, workspaceID).Scan(
		&guide.ID, &guide.WorkspaceID, &guide.Name, &guide.Colors, &guide.Typography,
		&guide.TestimonialStyle, &guide.TestimonialShape, &guide.TestimonialLayout,
		&guide.ShowRating, &guide.ShowAvatar, &guide.ShowDate, &guide.ShowCompany,
		&guide.Animation, &guide.Shadow, &guide.Border, &guide.RatingStyle,
		&guide.Voice, &guide.UISettings, &guide.IsDefault, &guide.CreatedAt, &guide.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("no default brand guide found for workspace ID %s", workspaceID)
		}
		return nil, fmt.Errorf("error fetching default brand guide: %w", err)
	}

	return &guide, nil
}

func (r *brandGuideRepository) SetDefault(ctx context.Context, id uuid.UUID, workspaceID uuid.UUID, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback()

	// First, unset default for all guides in this workspace
	_, err = tx.ExecContext(ctx, "UPDATE brand_guides SET is_default = false WHERE workspace_id = $1", workspaceID)
	if err != nil {
		return fmt.Errorf("error unsetting default brand guides: %w", err)
	}

	// Then set the specified guide as default
	result, err := tx.ExecContext(ctx, "UPDATE brand_guides SET is_default = true WHERE id = $1 AND workspace_id = $2", id, workspaceID)
	if err != nil {
		return fmt.Errorf("error setting default brand guide: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no brand guide found with ID %s in workspace %s", id, workspaceID)
	}

	return tx.Commit()
}
