package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type TestimonialRepository interface {
	Repository[models.Testimonial]
	FetchByID(ctx context.Context, id uuid.UUID, db DB) (*models.Testimonial, error)
	FetchForAIProcessing(ctx context.Context, id uuid.UUID, db DB) (*models.TestimonialAIData, error)
	FetchByTestimonialAndWorkspaceID(ctx context.Context, testimonial_id, workspace_id uuid.UUID, db *sql.DB) (*models.Testimonial, error)
	GetContentDataByID(ctx context.Context, testimonialID string, db *sql.DB) (models.TestimonialInput, error)
	GetContentsByIDs(ctx context.Context, testimonialIDs []string, db *sql.DB) ([]models.TestimonialInput, error)
	FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db *sql.DB) ([]models.Testimonial, error)
	Search(ctx context.Context, workspaceID uuid.UUID, query string, filter models.TestimonialFilter, db *sql.DB) ([]*models.Testimonial, error)
	BulkDelete(ctx context.Context, testimonialIDs []uuid.UUID, db *sql.DB) error
	GetCachedPlatformRecommendations(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]byte, error)
	SavePlatformRecommendations(ctx context.Context, testimonialID uuid.UUID, workspaceID uuid.UUID, artifactData []byte, db *sql.DB) error
}

type testimonialRepository struct {
	*BaseRepository[models.Testimonial]
}

func NewTestimonialRepository(redis *redis.Client) TestimonialRepository {
	return &testimonialRepository{
		BaseRepository: NewBaseRepository[models.Testimonial](redis, "testimonials"),
	}
}

// Basic CRUD Operations - matches your existing FetchByID pattern
func (r *testimonialRepository) Create(ctx context.Context, testimonial *models.Testimonial, db DB) error {

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

	// Marshal Metadata to JSON
	var metadataJSON []byte
	if testimonial.Metadata == nil {
		metadataJSON = []byte("{}")
	} else {
		var err error
		metadataJSON, err = json.Marshal(testimonial.Metadata)
		if err != nil {
			return fmt.Errorf("failed to marshal metadata: %w", err)
		}
	}

	// Marshal ProcessingMetadata to JSON
	var processingMetadataJSON []byte
	if testimonial.ProcessingMetadata == nil {
		processingMetadataJSON = []byte("{}")
	} else {
		var err error
		processingMetadataJSON, err = json.Marshal(testimonial.ProcessingMetadata)
		if err != nil {
			return fmt.Errorf("failed to marshal processing metadata: %w", err)
		}
	}

	var transcript_segments []byte
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
		string(transcript_segments),    // $13
		testimonial.CollectionMethod,   // $14
		string(metadataJSON),           // $15
		testimonial.Rating,             // $16
		tags,                           // $17
		testimonial.ProcessingStatus,   // $18
		string(processingMetadataJSON), // $19
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

func (r *testimonialRepository) FetchByID(ctx context.Context, id uuid.UUID, db DB) (*models.Testimonial, error) {
	query := `-- FetchByID
		SELECT id, workspace_id, author_name, author_email, author_company,
			   author_title, author_avatar_url, type, status, content, sentiment_score,
			   media_url, transcript_segments, collection_method, metadata,
			   rating, tags, processing_status, processing_metadata,
			   created_at, updated_at
		FROM testimonials WHERE id = $1
	`

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
		&testimonial.TranscriptSegments,
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

func (r *testimonialRepository) FetchForAIProcessing(ctx context.Context, id uuid.UUID, db DB) (*models.TestimonialAIData, error) {
	query := `
		SELECT id, workspace_id, content, media_url, transcript_segments
		FROM testimonials WHERE id = $1
	`

	var testimonial models.TestimonialAIData

	err := db.QueryRowContext(ctx, query, id).Scan(
		&testimonial.ID,
		&testimonial.WorkspaceID,
		&testimonial.Content,
		&testimonial.MediaURL,
		&testimonial.TranscriptSegments,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("testimonial not found (ID: %s): %w", id, err)
		}
		return nil, fmt.Errorf("failed to fetch testimonial for AI processing (ID: %s): %w", id, err)
	}

	return &testimonial, nil
}

func (r *testimonialRepository) FetchByTestimonialAndWorkspaceID(ctx context.Context, testimonial_id, workspace_id uuid.UUID, db *sql.DB) (*models.Testimonial, error) {
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

		// Use a temp variable to avoid overwriting transcriptSegmentsJSON on subsequent rows
		var tempTranscriptSegmentsJSON []byte

		err := rows.Scan(
			// Testimonial fields
			&t.ID, &t.WorkspaceID, &t.AuthorName, &t.AuthorEmail, &t.AuthorCompany,
			&t.AuthorTitle, &t.AuthorAvatarURL, &t.Type, &t.Status, &t.Content, &t.SentimentScore,
			&t.MediaURL, &tempTranscriptSegmentsJSON, &t.CollectionMethod, &t.Metadata,
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

		// First row sets the testimonial and captures transcript segments
		if testimonial == nil {
			testimonial = &t
			transcriptSegmentsJSON = tempTranscriptSegmentsJSON
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

	// Parse transcript segments JSON if present
	if len(transcriptSegmentsJSON) > 0 {
		var segments models.TranscriptSegments
		if err := json.Unmarshal(transcriptSegmentsJSON, &segments); err != nil {
			return nil, fmt.Errorf("failed to unmarshal transcript segments: %w", err)
		}
		testimonial.TranscriptSegments = &segments
	}

	testimonial.Artifacts = artifacts
	return testimonial, nil
}

func (r *testimonialRepository) GetContentDataByID(ctx context.Context, testimonialID string, db *sql.DB) (models.TestimonialInput, error) {
	query := `
		SELECT 
			-- Testimonial by content
			author_name, author_company, author_title, rating, content
		FROM testimonials
		WHERE id = $1
	`
	var data models.TestimonialInput
	var rating *int // Database rating is *int

	if err := db.QueryRowContext(ctx, query, testimonialID).Scan(&data.Author, &data.Company, &data.Title, &rating, &data.Text); err != nil {
		if err == sql.ErrNoRows {
			return data, fmt.Errorf("testimonial by content (ID: %s): %w", testimonialID, err)
		}
		return data, fmt.Errorf("failed to fetch by content (ID: %s): %w", testimonialID, err)
	}

	// Convert *int rating to *float64
	if rating != nil {
		floatRating := float64(*rating)
		data.Rating = &floatRating
	}

	return data, nil
}

func (r *testimonialRepository) GetContentsByIDs(ctx context.Context, testimonialIDs []string, db *sql.DB) ([]models.TestimonialInput, error) {
	if len(testimonialIDs) == 0 {
		return nil, nil
	}

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	type res struct {
		idx  int
		data models.TestimonialInput
		err  error
	}

	resChan := make(chan res, len(testimonialIDs))
	var wg sync.WaitGroup

	for i, id := range testimonialIDs {
		wg.Add(1)
		go func(i int, id string) {
			defer wg.Done()
			data, err := r.GetContentDataByID(ctx, id, db)

			select {
			case resChan <- res{i, data, err}:
			case <-ctx.Done():
			}

			if err != nil {
				cancel()
			}
		}(i, id)
	}

	go func() {
		wg.Wait()
		close(resChan)
	}()

	results := make([]models.TestimonialInput, len(testimonialIDs))
	for rcv := range resChan {
		if rcv.err != nil {
			// return first error seen
			return results, fmt.Errorf("error fetching id %s: %w", testimonialIDs[rcv.idx], rcv.err)
		}
		results[rcv.idx] = rcv.data
	}

	return results, nil
}

func (r *testimonialRepository) FetchByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, db *sql.DB) ([]models.Testimonial, error) {
	// Build query dynamically based on whether artifacts should be excluded
	var query string
	if filter.ExcludeArtifacts {
		// Lightweight query without artifacts for list views
		query = `
			SELECT
				-- Testimonial fields only
				id, workspace_id, author_name, author_email, author_company,
				author_title, author_avatar_url, type, status, content, sentiment_score,
				media_url, collection_method, metadata,
				rating, tags, processing_status, processing_metadata,
				created_at, updated_at
			FROM testimonials
			WHERE workspace_id = $1
		`
	} else {
		// Full query with artifacts
		query = `
			SELECT
				-- Testimonial fields
				t.id, t.workspace_id, t.author_name, t.author_email, t.author_company,
				t.author_title, t.author_avatar_url, t.type, t.status, t.content, t.sentiment_score,
				t.media_url, t.collection_method, t.metadata,
				t.rating, t.tags, t.processing_status, t.processing_metadata,
				t.created_at, t.updated_at,
				-- Artifact fields (nullable due to LEFT JOIN)
				a.id, a.testimonial_id, a.workspace_id, a.processing_type, a.result_category,
				a.text_content, a.data, a.asset_url, a.content_type, a.platform, a.format,
				a.is_user_saved, a.is_streamed, a.processing_metadata, a.created_at, a.updated_at
			FROM testimonials t
			LEFT JOIN testimonial_artifacts a ON t.id = a.testimonial_id
				AND a.processing_type = 'highlight_extraction'
				AND a.workspace_id = $1
			WHERE t.workspace_id = $1
		`
	}

	args := []interface{}{workspaceID}
	argIndex := 2

	// Determine table alias based on query type
	tableRef := "t"
	if filter.ExcludeArtifacts {
		tableRef = "" // No alias for simple query
	}

	// Apply filters to testimonials
	if filter.Status != "" {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.status = $%d", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND status = $%d", argIndex)
		}
		args = append(args, filter.Status)
		argIndex++
	}

	// Date range filters
	if filter.CreatedAfter != nil {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.created_at >= $%d", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND created_at >= $%d", argIndex)
		}
		args = append(args, *filter.CreatedAfter)
		argIndex++
	}

	if filter.CreatedBefore != nil {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.created_at <= $%d", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND created_at <= $%d", argIndex)
		}
		args = append(args, *filter.CreatedBefore)
		argIndex++
	}

	// Type filter (support both singular and array)
	if filter.Type != "" {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.type = $%d", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND type = $%d", argIndex)
		}
		args = append(args, filter.Type)
		argIndex++
	} else if len(filter.Types) > 0 {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.type = ANY($%d)", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND type = ANY($%d)", argIndex)
		}
		args = append(args, pq.Array(filter.Types))
		argIndex++
	}

	// Rating filters
	if filter.MinRating != nil {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.rating >= $%d", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND rating >= $%d", argIndex)
		}
		args = append(args, *filter.MinRating)
		argIndex++
	}

	if filter.MaxRating != nil {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.rating <= $%d", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND rating <= $%d", argIndex)
		}
		args = append(args, *filter.MaxRating)
		argIndex++
	}

	// Sentiment filter (convert sentiment labels to score ranges)
	if len(filter.Sentiments) > 0 {
		sentimentConditions := []string{}
		for _, sentiment := range filter.Sentiments {
			switch sentiment {
			case "positive":
				if tableRef != "" {
					sentimentConditions = append(sentimentConditions, fmt.Sprintf("%s.sentiment_score >= 0.6", tableRef))
				} else {
					sentimentConditions = append(sentimentConditions, "sentiment_score >= 0.6")
				}
			case "neutral":
				if tableRef != "" {
					sentimentConditions = append(sentimentConditions, fmt.Sprintf("(%s.sentiment_score >= 0.4 AND %s.sentiment_score < 0.6)", tableRef, tableRef))
				} else {
					sentimentConditions = append(sentimentConditions, "(sentiment_score >= 0.4 AND sentiment_score < 0.6)")
				}
			case "negative":
				if tableRef != "" {
					sentimentConditions = append(sentimentConditions, fmt.Sprintf("%s.sentiment_score < 0.4", tableRef))
				} else {
					sentimentConditions = append(sentimentConditions, "sentiment_score < 0.4")
				}
			}
		}
		if len(sentimentConditions) > 0 {
			query += " AND (" + strings.Join(sentimentConditions, " OR ") + ")"
		}
	}

	// Collection method filter
	if len(filter.CollectionMethods) > 0 {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.collection_method = ANY($%d)", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND collection_method = ANY($%d)", argIndex)
		}
		args = append(args, pq.Array(filter.CollectionMethods))
		argIndex++
	}

	// Company filter
	if len(filter.Companies) > 0 {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.author_company = ANY($%d)", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND author_company = ANY($%d)", argIndex)
		}
		// Convert []string to []*string for nullable field
		companyPtrs := make([]*string, len(filter.Companies))
		for i := range filter.Companies {
			companyPtrs[i] = &filter.Companies[i]
		}
		args = append(args, pq.Array(companyPtrs))
		argIndex++
	}

	// Tags filter (array overlap)
	if len(filter.Tags) > 0 {
		if tableRef != "" {
			query += fmt.Sprintf(" AND %s.tags && $%d", tableRef, argIndex)
		} else {
			query += fmt.Sprintf(" AND tags && $%d", argIndex)
		}
		args = append(args, pq.Array(filter.Tags))
		argIndex++
	}

	// Add ordering by testimonial fields
	if filter.SortBy != "" {
		direction := "DESC"
		if filter.SortOrder == "asc" {
			direction = "ASC"
		}
		if tableRef != "" {
			if !filter.ExcludeArtifacts {
				query += fmt.Sprintf(" ORDER BY %s.%s %s, a.created_at DESC", tableRef, filter.SortBy, direction)
			} else {
				query += fmt.Sprintf(" ORDER BY %s.%s %s", tableRef, filter.SortBy, direction)
			}
		} else {
			query += fmt.Sprintf(" ORDER BY %s %s", filter.SortBy, direction)
		}
	} else {
		if tableRef != "" && !filter.ExcludeArtifacts {
			query += " ORDER BY t.created_at DESC, a.created_at DESC"
		} else if tableRef != "" {
			query += " ORDER BY t.created_at DESC"
		} else {
			query += " ORDER BY created_at DESC"
		}
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
		return nil, fmt.Errorf("failed to fetch testimonials: %w", err)
	}
	defer rows.Close()

	// Handle lightweight query (no artifacts)
	if filter.ExcludeArtifacts {
		var testimonials []models.Testimonial
		for rows.Next() {
			var t models.Testimonial
			err := rows.Scan(
				&t.ID, &t.WorkspaceID, &t.AuthorName, &t.AuthorEmail, &t.AuthorCompany,
				&t.AuthorTitle, &t.AuthorAvatarURL, &t.Type, &t.Status, &t.Content, &t.SentimentScore,
				&t.MediaURL, &t.CollectionMethod, &t.Metadata,
				&t.Rating, &t.Tags, &t.ProcessingStatus, &t.ProcessingMetadata,
				&t.CreatedAt, &t.UpdatedAt,
			)
			if err != nil {
				return nil, fmt.Errorf("failed to scan testimonial row: %w", err)
			}
			testimonials = append(testimonials, t)
		}
		if err = rows.Err(); err != nil {
			return nil, fmt.Errorf("error iterating rows: %w", err)
		}
		return testimonials, nil
	}

	// Use a map to group testimonials and their artifacts (with artifacts query)
	testimonialMap := make(map[uuid.UUID]*models.Testimonial)
	var testimonialOrder []uuid.UUID // To maintain order

	for rows.Next() {
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
			&t.MediaURL, &t.CollectionMethod, &t.Metadata,
			&t.Rating, &t.Tags, &t.ProcessingStatus, &t.ProcessingMetadata,
			&t.CreatedAt, &t.UpdatedAt,
			// Artifact fields (nullable)
			&artifactID, &artifactTestimonialID, &artifactWorkspaceID, &artifactProcessingType,
			&artifactResultCategory, &artifactTextContent, &artifactData, &artifactAssetURL,
			&artifactContentType, &artifactPlatform, &artifactFormat, &artifactIsUserSaved,
			&artifactIsStreamed, &artifactProcessingMetadata, &artifactCreatedAt, &artifactUpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan testimonial row: %w", err)
		}

		// Check if this testimonial is already in our map
		existingTestimonial, exists := testimonialMap[t.ID]
		if !exists {
			// New testimonial - add to map and order slice
			testimonialMap[t.ID] = &t
			testimonialOrder = append(testimonialOrder, t.ID)
			existingTestimonial = &t
		}

		// If there's an artifact, add it to the testimonial
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

			existingTestimonial.Artifacts = append(existingTestimonial.Artifacts, artifact)
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	// Convert map back to slice in original order
	testimonials := make([]models.Testimonial, 0, len(testimonialOrder))
	for _, id := range testimonialOrder {
		if testimonial := testimonialMap[id]; testimonial != nil {
			testimonials = append(testimonials, *testimonial)
		}
	}

	return testimonials, nil
}

func (r *testimonialRepository) Update(ctx context.Context, testimonial *models.Testimonial, id uuid.UUID, db DB) error {
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

	var transcript_segments []byte
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

	// Marshal Metadata to JSON
	var metadataJSON []byte
	if testimonial.Metadata == nil {
		metadataJSON = []byte("{}")
	} else {
		var err error
		metadataJSON, err = json.Marshal(testimonial.Metadata)
		if err != nil {
			return fmt.Errorf("failed to marshal metadata: %w", err)
		}
	}

	// Marshal ProcessingMetadata to JSON
	var processingMetadataJSON []byte
	if testimonial.ProcessingMetadata == nil {
		processingMetadataJSON = []byte("{}")
	} else {
		var err error
		processingMetadataJSON, err = json.Marshal(testimonial.ProcessingMetadata)
		if err != nil {
			return fmt.Errorf("failed to marshal processing metadata: %w", err)
		}
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
		string(transcript_segments),
		testimonial.CollectionMethod,
		string(metadataJSON),
		testimonial.Rating,
		testimonial.Tags,
		testimonial.ProcessingStatus,
		string(processingMetadataJSON),
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

func (r *testimonialRepository) Delete(ctx context.Context, id uuid.UUID, db DB) error {
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
func (r *testimonialRepository) Search(ctx context.Context, workspaceID uuid.UUID, query string, filter models.TestimonialFilter, db *sql.DB) ([]*models.Testimonial, error) {
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

func (r *testimonialRepository) BulkDelete(ctx context.Context, testimonialIDs []uuid.UUID, db *sql.DB) error {
	if len(testimonialIDs) == 0 {
		return nil
	}

	query := `DELETE FROM testimonials WHERE id = ANY($1)`
	_, err := db.ExecContext(ctx, query, pq.Array(testimonialIDs))
	return err
}

func (r *testimonialRepository) UpdateWithTranscript(ctx context.Context, id uuid.UUID, result *models.TranscriptionResult, db *sql.DB) error {
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

// GetCachedPlatformRecommendations retrieves platform recommendations from artifacts
func (r *testimonialRepository) GetCachedPlatformRecommendations(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]byte, error) {
	query := `
		SELECT data
		FROM testimonial_artifacts
		WHERE testimonial_id = $1
		AND processing_type = 'platform_recommendation'
		AND result_category = 'analysis'
		ORDER BY created_at DESC
		LIMIT 1
	`

	var dataJSON []byte
	err := db.QueryRowContext(ctx, query, testimonialID).Scan(&dataJSON)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no cached platform recommendations")
		}
		return nil, fmt.Errorf("failed to query cached recommendations: %w", err)
	}

	return dataJSON, nil
}

// SavePlatformRecommendations saves platform recommendations to artifacts table
func (r *testimonialRepository) SavePlatformRecommendations(ctx context.Context, testimonialID uuid.UUID, workspaceID uuid.UUID, artifactData []byte, db *sql.DB) error {
	insertQuery := `
		INSERT INTO testimonial_artifacts (
			id, testimonial_id, workspace_id, processing_type, result_category,
			data, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (testimonial_id, processing_type, result_category)
		DO UPDATE SET data = $6, updated_at = $8
	`

	_, err := db.ExecContext(ctx, insertQuery,
		uuid.New(),
		testimonialID,
		workspaceID,
		"platform_recommendation",
		"analysis",
		artifactData,
		time.Now(),
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("failed to save platform recommendations artifact: %w", err)
	}

	return nil
}
