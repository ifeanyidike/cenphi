package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type HighlightRepository struct {
	logger *zap.Logger
	*BaseRepository[models.TestimonialHighlight]
}

func NewHighlightRepository(redis *redis.Client, logger *zap.Logger) HighlightRepository {
	return HighlightRepository{
		logger:         logger,
		BaseRepository: NewBaseRepository[models.TestimonialHighlight](redis, "testimonial_highlights"),
	}
}

// Create creates a new highlight
func (r HighlightRepository) Create(ctx context.Context, highlight *models.TestimonialHighlight, db DB) error {
	query := `
		INSERT INTO testimonial_highlights (
			id, testimonial_id, workspace_id, highlight_type, extraction_mode,
			moments, story_metadata, processing_metadata, moment_count, total_duration,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
	`

	if highlight.ID == uuid.Nil {
		highlight.ID = uuid.New()
	}

	now := time.Now()
	if highlight.CreatedAt.IsZero() {
		highlight.CreatedAt = now
	}
	highlight.UpdatedAt = now

	// CRITICAL: Serialize JSONB fields and use string(...)
	momentsJSON, err := json.Marshal(highlight.Moments)
	if err != nil {
		return fmt.Errorf("marshal moments: %w", err)
	}

	storyMetadataJSON, err := json.Marshal(highlight.StoryMetadata)
	if err != nil {
		return fmt.Errorf("marshal story_metadata: %w", err)
	}

	processingMetadataJSON, err := json.Marshal(highlight.ProcessingMetadata)
	if err != nil {
		return fmt.Errorf("marshal processing_metadata: %w", err)
	}

	_, err = db.ExecContext(ctx, query,
		highlight.ID,
		highlight.TestimonialID,
		highlight.WorkspaceID,
		highlight.HighlightType,
		highlight.ExtractionMode,
		string(momentsJSON),             // CRITICAL: string(...)
		string(storyMetadataJSON),       // CRITICAL: string(...)
		string(processingMetadataJSON),  // CRITICAL: string(...)
		highlight.MomentCount,
		highlight.TotalDuration,
		highlight.CreatedAt,
		highlight.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create highlight: %w", err)
	}

	r.logger.Info("Created highlight",
		zap.String("highlight_id", highlight.ID.String()),
		zap.String("testimonial_id", highlight.TestimonialID.String()),
		zap.String("highlight_type", highlight.HighlightType),
		zap.String("extraction_mode", highlight.ExtractionMode))

	return nil
}

// Upsert creates or updates a highlight (uses ON CONFLICT)
func (r HighlightRepository) Upsert(ctx context.Context, highlight *models.TestimonialHighlight, db DB) error {
	query := `
		INSERT INTO testimonial_highlights (
			id, testimonial_id, workspace_id, highlight_type, extraction_mode,
			moments, story_metadata, processing_metadata, moment_count, total_duration,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
		ON CONFLICT (testimonial_id, highlight_type, extraction_mode)
		DO UPDATE SET
			moments = EXCLUDED.moments,
			story_metadata = EXCLUDED.story_metadata,
			processing_metadata = EXCLUDED.processing_metadata,
			moment_count = EXCLUDED.moment_count,
			total_duration = EXCLUDED.total_duration,
			updated_at = NOW()
		RETURNING id
	`

	if highlight.ID == uuid.Nil {
		highlight.ID = uuid.New()
	}

	now := time.Now()
	if highlight.CreatedAt.IsZero() {
		highlight.CreatedAt = now
	}
	highlight.UpdatedAt = now

	// Serialize JSONB fields
	momentsJSON, err := json.Marshal(highlight.Moments)
	if err != nil {
		return fmt.Errorf("marshal moments: %w", err)
	}

	storyMetadataJSON, err := json.Marshal(highlight.StoryMetadata)
	if err != nil {
		return fmt.Errorf("marshal story_metadata: %w", err)
	}

	processingMetadataJSON, err := json.Marshal(highlight.ProcessingMetadata)
	if err != nil {
		return fmt.Errorf("marshal processing_metadata: %w", err)
	}

	var returnedID uuid.UUID
	err = db.QueryRowContext(ctx, query,
		highlight.ID, highlight.TestimonialID, highlight.WorkspaceID,
		highlight.HighlightType, highlight.ExtractionMode,
		string(momentsJSON), string(storyMetadataJSON), string(processingMetadataJSON),
		highlight.MomentCount, highlight.TotalDuration,
		highlight.CreatedAt, highlight.UpdatedAt,
	).Scan(&returnedID)

	if err != nil {
		return fmt.Errorf("failed to upsert highlight: %w", err)
	}

	// Update the ID if it was an update (conflict)
	highlight.ID = returnedID

	r.logger.Info("Upserted highlight",
		zap.String("highlight_id", highlight.ID.String()),
		zap.String("testimonial_id", highlight.TestimonialID.String()),
		zap.String("highlight_type", highlight.HighlightType),
		zap.String("extraction_mode", highlight.ExtractionMode))

	return nil
}

// GetByTestimonialAndType gets a specific highlight by testimonial, type, and mode
func (r HighlightRepository) GetByTestimonialAndType(
	ctx context.Context,
	testimonialID uuid.UUID,
	highlightType string,
	extractionMode string,
	db DB,
) (*models.TestimonialHighlight, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, highlight_type, extraction_mode,
			   moments, story_metadata, processing_metadata, moment_count, total_duration,
			   created_at, updated_at
		FROM testimonial_highlights
		WHERE testimonial_id = $1 AND highlight_type = $2 AND extraction_mode = $3
	`

	var highlight models.TestimonialHighlight
	err := db.QueryRowContext(ctx, query, testimonialID, highlightType, extractionMode).Scan(
		&highlight.ID,
		&highlight.TestimonialID,
		&highlight.WorkspaceID,
		&highlight.HighlightType,
		&highlight.ExtractionMode,
		&highlight.Moments,
		&highlight.StoryMetadata,
		&highlight.ProcessingMetadata,
		&highlight.MomentCount,
		&highlight.TotalDuration,
		&highlight.CreatedAt,
		&highlight.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Not found, return nil without error
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get highlight: %w", err)
	}

	return &highlight, nil
}

// GetByTestimonialID gets all highlights for a testimonial (all types and modes)
func (r HighlightRepository) GetByTestimonialID(
	ctx context.Context,
	testimonialID uuid.UUID,
	db DB,
) ([]models.TestimonialHighlight, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, highlight_type, extraction_mode,
			   moments, story_metadata, processing_metadata, moment_count, total_duration,
			   created_at, updated_at
		FROM testimonial_highlights
		WHERE testimonial_id = $1
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, fmt.Errorf("failed to query highlights: %w", err)
	}
	defer rows.Close()

	var highlights []models.TestimonialHighlight
	for rows.Next() {
		var h models.TestimonialHighlight
		err := rows.Scan(
			&h.ID, &h.TestimonialID, &h.WorkspaceID, &h.HighlightType, &h.ExtractionMode,
			&h.Moments, &h.StoryMetadata, &h.ProcessingMetadata, &h.MomentCount, &h.TotalDuration,
			&h.CreatedAt, &h.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan highlight: %w", err)
		}
		highlights = append(highlights, h)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating highlights: %w", err)
	}

	return highlights, nil
}

// GetStandaloneHighlights gets only standalone highlights for a testimonial
// Useful for the highlights tab UI (only shows standalone-worthy moments)
func (r HighlightRepository) GetStandaloneHighlights(
	ctx context.Context,
	testimonialID uuid.UUID,
	db DB,
) ([]models.TestimonialHighlight, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, highlight_type, extraction_mode,
			   moments, story_metadata, processing_metadata, moment_count, total_duration,
			   created_at, updated_at
		FROM testimonial_highlights
		WHERE testimonial_id = $1 AND extraction_mode = 'standalone'
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, fmt.Errorf("failed to query standalone highlights: %w", err)
	}
	defer rows.Close()

	var highlights []models.TestimonialHighlight
	for rows.Next() {
		var h models.TestimonialHighlight
		err := rows.Scan(
			&h.ID, &h.TestimonialID, &h.WorkspaceID, &h.HighlightType, &h.ExtractionMode,
			&h.Moments, &h.StoryMetadata, &h.ProcessingMetadata, &h.MomentCount, &h.TotalDuration,
			&h.CreatedAt, &h.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan standalone highlight: %w", err)
		}
		highlights = append(highlights, h)
	}

	return highlights, rows.Err()
}

// GetStoryVideoHighlights gets only story_video highlights for a testimonial
// Useful for story video generation (shows all moments including shorter/longer ones)
func (r HighlightRepository) GetStoryVideoHighlights(
	ctx context.Context,
	testimonialID uuid.UUID,
	db DB,
) ([]models.TestimonialHighlight, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, highlight_type, extraction_mode,
			   moments, story_metadata, processing_metadata, moment_count, total_duration,
			   created_at, updated_at
		FROM testimonial_highlights
		WHERE testimonial_id = $1 AND extraction_mode = 'story_video'
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, fmt.Errorf("failed to query story video highlights: %w", err)
	}
	defer rows.Close()

	var highlights []models.TestimonialHighlight
	for rows.Next() {
		var h models.TestimonialHighlight
		err := rows.Scan(
			&h.ID, &h.TestimonialID, &h.WorkspaceID, &h.HighlightType, &h.ExtractionMode,
			&h.Moments, &h.StoryMetadata, &h.ProcessingMetadata, &h.MomentCount, &h.TotalDuration,
			&h.CreatedAt, &h.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan story video highlight: %w", err)
		}
		highlights = append(highlights, h)
	}

	return highlights, rows.Err()
}

// Delete deletes a highlight
func (r HighlightRepository) Delete(ctx context.Context, highlightID uuid.UUID, db DB) error {
	query := `DELETE FROM testimonial_highlights WHERE id = $1`

	result, err := db.ExecContext(ctx, query, highlightID)
	if err != nil {
		return fmt.Errorf("failed to delete highlight: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("highlight not found: %s", highlightID)
	}

	r.logger.Info("Deleted highlight", zap.String("highlight_id", highlightID.String()))

	return nil
}
