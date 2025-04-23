package repositories

//go:generate mockery --name=TestimonialRepository --output=./mocks --case=underscore

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
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

func NewTestimonialRepository(redis *redis.Client) TestimonialRepository {
	return &testimonialRepository{
		BaseRepository: NewBaseRepository[models.Testimonial](redis, "testimonials"),
	}
}

// func (r *testimonialRepository) buildFilterQuery(query string, workspaceID uuid.UUID, filter models.TestimonialFilter) (string, []any) {
// 	// query := `
// 	//     SELECT * FROM testimonials
// 	//     WHERE workspace_id = $1
// 	// `

// 	args := []any{workspaceID}
// 	argNum := 2

// 	// Add filter conditions only if they're not empty
// 	if len(filter.Types) > 0 {
// 		// Convert slice to array parameter format for Postgres
// 		typesStr := "{" + strings.Join(mapSlice(filter.Types, func(t models.TestimonialType) string {
// 			return string(t)
// 		}), ",") + "}"
// 		query += fmt.Sprintf(" AND testimonial_type = ANY($%d::text[])", argNum)
// 		args = append(args, typesStr)
// 		argNum++
// 	} else {
// 		query += fmt.Sprintf(" AND ($%d::text[] IS NULL OR 1=1)", argNum)
// 		args = append(args, nil)
// 		argNum++
// 	}

// 	if len(filter.Statuses) > 0 {
// 		statusesStr := "{" + strings.Join(mapSlice(filter.Statuses, func(s models.ContentStatus) string {
// 			return string(s)
// 		}), ",") + "}"
// 		query += fmt.Sprintf(" AND status = ANY($%d::text[])", argNum)
// 		args = append(args, statusesStr)
// 		argNum++
// 	} else {
// 		query += fmt.Sprintf(" AND ($%d::text[] IS NULL OR 1=1)", argNum)
// 		args = append(args, nil)
// 		argNum++
// 	}

// 	// Continue with other filters
// 	query += fmt.Sprintf(" AND ($%d::int IS NULL OR rating >= $%d)", argNum, argNum)
// 	args = append(args, filter.MinRating)
// 	argNum++

// 	query += fmt.Sprintf(" AND ($%d::int IS NULL OR rating <= $%d)", argNum, argNum)
// 	args = append(args, filter.MaxRating)
// 	argNum++

// 	if len(filter.Tags) > 0 {
// 		tagsStr := "{" + strings.Join(filter.Tags, ",") + "}"
// 		query += fmt.Sprintf(" AND tags @> $%d::text[]", argNum)
// 		args = append(args, tagsStr)
// 		argNum++
// 	} else {
// 		query += fmt.Sprintf(" AND ($%d::text[] IS NULL OR 1=1)", argNum)
// 		args = append(args, nil)
// 		argNum++
// 	}

// 	if len(filter.Categories) > 0 {
// 		categoriesStr := "{" + strings.Join(filter.Categories, ",") + "}"
// 		query += fmt.Sprintf(" AND categories @> $%d::text[]", argNum)
// 		args = append(args, categoriesStr)
// 		argNum++
// 	} else {
// 		query += fmt.Sprintf(" AND ($%d::text[] IS NULL OR 1=1)", argNum)
// 		args = append(args, nil)
// 		argNum++
// 	}

// 	// Date range filters
// 	if !filter.DateRange.Start.IsZero() {
// 		query += fmt.Sprintf(" AND created_at >= $%d", argNum)
// 		args = append(args, filter.DateRange.Start)
// 		argNum++
// 	} else {
// 		query += fmt.Sprintf(" AND ($%d::timestamptz IS NULL OR 1=1)", argNum)
// 		args = append(args, nil)
// 		argNum++
// 	}

// 	if !filter.DateRange.End.IsZero() {
// 		query += fmt.Sprintf(" AND created_at <= $%d", argNum)
// 		args = append(args, filter.DateRange.End)
// 		argNum++
// 	} else {
// 		query += fmt.Sprintf(" AND ($%d::timestamptz IS NULL OR 1=1)", argNum)
// 		args = append(args, nil)
// 		argNum++
// 	}

// 	// Search query
// 	if filter.SearchQuery != "" {
// 		query += fmt.Sprintf(" AND content ILIKE '%%' || $%d || '%%'", argNum)
// 		args = append(args, filter.SearchQuery)
// 	} else {
// 		query += fmt.Sprintf(" AND ($%d::text IS NULL OR 1=1)", argNum)
// 		args = append(args, nil)
// 	}
// 	return query, args
// }

func (r *testimonialRepository) buildFilterQuery(query string, workspaceID uuid.UUID, filter models.TestimonialFilter) (string, []any) {
	args := []any{workspaceID}
	argNum := 2

	// Add filter conditions only if they're not empty
	if len(filter.Types) > 0 {
		typesStr := "{" + strings.Join(mapSlice(filter.Types, func(t models.TestimonialType) string {
			return string(t)
		}), ",") + "}"
		query += fmt.Sprintf(" AND testimonial_type = ANY($%d::text[])", argNum)
		args = append(args, typesStr)
		argNum++
	}

	if len(filter.Statuses) > 0 {
		statusesStr := "{" + strings.Join(mapSlice(filter.Statuses, func(s models.ContentStatus) string {
			return string(s)
		}), ",") + "}"
		query += fmt.Sprintf(" AND status = ANY($%d::text[])", argNum)
		args = append(args, statusesStr)
		argNum++
	}

	// Only add rating filters if they're non-zero
	if filter.MinRating > 0 {
		query += fmt.Sprintf(" AND rating >= $%d", argNum)
		args = append(args, filter.MinRating)
		argNum++
	}

	if filter.MaxRating > 0 {
		query += fmt.Sprintf(" AND rating <= $%d", argNum)
		args = append(args, filter.MaxRating)
		argNum++
	}

	if len(filter.Tags) > 0 {
		tagsStr := "{" + strings.Join(filter.Tags, ",") + "}"
		query += fmt.Sprintf(" AND tags @> $%d::text[]", argNum)
		args = append(args, tagsStr)
		argNum++
	}

	if len(filter.Categories) > 0 {
		categoriesStr := "{" + strings.Join(filter.Categories, ",") + "}"
		query += fmt.Sprintf(" AND categories @> $%d::text[]", argNum)
		args = append(args, categoriesStr)
		argNum++
	}

	// Date range filters
	if !filter.DateRange.Start.IsZero() {
		query += fmt.Sprintf(" AND created_at >= $%d", argNum)
		args = append(args, filter.DateRange.Start)
		argNum++
	}

	if !filter.DateRange.End.IsZero() {
		query += fmt.Sprintf(" AND created_at <= $%d", argNum)
		args = append(args, filter.DateRange.End)
		argNum++
	}

	// Search query
	if filter.SearchQuery != "" {
		query += fmt.Sprintf(" AND content ILIKE '%%' || $%d || '%%'", argNum)
		args = append(args, filter.SearchQuery)
		argNum++
	}

	// Collection methods filter
	if len(filter.CollectionMethods) > 0 {
		methodsStr := "{" + strings.Join(mapSlice(filter.CollectionMethods, func(m models.CollectionMethod) string {
			return string(m)
		}), ",") + "}"
		query += fmt.Sprintf(" AND collection_method = ANY($%d::text[])", argNum)
		args = append(args, methodsStr)
	}

	return query, args
}

func (r *testimonialRepository) FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db DB) ([]models.Testimonial, error) {
	query := `
		SELECT 
		  id, workspace_id, customer_profile_id, testimonial_type, format, status, language,
		  title, summary, content, transcript, media_urls, rating, media_url, media_duration,
		  thumbnail_url, additional_media, custom_formatting, product_context, experience_context,
		  collection_method, verification_method, verification_data, verification_status,
	  	  verified_at, authenticity_score, source_data, published, published_at, scheduled_publish_at,
	  	  tags, categories, custom_fields, view_count, share_count, conversion_count, engagement_metrics,
	  	  created_at, updated_at
		FROM testimonials
		WHERE workspace_id = $1
`
	query, args := r.buildFilterQuery(query, workspaceID, filter)
	query += " ORDER BY created_at DESC"

	// Debug logging
	log.Printf("Query: %s", query)
	log.Printf("Args: %+v", args)

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
			&t.ID,
			&t.WorkspaceID,
			&t.CustomerProfileID,
			&t.TestimonialType,
			&t.Format,
			&t.Status,
			&t.Language,
			&t.Title,
			&t.Summary,
			&t.Content,
			&t.Transcript,
			&t.MediaURLs,
			&t.Rating,
			&t.MediaURL,
			&t.MediaDuration,
			&t.ThumbnailURL,
			&t.AdditionalMedia,
			&t.CustomFormatting,
			&t.ProductContext,
			&t.ExperienceContext,
			&t.CollectionMethod,
			&t.VerificationMethod,
			&t.VerificationData,
			&t.VerificationStatus,
			&t.VerifiedAt,
			&t.AuthenticityScore,
			&t.SourceData,
			&t.Published,
			&t.PublishedAt,
			&t.ScheduledPublishAt,
			&t.Tags,
			&t.Categories,
			&t.CustomFields,
			&t.ViewCount,
			&t.ShareCount,
			&t.ConversionCount,
			&t.EngagementMetrics,
			&t.CreatedAt,
			&t.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning testimonial row: %w", err)
		}
		testimonials = append(testimonials, t)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating testimonial rows: %w", err)
	}

	if testimonials == nil {
		testimonials = []models.Testimonial{}
	}

	log.Printf("Found %d testimonials", len(testimonials))
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
		workspace_id, customer_profile_id, testimonial_type, format, status, language,
		title, summary, content, transcript, media_urls, rating, media_url, media_duration,
		thumbnail_url, additional_media, custom_formatting, product_context, purchase_context, experience_context,
		collection_method, verification_method, verification_data, verification_status, verified_at,
		authenticity_score, source_data, published, published_at, scheduled_publish_at,
		tags, categories, custom_fields, view_count, share_count, conversion_count, engagement_metrics
	) VALUES (
		$1, $2, $3, $4, $5, $6,
		$7, $8, $9, $10, $11, $12, $13, $14,
		$15, $16, $17, $18, $19,
		$20, $21, $22, $23, $24,
		$25, $26, $27, $28, $29,
		$30, $31, $32, $33, $34, $35, $36, $37
	) RETURNING id, created_at, updated_at
	`

	return db.QueryRowContext(ctx, query,
		t.WorkspaceID,
		t.CustomerProfileID,
		t.TestimonialType,
		t.Format,
		t.Status,
		t.Language,
		t.Title,
		t.Summary,
		t.Content,
		t.Transcript,
		t.MediaURLs,
		t.Rating,
		t.MediaURL,
		t.MediaDuration,
		t.ThumbnailURL,
		t.AdditionalMedia,
		t.CustomFormatting,
		t.ProductContext,
		t.PurchaseContext,
		t.ExperienceContext,
		t.CollectionMethod,
		t.VerificationMethod,
		t.VerificationData,
		t.VerificationStatus,
		t.VerifiedAt,
		t.AuthenticityScore,
		t.SourceData,
		t.Published,
		t.PublishedAt,
		t.ScheduledPublishAt,
		t.Tags,
		t.Categories,
		t.CustomFields,
		t.ViewCount,
		t.ShareCount,
		t.ConversionCount,
		t.EngagementMetrics,
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
		workspace_id, customer_profile_id, testimonial_type, format, status, language,
		title, summary, content, transcript, media_urls, rating, media_url, media_duration,
		thumbnail_url, additional_media, custom_formatting, product_context, purchase_context, experience_context,
		collection_method, verification_method, verification_data, verification_status, verified_at,
		authenticity_score, source_data, published, published_at, scheduled_publish_at,
		tags, categories, custom_fields, view_count, share_count, conversion_count, engagement_metrics
	) VALUES (
		$1, $2, $3, $4, $5, $6,
		$7, $8, $9, $10, $11, $12, $13, $14,
		$15, $16, $17, $18, $19,
		$20, $21, $22, $23, $24,
		$25, $26, $27, $28, $29,
		$30, $31, $32, $33, $34, $35, $36, $37
	)
	ON CONFLICT (workspace_id, customer_profile_id)
	DO UPDATE SET 
		status = EXCLUDED.status,
		title = EXCLUDED.title,
		summary = EXCLUDED.summary,
		content = EXCLUDED.content,
		transcript = EXCLUDED.transcript,
		media_urls = EXCLUDED.media_urls,
		rating = EXCLUDED.rating,
		media_url = EXCLUDED.media_url,
		media_duration = EXCLUDED.media_duration,
		thumbnail_url = EXCLUDED.thumbnail_url,
		additional_media = EXCLUDED.additional_media,
		custom_formatting = EXCLUDED.custom_formatting,
		product_context = EXCLUDED.product_context,
		purchase_context = EXCLUDED.purchase_context,
		experience_context = EXCLUDED.experience_context,
		collection_method = EXCLUDED.collection_method,
		verification_method = EXCLUDED.verification_method,
		verification_data = EXCLUDED.verification_data,
		verification_status = EXCLUDED.verification_status,
		verified_at = EXCLUDED.verified_at,
		authenticity_score = EXCLUDED.authenticity_score,
		source_data = EXCLUDED.source_data,
		published = EXCLUDED.published,
		published_at = EXCLUDED.published_at,
		scheduled_publish_at = EXCLUDED.scheduled_publish_at,
		tags = EXCLUDED.tags,
		categories = EXCLUDED.categories,
		custom_fields = EXCLUDED.custom_fields,
		view_count = EXCLUDED.view_count,
		share_count = EXCLUDED.share_count,
		conversion_count = EXCLUDED.conversion_count,
		engagement_metrics = EXCLUDED.engagement_metrics
	WHERE testimonials.source_data->>'review_id' IS NOT NULL
	RETURNING id;
	`
	var id string

	err := db.QueryRowContext(ctx, query,
		testimonial.WorkspaceID,
		testimonial.CustomerProfileID,
		testimonial.TestimonialType,
		testimonial.Format,
		testimonial.Status,
		testimonial.Language,
		testimonial.Title,
		testimonial.Summary,
		testimonial.Content,
		testimonial.Transcript,
		testimonial.MediaURLs,
		testimonial.Rating,
		testimonial.MediaURL,
		testimonial.MediaDuration,
		testimonial.ThumbnailURL,
		testimonial.AdditionalMedia,
		testimonial.CustomFormatting,
		testimonial.ProductContext,
		testimonial.PurchaseContext,
		testimonial.ExperienceContext,
		testimonial.CollectionMethod,
		testimonial.VerificationMethod,
		testimonial.VerificationData,
		testimonial.VerificationStatus,
		testimonial.VerifiedAt,
		testimonial.AuthenticityScore,
		testimonial.SourceData,
		testimonial.Published,
		testimonial.PublishedAt,
		testimonial.ScheduledPublishAt,
		testimonial.Tags,
		testimonial.Categories,
		testimonial.CustomFields,
		testimonial.ViewCount,
		testimonial.ShareCount,
		testimonial.ConversionCount,
		testimonial.EngagementMetrics,
	).Scan(&id)

	if err != nil {
		return fmt.Errorf("error inserting testimonial: %w", err)
	}
	return nil
}

// func (r *testimonialRepository) FetchByID(ctx context.Context, id uuid.UUID, db DB) (*models.Testimonial, error) {
// 	query := `
// 		SELECT
//     		t.*,
//     		(
//       			SELECT json_agg(sa.*)
//       			FROM story_analyses sa
//       			WHERE sa.testimonial_id = t.id
//     		) AS story_analyses,
//     		(
//       			SELECT json_agg(tp.*)
//       			FROM testimonial_dna_profiles tp
//       			WHERE tp.testimonial_id = t.id
//     		) AS dna_profiles,
//     		(
//       			SELECT json_agg(apj.*)
//       			FROM ai_processing_jobs apj
//       			WHERE apj.testimonial_id = t.id
//     		) AS processing_jobs,
//     		(
//       			SELECT json_agg(agc.*)
//       			FROM ai_generated_content agc
//       			WHERE agc.testimonial_id = t.id
//     		) AS generated_contents
// 		FROM testimonials t
// 		WHERE t.id = $1;
// 	`

// 	var testimonial models.Testimonial
// 	err := db.QueryRowContext(ctx, query, id).Scan(
// 		&testimonial.ID, &testimonial.WorkspaceID, &testimonial.CustomerProfileID,
// 		&testimonial.TestimonialType, &testimonial.Format, &testimonial.Status, &testimonial.Language,
// 		&testimonial.Title, &testimonial.Summary, &testimonial.Content, &testimonial.Transcript, &testimonial.MediaURLs,
// 		&testimonial.Rating, &testimonial.MediaURL, &testimonial.MediaDuration, &testimonial.ThumbnailURL,
// 		&testimonial.AdditionalMedia, &testimonial.ProductContext, &testimonial.PurchaseContext, &testimonial.ExperienceContext,
// 		&testimonial.CollectionMethod, &testimonial.VerificationMethod, &testimonial.VerificationData, &testimonial.VerificationStatus,
// 		&testimonial.VerifiedAt, &testimonial.AuthenticityScore, &testimonial.SourceData,
// 		&testimonial.Published, &testimonial.PublishedAt, &testimonial.ScheduledPublishAt,
// 		&testimonial.Tags, &testimonial.Categories, &testimonial.CustomFields,
// 		&testimonial.ViewCount, &testimonial.ShareCount, &testimonial.ConversionCount,
// 		&testimonial.EngagementMetrics, &testimonial.CreatedAt, &testimonial.UpdatedAt,
// 	)

// 	if err != nil {
// 		if errors.Is(err, sql.ErrNoRows) {
// 			return nil, fmt.Errorf("testimonial with ID %s not found", id)
// 		}
// 		return nil, fmt.Errorf("error fetching testimonial: %w", err)
// 	}

// 	return &testimonial, nil
// }

// func (r *testimonialRepository) FetchByID(ctx context.Context, id uuid.UUID, db DB) (*models.Testimonial, error) {
// 	query := `
//         SELECT
//             t.*,
//             (
//                 SELECT json_agg(a.*)
//                 FROM testimonial_analyses a
//                 WHERE a.testimonial_id = t.id
//             ) AS analyses,
//             (
//                 SELECT json_agg(cm.*)
//                 FROM competitor_mentions cm
//                 WHERE cm.testimonial_id = t.id
//             ) AS competitor_mentions,
//             (
//                 SELECT json_agg(j.*)
//                 FROM ai_jobs j
//                 WHERE j.testimonial_id = t.id
//             ) AS ai_jobs
//         FROM testimonials t
//         WHERE t.id = $1;
//     `

// 	var testimonial models.Testimonial
// 	rows, err := db.QueryContext(ctx, query, id)
// 	if err != nil {
// 		if errors.Is(err, sql.ErrNoRows) {
// 			return nil, fmt.Errorf("testimonial with ID %s not found", id)
// 		}
// 		return nil, fmt.Errorf("error fetching testimonial: %w", err)
// 	}
// 	defer rows.Close()

// 	if !rows.Next() {
// 		return nil, fmt.Errorf("testimonial with ID %s not found", id)
// 	}

// 	// Scan the testimonial data and related analysis
// 	var analysesJSON, competitorMentionsJSON, aiJobsJSON sql.NullString

// 	err = rows.Scan(
// 		&testimonial.ID, &testimonial.WorkspaceID, &testimonial.CustomerProfileID,
// 		&testimonial.TestimonialType, &testimonial.Format, &testimonial.Status, &testimonial.Language,
// 		&testimonial.Title, &testimonial.Summary, &testimonial.Content, &testimonial.Transcript, &testimonial.MediaURLs,
// 		&testimonial.Rating, &testimonial.MediaURL, &testimonial.MediaDuration, &testimonial.ThumbnailURL,
// 		&testimonial.AdditionalMedia, &testimonial.CustomFormatting, &testimonial.ProductContext, &testimonial.PurchaseContext, &testimonial.ExperienceContext,
// 		&testimonial.CollectionMethod, // New fields
// 		&testimonial.VerificationMethod, &testimonial.VerificationData, &testimonial.VerificationStatus,
// 		&testimonial.VerifiedAt, &testimonial.AuthenticityScore, &testimonial.SourceData,
// 		&testimonial.Published, &testimonial.PublishedAt, &testimonial.ScheduledPublishAt,
// 		&testimonial.Tags, &testimonial.Categories, &testimonial.CustomFields,
// 		&testimonial.ViewCount, &testimonial.ShareCount, &testimonial.ConversionCount,
// 		&testimonial.EngagementMetrics, &testimonial.CreatedAt, &testimonial.UpdatedAt,
// 		&analysesJSON, &competitorMentionsJSON, &aiJobsJSON,
// 	)

// 	if err != nil {
// 		return nil, fmt.Errorf("error scanning testimonial data: %w", err)
// 	}

// 	// Parse testimonial analyses
// 	if analysesJSON.Valid && analysesJSON.String != "" && analysesJSON.String != "null" {
// 		var analyses []models.TestimonialAnalysis
// 		if err := json.Unmarshal([]byte(analysesJSON.String), &analyses); err != nil {
// 			return nil, fmt.Errorf("error unmarshalling analyses data: %w", err)
// 		}
// 		testimonial.Analyses = analyses
// 	}

// 	// Parse competitor mentions
// 	if competitorMentionsJSON.Valid && competitorMentionsJSON.String != "" && competitorMentionsJSON.String != "null" {
// 		var mentions []models.CompetitorMention
// 		if err := json.Unmarshal([]byte(competitorMentionsJSON.String), &mentions); err != nil {
// 			return nil, fmt.Errorf("error unmarshalling competitor mentions: %w", err)
// 		}
// 		testimonial.CompetitorMentions = mentions
// 	}

// 	// Parse AI jobs
// 	if aiJobsJSON.Valid && aiJobsJSON.String != "" && aiJobsJSON.String != "null" {
// 		var jobs []models.AIJob
// 		if err := json.Unmarshal([]byte(aiJobsJSON.String), &jobs); err != nil {
// 			return nil, fmt.Errorf("error unmarshalling AI jobs: %w", err)
// 		}
// 		testimonial.AIJobs = jobs
// 	}

// 	// If customer profile ID exists, fetch the customer profile
// 	if testimonial.CustomerProfileID != nil {
// 		// This would be an additional query, or ideally part of a repository method
// 		// customerProfile, err := r.customerProfileRepository.FetchByID(ctx, *testimonial.CustomerProfileID, db)
// 		// if err == nil {
// 		//     testimonial.CustomerProfile = customerProfile
// 		// }
// 	}

// 	return &testimonial, nil
// }

func (r *testimonialRepository) FetchByID(ctx context.Context, id uuid.UUID, db DB) (*models.Testimonial, error) {
	query := `
        SELECT 
            t.id,
            t.workspace_id,
            t.customer_profile_id,
            t.testimonial_type,
            t.format,
            t.status,
            t.language,
            t.title,
            t.summary,
            t.content,
            t.transcript,
            t.media_urls,
            t.rating,
            t.media_url,
            t.media_duration,
            t.thumbnail_url,
            t.additional_media,
            t.custom_formatting,
            t.product_context,
            t.purchase_context,
            t.experience_context,
            t.collection_method,
            t.verification_method,
            t.verification_data,
            t.verification_status,
            t.verified_at,
            t.authenticity_score,
            t.source_data,
            t.published,
            t.published_at,
            t.scheduled_publish_at,
            t.tags,
            t.categories,
            t.custom_fields,
            t.view_count,
            t.share_count,
            t.conversion_count,
            t.engagement_metrics,
            t.created_at,
            t.updated_at,
            (SELECT json_agg(a.*) FROM testimonial_analyses a WHERE a.testimonial_id = t.id) AS analyses,
            (SELECT json_agg(cm.*) FROM competitor_mentions cm WHERE cm.testimonial_id = t.id) AS competitor_mentions,
            (SELECT json_agg(j.*) FROM ai_jobs j WHERE j.testimonial_id = t.id) AS ai_jobs
        FROM testimonials t
        WHERE t.id = $1;
    `

	var testimonial models.Testimonial
	rows, err := db.QueryContext(ctx, query, id)
	if err != nil {
		return nil, fmt.Errorf("error fetching testimonial: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, fmt.Errorf("testimonial with ID %s not found", id)
	}

	// Let's first verify the column order matches what we expect
	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("error getting columns: %w", err)
	}

	fmt.Printf("\n=== Columns returned from query ===\n")
	for i, col := range columns {
		fmt.Printf("Column %d: %s\n", i, col)
	}
	fmt.Printf("Total columns: %d\n\n", len(columns))

	// Now let's scan with the exact order we've specified in the query
	var analysesJSON, competitorMentionsJSON, aiJobsJSON sql.NullString

	err = rows.Scan(
		&testimonial.ID,                // 0: id
		&testimonial.WorkspaceID,       // 1: workspace_id
		&testimonial.CustomerProfileID, // 2: customer_profile_id
		&testimonial.TestimonialType,   // 3: testimonial_type
		&testimonial.Format,            // 4: format
		&testimonial.Status,            // 5: status
		&testimonial.Language,          // 6: language
		&testimonial.Title,             // 7: title
		&testimonial.Summary,           // 8: summary
		&testimonial.Content,           // 9: content
		&testimonial.Transcript,        // 10: transcript
		&testimonial.MediaURLs,         // 11: media_urls
		&testimonial.Rating,            // 12: rating
		&testimonial.MediaURL,          // 13: media_url
		&testimonial.MediaDuration,     // 14: media_duration
		&testimonial.ThumbnailURL,      // 15: thumbnail_url
		&testimonial.AdditionalMedia,   // 16: additional_media
		&testimonial.CustomFormatting,  // 17: custom_formatting
		&testimonial.ProductContext,    // 18: product_context
		&testimonial.PurchaseContext,   // 19: purchase_context
		&testimonial.ExperienceContext, // 20: experience_context
		&testimonial.CollectionMethod,  // 21: collection_method
		// &testimonial.TriggerSource,      // 22: trigger_source
		// &testimonial.TriggerData,        // 23: trigger_data
		&testimonial.VerificationMethod, // 24: verification_method
		&testimonial.VerificationData,   // 25: verification_data
		&testimonial.VerificationStatus, // 26: verification_status
		&testimonial.VerifiedAt,         // 27: verified_at
		&testimonial.AuthenticityScore,  // 28: authenticity_score
		&testimonial.SourceData,         // 29: source_data
		&testimonial.Published,          // 30: published
		&testimonial.PublishedAt,        // 31: published_at
		&testimonial.ScheduledPublishAt, // 32: scheduled_publish_at
		&testimonial.Tags,               // 33: tags
		&testimonial.Categories,         // 34: categories
		&testimonial.CustomFields,       // 35: custom_fields
		&testimonial.ViewCount,          // 36: view_count
		&testimonial.ShareCount,         // 37: share_count
		&testimonial.ConversionCount,    // 38: conversion_count
		&testimonial.EngagementMetrics,  // 39: engagement_metrics
		&testimonial.CreatedAt,          // 40: created_at
		&testimonial.UpdatedAt,          // 41: updated_at
		&analysesJSON,                   // 42: analyses (JSON aggregation)
		&competitorMentionsJSON,         // 43: competitor_mentions (JSON aggregation)
		&aiJobsJSON,                     // 44: ai_jobs (JSON aggregation)
	)

	if err != nil {
		// Let's try to identify which column is causing the issue
		// Create a slice to scan individual columns for debugging
		values := make([]interface{}, len(columns))
		for i := range values {
			values[i] = new(interface{})
		}

		// Rerun the query for debugging
		rows2, err := db.QueryContext(ctx, query, id)
		if err != nil {
			return nil, fmt.Errorf("error re-fetching for debug: %w", err)
		}
		defer rows2.Close()

		if !rows2.Next() {
			return nil, fmt.Errorf("testimonial with ID %s not found on debug fetch", id)
		}

		// Scan all values as generic interfaces
		err = rows2.Scan(values...)
		if err != nil {
			return nil, fmt.Errorf("error scanning generic values: %w", err)
		}

		// Print out the actual values and their types
		fmt.Printf("\n=== Column values and types ===\n")
		for i, col := range columns {
			value := *(values[i].(*interface{}))
			fmt.Printf("Column %d: %s = %v (type: %T)\n", i, col, value, value)
		}

		return nil, fmt.Errorf("error scanning testimonial data: %w", err)
	}

	// Parse JSON fields
	if analysesJSON.Valid && analysesJSON.String != "" && analysesJSON.String != "null" {
		var analyses []models.TestimonialAnalysis
		if err := json.Unmarshal([]byte(analysesJSON.String), &analyses); err != nil {
			return nil, fmt.Errorf("error unmarshalling analyses data: %w", err)
		}
		testimonial.Analyses = analyses
	}

	if competitorMentionsJSON.Valid && competitorMentionsJSON.String != "" && competitorMentionsJSON.String != "null" {
		var mentions []models.CompetitorMention
		if err := json.Unmarshal([]byte(competitorMentionsJSON.String), &mentions); err != nil {
			return nil, fmt.Errorf("error unmarshalling competitor mentions: %w", err)
		}
		testimonial.CompetitorMentions = mentions
	}

	if aiJobsJSON.Valid && aiJobsJSON.String != "" && aiJobsJSON.String != "null" {
		var jobs []models.AIJob
		if err := json.Unmarshal([]byte(aiJobsJSON.String), &jobs); err != nil {
			return nil, fmt.Errorf("error unmarshalling AI jobs: %w", err)
		}
		testimonial.AIJobs = jobs
	}

	return &testimonial, nil
}

func (r *testimonialRepository) FetchByCustomerEmail(ctx context.Context, workspaceID uuid.UUID, email string, db DB) ([]models.Testimonial, error) {
	query := `
		SELECT t.* 
		FROM testimonials t
		JOIN customer_profiles cp ON cp.id = t.customer_profile_id
		WHERE t.workspace_id = $1 AND cp.email = $2
		ORDER BY t.created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, email)
	if err != nil {
		return nil, fmt.Errorf("error querying testimonials by email: %w", err)
	}
	defer rows.Close()

	var testimonials []models.Testimonial
	for rows.Next() {
		var t models.Testimonial
		if err := rows.Scan(
			&t.ID, &t.WorkspaceID, &t.CustomerProfileID, &t.TestimonialType, &t.Format, &t.Status, &t.Language,
			&t.Title, &t.Summary, &t.Content, &t.Transcript, &t.MediaURLs, &t.Rating, &t.MediaURL,
			&t.MediaDuration, &t.ThumbnailURL, &t.AdditionalMedia, &t.ProductContext,
			&t.PurchaseContext, &t.ExperienceContext, &t.CollectionMethod, &t.VerificationMethod,
			&t.VerificationData, &t.VerificationStatus, &t.VerifiedAt, &t.AuthenticityScore,
			&t.SourceData, &t.Published, &t.PublishedAt, &t.ScheduledPublishAt,
			&t.Tags, &t.Categories, &t.CustomFields, &t.ViewCount, &t.ShareCount, &t.ConversionCount,
			&t.EngagementMetrics, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning testimonial: %w", err)
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, nil
}

func (r *testimonialRepository) CountByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db DB) (int, error) {

	query := `
	    SELECT COUNT(*) FROM testimonials
	    WHERE workspace_id = $1
	`
	query, args := r.buildFilterQuery(query, workspaceID, filter)

	var count int
	err := db.QueryRowContext(ctx, query, args...).Scan(&count)

	if err != nil {
		return 0, fmt.Errorf("error counting testimonials: %w", err)
	}

	return count, nil
}

func (r *testimonialRepository) FetchTopRated(ctx context.Context, workspaceID uuid.UUID, limit int, db DB) ([]models.Testimonial, error) {
	query := `
		SELECT 
			id,
			workspace_id,
			customer_profile_id,
			testimonial_type,
			format,
			status,
			language,
			title,
			summary,
			content,
			transcript,
			media_urls,
			rating,
			media_url,
			media_duration,
			thumbnail_url,
			additional_media,
			custom_formatting,
			product_context,
			purchase_context,
			experience_context,
			collection_method,
			verification_method,
			verification_data,
			verification_status,
			verified_at,
			authenticity_score,
			source_data,
			published,
			published_at,
			scheduled_publish_at,
			tags,
			categories,
			custom_fields,
			view_count,
			share_count,
			conversion_count,
			engagement_metrics,
			created_at,
			updated_at
		FROM testimonials
		WHERE workspace_id = $1 
		  AND status = 'approved' 
		  AND rating IS NOT NULL 
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
			&t.ID,
			&t.WorkspaceID,
			&t.CustomerProfileID,
			&t.TestimonialType,
			&t.Format,
			&t.Status,
			&t.Language,
			&t.Title,
			&t.Summary,
			&t.Content,
			&t.Transcript,
			&t.MediaURLs,
			&t.Rating,
			&t.MediaURL,
			&t.MediaDuration,
			&t.ThumbnailURL,
			&t.AdditionalMedia,
			&t.CustomFormatting,
			&t.ProductContext,
			&t.PurchaseContext,
			&t.ExperienceContext,
			&t.CollectionMethod,
			&t.VerificationMethod,
			&t.VerificationData,
			&t.VerificationStatus,
			&t.VerifiedAt,
			&t.AuthenticityScore,
			&t.SourceData,
			&t.Published,
			&t.PublishedAt,
			&t.ScheduledPublishAt,
			&t.Tags,
			&t.Categories,
			&t.CustomFields,
			&t.ViewCount,
			&t.ShareCount,
			&t.ConversionCount,
			&t.EngagementMetrics,
			&t.CreatedAt,
			&t.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning top rated testimonial: %w", err)
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, nil
}

func (r *testimonialRepository) FetchMostRecent(ctx context.Context, workspaceID uuid.UUID, limit int, db DB) ([]models.Testimonial, error) {
	query := `
		SELECT 
			id,
			workspace_id,
			customer_profile_id,
			testimonial_type,
			format,
			status,
			language,
			title,
			summary,
			content,
			transcript,
			media_urls,
			rating,
			media_url,
			media_duration,
			thumbnail_url,
			additional_media,
			custom_formatting,
			product_context,
			purchase_context,
			experience_context,
			collection_method,
			verification_method,
			verification_data,
			verification_status,
			verified_at,
			authenticity_score,
			source_data,
			published,
			published_at,
			scheduled_publish_at,
			tags,
			categories,
			custom_fields,
			view_count,
			share_count,
			conversion_count,
			engagement_metrics,
			created_at,
			updated_at
		FROM testimonials
		WHERE workspace_id = $1 
		  AND status = 'approved'
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
			&t.ID,
			&t.WorkspaceID,
			&t.CustomerProfileID,
			&t.TestimonialType,
			&t.Format,
			&t.Status,
			&t.Language,
			&t.Title,
			&t.Summary,
			&t.Content,
			&t.Transcript,
			&t.MediaURLs,
			&t.Rating,
			&t.MediaURL,
			&t.MediaDuration,
			&t.ThumbnailURL,
			&t.AdditionalMedia,
			&t.CustomFormatting,
			&t.ProductContext,
			&t.PurchaseContext,
			&t.ExperienceContext,
			&t.CollectionMethod,
			&t.VerificationMethod,
			&t.VerificationData,
			&t.VerificationStatus,
			&t.VerifiedAt,
			&t.AuthenticityScore,
			&t.SourceData,
			&t.Published,
			&t.PublishedAt,
			&t.ScheduledPublishAt,
			&t.Tags,
			&t.Categories,
			&t.CustomFields,
			&t.ViewCount,
			&t.ShareCount,
			&t.ConversionCount,
			&t.EngagementMetrics,
			&t.CreatedAt,
			&t.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning most recent testimonial: %w", err)
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
			SELECT 
				id,
				workspace_id,
				customer_profile_id,
				testimonial_type,
				format,
				status,
				language,
				title,
				summary,
				content,
				transcript,
				media_urls,
				rating,
				media_url,
				media_duration,
				thumbnail_url,
				additional_media,
				custom_formatting,
				product_context,
				purchase_context,
				experience_context,
				collection_method,
				verification_method,
				verification_data,
				verification_status,
				verified_at,
				authenticity_score,
				source_data,
				published,
				published_at,
				scheduled_publish_at,
				tags,
				categories,
				custom_fields,
				view_count,
				share_count,
				conversion_count,
				engagement_metrics,
				created_at,
				updated_at
			FROM testimonials 
			WHERE workspace_id = $1 AND tags @> $2
			ORDER BY created_at DESC
		`
	} else {
		// Any tag can match (overlap)
		query = `
			SELECT 
				id,
				workspace_id,
				customer_profile_id,
				testimonial_type,
				format,
				status,
				language,
				title,
				summary,
				content,
				transcript,
				media_urls,
				rating,
				media_url,
				media_duration,
				thumbnail_url,
				additional_media,
				custom_formatting,
				product_context,
				purchase_context,
				experience_context,
				collection_method,
				verification_method,
				verification_data,
				verification_status,
				verified_at,
				authenticity_score,
				source_data,
				published,
				published_at,
				scheduled_publish_at,
				tags,
				categories,
				custom_fields,
				view_count,
				share_count,
				conversion_count,
				engagement_metrics,
				created_at,
				updated_at
			FROM testimonials 
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
			&t.ID,
			&t.WorkspaceID,
			&t.CustomerProfileID,
			&t.TestimonialType,
			&t.Format,
			&t.Status,
			&t.Language,
			&t.Title,
			&t.Summary,
			&t.Content,
			&t.Transcript,
			&t.MediaURLs,
			&t.Rating,
			&t.MediaURL,
			&t.MediaDuration,
			&t.ThumbnailURL,
			&t.AdditionalMedia,
			&t.CustomFormatting,
			&t.ProductContext,
			&t.PurchaseContext,
			&t.ExperienceContext,
			&t.CollectionMethod,
			&t.VerificationMethod,
			&t.VerificationData,
			&t.VerificationStatus,
			&t.VerifiedAt,
			&t.AuthenticityScore,
			&t.SourceData,
			&t.Published,
			&t.PublishedAt,
			&t.ScheduledPublishAt,
			&t.Tags,
			&t.Categories,
			&t.CustomFields,
			&t.ViewCount,
			&t.ShareCount,
			&t.ConversionCount,
			&t.EngagementMetrics,
			&t.CreatedAt,
			&t.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning testimonial by tags: %w", err)
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
