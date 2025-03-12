package repositories

//go:generate mockery --name=TestimonialRepository --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type TestimonialRepository interface {
	Repository[models.Testimonial]
	FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db DB) ([]models.Testimonial, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status models.ContentStatus, db DB) error
	BatchUpsert(ctx context.Context, testimonials []models.Testimonial, db *sql.DB) error
	Upsert(ctx context.Context, testimonial models.Testimonial, db DB) error

	FetchByID(ctx context.Context, id uuid.UUID, db DB) (*models.Testimonial, error)
	FetchByCustomerEmail(ctx context.Context, workspaceID uuid.UUID, email string, db DB) ([]models.Testimonial, error)
	CountByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db DB) (int, error)
	FetchTopRated(ctx context.Context, workspaceID uuid.UUID, limit int, db DB) ([]models.Testimonial, error)
	FetchMostRecent(ctx context.Context, workspaceID uuid.UUID, limit int, db DB) ([]models.Testimonial, error)
	FetchByTags(ctx context.Context, workspaceID uuid.UUID, tags []string, matchAll bool, db DB) ([]models.Testimonial, error)
	DeleteByID(ctx context.Context, id uuid.UUID, db DB) error
	UpdateMetrics(ctx context.Context, id uuid.UUID, viewCount, shareCount, conversionCount int, db DB) error
	MarkAsVerified(ctx context.Context, id uuid.UUID, verificationMethod models.VerificationType, verificationData map[string]interface{}, db DB) error
}

type testimonialRepository struct {
	*BaseRepository[models.Testimonial]
}

func NewTestimonialRepository(redis *redis.Client, db DB) TestimonialRepository {
	return &testimonialRepository{
		BaseRepository: NewBaseRepository[models.Testimonial](redis, "testimonials"),
	}
}

func (r *testimonialRepository) buildFilterQuery(query string, workspaceID uuid.UUID, filter models.TestimonialFilter) (string, []any) {
	// query := `
	//     SELECT * FROM testimonials
	//     WHERE workspace_id = $1
	// `

	args := []any{workspaceID}
	argNum := 2

	// Add filter conditions only if they're not empty
	if len(filter.Types) > 0 {
		// Convert slice to array parameter format for Postgres
		typesStr := "{" + strings.Join(mapSlice(filter.Types, func(t models.TestimonialType) string {
			return string(t)
		}), ",") + "}"
		query += fmt.Sprintf(" AND type = ANY($%d::text[])", argNum)
		args = append(args, typesStr)
		argNum++
	} else {
		query += fmt.Sprintf(" AND ($%d::text[] IS NULL OR 1=1)", argNum)
		args = append(args, nil)
		argNum++
	}

	if len(filter.Statuses) > 0 {
		statusesStr := "{" + strings.Join(mapSlice(filter.Statuses, func(s models.ContentStatus) string {
			return string(s)
		}), ",") + "}"
		query += fmt.Sprintf(" AND status = ANY($%d::text[])", argNum)
		args = append(args, statusesStr)
		argNum++
	} else {
		query += fmt.Sprintf(" AND ($%d::text[] IS NULL OR 1=1)", argNum)
		args = append(args, nil)
		argNum++
	}

	// Continue with other filters
	query += fmt.Sprintf(" AND ($%d::int IS NULL OR rating >= $%d)", argNum, argNum)
	args = append(args, filter.MinRating)
	argNum++

	query += fmt.Sprintf(" AND ($%d::int IS NULL OR rating <= $%d)", argNum, argNum)
	args = append(args, filter.MaxRating)
	argNum++

	if len(filter.Tags) > 0 {
		tagsStr := "{" + strings.Join(filter.Tags, ",") + "}"
		query += fmt.Sprintf(" AND tags @> $%d::text[]", argNum)
		args = append(args, tagsStr)
		argNum++
	} else {
		query += fmt.Sprintf(" AND ($%d::text[] IS NULL OR 1=1)", argNum)
		args = append(args, nil)
		argNum++
	}

	if len(filter.Categories) > 0 {
		categoriesStr := "{" + strings.Join(filter.Categories, ",") + "}"
		query += fmt.Sprintf(" AND categories @> $%d::text[]", argNum)
		args = append(args, categoriesStr)
		argNum++
	} else {
		query += fmt.Sprintf(" AND ($%d::text[] IS NULL OR 1=1)", argNum)
		args = append(args, nil)
		argNum++
	}

	// Date range filters
	if !filter.DateRange.Start.IsZero() {
		query += fmt.Sprintf(" AND created_at >= $%d", argNum)
		args = append(args, filter.DateRange.Start)
		argNum++
	} else {
		query += fmt.Sprintf(" AND ($%d::timestamptz IS NULL OR 1=1)", argNum)
		args = append(args, nil)
		argNum++
	}

	if !filter.DateRange.End.IsZero() {
		query += fmt.Sprintf(" AND created_at <= $%d", argNum)
		args = append(args, filter.DateRange.End)
		argNum++
	} else {
		query += fmt.Sprintf(" AND ($%d::timestamptz IS NULL OR 1=1)", argNum)
		args = append(args, nil)
		argNum++
	}

	// Search query
	if filter.SearchQuery != "" {
		query += fmt.Sprintf(" AND content ILIKE '%%' || $%d || '%%'", argNum)
		args = append(args, filter.SearchQuery)
	} else {
		query += fmt.Sprintf(" AND ($%d::text IS NULL OR 1=1)", argNum)
		args = append(args, nil)
	}
	return query, args
}

func (r *testimonialRepository) FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db DB) ([]models.Testimonial, error) {

	query := `
	    SELECT * FROM testimonials
	    WHERE workspace_id = $1
	`
	query, args := r.buildFilterQuery(query, workspaceID, filter)
	query += " ORDER BY created_at DESC"

	// Execute the query
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying testimonials: %w", err)
	}
	defer rows.Close()

	// Rest of the function remains the same...
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
	if testimonials == nil {
		testimonials = []models.Testimonial{}
	}
	return testimonials, nil
}

// Helper function to map slice elements
func mapSlice[T any, R any](slice []T, mapFunc func(T) R) []R {
	result := make([]R, len(slice))
	for i, v := range slice {
		result[i] = mapFunc(v)
	}
	return result
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
	INSERT INTO testimonials (
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
	WHERE testimonials.source_data->>'review_id' IS NOT NULL
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

func (r *testimonialRepository) FetchByID(ctx context.Context, id uuid.UUID, db DB) (*models.Testimonial, error) {
	// query := `SELECT * FROM testimonials WHERE id = $1`
	query := `
		SELECT 
    		t.*,
    		(
      			SELECT json_agg(sa.*)
      			FROM story_analyses sa
      			WHERE sa.testimonial_id = t.id
    		) AS story_analyses,
    		(
      			SELECT json_agg(tp.*)
      			FROM testimonial_dna_profiles tp
      			WHERE tp.testimonial_id = t.id
    		) AS dna_profiles,
    		(
      			SELECT json_agg(apj.*)
      			FROM ai_processing_jobs apj
      			WHERE apj.testimonial_id = t.id
    			) AS processing_jobs,
    		(
      			SELECT json_agg(agc.*)
      			FROM ai_generated_content agc
      			WHERE agc.testimonial_id = t.id
    		) AS generated_contents
		FROM testimonials t
		WHERE t.id = $1;
	`

	var testimonial models.Testimonial
	err := db.QueryRowContext(ctx, query, id).Scan(
		&testimonial.ID, &testimonial.WorkspaceID, &testimonial.Type, &testimonial.Status,
		&testimonial.Content, &testimonial.MediaURLs, &testimonial.Rating, &testimonial.Language,
		&testimonial.CustomerName, &testimonial.CustomerEmail, &testimonial.CustomerTitle,
		&testimonial.CustomerCompany, &testimonial.CustomerLocation, &testimonial.CustomerAvatarURL,
		&testimonial.CustomerMetadata, &testimonial.CollectionMethod, &testimonial.VerificationMethod,
		&testimonial.VerificationData, &testimonial.VerifiedAt, &testimonial.SourceData,
		&testimonial.Tags, &testimonial.Categories, &testimonial.CustomFields,
		&testimonial.ViewCount, &testimonial.ShareCount, &testimonial.ConversionCount,
		&testimonial.EngagementMetrics, &testimonial.CreatedAt, &testimonial.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("testimonial with ID %s not found", id)
		}
		return nil, fmt.Errorf("error fetching testimonial: %w", err)
	}

	return &testimonial, nil
}

func (r *testimonialRepository) FetchByCustomerEmail(ctx context.Context, workspaceID uuid.UUID, email string, db DB) ([]models.Testimonial, error) {
	query := `SELECT * FROM testimonials WHERE workspace_id = $1 AND customer_email = $2 ORDER BY created_at DESC`

	rows, err := db.QueryContext(ctx, query, workspaceID, email)
	if err != nil {
		return nil, fmt.Errorf("error querying testimonials by email: %w", err)
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
			return nil, fmt.Errorf("error scanning testimonial: %w", err)
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, nil
}

func (r *testimonialRepository) CountByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db DB) (int, error) {
	// query := `
	// 	SELECT COUNT(*) FROM testimonials
	// 	WHERE workspace_id = $1
	// 	AND ($2::text[] IS NULL OR type = ANY($2))
	// 	AND ($3::text[] IS NULL OR status = ANY($3))
	// 	AND ($4::int IS NULL OR rating >= $4)
	// 	AND ($5::int IS NULL OR rating <= $5)
	// 	AND ($6::text[] IS NULL OR tags @> $6)
	// 	AND ($7::text[] IS NULL OR categories @> $7)
	// 	AND ($8::timestamptz IS NULL OR created_at >= $8)
	// 	AND ($9::timestamptz IS NULL OR created_at <= $9)
	// 	AND ($10::text IS NULL OR content ILIKE '%' || $10 || '%')
	// `

	query := `
	    SELECT COUNT(*) FROM testimonials
	    WHERE workspace_id = $1
	`
	query, args := r.buildFilterQuery(query, workspaceID, filter)

	var count int
	// err := db.QueryRowContext(ctx, query,
	// 	workspaceID,
	// 	filter.Types,
	// 	filter.Statuses,
	// 	filter.MinRating,
	// 	filter.MaxRating,
	// 	filter.Tags,
	// 	filter.Categories,
	// 	filter.DateRange.Start,
	// 	filter.DateRange.End,
	// 	filter.SearchQuery,
	// ).Scan(&count)
	err := db.QueryRowContext(ctx, query, args...).Scan(&count)

	if err != nil {
		return 0, fmt.Errorf("error counting testimonials: %w", err)
	}

	return count, nil
}

func (r *testimonialRepository) FetchTopRated(ctx context.Context, workspaceID uuid.UUID, limit int, db DB) ([]models.Testimonial, error) {
	query := `
		SELECT * FROM testimonials 
		WHERE workspace_id = $1 AND status = 'approved' AND rating IS NOT NULL 
		ORDER BY rating DESC, created_at DESC 
		LIMIT $2
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, limit)
	if err != nil {
		return nil, fmt.Errorf("error querying top rated testimonials: %w", err)
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
			return nil, fmt.Errorf("error scanning testimonial: %w", err)
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, nil
}

func (r *testimonialRepository) FetchMostRecent(ctx context.Context, workspaceID uuid.UUID, limit int, db DB) ([]models.Testimonial, error) {
	query := `
		SELECT * FROM testimonials 
		WHERE workspace_id = $1 AND status = 'approved' 
		ORDER BY created_at DESC 
		LIMIT $2
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, limit)
	if err != nil {
		return nil, fmt.Errorf("error querying most recent testimonials: %w", err)
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
			return nil, fmt.Errorf("error scanning testimonial: %w", err)
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, nil
}

func (r *testimonialRepository) FetchByTags(ctx context.Context, workspaceID uuid.UUID, tags []string, matchAll bool, db DB) ([]models.Testimonial, error) {
	var query string
	if matchAll {
		// All tags must match (strict containment)
		query = `
			SELECT * FROM testimonials 
			WHERE workspace_id = $1 AND tags @> $2
			ORDER BY created_at DESC
		`
	} else {
		// Any tag can match (overlap)
		query = `
			SELECT * FROM testimonials 
			WHERE workspace_id = $1 AND tags && $2
			ORDER BY created_at DESC
		`
	}

	rows, err := db.QueryContext(ctx, query, workspaceID, tags)
	if err != nil {
		return nil, fmt.Errorf("error querying testimonials by tags: %w", err)
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
			return nil, fmt.Errorf("error scanning testimonial: %w", err)
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, nil
}

func (r *testimonialRepository) DeleteByID(ctx context.Context, id uuid.UUID, db DB) error {
	query := "DELETE FROM testimonials WHERE id = $1"

	res, err := db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("error deleting testimonial: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no testimonial found with ID %s", id)
	}

	// // Delete from cache if present
	// cacheKey := fmt.Sprintf("testimonial:%s", id)
	// err = r.Redis.Del(ctx, cacheKey).Err()
	// if err != nil {
	// 	// Just log the error but don't fail the operation
	// 	fmt.Printf("error deleting testimonial from cache: %v", err)
	// }

	return nil
}

func (r *testimonialRepository) UpdateMetrics(ctx context.Context, id uuid.UUID, viewCount, shareCount, conversionCount int, db DB) error {
	query := `
		UPDATE testimonials 
		SET view_count = $1, share_count = $2, conversion_count = $3, updated_at = NOW()
		WHERE id = $4
	`

	res, err := db.ExecContext(ctx, query, viewCount, shareCount, conversionCount, id)
	if err != nil {
		return fmt.Errorf("error updating testimonial metrics: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no testimonial found with ID %s", id)
	}

	// // Invalidate cache
	// cacheKey := fmt.Sprintf("testimonial:%s", id)
	// err = r.Redis.Del(ctx, cacheKey).Err()
	// if err != nil {
	// 	// Just log the error but don't fail the operation
	// 	fmt.Printf("error invalidating testimonial cache: %v", err)
	// }

	return nil
}

func (r *testimonialRepository) MarkAsVerified(ctx context.Context, id uuid.UUID, verificationMethod models.VerificationType, verificationData map[string]interface{}, db DB) error {
	query := `
		UPDATE testimonials 
		SET verification_method = $1, verification_data = $2, verified_at = NOW(), updated_at = NOW()
		WHERE id = $3
	`

	res, err := db.ExecContext(ctx, query, verificationMethod, verificationData, id)
	if err != nil {
		return fmt.Errorf("error marking testimonial as verified: %w", err)
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
