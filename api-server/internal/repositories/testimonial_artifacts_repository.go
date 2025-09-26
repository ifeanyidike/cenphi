package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type ArtifactSourceRepo struct {
	*BaseRepository[models.ArtifactSource]
}

type TestimonialArtifactRepository struct {
	logger *zap.Logger
	*BaseRepository[models.TestimonialArtifact]
	ArtifactSourceRepo
}

func NewArtifactSourceRepo(redis *redis.Client) ArtifactSourceRepo {
	return ArtifactSourceRepo{
		BaseRepository: NewBaseRepository[models.ArtifactSource](redis, "artifact_sources"),
	}
}

func NewTestimonialArtifactRepository(redis *redis.Client, logger *zap.Logger) TestimonialArtifactRepository {

	return TestimonialArtifactRepository{
		logger:         logger,
		BaseRepository: NewBaseRepository[models.TestimonialArtifact](redis, "testimonial_artifact"),
	}
}

func (r TestimonialArtifactRepository) Create(ctx context.Context, artifact *models.TestimonialArtifact, db DB) error {
	query := `
		INSERT INTO testimonial_artifacts (
			id, testimonial_id, workspace_id, processing_type, result_category, text_content,
			data, asset_url, content_type, platform, format, is_user_saved,
			is_streamed, processing_metadata, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		)
	`

	var pmArg any
	b, err := json.Marshal(artifact.ProcessingMetadata)
	if err != nil {
		return fmt.Errorf("marshal processing metadata: %w", err)
	}
	pmArg = string(b)

	var data any
	d, err := json.Marshal(artifact.Data)
	if err != nil {
		return fmt.Errorf("marshal data: %w", err)
	}
	data = string(d)

	if artifact.ID == uuid.Nil {
		artifact.ID = uuid.New()
	}

	now := time.Now()
	if artifact.CreatedAt.IsZero() {
		artifact.CreatedAt = now
	}
	artifact.UpdatedAt = now

	_, err = db.ExecContext(ctx, query,
		artifact.ID,
		artifact.TestimonialID,
		artifact.WorkspaceID,
		artifact.ProcessingType,
		artifact.ResultCategory,
		artifact.TextContent,
		data,
		artifact.AssetURL,
		artifact.ContentType,
		artifact.Platform,
		artifact.Format,
		artifact.IsUserSaved,
		artifact.IsStreamed,
		pmArg,
		artifact.CreatedAt,
		artifact.UpdatedAt,
	)

	return err
}

func (r TestimonialArtifactRepository) GetByID(ctx context.Context, id uuid.UUID, db DB) (*models.TestimonialArtifact, error) {
	query := `
		SELECT id, testimonial_id, processing_type, result_category, text_content,
			   data, asset_url, content_type, platform, format, is_user_saved,
			   is_streamed, processing_metadata, created_at, updated_at
		FROM testimonial_artifacts WHERE id = $1::uuid
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

func (r TestimonialArtifactRepository) GetByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db DB) ([]models.TestimonialArtifact, error) {
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

func (r TestimonialArtifactRepository) GetByTestimonialAndType(ctx context.Context, testimonialID uuid.UUID, processingType string, db DB) (*models.TestimonialArtifact, error) {
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

func (r TestimonialArtifactRepository) Update(ctx context.Context, artifact *models.TestimonialArtifact, db DB) error {
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

func (r TestimonialArtifactRepository) Delete(ctx context.Context, id uuid.UUID, db DB) error {
	query := `DELETE FROM testimonial_artifacts WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id)
	return err
}

func (r TestimonialArtifactRepository) GetHighlights(ctx context.Context, testimonialID uuid.UUID, db DB) ([]models.TestimonialArtifact, error) {
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

func (r TestimonialArtifactRepository) CreateArtifactSource(ctx context.Context, data *models.ArtifactSource, db DB) error {
	query := `
		INSERT INTO artifact_sources (
			id, artifact_id, source_testimonial_id, source_artifact_id, 
			source_clip_id, source_type, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	if data.ID == uuid.Nil {
		data.ID = uuid.New()
	}

	now := time.Now()
	if data.CreatedAt.IsZero() {
		data.CreatedAt = now
	}

	_, err := db.ExecContext(ctx, query,
		&data.ID,
		&data.ArtifactID,
		&data.SourceTestimonialID,
		&data.SourceArtifactID,
		&data.SourceClipID,
		&data.SourceType,
		&data.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create artifact source; %v", err)
	}

	return nil
}

// Add this method to your repository
func (r *TestimonialArtifactRepository) CreateArtifactSources(ctx context.Context, sources []*models.ArtifactSource, db DB) error {
	if len(sources) == 0 {
		return nil
	}

	// Single insert optimization
	if len(sources) == 1 {
		return r.CreateArtifactSource(ctx, sources[0], db)
	}

	// fmt.Printf("sources info %#v\n\n", sources)

	// Batch insert for multiple sources
	valueStrings := make([]string, 0, len(sources))
	valueArgs := make([]any, 0, len(sources)*7)

	for i, source := range sources {
		// Generate ID if not provided
		if source.ID == uuid.Nil {
			source.ID = uuid.New()
		}

		fmt.Printf("artifact source id: %s\n", source.SourceArtifactID)

		// Set created_at if not provided
		now := time.Now()
		if source.CreatedAt.IsZero() {
			source.CreatedAt = now
		}

		// Create placeholder string for this row
		valueStrings = append(valueStrings, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d)",
			i*7+1, i*7+2, i*7+3, i*7+4, i*7+5, i*7+6, i*7+7))

		// Add values for this row
		valueArgs = append(valueArgs,
			source.ID,
			source.ArtifactID,
			source.SourceTestimonialID,
			source.SourceArtifactID,
			source.SourceClipID,
			source.SourceType,
			source.CreatedAt,
		)
	}

	query := fmt.Sprintf(`
        INSERT INTO artifact_sources (
            id, artifact_id, source_testimonial_id, source_artifact_id,
            source_clip_id, source_type, created_at
        ) VALUES %s
    `, strings.Join(valueStrings, ","))

	_, err := db.ExecContext(ctx, query, valueArgs...)
	if err != nil {
		return fmt.Errorf("failed to create artifact sources: %v", err)
	}

	return nil
}

// Single source from testimonial
func (r *TestimonialArtifactRepository) CreateSourceFromTestimonial(ctx context.Context, artifactID, testimonialID uuid.UUID, db DB) error {
	source := &models.ArtifactSource{
		ArtifactID:          &artifactID,
		SourceTestimonialID: &testimonialID,
		SourceType:          "testimonial",
	}
	return r.CreateArtifactSource(ctx, source, db)
}

func (r *TestimonialArtifactRepository) CreateSourceFromTestimonials(ctx context.Context, testimonialIDs []uuid.UUID, db DB) error {

	sources := []*models.ArtifactSource{}
	for _, id := range testimonialIDs {
		source := &models.ArtifactSource{
			SourceTestimonialID: &id,
			SourceType:          "best_story_moments",
		}
		sources = append(sources, source)
	}

	return r.CreateArtifactSources(ctx, sources, db)
}

// Single source from artifact
func (r *TestimonialArtifactRepository) CreateSourceFromArtifact(ctx context.Context, artifactID, sourceArtifactID uuid.UUID, db DB) error {
	source := &models.ArtifactSource{
		ArtifactID:       &artifactID,
		SourceArtifactID: &sourceArtifactID,
		SourceType:       "artifact",
	}
	return r.CreateArtifactSource(ctx, source, db)
}

// Single source from clip
func (r *TestimonialArtifactRepository) CreateSourceFromClip(ctx context.Context, artifactID, sourceArtifactID, clipID uuid.UUID, db DB) error {
	source := &models.ArtifactSource{
		ArtifactID:       &artifactID,
		SourceArtifactID: &sourceArtifactID,
		SourceClipID:     &clipID,
		SourceType:       "clip",
	}
	return r.CreateArtifactSource(ctx, source, db)
}

// Multiple sources from clips (story video use case)
func (r *TestimonialArtifactRepository) CreateSourcesFromClips(ctx context.Context, artifactID uuid.UUID, clips []models.ClipSource, db DB) error {
	sources := make([]*models.ArtifactSource, len(clips))

	for i, clip := range clips {
		sources[i] = &models.ArtifactSource{
			ArtifactID:       &artifactID,
			SourceArtifactID: &clip.ArtifactID,
			SourceClipID:     &clip.ClipID,
			SourceType:       "clip",
		}
	}

	return r.CreateArtifactSources(ctx, sources, db)
}

func (r *TestimonialArtifactRepository) GetContentDataByID(ctx context.Context, artifactID string, db *sql.DB) (models.TestimonialInput, error) {
	query := `
		SELECT 
			-- Testimonial by content
			a.text_content,
			t.author_name, t.author_company, t.author_title, t.rating, t.content
		FROM testimonial_artifacts a 
		INNER JOIN testimonials t ON a.testimonial_id = t.id
		WHERE id = $1
	`
	var data models.TestimonialInput

	if err := db.QueryRowContext(ctx, query, artifactID).Scan(&data.Author, &data.Company, &data.Title, &data.Rating, &data.Text); err != nil {
		if err == sql.ErrNoRows {
			return data, fmt.Errorf("testimonial and artifact by content (ID: %s): %w", artifactID, err)
		}
		return data, fmt.Errorf("failed to fetch by testimonial and artifact content (ID: %s): %w", artifactID, err)
	}

	return data, nil
}

func (r *TestimonialArtifactRepository) GetContentsByIDs(ctx context.Context, testimonialIDs []string, db *sql.DB) ([]models.TestimonialInput, error) {
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

// func (r *TestimonialArtifactRepository) UpdateAny(ctx context.Context, id uuid.UUID, updates map[string]any, db *sql.DB) error {
// 	if len(updates) == 0 {
// 		return fmt.Errorf("no fields to update")
// 	}

// 	// Always update the updated_at field
// 	updates["updated_at"] = time.Now()

// 	// Build dynamic query
// 	setParts := make([]string, 0, len(updates))
// 	args := make([]any, 0, len(updates)+1)
// 	argIndex := 1

// 	for field, value := range updates {
// 		slog.Debug("Processing field for update",
// 			slog.String("attr", field),
// 			slog.String("value_type", fmt.Sprintf("%T", value)),
// 			slog.Bool("needs_json", needsJSONSerialization(value)))

// 		// Handle special types that need JSON serialization
// 		if needsJSONSerialization(value) {
// 			// Dereference pointer if it's a pointer
// 			actualValue := value
// 			if reflect.ValueOf(value).Kind() == reflect.Ptr {
// 				if reflect.ValueOf(value).IsNil() {
// 					actualValue = nil
// 				} else {
// 					actualValue = reflect.ValueOf(value).Elem().Interface()
// 				}
// 			}

// 			if actualValue != nil {
// 				jsonBytes, err := json.Marshal(actualValue)
// 				if err != nil {
// 					return fmt.Errorf("failed to marshal field %s: %w", field, err)
// 				}
// 				value = jsonBytes
// 				slog.Debug("Serialized field to JSON",
// 					slog.String("field", field),
// 					slog.String("json", string(jsonBytes)))
// 			}
// 		} else {
// 			// Handle pointers to basic types
// 			if reflect.ValueOf(value).Kind() == reflect.Ptr {
// 				if reflect.ValueOf(value).IsNil() {
// 					value = nil
// 				} else {
// 					value = reflect.ValueOf(value).Elem().Interface()
// 				}
// 			}
// 		}

// 		setParts = append(setParts, fmt.Sprintf("%s = $%d", field, argIndex))
// 		args = append(args, value)
// 		argIndex++
// 	}

// 	// Add ID as the last argument
// 	args = append(args, id)

// 	query := fmt.Sprintf(`
// 		UPDATE testimonial_artifacts
// 		SET %s
// 		WHERE id = $%d
// 	`, strings.Join(setParts, ", "), argIndex)

// 	result, err := db.ExecContext(ctx, query, args...)
// 	if err != nil {
// 		return fmt.Errorf("failed to update testimonial (ID: %s): %w", id, err)
// 	}

// 	rowsAffected, err := result.RowsAffected()
// 	if err != nil {
// 		return fmt.Errorf("failed to get rows affected: %w", err)
// 	}

// 	if rowsAffected == 0 {
// 		return fmt.Errorf("testimonial not found (ID: %s)", id)
// 	}

// 	return nil
// }

// // GetServiceLineageForTestimonial gets all services applied to a testimonial through any processing chain
// func (r *TestimonialArtifactRepository) GetServiceLineageForTestimonial(
// 	ctx context.Context,
// 	testimonialID uuid.UUID,
// 	db DB,
// ) ([]string, error) {
// 	query := `
// 		WITH RECURSIVE testimonial_services AS (
// 			-- Base: direct artifacts from testimonial
// 			SELECT ta.processing_type, ta.created_at, 1 as depth
// 			FROM testimonial_artifacts ta
// 			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
// 			WHERE asrc.source_testimonial_id = $1

// 			UNION ALL

// 			-- Recursive: artifacts created from other artifacts in the chain
// 			SELECT ta.processing_type, ta.created_at, ts.depth + 1
// 			FROM testimonial_artifacts ta
// 			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
// 			JOIN testimonial_services ts ON EXISTS (
// 				SELECT 1 FROM testimonial_artifacts ta2
// 				JOIN artifact_sources asrc2 ON asrc2.artifact_id = ta2.id
// 				WHERE asrc.source_artifact_id = ta2.id
// 			)
// 		)
// 		SELECT DISTINCT processing_type
// 		FROM testimonial_services
// 		ORDER BY processing_type
// 	`

// 	rows, err := db.QueryContext(ctx, query, testimonialID)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get testimonial service lineage: %w", err)
// 	}
// 	defer rows.Close()

// 	var services []string
// 	for rows.Next() {
// 		var service string
// 		if err := rows.Scan(&service); err != nil {
// 			return nil, fmt.Errorf("failed to scan service: %w", err)
// 		}
// 		services = append(services, service)
// 	}

// 	return services, rows.Err()
// }

func (r *TestimonialArtifactRepository) GetServiceLineageForTestimonial(
	ctx context.Context,
	testimonialID uuid.UUID,
	db DB,
) ([]string, error) {
	// ✅ SIMPLIFIED: Replaced complex recursive CTE with simpler approach
	query := `
		SELECT DISTINCT ta.processing_type
		FROM testimonial_artifacts ta
		JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
		WHERE asrc.source_testimonial_id = $1
		   OR asrc.source_artifact_id IN (
			   SELECT ta2.id FROM testimonial_artifacts ta2
			   JOIN artifact_sources asrc2 ON asrc2.artifact_id = ta2.id
			   WHERE asrc2.source_testimonial_id = $1
		   )
		ORDER BY ta.processing_type
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		// ✅ ADDED: Fallback to even simpler query if complex one fails
		simpleQuery := `
			SELECT DISTINCT ta.processing_type
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE asrc.source_testimonial_id = $1
			ORDER BY ta.processing_type
		`

		rows, err = db.QueryContext(ctx, simpleQuery, testimonialID)
		if err != nil {
			return nil, fmt.Errorf("failed to get testimonial service lineage: %w", err)
		}
	}
	defer rows.Close()

	var services []string
	for rows.Next() {
		var service string
		if err := rows.Scan(&service); err != nil {
			return nil, fmt.Errorf("failed to scan service: %w", err)
		}
		services = append(services, service)
	}

	return services, rows.Err()
}

// GetServiceLineageForArtifact gets all services in the lineage leading to an artifact
func (r *TestimonialArtifactRepository) GetServiceLineageForArtifact(
	ctx context.Context,
	artifactID uuid.UUID,
	db DB,
) ([]string, error) {
	query := `
		WITH RECURSIVE artifact_lineage AS (
			-- Find the testimonial this artifact chain started from
			SELECT ta.id, ta.testimonial_id, ta.processing_type, 
				   asrc.source_testimonial_id, asrc.source_artifact_id,
				   ARRAY[ta.processing_type] as service_path
			FROM testimonial_artifacts ta
			LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE ta.id = $1
			
			UNION ALL
			
			-- Follow the chain back to find all services in lineage
			SELECT ta.id, ta.testimonial_id, ta.processing_type,
				   asrc.source_testimonial_id, asrc.source_artifact_id,
				   ta.processing_type || al.service_path
			FROM testimonial_artifacts ta
			LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			JOIN artifact_lineage al ON al.source_artifact_id = ta.id
		)
		SELECT DISTINCT unnest(service_path) as service
		FROM artifact_lineage
	`

	rows, err := db.QueryContext(ctx, query, artifactID)
	if err != nil {
		return nil, fmt.Errorf("failed to get artifact service lineage: %w", err)
	}
	defer rows.Close()

	var services []string
	for rows.Next() {
		var service string
		if err := rows.Scan(&service); err != nil {
			return nil, fmt.Errorf("failed to scan service: %w", err)
		}
		services = append(services, service)
	}

	return services, rows.Err()
}

// CheckServiceAppliedToSource checks if a service has been applied to any source
func (r *TestimonialArtifactRepository) CheckServiceAppliedToSource(
	ctx context.Context,
	sourceID uuid.UUID,
	sourceType models.ArtifactSourceType,
	serviceName string,
	db DB,
) (bool, error) {
	var query string
	var args []interface{}

	switch sourceType {
	case models.TestimonialTypeSource:
		query = `
			SELECT EXISTS(
				WITH RECURSIVE testimonial_services AS (
					SELECT ta.processing_type
					FROM testimonial_artifacts ta
					JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
					WHERE asrc.source_testimonial_id = $1
					
					UNION ALL
					
					SELECT ta.processing_type
					FROM testimonial_artifacts ta
					JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
					WHERE asrc.source_artifact_id IN (
						SELECT ta2.id FROM testimonial_artifacts ta2
						JOIN artifact_sources asrc2 ON asrc2.artifact_id = ta2.id
						WHERE asrc2.source_testimonial_id = $1
					)
				)
				SELECT 1 FROM testimonial_services WHERE processing_type = $2
			)
		`
		args = []interface{}{sourceID, serviceName}

	case models.ArtifactTypeSource:
		query = `
			SELECT EXISTS(
				WITH RECURSIVE artifact_lineage AS (
					SELECT ta.processing_type, asrc.source_artifact_id
					FROM testimonial_artifacts ta
					LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
					WHERE ta.id = $1
					
					UNION ALL
					
					SELECT ta.processing_type, asrc.source_artifact_id
					FROM testimonial_artifacts ta
					LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
					JOIN artifact_lineage al ON al.source_artifact_id = ta.id
				)
				SELECT 1 FROM artifact_lineage WHERE processing_type = $2
			)
		`
		args = []interface{}{sourceID, serviceName}

	default:
		return false, fmt.Errorf("unsupported source type: %v", sourceType)
	}

	var exists bool
	err := db.QueryRowContext(ctx, query, args...).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check service application: %w", err)
	}

	return exists, nil
}

// // GetProcessingTreeForTestimonial gets the hierarchical processing tree
// func (r *TestimonialArtifactRepository) GetProcessingTreeForTestimonial(
// 	ctx context.Context,
// 	testimonialID uuid.UUID,
// 	db DB,
// ) ([]models.TestimonialArtifact, error) {
// 	query := `
// 		WITH RECURSIVE processing_tree AS (
// 			-- Base: direct artifacts from testimonial
// 			SELECT ta.*, asrc.source_testimonial_id, asrc.source_artifact_id, 1 as depth
// 			FROM testimonial_artifacts ta
// 			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
// 			WHERE asrc.source_testimonial_id = $1

// 			UNION ALL

// 			-- Recursive: artifacts created from other artifacts
// 			SELECT ta.*, asrc.source_testimonial_id, asrc.source_artifact_id, pt.depth + 1
// 			FROM testimonial_artifacts ta
// 			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
// 			JOIN processing_tree pt ON pt.id = asrc.source_artifact_id
// 		)
// 		SELECT id, testimonial_id, workspace_id, processing_type, result_category,
// 			   text_content, data, asset_url, content_type, platform, format,
// 			   is_user_saved, is_streamed, processing_metadata, created_at, updated_at, depth
// 		FROM processing_tree
// 		ORDER BY depth, created_at
// 	`

// 	rows, err := db.QueryContext(ctx, query, testimonialID)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get processing tree: %w", err)
// 	}
// 	defer rows.Close()

// 	var artifacts []models.TestimonialArtifact
// 	for rows.Next() {
// 		var artifact models.TestimonialArtifact
// 		var depth int

// 		err := rows.Scan(
// 			&artifact.ID,
// 			&artifact.TestimonialID,
// 			&artifact.WorkspaceID,
// 			&artifact.ProcessingType,
// 			&artifact.ResultCategory,
// 			&artifact.TextContent,
// 			&artifact.Data,
// 			&artifact.AssetURL,
// 			&artifact.ContentType,
// 			&artifact.Platform,
// 			&artifact.Format,
// 			&artifact.IsUserSaved,
// 			&artifact.IsStreamed,
// 			&artifact.ProcessingMetadata,
// 			&artifact.CreatedAt,
// 			&artifact.UpdatedAt,
// 			&depth,
// 		)
// 		if err != nil {
// 			return nil, fmt.Errorf("failed to scan processing tree artifact: %w", err)
// 		}

// 		artifacts = append(artifacts, artifact)
// 	}

// 	return artifacts, rows.Err()
// }

func (r *TestimonialArtifactRepository) GetProcessingTreeForTestimonial(
	ctx context.Context,
	testimonialID uuid.UUID,
	db DB,
) ([]models.TestimonialArtifact, error) {
	// ✅ SIMPLIFIED: Replaced complex recursive CTE with flat query
	// We'll build the hierarchy in the service layer instead of SQL
	query := `
		SELECT ta.id, ta.testimonial_id, ta.workspace_id, ta.processing_type, 
			   ta.result_category, ta.text_content, ta.data, ta.asset_url, 
			   ta.content_type, ta.platform, ta.format, ta.is_user_saved, 
			   ta.is_streamed, ta.processing_metadata, ta.created_at, ta.updated_at,
			   asrc.source_testimonial_id, asrc.source_artifact_id
		FROM testimonial_artifacts ta
		JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
		WHERE asrc.source_testimonial_id = $1
		   OR asrc.source_artifact_id IN (
			   SELECT ta2.id FROM testimonial_artifacts ta2
			   JOIN artifact_sources asrc2 ON asrc2.artifact_id = ta2.id
			   WHERE asrc2.source_testimonial_id = $1
		   )
		ORDER BY ta.created_at
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		// ✅ ADDED: Even simpler fallback query
		fallbackQuery := `
			SELECT ta.id, ta.testimonial_id, ta.workspace_id, ta.processing_type, 
				   ta.result_category, ta.text_content, ta.data, ta.asset_url, 
				   ta.content_type, ta.platform, ta.format, ta.is_user_saved, 
				   ta.is_streamed, ta.processing_metadata, ta.created_at, ta.updated_at
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE asrc.source_testimonial_id = $1
			ORDER BY ta.created_at
		`

		rows, err = db.QueryContext(ctx, fallbackQuery, testimonialID)
		if err != nil {
			return nil, fmt.Errorf("failed to get processing tree: %w", err)
		}

		// Handle simpler result set
		defer rows.Close()
		var artifacts []models.TestimonialArtifact
		for rows.Next() {
			var artifact models.TestimonialArtifact
			err := rows.Scan(
				&artifact.ID, &artifact.TestimonialID, &artifact.WorkspaceID,
				&artifact.ProcessingType, &artifact.ResultCategory, &artifact.TextContent,
				&artifact.Data, &artifact.AssetURL, &artifact.ContentType,
				&artifact.Platform, &artifact.Format, &artifact.IsUserSaved,
				&artifact.IsStreamed, &artifact.ProcessingMetadata,
				&artifact.CreatedAt, &artifact.UpdatedAt,
			)
			if err != nil {
				return nil, fmt.Errorf("failed to scan processing tree artifact: %w", err)
			}
			artifacts = append(artifacts, artifact)
		}
		return artifacts, rows.Err()
	}
	defer rows.Close()

	var artifacts []models.TestimonialArtifact
	for rows.Next() {
		var artifact models.TestimonialArtifact
		var sourceTestimonialID, sourceArtifactID *uuid.UUID

		err := rows.Scan(
			&artifact.ID, &artifact.TestimonialID, &artifact.WorkspaceID,
			&artifact.ProcessingType, &artifact.ResultCategory, &artifact.TextContent,
			&artifact.Data, &artifact.AssetURL, &artifact.ContentType,
			&artifact.Platform, &artifact.Format, &artifact.IsUserSaved,
			&artifact.IsStreamed, &artifact.ProcessingMetadata,
			&artifact.CreatedAt, &artifact.UpdatedAt,
			&sourceTestimonialID, &sourceArtifactID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan processing tree artifact: %w", err)
		}

		artifacts = append(artifacts, artifact)
	}

	return artifacts, rows.Err()
}

// GetArtifactWithSources gets an artifact along with its source information
func (r *TestimonialArtifactRepository) GetArtifactWithSources(
	ctx context.Context,
	artifactID uuid.UUID,
	db DB,
) (*models.TestimonialArtifact, error) {
	query := `
		SELECT 
			ta.id, ta.testimonial_id, ta.workspace_id, ta.processing_type, ta.result_category,
			ta.text_content, ta.data, ta.asset_url, ta.content_type, ta.platform, ta.format,
			ta.is_user_saved, ta.is_streamed, ta.processing_metadata, ta.created_at, ta.updated_at,
			-- Source information
			asrc.id as source_id, asrc.source_testimonial_id, asrc.source_artifact_id, 
			asrc.source_clip_id, asrc.source_type, asrc.created_at as source_created_at
		FROM testimonial_artifacts ta
		LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
		WHERE ta.id = $1
	`

	rows, err := db.QueryContext(ctx, query, artifactID)
	if err != nil {
		return nil, fmt.Errorf("failed to get artifact with sources: %w", err)
	}
	defer rows.Close()

	var artifact *models.TestimonialArtifact
	var sources []models.ArtifactSource

	for rows.Next() {
		var tempArtifact models.TestimonialArtifact
		var source models.ArtifactSource
		var sourceID sql.NullString

		err := rows.Scan(
			&tempArtifact.ID,
			&tempArtifact.TestimonialID,
			&tempArtifact.WorkspaceID,
			&tempArtifact.ProcessingType,
			&tempArtifact.ResultCategory,
			&tempArtifact.TextContent,
			&tempArtifact.Data,
			&tempArtifact.AssetURL,
			&tempArtifact.ContentType,
			&tempArtifact.Platform,
			&tempArtifact.Format,
			&tempArtifact.IsUserSaved,
			&tempArtifact.IsStreamed,
			&tempArtifact.ProcessingMetadata,
			&tempArtifact.CreatedAt,
			&tempArtifact.UpdatedAt,
			// Source fields
			&sourceID,
			&source.SourceTestimonialID,
			&source.SourceArtifactID,
			&source.SourceClipID,
			&source.SourceType,
			&source.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan artifact with sources: %w", err)
		}

		if artifact == nil {
			artifact = &tempArtifact
		}

		if sourceID.Valid {
			source.ID = uuid.MustParse(sourceID.String)
			source.ArtifactID = &artifact.ID
			sources = append(sources, source)
		}
	}

	if artifact == nil {
		return nil, fmt.Errorf("artifact not found")
	}

	artifact.ArtifactSources = sources
	return artifact, nil
}

// CreateArtifactWithLineage creates an artifact with complete source lineage tracking
func (r *TestimonialArtifactRepository) CreateArtifactWithLineage(
	ctx context.Context,
	processingType string,
	workspaceID uuid.UUID,
	testimonialID *uuid.UUID,
	data models.JSONMap,
	sourceData models.CreateArtifactSourceParams,
	testimonialsIds []uuid.UUID,
	db DB,
) (string, error) {
	// Start timing for performance monitoring
	start := time.Now()
	defer func() {
		duration := time.Since(start)
		if duration > 1*time.Second {
			// You can add logging here if needed
		}
	}()

	// Determine if we need to create a transaction
	var tx *sql.Tx
	var shouldCommit bool

	if existingTx, ok := db.(*sql.Tx); ok {
		// Already in a transaction
		tx = existingTx
		shouldCommit = false
	} else {
		// Create new transaction
		if sqlDB, ok := db.(*sql.DB); ok {
			var err error
			tx, err = sqlDB.BeginTx(ctx, &sql.TxOptions{
				Isolation: sql.LevelReadCommitted,
			})
			if err != nil {
				return "", fmt.Errorf("failed to begin transaction: %v", err)
			}
			shouldCommit = true
		} else {
			return "", fmt.Errorf("unsupported database type")
		}
	}

	// Handle transaction cleanup
	if shouldCommit {
		defer func() {
			if p := recover(); p != nil {
				tx.Rollback()
				panic(p) // re-throw panic after rollback
			}
		}()
	}

	// Extract metadata from sourceData
	assetUrl, _ := sourceData.Metadata["asset_url"].(string)
	textContent, _ := sourceData.Metadata["text_content"].(string)

	// Create processing metadata
	meta := models.JSONMap{
		"processed_at": time.Now(),
	}

	// Add timing information if present
	if startTime, ok := data["start_time"].(float64); ok {
		meta["start_time"] = startTime
	}
	if endTime, ok := data["end_time"].(float64); ok {
		meta["end_time"] = endTime
	}

	// Add processed segments if present
	if processedSegments, ok := data["processed_segments"]; ok {
		meta["processed_segments"] = processedSegments
	}

	if len(sourceData.AppliedServices) > 0 {
		meta["applied_services"] = sourceData.AppliedServices
	}

	// Create the artifact
	artifact := &models.TestimonialArtifact{
		ID:                 uuid.New(),
		WorkspaceID:        workspaceID,
		TestimonialID:      testimonialID,
		ProcessingType:     processingType,
		AssetURL:           nil,
		TextContent:        nil,
		ResultCategory:     "analysis", // Default category
		Data:               data,
		IsStreamed:         false,
		ProcessingMetadata: meta,
	}

	// Set optional fields if provided
	if assetUrl != "" {
		artifact.AssetURL = &assetUrl
	}
	if textContent != "" {
		artifact.TextContent = &textContent
	}

	// Determine result category based on processing type
	switch processingType {
	case "clipping", "enhancement", "story_mode_generation", "video_platform_optimization":
		artifact.ResultCategory = "content"
	case "sentiment_analysis", "highlight_extraction":
		artifact.ResultCategory = "analysis"
	case "text_polishing", "translation", "content_generation", "narration":
		artifact.ResultCategory = "content"
	default:
		artifact.ResultCategory = "analysis"
	}

	// Create the artifact
	if err := r.Create(ctx, artifact, tx); err != nil {
		if shouldCommit {
			tx.Rollback()
		}
		return "", fmt.Errorf("failed to create artifact: %v", err)
	}

	// Create source relationships based on source type
	var err error
	switch sourceData.Type {
	case models.TestimonialTypeSource:
		err = r.handleTestimonialSource(ctx, artifact.ID, sourceData.Data, tx)
	case models.ArtifactTypeSource:
		err = r.handleArtifactSource(ctx, artifact.ID, sourceData.Data, tx)
	case models.ClipTypeSource:
		err = r.handleClipSource(ctx, artifact.ID, sourceData.Data, tx)
	case models.ClipsTypeSource:
		err = r.handleClipsSource(ctx, artifact.ID, sourceData.Data, tx)
	case models.BestStoryMoments:
		err = r.CreateSourceFromTestimonials(ctx, testimonialsIds, tx)
	case models.NoTypeSource:
		// No source relationship needed
		err = nil
	default:
		err = fmt.Errorf("unsupported source type: %v", sourceData.Type)
	}

	if err != nil {
		if shouldCommit {
			tx.Rollback()
		}
		return "", fmt.Errorf("failed to create source relationship: %v", err)
	}

	// Commit transaction if we created it
	if shouldCommit {
		if err := tx.Commit(); err != nil {
			return "", fmt.Errorf("failed to commit transaction: %v", err)
		}
	}

	return artifact.ID.String(), nil
}

// Helper method to handle testimonial source
func (r *TestimonialArtifactRepository) handleTestimonialSource(
	ctx context.Context,
	artifactID uuid.UUID,
	data interface{},
	db DB,
) error {
	testimonialIDStr, ok := data.(string)
	if !ok {
		return fmt.Errorf("invalid testimonial ID format: expected string, got %T", data)
	}

	testimonialUUID, err := uuid.Parse(testimonialIDStr)
	if err != nil {
		return fmt.Errorf("failed to parse testimonial ID %s: %v", testimonialIDStr, err)
	}

	return r.CreateSourceFromTestimonial(ctx, artifactID, testimonialUUID, db)
}

// Helper method to handle artifact source
func (r *TestimonialArtifactRepository) handleArtifactSource(
	ctx context.Context,
	artifactID uuid.UUID,
	data interface{},
	db DB,
) error {
	artifactIDStr, ok := data.(string)
	if !ok {
		return fmt.Errorf("invalid artifact ID format: expected string, got %T", data)
	}

	sourceArtifactUUID, err := uuid.Parse(artifactIDStr)
	if err != nil {
		return fmt.Errorf("failed to parse artifact ID %s: %v", artifactIDStr, err)
	}

	return r.CreateSourceFromArtifact(ctx, artifactID, sourceArtifactUUID, db)
}

// Helper method to handle clip source
func (r *TestimonialArtifactRepository) handleClipSource(
	ctx context.Context,
	artifactID uuid.UUID,
	data interface{},
	db DB,
) error {
	var clipData models.ClipSource

	switch v := data.(type) {
	case models.ClipSource:
		clipData = v
	default:
		// Use JSON marshalling/unmarshalling for all other types
		// This is safer and handles validation automatically
		b, err := json.Marshal(v)
		if err != nil {
			return fmt.Errorf("failed to marshal clip data: %w", err)
		}
		if err := json.Unmarshal(b, &clipData); err != nil {
			return fmt.Errorf("failed to unmarshal clip data: %w", err)
		}
	}

	return r.CreateSourceFromClip(ctx, artifactID, clipData.ArtifactID, clipData.ClipID, db)
}

// Helper method to handle clips source (multiple clips)
func (r *TestimonialArtifactRepository) handleClipsSource(ctx context.Context, artifactID uuid.UUID, data any, db DB) error {

	clips, err := models.ExtractClipSourcesData(data)
	if err != nil {
		return fmt.Errorf("failed to handle clips sources: %w", err)
	}

	return r.CreateSourcesFromClips(ctx, artifactID, clips, db)
}

// CheckServiceAlreadyAppliedToSource checks if a service has been applied to a source
func (r *TestimonialArtifactRepository) CheckServiceAlreadyAppliedToSource(
	ctx context.Context,
	sourceID string,
	sourceType models.ArtifactSourceType,
	serviceName string,
	db DB,
) (bool, error) {
	var query string
	var args []interface{}

	switch sourceType {
	case models.TestimonialTypeSource:
		// Check if service was applied to any artifact created from this testimonial
		sourceUUID, err := uuid.Parse(sourceID)
		if err != nil {
			return false, fmt.Errorf("invalid testimonial ID: %v", err)
		}

		query = `
			WITH RECURSIVE testimonial_services AS (
				-- Direct artifacts from testimonial
				SELECT ta.processing_type
				FROM testimonial_artifacts ta
				JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
				WHERE asrc.source_testimonial_id = $1
				
				UNION ALL
				
				-- Artifacts created from other artifacts in the chain
				SELECT ta.processing_type
				FROM testimonial_artifacts ta
				JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
				WHERE asrc.source_artifact_id IN (
					SELECT ta2.id FROM testimonial_artifacts ta2
					JOIN artifact_sources asrc2 ON asrc2.artifact_id = ta2.id
					WHERE asrc2.source_testimonial_id = $1
					
					UNION ALL
					
					SELECT ta3.id FROM testimonial_artifacts ta3
					JOIN artifact_sources asrc3 ON asrc3.artifact_id = ta3.id
					WHERE asrc3.source_artifact_id IN (
						SELECT ta4.id FROM testimonial_artifacts ta4
						JOIN artifact_sources asrc4 ON asrc4.artifact_id = ta4.id
						WHERE asrc4.source_testimonial_id = $1
					)
				)
			)
			SELECT EXISTS(
				SELECT 1 FROM testimonial_services WHERE processing_type = $2
			)
		`
		args = []interface{}{sourceUUID, serviceName}

	case models.ArtifactTypeSource:
		// Check if service is in the lineage of this artifact or any of its derivatives
		sourceUUID, err := uuid.Parse(sourceID)
		if err != nil {
			return false, fmt.Errorf("invalid artifact ID: %v", err)
		}

		query = `
			WITH RECURSIVE artifact_lineage AS (
				-- Start with the artifact itself
				SELECT ta.processing_type, asrc.source_artifact_id
				FROM testimonial_artifacts ta
				LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
				WHERE ta.id = $1
				
				UNION ALL
				
				-- Follow the chain back to find all services in lineage
				SELECT ta.processing_type, asrc.source_artifact_id
				FROM testimonial_artifacts ta
				LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
				JOIN artifact_lineage al ON al.source_artifact_id = ta.id
			)
			SELECT EXISTS(
				SELECT 1 FROM artifact_lineage WHERE processing_type = $2
			)
		`
		args = []interface{}{sourceUUID, serviceName}

	case models.ClipTypeSource:
		// For clips, parse the "artifactID:clipID" format and check the artifact lineage
		parts := strings.Split(sourceID, ":")
		if len(parts) != 2 {
			return false, fmt.Errorf("invalid clip reference format, expected artifactID:clipID")
		}

		sourceUUID, err := uuid.Parse(parts[0])
		if err != nil {
			return false, fmt.Errorf("invalid artifact ID in clip reference: %v", err)
		}

		// Use same logic as artifact, since clips inherit artifact lineage
		query = `
			WITH RECURSIVE artifact_lineage AS (
				SELECT ta.processing_type, asrc.source_artifact_id
				FROM testimonial_artifacts ta
				LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
				WHERE ta.id = $1
				
				UNION ALL
				
				SELECT ta.processing_type, asrc.source_artifact_id
				FROM testimonial_artifacts ta
				LEFT JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
				JOIN artifact_lineage al ON al.source_artifact_id = ta.id
			)
			SELECT EXISTS(
				SELECT 1 FROM artifact_lineage WHERE processing_type = $2
			)
		`
		args = []interface{}{sourceUUID, serviceName}

	default:
		return false, fmt.Errorf("unsupported source type: %v", sourceType)
	}

	var exists bool
	err := db.QueryRowContext(ctx, query, args...).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check service application: %w", err)
	}

	return exists, nil
}

// GetServiceLineageForClip gets all services applied specifically to a clip and its derivatives
func (r *TestimonialArtifactRepository) GetServiceLineageForClip(
	ctx context.Context,
	artifactID, clipID uuid.UUID,
	db DB,
) ([]string, error) {
	// Query to find all artifacts created from this specific clip
	// and recursively follow the chain to find all derivative processing
	query := `
		WITH RECURSIVE clip_lineage AS (
			-- Base case: Find direct artifacts created from this specific clip
			SELECT ta.id, ta.processing_type, ta.created_at,
				   asrc.source_artifact_id, asrc.source_clip_id,
				   ARRAY[ta.processing_type] as service_path,
				   1 as depth
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE asrc.source_artifact_id = $1 
			  AND asrc.source_clip_id = $2
			  AND asrc.source_type = 'clip'
			
			UNION ALL
			
			-- Recursive case: Find artifacts created from derivatives of this clip
			SELECT ta.id, ta.processing_type, ta.created_at,
				   asrc.source_artifact_id, asrc.source_clip_id,
				   cl.service_path || ta.processing_type,
				   cl.depth + 1
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			JOIN clip_lineage cl ON cl.id = asrc.source_artifact_id
			WHERE cl.depth < 10  -- Prevent infinite recursion
		)
		SELECT DISTINCT unnest(service_path) as processing_type
		FROM clip_lineage
		ORDER BY processing_type
	`

	rows, err := db.QueryContext(ctx, query, artifactID, clipID)
	if err != nil {
		// Fallback to simpler query if CTE fails
		fallbackQuery := `
			SELECT DISTINCT ta.processing_type
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE asrc.source_artifact_id = $1 
			  AND asrc.source_clip_id = $2
			  AND asrc.source_type = 'clip'
			ORDER BY ta.processing_type
		`

		rows, err = db.QueryContext(ctx, fallbackQuery, artifactID, clipID)
		if err != nil {
			return nil, fmt.Errorf("failed to get clip service lineage: %w", err)
		}
	}
	defer rows.Close()

	var services []string
	for rows.Next() {
		var service string
		if err := rows.Scan(&service); err != nil {
			return nil, fmt.Errorf("failed to scan service: %w", err)
		}
		services = append(services, service)
	}

	return services, rows.Err()
}

// GetClipDerivatives gets all artifacts that were created from a specific clip
func (r *TestimonialArtifactRepository) GetClipDerivatives(
	ctx context.Context,
	artifactID, clipID uuid.UUID,
	db DB,
) ([]models.TestimonialArtifact, error) {
	query := `
		WITH RECURSIVE clip_derivatives AS (
			-- Base: Direct derivatives from this clip
			SELECT ta.id, ta.testimonial_id, ta.workspace_id, ta.processing_type, 
				   ta.result_category, ta.text_content, ta.data, ta.asset_url, 
				   ta.content_type, ta.platform, ta.format, ta.is_user_saved, 
				   ta.is_streamed, ta.processing_metadata, ta.created_at, ta.updated_at,
				   1 as depth
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE asrc.source_artifact_id = $1 
			  AND asrc.source_clip_id = $2
			  AND asrc.source_type = 'clip'
			
			UNION ALL
			
			-- Recursive: Derivatives of derivatives
			SELECT ta.id, ta.testimonial_id, ta.workspace_id, ta.processing_type, 
				   ta.result_category, ta.text_content, ta.data, ta.asset_url, 
				   ta.content_type, ta.platform, ta.format, ta.is_user_saved, 
				   ta.is_streamed, ta.processing_metadata, ta.created_at, ta.updated_at,
				   cd.depth + 1
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			JOIN clip_derivatives cd ON cd.id = asrc.source_artifact_id
			WHERE cd.depth < 10
		)
		SELECT id, testimonial_id, workspace_id, processing_type, result_category,
			   text_content, data, asset_url, content_type, platform, format,
			   is_user_saved, is_streamed, processing_metadata, created_at, updated_at
		FROM clip_derivatives
		ORDER BY depth, created_at
	`

	rows, err := db.QueryContext(ctx, query, artifactID, clipID)
	if err != nil {
		// Simplified fallback
		fallbackQuery := `
			SELECT ta.id, ta.testimonial_id, ta.workspace_id, ta.processing_type, 
				   ta.result_category, ta.text_content, ta.data, ta.asset_url, 
				   ta.content_type, ta.platform, ta.format, ta.is_user_saved, 
				   ta.is_streamed, ta.processing_metadata, ta.created_at, ta.updated_at
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE asrc.source_artifact_id = $1 
			  AND asrc.source_clip_id = $2
			  AND asrc.source_type = 'clip'
			ORDER BY ta.created_at
		`

		rows, err = db.QueryContext(ctx, fallbackQuery, artifactID, clipID)
		if err != nil {
			return nil, fmt.Errorf("failed to get clip derivatives: %w", err)
		}
	}
	defer rows.Close()

	var artifacts []models.TestimonialArtifact
	for rows.Next() {
		var artifact models.TestimonialArtifact
		err := rows.Scan(
			&artifact.ID, &artifact.TestimonialID, &artifact.WorkspaceID,
			&artifact.ProcessingType, &artifact.ResultCategory, &artifact.TextContent,
			&artifact.Data, &artifact.AssetURL, &artifact.ContentType,
			&artifact.Platform, &artifact.Format, &artifact.IsUserSaved,
			&artifact.IsStreamed, &artifact.ProcessingMetadata,
			&artifact.CreatedAt, &artifact.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan clip derivative: %w", err)
		}
		artifacts = append(artifacts, artifact)
	}

	return artifacts, rows.Err()
}

// CheckServiceAppliedToClip checks if a service has been applied to a specific clip
func (r *TestimonialArtifactRepository) CheckServiceAppliedToClip(
	ctx context.Context,
	artifactID, clipID uuid.UUID,
	serviceName string,
	db DB,
) (bool, error) {
	query := `
		WITH RECURSIVE clip_lineage AS (
			-- Direct processing of this clip
			SELECT ta.processing_type
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE asrc.source_artifact_id = $1 
			  AND asrc.source_clip_id = $2
			  AND asrc.source_type = 'clip'
			
			UNION ALL
			
			-- Processing of derivatives
			SELECT ta.processing_type
			FROM testimonial_artifacts ta
			JOIN artifact_sources asrc ON asrc.artifact_id = ta.id
			WHERE asrc.source_artifact_id IN (
				SELECT ta2.id FROM testimonial_artifacts ta2
				JOIN artifact_sources asrc2 ON asrc2.artifact_id = ta2.id
				WHERE asrc2.source_artifact_id = $1 
				  AND asrc2.source_clip_id = $2
				  AND asrc2.source_type = 'clip'
			)
		)
		SELECT EXISTS(
			SELECT 1 FROM clip_lineage WHERE processing_type = $3
		)
	`

	var exists bool
	err := db.QueryRowContext(ctx, query, artifactID, clipID, serviceName).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check service application to clip: %w", err)
	}

	return exists, nil
}

func (r *TestimonialArtifactRepository) UpdateProcessingMetadata(ctx context.Context, artifactID uuid.UUID, updateData map[string]any, db DB) error {
	// Get current metadata
	var currentMetadataJSON []byte
	selectQuery := `SELECT COALESCE(processing_metadata, '{}'::jsonb) FROM testimonial_artifacts WHERE id = $1`
	err := db.QueryRowContext(ctx, selectQuery, artifactID).Scan(&currentMetadataJSON)
	if err != nil {
		return fmt.Errorf("failed to get current processing metadata: %w", err)
	}

	var currentMetadata map[string]any
	if err := json.Unmarshal(currentMetadataJSON, &currentMetadata); err != nil {
		return fmt.Errorf("failed to unmarshal current processing metadata: %w", err)
	}

	mergedMetadata := r.mergeMetadata(currentMetadata, updateData)

	// Validate and marshal
	mergedJSON, err := json.Marshal(mergedMetadata)
	if err != nil {
		return fmt.Errorf("failed to marshal merged metadata: %w", err)
	}

	// Update using PostgreSQL
	updateQuery := `
		UPDATE testimonial_artifacts 
		SET processing_metadata = $2::jsonb, updated_at = NOW() 
		WHERE id = $1
	`

	result, err := db.ExecContext(ctx, updateQuery, artifactID, string(mergedJSON))
	if err != nil {
		return fmt.Errorf("failed to update processing metadata: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("artifact not found: %s", artifactID)
	}

	return nil
}

func (r *TestimonialArtifactRepository) mergeMetadata(current, updates map[string]any) map[string]any {
	result := make(map[string]any)

	// Copy all existing data
	for k, v := range current {
		result[k] = v
	}

	// Apply updates with smart handling for arrays and objects
	for k, newValue := range updates {
		existingValue, exists := result[k]

		if !exists {
			// New field - just add it
			result[k] = newValue
			continue
		}

		// Special handling for arrays (like applied_services, processed_segments)
		if existingArray, ok := existingValue.([]interface{}); ok {
			if newArray, ok := newValue.([]interface{}); ok {
				// Append arrays together
				result[k] = append(existingArray, newArray...)
				continue
			}
		}

		// For everything else, replace the value
		result[k] = newValue
	}

	return result
}
