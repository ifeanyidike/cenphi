package repositories

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type TestimonialArtifactRepository interface {
	Create(ctx context.Context, artifact *models.TestimonialArtifact, db *sql.DB) error
	GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.TestimonialArtifact, error)
	GetByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]models.TestimonialArtifact, error)
	GetByTestimonialAndType(ctx context.Context, testimonialID uuid.UUID, processingType string, db *sql.DB) (*models.TestimonialArtifact, error)
	Update(ctx context.Context, artifact *models.TestimonialArtifact, db *sql.DB) error
	Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error
	GetHighlights(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]models.TestimonialArtifact, error)
}

type testimonialArtifactRepository struct {
	*BaseRepository[models.TestimonialArtifact]
}

func NewTestimonialArtifactRepository(redis *redis.Client) TestimonialArtifactRepository {
	return &testimonialArtifactRepository{
		BaseRepository: NewBaseRepository[models.TestimonialArtifact](redis, "testimonial_artifact"),
	}
}

func (r *testimonialArtifactRepository) Create(ctx context.Context, artifact *models.TestimonialArtifact, db *sql.DB) error {
	query := `
		INSERT INTO testimonial_artifacts (
			id, testimonial_id, workspace_id, processing_type, result_category, text_content,
			data, asset_url, content_type, platform, format, is_user_saved,
			is_streamed, processing_metadata, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		)
	`

	if artifact.ID == uuid.Nil {
		artifact.ID = uuid.New()
	}

	now := time.Now()
	if artifact.CreatedAt.IsZero() {
		artifact.CreatedAt = now
	}
	artifact.UpdatedAt = now

	_, err := db.ExecContext(ctx, query,
		artifact.ID,
		artifact.TestimonialID,
		artifact.WorkspaceID,
		artifact.ProcessingType,
		artifact.ResultCategory,
		artifact.TextContent,
		artifact.Data,
		artifact.AssetURL,
		artifact.ContentType,
		artifact.Platform,
		artifact.Format,
		artifact.IsUserSaved,
		artifact.IsStreamed,
		artifact.ProcessingMetadata,
		artifact.CreatedAt,
		artifact.UpdatedAt,
	)

	return err
}

func (r *testimonialArtifactRepository) GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.TestimonialArtifact, error) {
	query := `
		SELECT id, testimonial_id, processing_type, result_category, text_content,
			   data, asset_url, content_type, platform, format, is_user_saved,
			   is_streamed, processing_metadata, created_at, updated_at
		FROM testimonial_artifacts WHERE id = $1
	`

	var artifact models.TestimonialArtifact
	err := db.QueryRowContext(ctx, query, id).Scan(
		&artifact.ID,
		&artifact.TestimonialID,
		&artifact.ProcessingType,
		&artifact.ResultCategory,
		&artifact.TextContent,
		&artifact.Data,
		&artifact.AssetURL,
		&artifact.ContentType,
		&artifact.Platform,
		&artifact.Format,
		&artifact.IsUserSaved,
		&artifact.IsStreamed,
		&artifact.ProcessingMetadata,
		&artifact.CreatedAt,
		&artifact.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &artifact, nil
}

func (r *testimonialArtifactRepository) GetByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]models.TestimonialArtifact, error) {
	query := `
		SELECT id, testimonial_id, processing_type, result_category, text_content,
			   data, asset_url, content_type, platform, format, is_user_saved,
			   is_streamed, processing_metadata, created_at, updated_at
		FROM testimonial_artifacts WHERE testimonial_id = $1 ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artifacts []models.TestimonialArtifact
	for rows.Next() {
		var artifact models.TestimonialArtifact
		err := rows.Scan(
			&artifact.ID,
			&artifact.TestimonialID,
			&artifact.ProcessingType,
			&artifact.ResultCategory,
			&artifact.TextContent,
			&artifact.Data,
			&artifact.AssetURL,
			&artifact.ContentType,
			&artifact.Platform,
			&artifact.Format,
			&artifact.IsUserSaved,
			&artifact.IsStreamed,
			&artifact.ProcessingMetadata,
			&artifact.CreatedAt,
			&artifact.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		artifacts = append(artifacts, artifact)
	}

	return artifacts, rows.Err()
}

func (r *testimonialArtifactRepository) GetByTestimonialAndType(ctx context.Context, testimonialID uuid.UUID, processingType string, db *sql.DB) (*models.TestimonialArtifact, error) {
	query := `
		SELECT id, testimonial_id, processing_type, result_category, text_content,
			   data, asset_url, content_type, platform, format, is_user_saved,
			   is_streamed, processing_metadata, created_at, updated_at
		FROM testimonial_artifacts 
		WHERE testimonial_id = $1 AND processing_type = $2 
		ORDER BY created_at DESC LIMIT 1
	`

	var artifact models.TestimonialArtifact
	err := db.QueryRowContext(ctx, query, testimonialID, processingType).Scan(
		&artifact.ID,
		&artifact.TestimonialID,
		&artifact.ProcessingType,
		&artifact.ResultCategory,
		&artifact.TextContent,
		&artifact.Data,
		&artifact.AssetURL,
		&artifact.ContentType,
		&artifact.Platform,
		&artifact.Format,
		&artifact.IsUserSaved,
		&artifact.IsStreamed,
		&artifact.ProcessingMetadata,
		&artifact.CreatedAt,
		&artifact.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &artifact, nil
}

func (r *testimonialArtifactRepository) Update(ctx context.Context, artifact *models.TestimonialArtifact, db *sql.DB) error {
	query := `
		UPDATE testimonial_artifacts SET
			processing_type = $2, result_category = $3, text_content = $4,
			data = $5, asset_url = $6, content_type = $7, platform = $8,
			format = $9, is_user_saved = $10, is_streamed = $11,
			processing_metadata = $12, updated_at = $13
		WHERE id = $1
	`

	artifact.UpdatedAt = time.Now()

	_, err := db.ExecContext(ctx, query,
		artifact.ID,
		artifact.ProcessingType,
		artifact.ResultCategory,
		artifact.TextContent,
		artifact.Data,
		artifact.AssetURL,
		artifact.ContentType,
		artifact.Platform,
		artifact.Format,
		artifact.IsUserSaved,
		artifact.IsStreamed,
		artifact.ProcessingMetadata,
		artifact.UpdatedAt,
	)

	return err
}

func (r *testimonialArtifactRepository) Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM testimonial_artifacts WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id)
	return err
}

func (r *testimonialArtifactRepository) GetHighlights(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]models.TestimonialArtifact, error) {
	query := `
		SELECT id, testimonial_id, processing_type, result_category, text_content,
			   data, asset_url, content_type, platform, format, is_user_saved,
			   is_streamed, processing_metadata, created_at, updated_at
		FROM testimonial_artifacts 
		WHERE testimonial_id = $1 AND processing_type = 'highlight_extraction'
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artifacts []models.TestimonialArtifact
	for rows.Next() {
		var artifact models.TestimonialArtifact
		err := rows.Scan(
			&artifact.ID,
			&artifact.TestimonialID,
			&artifact.ProcessingType,
			&artifact.ResultCategory,
			&artifact.TextContent,
			&artifact.Data,
			&artifact.AssetURL,
			&artifact.ContentType,
			&artifact.Platform,
			&artifact.Format,
			&artifact.IsUserSaved,
			&artifact.IsStreamed,
			&artifact.ProcessingMetadata,
			&artifact.CreatedAt,
			&artifact.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		artifacts = append(artifacts, artifact)
	}

	return artifacts, rows.Err()
}
