package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type TestimonialRepository interface {
	Repository[models.Testimonial]
	FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter TestimonialFilter, db DB) ([]models.Testimonial, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status models.ContentStatus, db DB) error
	BatchUpsert(ctx context.Context, testimonials []models.Testimonial, db *sql.DB) error
	Upsert(ctx context.Context, testimonial models.Testimonial, db DB) error
}

type testimonialRepository struct {
	*BaseRepository[models.Testimonial]
}

type TestimonialFilter struct {
	Types       []models.TestimonialType
	Statuses    []models.ContentStatus
	MinRating   int
	MaxRating   int
	Tags        []string
	Categories  []string
	DateRange   DateRange
	SearchQuery string
}

type DateRange struct {
	Start time.Time
	End   time.Time
}

func NewTestimonialRepository(redis *redis.Client, db DB) TestimonialRepository {
	return &testimonialRepository{
		BaseRepository: NewBaseRepository[models.Testimonial](redis, "testimonials"),
	}
}

func (r *testimonialRepository) FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter TestimonialFilter, db DB) ([]models.Testimonial, error) {
	query := `
		SELECT * FROM testimonials 
		WHERE workspace_id = $1
		AND ($2::text[] IS NULL OR type = ANY($2))
		AND ($3::text[] IS NULL OR status = ANY($3))
		AND ($4::int IS NULL OR rating >= $4)
		AND ($5::int IS NULL OR rating <= $5)
		AND ($6::text[] IS NULL OR tags @> $6)
		AND ($7::text[] IS NULL OR categories @> $7)
		AND ($8::timestamptz IS NULL OR created_at >= $8)
		AND ($9::timestamptz IS NULL OR created_at <= $9)
		AND ($10::text IS NULL OR content ILIKE '%' || $10 || '%')
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query,
		workspaceID,
		filter.Types,
		filter.Statuses,
		filter.MinRating,
		filter.MaxRating,
		filter.Tags,
		filter.Categories,
		filter.DateRange.Start,
		filter.DateRange.End,
		filter.SearchQuery,
	)
	if err != nil {
		return nil, fmt.Errorf("error querying testimonials: %w", err)
	}
	defer rows.Close()

	var testimonials []models.Testimonial
	for rows.Next() {
		var t models.Testimonial
		if err := rows.Scan(
			&t.ID, &t.WorkspaceID, &t.Type, &t.Status, &t.Content, &t.MediaURLs,
			&t.Rating, &t.Language, &t.CustomerName, &t.CustomerEmail, &t.CustomerTitle,
			&t.CustomerCompany, &t.CustomerLocation, &t.CustomerAvatarURL,
			&t.CustomerMetadata, &t.CollectionMethod, &t.VerificationMethod,
			&t.VerificationData, &t.VerifiedAt, &t.SourceData, &t.Tags, &t.Categories,
			&t.CustomFields, &t.ViewCount, &t.ShareCount, &t.ConversionCount,
			&t.EngagementMetrics, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning testimonial row: %w", err)
		}
		testimonials = append(testimonials, t)
	}
	return testimonials, nil
}

func (r *testimonialRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.ContentStatus, db DB) error {
	query := "UPDATE testimonials SET status = $1 WHERE id = $2"
	res, err := db.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("error updating testimonial status: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("no testimonial found with ID %s", id)
	}
	return nil
}

func (r *testimonialRepository) Create(ctx context.Context, t *models.Testimonial, db DB) error {
	query := `
	INSERT INTO testimonials (
		workspace_id, type, status, content, media_urls, rating, language,
		customer_name, customer_email, customer_title, customer_company,
		customer_location, customer_avatar_url, customer_metadata,
		collection_method, verification_method, verification_data, verified_at,
		source_data, tags, categories, custom_fields
	) VALUES (
		$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
		$18, $19, $20, $21, $22
	) RETURNING id, created_at, updated_at`

	return db.QueryRowContext(ctx, query,
		t.WorkspaceID, t.Type, t.Status, t.Content, t.MediaURLs, t.Rating, t.Language,
		t.CustomerName, t.CustomerEmail, t.CustomerTitle, t.CustomerCompany,
		t.CustomerLocation, t.CustomerAvatarURL, t.CustomerMetadata,
		t.CollectionMethod, t.VerificationMethod, t.VerificationData, t.VerifiedAt,
		t.SourceData, t.Tags, t.Categories, t.CustomFields,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
}

// func (r *testimonialRepository) BatchUpsert(ctx context.Context, testimonials []models.Testimonial, db DB) error {
// 	// tx, err := db.BeginTxx(ctx, nil)
// 	// if err != nil {
// 	// 	return err
// 	// }

// 	// for _, t := range testimonials {
// 	// 	_, err := tx.NamedExecContext(ctx, `
// 	// 		INSERT INTO testimonials (...)
// 	// 		VALUES (...)
// 	// 		ON CONFLICT (source, source_id) DO UPDATE
// 	// 		SET ...`, t)
// 	// 	if err != nil {
// 	// 		tx.Rollback()
// 	// 		return err
// 	// 	}
// 	// }
// 	// return tx.Commit()
// 	return nil
// }

func (r *testimonialRepository) BatchUpsert(ctx context.Context, testimonials []models.Testimonial, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			slog.Error("transaction failed")
		} else {
			tx.Commit()
			slog.Info("transaction committed")
		}
	}()

	for _, t := range testimonials {
		if err := r.Upsert(ctx, t, db); err != nil {
			tx.Rollback()
			slog.Error("transaction failed rollback")
			return err
		}
	}

	return tx.Commit()
}

func (r *testimonialRepository) Upsert(ctx context.Context, testimonial models.Testimonial, db DB) error {
	query := `
	INSERT INTO reviews (
		workspace_id, type, status, content, media_urls, rating, language,
		customer_name, customer_email, customer_title, customer_company,
		customer_location, customer_avatar_url, customer_metadata,
		collection_method, verification_method, verification_data, verified_at,
		source_data, tags, categories, custom_fields
	) VALUES (
		$1, $2, $3, $4, $5, $6, $7, 
		$8, $9, $10, $11, $12, 
		$13, $14, $15, 
		$16, $17, $18, $19, 
		$20, $21, $22, $23
	)
	ON CONFLICT (workspace_id, type)
	DO UPDATE SET 
		status = EXCLUDED.status,
		content = EXCLUDED.content,
		media_urls = EXCLUDED.media_urls,
		rating = EXCLUDED.rating,
		language = EXCLUDED.language,
		customer_name = EXCLUDED.customer_name,
		customer_email = EXCLUDED.customer_email,
		customer_title = EXCLUDED.customer_title,
		customer_company = EXCLUDED.customer_company,
		customer_location = EXCLUDED.customer_location,
		customer_avatar_url = EXCLUDED.customer_avatar_url,
		customer_metadata = EXCLUDED.customer_metadata,
		collection_method = EXCLUDED.collection_method,
		verification_method = EXCLUDED.verification_method,
		verification_data = EXCLUDED.verification_data,
		verified_at = EXCLUDED.verified_at,
		source_data = EXCLUDED.source_data,
		tags = EXCLUDED.tags,
		categories = EXCLUDED.categories,
		custom_fields = EXCLUDED.custom_fields
	WHERE reviews.source_data->>'review_id' IS NOT NULL
	RETURNING id;
	`
	var id string

	err := db.QueryRowContext(ctx, query,
		testimonial.WorkspaceID, testimonial.Type, testimonial.Status, testimonial.Content, testimonial.MediaURLs, testimonial.Rating, testimonial.Language,
		testimonial.CustomerName, testimonial.CustomerEmail, testimonial.CustomerTitle, testimonial.CustomerCompany,
		testimonial.CustomerLocation, testimonial.CustomerAvatarURL, testimonial.CustomerMetadata,
		testimonial.CollectionMethod, testimonial.VerificationMethod, testimonial.VerificationData, testimonial.VerifiedAt,
		testimonial.SourceData, testimonial.Tags, testimonial.Categories, testimonial.CustomFields,
	).Scan(&id)

	if err != nil {
		return fmt.Errorf("error inserting testimonial: %w", err)
	}
	return nil
}
