// ============================================================================
// 1. COMPLETE TESTIMONIAL REPOSITORY (internal/repositories/testimonial_repository.go)
// This can stay as is since it's just data layer - matches your pattern
// ============================================================================

package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"reflect"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

// type TestimonialRepository interface {
// 	// Basic CRUD operations
// 	Create(ctx context.Context, testimonial *models.Testimonial, db *sql.DB) error
// 	FetchByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.Testimonial, error)
// 	FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db *sql.DB) ([]models.Testimonial, error)
// 	Update(ctx context.Context, testimonial *models.Testimonial, db *sql.DB) error
// 	Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error

// 	// Advanced queries
// 	Search(ctx context.Context, workspaceID uuid.UUID, query string, filter models.TestimonialFilter, db *sql.DB) ([]*models.Testimonial, error)
// 	GetStats(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) (*models.TestimonialStats, error)
// 	GetByStatus(ctx context.Context, workspaceID uuid.UUID, status string, limit int, db *sql.DB) ([]models.Testimonial, error)
// 	GetByType(ctx context.Context, workspaceID uuid.UUID, testimonialType string, limit int, db *sql.DB) ([]models.Testimonial, error)
// 	GetByRating(ctx context.Context, workspaceID uuid.UUID, minRating int, db *sql.DB) ([]models.Testimonial, error)
// 	GetRecent(ctx context.Context, workspaceID uuid.UUID, days int, limit int, db *sql.DB) ([]models.Testimonial, error)
// 	GetByAuthor(ctx context.Context, workspaceID uuid.UUID, authorEmail string, db *sql.DB) ([]models.Testimonial, error)
// 	GetByTags(ctx context.Context, workspaceID uuid.UUID, tags []string, db *sql.DB) ([]models.Testimonial, error)

// 	// Bulk operations
// 	BulkUpdateStatus(ctx context.Context, testimonialIDs []uuid.UUID, status string, db *sql.DB) error
// 	BulkDelete(ctx context.Context, testimonialIDs []uuid.UUID, db *sql.DB) error

// 	// Aggregation queries
// 	GetCountByStatus(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) (map[string]int, error)
// 	GetCountByType(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) (map[string]int, error)
// 	GetAverageRating(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) (float64, error)
// 	GetTopAuthors(ctx context.Context, workspaceID uuid.UUID, limit int, db *sql.DB) ([]models.AuthorStats, error)

// 	UpdateAny(ctx context.Context, id uuid.UUID, updates map[string]any, db *sql.DB) error
// 	UpdateWithTranscript(ctx context.Context, id uuid.UUID, result *models.TranscriptionResult, db *sql.DB) error
// }

type TestimonialRepository struct {
	*BaseRepository[models.Testimonial]
}

func NewTestimonialRepository(redis *redis.Client) TestimonialRepository {
	return TestimonialRepository{
		BaseRepository: NewBaseRepository[models.Testimonial](redis, "testimonial"),
	}
}

// Basic CRUD Operations - matches your existing FetchByID pattern
func (r *TestimonialRepository) Create(ctx context.Context, testimonial *models.Testimonial, db *sql.DB) error {

	log.Println("ID", testimonial.ID.String())
	log.Println("WorkspaceID", testimonial.WorkspaceID.String())
	log.Println("Author Company", testimonial.AuthorCompany)
	log.Println("Author Name", testimonial.AuthorName)
	log.Println("Author Email", testimonial.AuthorEmail)
	log.Println("Author Title", testimonial.AuthorTitle)
	log.Println("Author Avatar", testimonial.AuthorAvatarURL)
	log.Println(" Type", testimonial.Type)
	log.Println(" Status", testimonial.Status)
	log.Println(" Format", testimonial.Format)
	log.Println(" Content", testimonial.Content)
	log.Println(" MediaURL", testimonial.MediaURL)
	log.Println(" TranscriptSegments", testimonial.TranscriptSegments)
	log.Println(" CollectionMethod", testimonial.CollectionMethod)
	log.Println(" Metadata", testimonial.Metadata)
	log.Println(" Tags", testimonial.Tags)
	log.Println(" ProcessingStatus", testimonial.ProcessingStatus)
	log.Println(" ProcessingMetadata", testimonial.ProcessingMetadata)

	query := `
		INSERT INTO testimonials (
			id, workspace_id, author_name, author_email, author_company,
			author_title, author_avatar_url, type, status, format, content,
			media_url, transcript_segments, collection_method, 
			metadata, rating, tags, processing_status, processing_metadata,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
		)
	`

	if testimonial.ID == uuid.Nil {
		testimonial.ID = uuid.New()
	}

	now := time.Now()
	if testimonial.CreatedAt.IsZero() {
		testimonial.CreatedAt = now
	}
	testimonial.UpdatedAt = now

	var authorName, authorEmail, authorCompany, authorTitle, authorAvatarURL, content, mediaURL sql.NullString

	if testimonial.AuthorName != nil {
		authorName = sql.NullString{String: *testimonial.AuthorName, Valid: true}
	}
	if testimonial.AuthorEmail != nil {
		authorEmail = sql.NullString{String: *testimonial.AuthorEmail, Valid: true}
	}
	if testimonial.AuthorCompany != nil {
		authorCompany = sql.NullString{String: *testimonial.AuthorCompany, Valid: true}
	}
	if testimonial.AuthorTitle != nil {
		authorTitle = sql.NullString{String: *testimonial.AuthorTitle, Valid: true}
	}
	if testimonial.AuthorAvatarURL != nil {
		authorAvatarURL = sql.NullString{String: *testimonial.AuthorAvatarURL, Valid: true}
	}
	if testimonial.Content != nil {
		content = sql.NullString{String: *testimonial.Content, Valid: true}
	}
	if testimonial.MediaURL != nil {
		mediaURL = sql.NullString{String: *testimonial.MediaURL, Valid: true}
	}

	var tags any
	if len(testimonial.Tags) == 0 {
		tags = pq.Array([]string{})
	} else {
		tags = pq.Array([]string(testimonial.Tags))
	}

	if testimonial.Metadata == nil {
		testimonial.Metadata = make(models.JSONMap)
	}

	if testimonial.ProcessingMetadata == nil {
		testimonial.ProcessingMetadata = make(models.JSONMap)
	}

	var transcript_segments any
	if testimonial.TranscriptSegments == nil {
		transcript_segments = []byte("[]")
	} else if len(*testimonial.TranscriptSegments) == 0 {
		transcript_segments = []byte("[]")
	} else {
		jsonData, err := json.Marshal(*testimonial.TranscriptSegments)
		if err != nil {
			return fmt.Errorf("failed to marshall transcript segments: %w", err)
		}
		transcript_segments = jsonData
	}

	_, err := db.ExecContext(ctx, query,
		testimonial.ID,                 // $1
		testimonial.WorkspaceID,        // $2
		authorName,                     // $3
		authorEmail,                    // $4
		authorCompany,                  // $5
		authorTitle,                    // $6
		authorAvatarURL,                // $7
		testimonial.Type,               // $8
		testimonial.Status,             // $9
		testimonial.Format,             // $10
		content,                        // $11
		mediaURL,                       // $12
		transcript_segments,            // $13
		testimonial.CollectionMethod,   // $14
		testimonial.Metadata,           // $15
		testimonial.Rating,             // $16
		tags,                           // $17
		testimonial.ProcessingStatus,   // $18
		testimonial.ProcessingMetadata, // $19
		testimonial.CreatedAt,          // $20
		testimonial.UpdatedAt,          // $21
	)

	if err != nil {
		// Check for specific PostgreSQL errors
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code {
			case "23505": // unique_violation
				return fmt.Errorf("testimonial with ID %s already exists: %w", testimonial.ID, err)
			case "23503": // foreign_key_violation
				return fmt.Errorf("invalid workspace_id %s: %w", testimonial.WorkspaceID, err)
			case "23514": // check_violation
				return fmt.Errorf("testimonial data validation failed: %w", err)
			}
		}
		return fmt.Errorf("failed to create testimonial (ID: %s, WorkspaceID: %s): %w",
			testimonial.ID, testimonial.WorkspaceID, err)
	}

	return nil
}

func (r *TestimonialRepository) FetchByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.Testimonial, error) {
	query := `
		SELECT id, workspace_id, author_name, author_email, author_company,
			   author_title, author_avatar_url, type, status, content, sentiment_score,
			   media_url, transcript_segments, collection_method, metadata,
			   rating, tags, processing_status, processing_metadata,
			   created_at, updated_at
		FROM testimonials WHERE id = $1
	`

	var transcriptSegmentsJSON []byte
	var testimonial models.Testimonial

	err := db.QueryRowContext(ctx, query, id).Scan(
		&testimonial.ID,
		&testimonial.WorkspaceID,
		&testimonial.AuthorName,
		&testimonial.AuthorEmail,
		&testimonial.AuthorCompany,
		&testimonial.AuthorTitle,
		&testimonial.AuthorAvatarURL,
		&testimonial.Type,
		&testimonial.Status,
		&testimonial.Content,
		&testimonial.SentimentScore,
		&testimonial.MediaURL,
		&transcriptSegmentsJSON,
		&testimonial.CollectionMethod,
		&testimonial.Metadata,
		&testimonial.Rating,
		&testimonial.Tags,
		&testimonial.ProcessingStatus,
		&testimonial.ProcessingMetadata,
		&testimonial.CreatedAt,
		&testimonial.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("testimonial not found (ID: %s): %w", id, err)
		}
		return nil, fmt.Errorf("failed to fetch testimonial (ID: %s): %w", id, err)
	}

	return &testimonial, nil
}

func (r *TestimonialRepository) FetchByTestimonialAndWorkspaceID(ctx context.Context, testimonial_id, workspace_id uuid.UUID, db *sql.DB) (*models.Testimonial, error) {
	fmt.Println("calling FetchByTestimonialAndWorkspaceID")
	query := `
		SELECT 
			t.id, t.workspace_id, t.author_name, t.author_email, t.author_company,
			t.author_title, t.author_avatar_url, t.type, t.status, t.content, t.sentiment_score,
			t.media_url, t.transcript_segments, t.collection_method, t.metadata,
			t.rating, t.tags, t.processing_status, t.processing_metadata,
			t.created_at, t.updated_at,
			-- Artifact fields (nullable)
			a.id, a.testimonial_id, a.workspace_id, a.processing_type, a.result_category,
			a.text_content, a.data, a.asset_url, a.content_type, a.platform, a.format,
			a.is_user_saved, a.is_streamed, a.processing_metadata, a.created_at, a.updated_at
		FROM testimonials t
		LEFT JOIN testimonial_artifacts a ON t.id = a.testimonial_id
		WHERE t.id = $1 AND t.workspace_id = $2
		ORDER BY a.created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonial_id, workspace_id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch testimonial with artifacts: %w", err)
	}
	defer rows.Close()

	var testimonial *models.Testimonial
	var artifacts []models.TestimonialArtifact
	var transcriptSegmentsJSON []byte

	for rows.Next() {
		// Scan testimonial fields (will be same for all rows)
		var t models.Testimonial

		// Artifact fields (all nullable since LEFT JOIN)
		var artifactID sql.NullString
		var artifactTestimonialID sql.NullString
		var artifactWorkspaceID sql.NullString
		var artifactProcessingType sql.NullString
		var artifactResultCategory sql.NullString
		var artifactTextContent sql.NullString
		var artifactData sql.NullString
		var artifactAssetURL sql.NullString
		var artifactContentType sql.NullString
		var artifactPlatform sql.NullString
		var artifactFormat sql.NullString
		var artifactIsUserSaved sql.NullBool
		var artifactIsStreamed sql.NullBool
		var artifactProcessingMetadata sql.NullString
		var artifactCreatedAt sql.NullTime
		var artifactUpdatedAt sql.NullTime

		err := rows.Scan(
			// Testimonial fields
			&t.ID, &t.WorkspaceID, &t.AuthorName, &t.AuthorEmail, &t.AuthorCompany,
			&t.AuthorTitle, &t.AuthorAvatarURL, &t.Type, &t.Status, &t.Content, &t.SentimentScore,
			&t.MediaURL, &transcriptSegmentsJSON, &t.CollectionMethod, &t.Metadata,
			&t.Rating, &t.Tags, &t.ProcessingStatus, &t.ProcessingMetadata,
			&t.CreatedAt, &t.UpdatedAt,
			// Artifact fields (nullable)
			&artifactID, &artifactTestimonialID, &artifactWorkspaceID, &artifactProcessingType,
			&artifactResultCategory, &artifactTextContent, &artifactData, &artifactAssetURL,
			&artifactContentType, &artifactPlatform, &artifactFormat, &artifactIsUserSaved,
			&artifactIsStreamed, &artifactProcessingMetadata, &artifactCreatedAt, &artifactUpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		// First row sets the testimonial
		if testimonial == nil {
			testimonial = &t
			// // Handle transcript segments JSON
			// if transcriptSegmentsJSON != nil {
			// 	if err := testimonial.TranscriptSegments.Scan(transcriptSegmentsJSON); err != nil {
			// 		return nil, fmt.Errorf("failed to unmarshal transcript segments: %w", err)
			// 	}
			// }
		}

		// If artifact exists, add it
		if artifactID.Valid {
			artifactUUID, err := uuid.Parse(artifactID.String)
			if err != nil {
				return nil, fmt.Errorf("failed to parse artifact UUID: %w", err)
			}

			workspaceUUID, err := uuid.Parse(artifactWorkspaceID.String)
			if err != nil {
				return nil, fmt.Errorf("failed to parse artifact workspace UUID: %w", err)
			}

			artifact := models.TestimonialArtifact{
				ID:             artifactUUID,
				WorkspaceID:    workspaceUUID,
				ProcessingType: artifactProcessingType.String,
				ResultCategory: artifactResultCategory.String,
				ContentType:    artifactContentType.String,
				IsUserSaved:    artifactIsUserSaved.Bool,
				IsStreamed:     artifactIsStreamed.Bool,
				CreatedAt:      artifactCreatedAt.Time,
				UpdatedAt:      artifactUpdatedAt.Time,
			}

			// Handle nullable testimonial_id
			if artifactTestimonialID.Valid {
				testimonialUUID, err := uuid.Parse(artifactTestimonialID.String)
				if err != nil {
					return nil, fmt.Errorf("failed to parse artifact testimonial UUID: %w", err)
				}
				artifact.TestimonialID = &testimonialUUID
			}

			// Handle nullable text content
			if artifactTextContent.Valid {
				artifact.TextContent = &artifactTextContent.String
			}

			// Handle nullable asset URL
			if artifactAssetURL.Valid {
				artifact.AssetURL = &artifactAssetURL.String
			}

			// Handle nullable platform
			if artifactPlatform.Valid {
				artifact.Platform = &artifactPlatform.String
			}

			// Handle nullable format
			if artifactFormat.Valid {
				artifact.Format = &artifactFormat.String
			}

			// Handle JSONB data field
			if artifactData.Valid {
				if err := artifact.Data.Scan(artifactData.String); err != nil {
					return nil, fmt.Errorf("failed to unmarshal artifact data: %w", err)
				}
			}

			// Handle JSONB processing metadata
			if artifactProcessingMetadata.Valid {
				if err := artifact.ProcessingMetadata.Scan(artifactProcessingMetadata.String); err != nil {
					return nil, fmt.Errorf("failed to unmarshal artifact processing metadata: %w", err)
				}
			}

			artifacts = append(artifacts, artifact)
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	if testimonial == nil {
		return nil, fmt.Errorf("testimonial not found (ID: %s) on workspace(ID: %s)", testimonial_id, workspace_id)
	}

	testimonial.Artifacts = artifacts
	return testimonial, nil
}

func (r *TestimonialRepository) FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db *sql.DB) ([]models.Testimonial, error) {
	query := `
		SELECT id, workspace_id, author_name, author_email, author_company,
			   author_title, author_avatar_url, type, status, content, sentiment_score,
			   media_url, transcript_segments, collection_method, metadata,
			   rating, tags, processing_status, processing_metadata,
			   created_at, updated_at
		FROM testimonials 
		WHERE workspace_id = $1
	`

	args := []interface{}{workspaceID}
	argIndex := 2

	// Apply filters
	if filter.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, filter.Status)
		argIndex++
	}

	if filter.Type != "" {
		query += fmt.Sprintf(" AND type = $%d", argIndex)
		args = append(args, filter.Type)
		argIndex++
	}

	if filter.MinRating != nil {
		query += fmt.Sprintf(" AND rating >= $%d", argIndex)
		args = append(args, *filter.MinRating)
		argIndex++
	}

	// Add ordering
	if filter.SortBy != "" {
		direction := "DESC"
		if filter.SortOrder == "asc" {
			direction = "ASC"
		}
		query += fmt.Sprintf(" ORDER BY %s %s", filter.SortBy, direction)
	} else {
		query += " ORDER BY created_at DESC"
	}

	// Add pagination
	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, filter.Limit)
		argIndex++
	}

	if filter.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argIndex)
		args = append(args, filter.Offset)
	}

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testimonials []models.Testimonial
	for rows.Next() {
		var t models.Testimonial
		err := rows.Scan(
			&t.ID, &t.WorkspaceID, &t.AuthorName, &t.AuthorEmail, &t.AuthorCompany,
			&t.AuthorTitle, &t.AuthorAvatarURL, &t.Type, &t.Status, &t.Content, &t.SentimentScore,
			&t.MediaURL, &t.TranscriptSegments, &t.CollectionMethod, &t.Metadata,
			&t.Rating, &t.Tags, &t.ProcessingStatus, &t.ProcessingMetadata,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, rows.Err()
}

func (r *TestimonialRepository) Update(ctx context.Context, testimonial *models.Testimonial, db *sql.DB) error {
	query := `
		UPDATE testimonials SET
			author_name = $2, author_email = $3, author_company = $4,
			author_title = $5, author_avatar_url = $6, type = $7, status = $8,
			content = $9, media_url = $10, transcript_segments = $11,
			collection_method = $12, metadata = $13, rating = $14, tags = $15,
			processing_status = $16, processing_metadata = $17, updated_at = $18
		WHERE id = $1
	`

	testimonial.UpdatedAt = time.Now()

	var transcript_segments any
	if testimonial.TranscriptSegments == nil {
		transcript_segments = []byte("[]")
	} else if len(*testimonial.TranscriptSegments) == 0 {
		transcript_segments = []byte("[]")
	} else {
		jsonData, err := json.Marshal(*testimonial.TranscriptSegments)
		if err != nil {
			return fmt.Errorf("failed to marshall transcript segments: %w", err)
		}
		transcript_segments = jsonData
	}

	result, err := db.ExecContext(ctx, query,
		testimonial.ID,
		testimonial.AuthorName,
		testimonial.AuthorEmail,
		testimonial.AuthorCompany,
		testimonial.AuthorTitle,
		testimonial.AuthorAvatarURL,
		testimonial.Type,
		testimonial.Status,
		testimonial.Content,
		testimonial.MediaURL,
		transcript_segments,
		testimonial.CollectionMethod,
		testimonial.Metadata,
		testimonial.Rating,
		testimonial.Tags,
		testimonial.ProcessingStatus,
		testimonial.ProcessingMetadata,
		testimonial.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update testimonial (ID: %s): %w", testimonial.ID, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected for testimonial update (ID: %s): %w",
			testimonial.ID, err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("testimonial not found for update (ID: %s)", testimonial.ID)
	}

	return nil
}

func (r *TestimonialRepository) Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM testimonials WHERE id = $1`
	result, err := db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete testimonial (ID: %s): %w", id, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected for testimonial deletion (ID: %s): %w", id, err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("testimonial not found for deletion (ID: %s)", id)
	}

	return nil
}

// Search method returning slice of pointers to match your pattern
func (r *TestimonialRepository) Search(ctx context.Context, workspaceID uuid.UUID, query string, filter models.TestimonialFilter, db *sql.DB) ([]*models.Testimonial, error) {
	searchQuery := `
		SELECT id, workspace_id, author_name, author_email, author_company,
			   author_title, author_avatar_url, type, status, content, sentiment_score,
			   media_url, transcript_segments, collection_method, metadata,
			   rating, tags, processing_status, processing_metadata,
			   created_at, updated_at
		FROM testimonials 
		WHERE workspace_id = $1 
		AND (
			content ILIKE '%' || $2 || '%' OR
			author_name ILIKE '%' || $2 || '%' OR
			author_company ILIKE '%' || $2 || '%' OR
			author_title ILIKE '%' || $2 || '%' OR
			$2 = ANY(tags)
		)
	`

	args := []interface{}{workspaceID, query}
	argIndex := 3

	// Apply additional filters
	if filter.Status != "" {
		searchQuery += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, filter.Status)
		argIndex++
	}

	if filter.Type != "" {
		searchQuery += fmt.Sprintf(" AND type = $%d", argIndex)
		args = append(args, filter.Type)
		argIndex++
	}

	if filter.MinRating != nil {
		searchQuery += fmt.Sprintf(" AND rating >= $%d", argIndex)
		args = append(args, *filter.MinRating)
		argIndex++
	}

	searchQuery += " ORDER BY created_at DESC"

	if filter.Limit > 0 {
		searchQuery += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, filter.Limit)
		argIndex++
	}

	if filter.Offset > 0 {
		searchQuery += fmt.Sprintf(" OFFSET $%d", argIndex)
		args = append(args, filter.Offset)
	}

	rows, err := db.QueryContext(ctx, searchQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testimonials []*models.Testimonial
	for rows.Next() {
		var t models.Testimonial
		err := rows.Scan(
			&t.ID, &t.WorkspaceID, &t.AuthorName, &t.AuthorEmail, &t.AuthorCompany,
			&t.AuthorTitle, &t.AuthorAvatarURL, &t.Type, &t.Status, &t.Content, &t.SentimentScore,
			&t.MediaURL, &t.TranscriptSegments, &t.CollectionMethod, &t.Metadata,
			&t.Rating, &t.Tags, &t.ProcessingStatus, &t.ProcessingMetadata,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		testimonials = append(testimonials, &t)
	}

	return testimonials, rows.Err()
}

func (r *TestimonialRepository) GetStats(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) (*models.TestimonialStats, error) {
	statsQuery := `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
			COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
			COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
			COUNT(CASE WHEN type = 'video' THEN 1 END) as video_count,
			COUNT(CASE WHEN type = 'text' THEN 1 END) as text_count,
			AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avg_rating,
			COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count,
			COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as weekly_count
		FROM testimonials 
		WHERE workspace_id = $1
	`

	var stats models.TestimonialStats
	err := db.QueryRowContext(ctx, statsQuery, workspaceID).Scan(
		&stats.Total,
		&stats.Published,
		&stats.Draft,
		&stats.Archived,
		&stats.VideoCount,
		&stats.TextCount,
		&stats.AvgRating,
		&stats.RecentCount,
		&stats.WeeklyCount,
	)

	if err != nil {
		return nil, err
	}

	return &stats, nil
}

// Bulk operations
func (r *TestimonialRepository) BulkUpdateStatus(ctx context.Context, testimonialIDs []uuid.UUID, status string, db *sql.DB) error {
	if len(testimonialIDs) == 0 {
		return fmt.Errorf("no testimonial IDs provided for bulk status update")
	}

	// Convert UUIDs to strings for PostgreSQL array
	ids := make([]string, len(testimonialIDs))
	for i, id := range testimonialIDs {
		ids[i] = id.String()
	}

	query := `
		UPDATE testimonials 
		SET status = $1, updated_at = NOW() 
		WHERE id = ANY($2::uuid[])
	`

	result, err := db.ExecContext(ctx, query, status, pq.Array(ids))
	if err != nil {
		return fmt.Errorf("failed to bulk update testimonial status to %s (IDs: %v): %w",
			status, testimonialIDs, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected for bulk status update: %w", err)
	}

	if rowsAffected != int64(len(testimonialIDs)) {
		return fmt.Errorf("bulk status update affected %d rows, expected %d",
			rowsAffected, len(testimonialIDs))
	}

	return nil
}

func (r *TestimonialRepository) BulkDelete(ctx context.Context, testimonialIDs []uuid.UUID, db *sql.DB) error {
	if len(testimonialIDs) == 0 {
		return nil
	}

	query := `DELETE FROM testimonials WHERE id = ANY($1)`
	_, err := db.ExecContext(ctx, query, pq.Array(testimonialIDs))
	return err
}

// Additional helper methods for your use cases
func (r *TestimonialRepository) GetByStatus(ctx context.Context, workspaceID uuid.UUID, status string, limit int, db *sql.DB) ([]models.Testimonial, error) {
	filter := models.TestimonialFilter{
		Status: status,
		Limit:  limit,
	}
	return r.FetchByWorkspaceID(ctx, workspaceID, filter, db)
}

func (r *TestimonialRepository) GetByType(ctx context.Context, workspaceID uuid.UUID, testimonialType string, limit int, db *sql.DB) ([]models.Testimonial, error) {
	filter := models.TestimonialFilter{
		Type:  testimonialType,
		Limit: limit,
	}
	return r.FetchByWorkspaceID(ctx, workspaceID, filter, db)
}

func (r *TestimonialRepository) GetByRating(ctx context.Context, workspaceID uuid.UUID, minRating int, db *sql.DB) ([]models.Testimonial, error) {
	filter := models.TestimonialFilter{
		MinRating: &minRating,
	}
	return r.FetchByWorkspaceID(ctx, workspaceID, filter, db)
}

func (r *TestimonialRepository) GetRecent(ctx context.Context, workspaceID uuid.UUID, days int, limit int, db *sql.DB) ([]models.Testimonial, error) {
	query := `
		SELECT id, workspace_id, author_name, author_email, author_company,
			   author_title, author_avatar_url, type, status, content,
			   media_url, transcript_segments, collection_method, metadata,
			   rating, tags, processing_status, processing_metadata,
			   created_at, updated_at
		FROM testimonials 
		WHERE workspace_id = $1 AND created_at >= NOW() - INTERVAL '%d days'
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := db.QueryContext(ctx, fmt.Sprintf(query, days), workspaceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testimonials []models.Testimonial
	for rows.Next() {
		var t models.Testimonial
		err := rows.Scan(
			&t.ID, &t.WorkspaceID, &t.AuthorName, &t.AuthorEmail, &t.AuthorCompany,
			&t.AuthorTitle, &t.AuthorAvatarURL, &t.Type, &t.Status, &t.Content,
			&t.MediaURL, &t.TranscriptSegments, &t.CollectionMethod, &t.Metadata,
			&t.Rating, &t.Tags, &t.ProcessingStatus, &t.ProcessingMetadata,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, rows.Err()
}

func (r *TestimonialRepository) GetByAuthor(ctx context.Context, workspaceID uuid.UUID, authorEmail string, db *sql.DB) ([]models.Testimonial, error) {
	query := `
		SELECT id, workspace_id, author_name, author_email, author_company,
			   author_title, author_avatar_url, type, status, content,
			   media_url, transcript_segments, collection_method, metadata,
			   rating, tags, processing_status, processing_metadata,
			   created_at, updated_at
		FROM testimonials 
		WHERE workspace_id = $1 AND author_email = $2
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, authorEmail)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testimonials []models.Testimonial
	for rows.Next() {
		var t models.Testimonial
		err := rows.Scan(
			&t.ID, &t.WorkspaceID, &t.AuthorName, &t.AuthorEmail, &t.AuthorCompany,
			&t.AuthorTitle, &t.AuthorAvatarURL, &t.Type, &t.Status, &t.Content,
			&t.MediaURL, &t.TranscriptSegments, &t.CollectionMethod, &t.Metadata,
			&t.Rating, &t.Tags, &t.ProcessingStatus, &t.ProcessingMetadata,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, rows.Err()
}

func (r *TestimonialRepository) GetByTags(ctx context.Context, workspaceID uuid.UUID, tags []string, db *sql.DB) ([]models.Testimonial, error) {
	query := `
		SELECT id, workspace_id, author_name, author_email, author_company,
			   author_title, author_avatar_url, type, status, content,
			   media_url, transcript_segments, collection_method, metadata,
			   rating, tags, processing_status, processing_metadata,
			   created_at, updated_at
		FROM testimonials 
		WHERE workspace_id = $1 AND tags && $2
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, pq.Array(tags))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testimonials []models.Testimonial
	for rows.Next() {
		var t models.Testimonial
		err := rows.Scan(
			&t.ID, &t.WorkspaceID, &t.AuthorName, &t.AuthorEmail, &t.AuthorCompany,
			&t.AuthorTitle, &t.AuthorAvatarURL, &t.Type, &t.Status, &t.Content,
			&t.MediaURL, &t.TranscriptSegments, &t.CollectionMethod, &t.Metadata,
			&t.Rating, &t.Tags, &t.ProcessingStatus, &t.ProcessingMetadata,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		testimonials = append(testimonials, t)
	}

	return testimonials, rows.Err()
}

// Aggregation queries
func (r *TestimonialRepository) GetCountByStatus(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) (map[string]int, error) {
	query := `
		SELECT status, COUNT(*) 
		FROM testimonials 
		WHERE workspace_id = $1 
		GROUP BY status
	`

	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		err := rows.Scan(&status, &count)
		if err != nil {
			return nil, err
		}
		counts[status] = count
	}

	return counts, rows.Err()
}

func (r *TestimonialRepository) GetCountByType(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) (map[string]int, error) {
	query := `
		SELECT type, COUNT(*) 
		FROM testimonials 
		WHERE workspace_id = $1 
		GROUP BY type
	`

	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[string]int)
	for rows.Next() {
		var testimonialType string
		var count int
		err := rows.Scan(&testimonialType, &count)
		if err != nil {
			return nil, err
		}
		counts[testimonialType] = count
	}

	return counts, rows.Err()
}

func (r *TestimonialRepository) GetAverageRating(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) (float64, error) {
	query := `
		SELECT COALESCE(AVG(rating), 0) 
		FROM testimonials 
		WHERE workspace_id = $1 AND rating IS NOT NULL
	`

	var avgRating float64
	err := db.QueryRowContext(ctx, query, workspaceID).Scan(&avgRating)
	return avgRating, err
}

func (r *TestimonialRepository) GetTopAuthors(ctx context.Context, workspaceID uuid.UUID, limit int, db *sql.DB) ([]models.AuthorStats, error) {
	query := `
		SELECT 
			author_name, 
			author_email, 
			author_company,
			COUNT(*) as testimonial_count,
			AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avg_rating
		FROM testimonials 
		WHERE workspace_id = $1 AND author_email IS NOT NULL
		GROUP BY author_name, author_email, author_company
		ORDER BY testimonial_count DESC, avg_rating DESC
		LIMIT $2
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var authors []models.AuthorStats
	for rows.Next() {
		var author models.AuthorStats
		err := rows.Scan(
			&author.AuthorName,
			&author.AuthorEmail,
			&author.AuthorCompany,
			&author.TestimonialCount,
			&author.AvgRating,
		)
		if err != nil {
			return nil, err
		}
		authors = append(authors, author)
	}

	return authors, rows.Err()
}

func (r *TestimonialRepository) UpdateWithTranscript(ctx context.Context, id uuid.UUID, result *models.TranscriptionResult, db *sql.DB) error {
	// Serialize segments to JSON
	segmentsJSON, err := json.Marshal(result.Segments)
	if err != nil {
		return fmt.Errorf("failed to marshal segments: %w", err)
	}

	query := `
		UPDATE testimonials 
		SET 
			transcript = $1,
			transcription_segments = $2,
			language = $3,
			transcription_confidence = $4,
			processing_status = $5,
			updated_at = $6
		WHERE id = $7
	`

	_, err = db.ExecContext(ctx, query,
		result.Transcript,
		segmentsJSON, // Store as JSON
		result.Language,
		result.Confidence,
		"completed",
		time.Now(),
		id,
	)

	if err != nil {
		return fmt.Errorf("failed to update testimonial (ID: %s): %w", id, err)
	}

	return nil
}

// UpdateAny allows updating specific fields dynamically
func (r *TestimonialRepository) UpdateAny(ctx context.Context, id uuid.UUID, updates map[string]any, db *sql.DB) error {
	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	// Always update the updated_at field
	updates["updated_at"] = time.Now()

	// Build dynamic query
	setParts := make([]string, 0, len(updates))
	args := make([]interface{}, 0, len(updates)+1)
	argIndex := 1

	for field, value := range updates {
		slog.Debug("Processing field for update",
			slog.String("attr", field),
			slog.String("value_type", fmt.Sprintf("%T", value)),
			slog.Bool("needs_json", needsJSONSerialization(value)))

		// Handle special types that need JSON serialization
		if needsJSONSerialization(value) {
			// Dereference pointer if it's a pointer
			actualValue := value
			if reflect.ValueOf(value).Kind() == reflect.Ptr {
				if reflect.ValueOf(value).IsNil() {
					actualValue = nil
				} else {
					actualValue = reflect.ValueOf(value).Elem().Interface()
				}
			}

			if actualValue != nil {
				jsonBytes, err := json.Marshal(actualValue)
				if err != nil {
					return fmt.Errorf("failed to marshal field %s: %w", field, err)
				}
				value = jsonBytes
				slog.Debug("Serialized field to JSON",
					slog.String("field", field),
					slog.String("json", string(jsonBytes)))
			}
		} else {
			// Handle pointers to basic types
			if reflect.ValueOf(value).Kind() == reflect.Ptr {
				if reflect.ValueOf(value).IsNil() {
					value = nil
				} else {
					value = reflect.ValueOf(value).Elem().Interface()
				}
			}
		}

		setParts = append(setParts, fmt.Sprintf("%s = $%d", field, argIndex))
		args = append(args, value)
		argIndex++
	}

	// Add ID as the last argument
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE testimonials 
		SET %s 
		WHERE id = $%d
	`, strings.Join(setParts, ", "), argIndex)

	result, err := db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update testimonial (ID: %s): %w", id, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("testimonial not found (ID: %s)", id)
	}

	return nil
}

func needsJSONSerialization(value interface{}) bool {
	if value == nil {
		return false
	}

	v := reflect.ValueOf(value)

	// Handle pointers by dereferencing them
	for v.Kind() == reflect.Ptr {
		if v.IsNil() {
			return false
		}
		v = v.Elem()
	}

	switch v.Kind() {
	case reflect.Slice, reflect.Array:
		// For slices/arrays, check the element type
		elemType := v.Type().Elem()

		// Handle pointers in slice elements
		for elemType.Kind() == reflect.Ptr {
			elemType = elemType.Elem()
		}

		// Return true if it's a slice of structs (but not time.Time)
		if elemType.Kind() == reflect.Struct {
			// Special case: don't serialize time.Time slices
			return elemType != reflect.TypeOf(time.Time{})
		}

		// Also handle slices of maps or other complex types
		return elemType.Kind() == reflect.Map || elemType.Kind() == reflect.Interface

	case reflect.Struct:
		// Don't serialize time.Time or other basic types
		return v.Type() != reflect.TypeOf(time.Time{})

	case reflect.Map, reflect.Interface:
		return true

	default:
		return false
	}
}
