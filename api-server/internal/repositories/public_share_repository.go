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

type PublicShareRepository struct {
	logger          *zap.Logger
	testimonialRepo TestimonialRepository
	artifactRepo    TestimonialArtifactRepository
	*BaseRepository[models.PublicShare]
}

func NewPublicShareRepository(
	redis *redis.Client,
	logger *zap.Logger,
	testimonialRepo TestimonialRepository,
	artifactRepo TestimonialArtifactRepository,
) PublicShareRepository {
	return PublicShareRepository{
		logger:          logger,
		testimonialRepo: testimonialRepo,
		artifactRepo:    artifactRepo,
		BaseRepository:  NewBaseRepository[models.PublicShare](redis, "public_shares"),
	}
}

// Create creates a new public share
func (r PublicShareRepository) Create(ctx context.Context, share *models.PublicShare, db DB) error {
	query := `
		INSERT INTO public_shares (
			id, workspace_id, share_type, testimonial_id, artifact_id, description,
			is_public, is_active, password_protected, password_hash,
			expires_at, custom_branding, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		)
	`

	if share.ID == uuid.Nil {
		share.ID = uuid.New()
	}

	now := time.Now()
	if share.CreatedAt.IsZero() {
		share.CreatedAt = now
	}
	share.UpdatedAt = now

	var customBranding []byte
	if share.CustomBranding != nil {
		jsonData, err := json.Marshal(share.CustomBranding)
		if err != nil {
			return fmt.Errorf("failed to marshal custom branding: %w", err)
		}
		customBranding = jsonData
	} else {
		customBranding = []byte("{}")
	}

	_, err := db.ExecContext(ctx, query,
		share.ID,
		share.WorkspaceID,
		share.ShareType,
		share.TestimonialID,
		share.ArtifactID,
		share.Description,
		share.IsPublic,
		share.IsActive,
		share.PasswordProtected,
		share.PasswordHash,
		share.ExpiresAt,
		string(customBranding),
		share.CreatedAt,
		share.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create public share: %w", err)
	}

	// Initialize metrics row
	if err := r.initializeMetrics(ctx, share.ID, db); err != nil {
		r.logger.Warn("Failed to initialize metrics for share",
			zap.Error(err),
			zap.String("share_id", share.ID.String()))
	}

	// Invalidate caches
	r.invalidateShareCaches(ctx, share.WorkspaceID, &share.ID)

	return nil
}

// GetByID gets a public share by ID
func (r PublicShareRepository) GetByID(ctx context.Context, id uuid.UUID, db DB) (*models.PublicShare, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("share:%s", id.String())
	cached, err := r.Get(ctx, cacheKey, r.redis)
	if err == nil && cached != nil {
		r.logger.Debug("Cache hit for share", zap.String("id", id.String()))
		return cached, nil
	}

	query := `
		SELECT id, workspace_id, share_type, testimonial_id, artifact_id, description,
			   is_public, is_active, password_protected, password_hash,
			   expires_at, custom_branding, created_at, updated_at
		FROM public_shares
		WHERE id = $1
	`

	var share models.PublicShare
	err = db.QueryRowContext(ctx, query, id).Scan(
		&share.ID,
		&share.WorkspaceID,
		&share.ShareType,
		&share.TestimonialID,
		&share.ArtifactID,
		&share.Description,
		&share.IsPublic,
		&share.IsActive,
		&share.PasswordProtected,
		&share.PasswordHash,
		&share.ExpiresAt,
		&share.CustomBranding,
		&share.CreatedAt,
		&share.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("share not found")
		}
		return nil, fmt.Errorf("failed to get share: %w", err)
	}

	// Cache for 5 minutes
	if err := r.Set(ctx, cacheKey, &share, 5*time.Minute, r.redis); err != nil {
		r.logger.Warn("Failed to cache share", zap.Error(err), zap.String("id", id.String()))
	}

	return &share, nil
}

// GetWithMetrics gets a share with its metrics
func (r PublicShareRepository) GetWithMetrics(ctx context.Context, id uuid.UUID, db DB) (*models.PublicShare, error) {
	query := `
		SELECT
			ps.id, ps.workspace_id, ps.share_type, ps.testimonial_id, ps.artifact_id, ps.description,
			ps.is_public, ps.is_active, ps.password_protected, ps.password_hash,
			ps.expires_at, ps.custom_branding, ps.created_at, ps.updated_at,
			m.id, m.public_share_id, m.view_count, m.unique_visitor_count,
			m.play_count, m.download_count, m.copy_link_count,
			m.linkedin_share_count, m.twitter_share_count, m.facebook_share_count,
			m.whatsapp_share_count, m.email_share_count, m.created_at, m.updated_at
		FROM public_shares ps
		LEFT JOIN public_share_metrics m ON m.public_share_id = ps.id
		WHERE ps.id = $1
	`

	var share models.PublicShare
	var metricsID sql.NullString
	var metricsPublicShareID sql.NullString
	var metricsViewCount sql.NullInt64
	var metricsUniqueVisitorCount sql.NullInt64
	var metricsPlayCount sql.NullInt64
	var metricsDownloadCount sql.NullInt64
	var metricsCopyLinkCount sql.NullInt64
	var metricsLinkedInShareCount sql.NullInt64
	var metricsTwitterShareCount sql.NullInt64
	var metricsFacebookShareCount sql.NullInt64
	var metricsWhatsAppShareCount sql.NullInt64
	var metricsEmailShareCount sql.NullInt64
	var metricsCreatedAt sql.NullTime
	var metricsUpdatedAt sql.NullTime

	err := db.QueryRowContext(ctx, query, id).Scan(
		&share.ID,
		&share.WorkspaceID,
		&share.ShareType,
		&share.TestimonialID,
		&share.ArtifactID,
		&share.Description,
		&share.IsPublic,
		&share.IsActive,
		&share.PasswordProtected,
		&share.PasswordHash,
		&share.ExpiresAt,
		&share.CustomBranding,
		&share.CreatedAt,
		&share.UpdatedAt,
		&metricsID,
		&metricsPublicShareID,
		&metricsViewCount,
		&metricsUniqueVisitorCount,
		&metricsPlayCount,
		&metricsDownloadCount,
		&metricsCopyLinkCount,
		&metricsLinkedInShareCount,
		&metricsTwitterShareCount,
		&metricsFacebookShareCount,
		&metricsWhatsAppShareCount,
		&metricsEmailShareCount,
		&metricsCreatedAt,
		&metricsUpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("share not found")
		}
		return nil, fmt.Errorf("failed to get share with metrics: %w", err)
	}

	// Only populate metrics if the LEFT JOIN returned data
	if metricsID.Valid {
		var metrics models.PublicShareMetrics
		metrics.ID = uuid.MustParse(metricsID.String)

		if metricsPublicShareID.Valid {
			shareID := uuid.MustParse(metricsPublicShareID.String)
			metrics.PublicShareID = shareID
		}

		if metricsViewCount.Valid {
			metrics.ViewCount = int(metricsViewCount.Int64)
		}
		if metricsUniqueVisitorCount.Valid {
			metrics.UniqueVisitorCount = int(metricsUniqueVisitorCount.Int64)
		}
		if metricsPlayCount.Valid {
			metrics.PlayCount = int(metricsPlayCount.Int64)
		}
		if metricsDownloadCount.Valid {
			metrics.DownloadCount = int(metricsDownloadCount.Int64)
		}
		if metricsCopyLinkCount.Valid {
			metrics.CopyLinkCount = int(metricsCopyLinkCount.Int64)
		}
		if metricsLinkedInShareCount.Valid {
			metrics.LinkedInShareCount = int(metricsLinkedInShareCount.Int64)
		}
		if metricsTwitterShareCount.Valid {
			metrics.TwitterShareCount = int(metricsTwitterShareCount.Int64)
		}
		if metricsFacebookShareCount.Valid {
			metrics.FacebookShareCount = int(metricsFacebookShareCount.Int64)
		}
		if metricsWhatsAppShareCount.Valid {
			metrics.WhatsAppShareCount = int(metricsWhatsAppShareCount.Int64)
		}
		if metricsEmailShareCount.Valid {
			metrics.EmailShareCount = int(metricsEmailShareCount.Int64)
		}
		if metricsCreatedAt.Valid {
			metrics.CreatedAt = metricsCreatedAt.Time
		}
		if metricsUpdatedAt.Valid {
			metrics.UpdatedAt = metricsUpdatedAt.Time
		}

		share.Metrics = &metrics
	}

	return &share, nil
}

// GetWithContent gets a share with its content (testimonial or artifact)
func (r PublicShareRepository) GetWithContent(ctx context.Context, id uuid.UUID, db DB) (*models.PublicShareWithContent, error) {
	share, err := r.GetWithMetrics(ctx, id, db)
	if err != nil {
		return nil, err
	}

	result := &models.PublicShareWithContent{
		PublicShare: *share,
	}

	// Load testimonial if testimonial share
	if share.ShareType == "testimonial" && share.TestimonialID != nil {
		testimonial, err := r.testimonialRepo.FetchByID(ctx, *share.TestimonialID, db)
		if err != nil {
			r.logger.Warn("Failed to load testimonial for share",
				zap.Error(err),
				zap.String("testimonial_id", share.TestimonialID.String()))
		} else {
			result.Testimonial = testimonial
		}
	}

	// Load artifact if artifact share
	if share.ShareType == "artifact" && share.ArtifactID != nil {
		artifact, err := r.artifactRepo.GetByID(ctx, *share.ArtifactID, db)
		if err != nil {
			r.logger.Warn("Failed to load artifact for share",
				zap.Error(err),
				zap.String("artifact_id", share.ArtifactID.String()))
		} else {
			result.Artifact = artifact
		}
	}

	return result, nil
}

// GetByWorkspace gets all shares for a workspace
func (r PublicShareRepository) GetByWorkspace(ctx context.Context, workspaceID uuid.UUID, db DB) ([]models.PublicShare, error) {
	query := `
		SELECT id, workspace_id, share_type, testimonial_id, artifact_id, description,
			   is_public, is_active, password_protected, password_hash,
			   expires_at, custom_branding, created_at, updated_at
		FROM public_shares
		WHERE workspace_id = $1
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shares by workspace: %w", err)
	}
	defer rows.Close()

	var shares []models.PublicShare
	for rows.Next() {
		var share models.PublicShare
		err := rows.Scan(
			&share.ID,
			&share.WorkspaceID,
			&share.ShareType,
			&share.TestimonialID,
			&share.ArtifactID,
			&share.Description,
			&share.IsPublic,
			&share.IsActive,
			&share.PasswordProtected,
			&share.PasswordHash,
			&share.ExpiresAt,
			&share.CustomBranding,
			&share.CreatedAt,
			&share.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan share: %w", err)
		}
		shares = append(shares, share)
	}

	return shares, rows.Err()
}

// GetByTestimonial gets all shares for a testimonial
func (r PublicShareRepository) GetByTestimonial(ctx context.Context, testimonialID uuid.UUID, db DB) ([]models.PublicShare, error) {
	query := `
		SELECT id, workspace_id, share_type, testimonial_id, artifact_id, description,
			   is_public, is_active, password_protected, password_hash,
			   expires_at, custom_branding, created_at, updated_at
		FROM public_shares
		WHERE testimonial_id = $1 AND share_type = 'testimonial'
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shares by testimonial: %w", err)
	}
	defer rows.Close()

	var shares []models.PublicShare
	for rows.Next() {
		var share models.PublicShare
		err := rows.Scan(
			&share.ID,
			&share.WorkspaceID,
			&share.ShareType,
			&share.TestimonialID,
			&share.ArtifactID,
			&share.Description,
			&share.IsPublic,
			&share.IsActive,
			&share.PasswordProtected,
			&share.PasswordHash,
			&share.ExpiresAt,
			&share.CustomBranding,
			&share.CreatedAt,
			&share.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan share: %w", err)
		}
		shares = append(shares, share)
	}

	return shares, rows.Err()
}

// GetByArtifact gets all shares for an artifact
func (r PublicShareRepository) GetByArtifact(ctx context.Context, artifactID uuid.UUID, db DB) ([]models.PublicShare, error) {
	query := `
		SELECT id, workspace_id, share_type, testimonial_id, artifact_id, description,
			   is_public, is_active, password_protected, password_hash,
			   expires_at, custom_branding, created_at, updated_at
		FROM public_shares
		WHERE artifact_id = $1 AND share_type = 'artifact'
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, artifactID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shares by artifact: %w", err)
	}
	defer rows.Close()

	var shares []models.PublicShare
	for rows.Next() {
		var share models.PublicShare
		err := rows.Scan(
			&share.ID,
			&share.WorkspaceID,
			&share.ShareType,
			&share.TestimonialID,
			&share.ArtifactID,
			&share.Description,
			&share.IsPublic,
			&share.IsActive,
			&share.PasswordProtected,
			&share.PasswordHash,
			&share.ExpiresAt,
			&share.CustomBranding,
			&share.CreatedAt,
			&share.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan share: %w", err)
		}
		shares = append(shares, share)
	}

	return shares, rows.Err()
}

// Update updates a public share
func (r PublicShareRepository) Update(ctx context.Context, share *models.PublicShare, db DB) error {
	query := `
		UPDATE public_shares SET
			description = $2, is_public = $3, is_active = $4, password_protected = $5,
			password_hash = $6, expires_at = $7, custom_branding = $8,
			updated_at = $9
		WHERE id = $1
	`

	share.UpdatedAt = time.Now()

	// Marshal custom branding to ensure proper JSONB handling
	var customBranding []byte
	if len(share.CustomBranding) > 0 {
		jsonData, err := json.Marshal(share.CustomBranding)
		if err != nil {
			return fmt.Errorf("failed to marshal custom branding: %w", err)
		}
		customBranding = jsonData
	} else {
		customBranding = []byte("{}")
	}

	result, err := db.ExecContext(ctx, query,
		share.ID,
		share.Description,
		share.IsPublic,
		share.IsActive,
		share.PasswordProtected,
		share.PasswordHash,
		share.ExpiresAt,
		string(customBranding),
		share.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update share: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("share not found")
	}

	// Invalidate caches
	r.invalidateShareCaches(ctx, share.WorkspaceID, &share.ID)

	return nil
}

// Delete deletes a public share
func (r PublicShareRepository) Delete(ctx context.Context, id uuid.UUID, db DB) error {
	// Get share info for cache invalidation
	var workspaceID uuid.UUID
	selectQuery := `SELECT workspace_id FROM public_shares WHERE id = $1`
	if err := db.QueryRowContext(ctx, selectQuery, id).Scan(&workspaceID); err != nil {
		if err != sql.ErrNoRows {
			return fmt.Errorf("failed to get share info: %w", err)
		}
	}

	// Delete share (metrics and events cascade)
	_, err := db.ExecContext(ctx, `DELETE FROM public_shares WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete share: %w", err)
	}

	// Invalidate caches
	r.invalidateShareCaches(ctx, workspaceID, &id)

	return nil
}

// TrackEvent tracks a share event and updates metrics atomically
func (r PublicShareRepository) TrackEvent(ctx context.Context, event *models.PublicShareEvent, db DB) error {
	// Start transaction if db is *sql.DB
	var tx *sql.Tx
	var shouldCommit bool

	if existingTx, ok := db.(*sql.Tx); ok {
		tx = existingTx
		shouldCommit = false
	} else if sqlDB, ok := db.(*sql.DB); ok {
		var err error
		tx, err = sqlDB.BeginTx(ctx, &sql.TxOptions{
			Isolation: sql.LevelReadCommitted,
		})
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}
		shouldCommit = true
		defer func() {
			if p := recover(); p != nil {
				tx.Rollback()
				panic(p)
			}
		}()
	} else {
		return fmt.Errorf("unsupported database type")
	}

	// Generate event ID if not set
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}

	now := time.Now()
	if event.CreatedAt.IsZero() {
		event.CreatedAt = now
	}

	// Deduplication: Check if same event from same visitor within last 5 minutes
	if event.VisitorID != nil {
		dedupeQuery := `
			SELECT EXISTS(
				SELECT 1 FROM public_share_events
				WHERE public_share_id = $1
				  AND event_type = $2
				  AND visitor_id = $3
				  AND created_at > NOW() - INTERVAL '5 minutes'
			)
		`
		var exists bool
		err := tx.QueryRowContext(ctx, dedupeQuery,
			event.PublicShareID,
			event.EventType,
			event.VisitorID,
		).Scan(&exists)

		if err != nil {
			r.logger.Warn("Failed to check for duplicate event",
				zap.Error(err),
				zap.String("share_id", event.PublicShareID.String()),
				zap.String("event_type", event.EventType))
		} else if exists {
			// Duplicate event detected - skip insertion
			r.logger.Debug("Skipping duplicate event",
				zap.String("share_id", event.PublicShareID.String()),
				zap.String("event_type", event.EventType),
				zap.Any("visitor_id", event.VisitorID))

			// Commit or no-op depending on who started the transaction
			if shouldCommit {
				if err := tx.Commit(); err != nil {
					return fmt.Errorf("failed to commit transaction: %w", err)
				}
			}
			return nil // Successfully ignored duplicate
		}
	}

	// Insert event
	insertQuery := `
		INSERT INTO public_share_events (
			id, public_share_id, event_type, visitor_id, ip_address,
			user_agent, referrer, country_code, city, metadata, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		)
	`

	_, err := tx.ExecContext(ctx, insertQuery,
		event.ID,
		event.PublicShareID,
		event.EventType,
		event.VisitorID,
		event.IPAddress,
		event.UserAgent,
		event.Referrer,
		event.CountryCode,
		event.City,
		event.Metadata,
		event.CreatedAt,
	)

	if err != nil {
		if shouldCommit {
			if rbErr := tx.Rollback(); rbErr != nil {
				r.logger.Warn("Failed to rollback transaction after insert error",
					zap.Error(rbErr),
					zap.String("original_error", err.Error()))
			}
		}
		return fmt.Errorf("failed to insert event: %w", err)
	}

	// Update metrics using database function
	_, err = tx.ExecContext(ctx,
		`SELECT increment_public_share_metric($1, $2, $3)`,
		event.PublicShareID,
		event.EventType,
		event.VisitorID,
	)

	if err != nil {
		r.logger.Error("Failed to execute increment_public_share_metric",
			zap.Error(err),
			zap.String("share_id", event.PublicShareID.String()),
			zap.String("event_type", event.EventType),
			zap.Any("visitor_id", event.VisitorID))

		if shouldCommit {
			if rbErr := tx.Rollback(); rbErr != nil {
				r.logger.Warn("Failed to rollback transaction after metrics error",
					zap.Error(rbErr),
					zap.String("original_error", err.Error()))
			}
		}
		return fmt.Errorf("failed to update metrics: %w", err)
	}

	// Commit transaction if we started it
	if shouldCommit {
		if err := tx.Commit(); err != nil {
			// If commit fails, try to rollback (though it may already be rolled back)
			if rbErr := tx.Rollback(); rbErr != nil {
				r.logger.Warn("Failed to rollback after commit failure",
					zap.Error(rbErr),
					zap.String("commit_error", err.Error()))
			}
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	// Invalidate metrics cache
	cacheKey := fmt.Sprintf("share:%s", event.PublicShareID.String())
	r.DeleteCache(ctx, cacheKey, r.redis)

	return nil
}

// GetMetrics gets metrics for a share
func (r PublicShareRepository) GetMetrics(ctx context.Context, shareID uuid.UUID, db DB) (*models.PublicShareMetrics, error) {
	query := `
		SELECT id, public_share_id, view_count, unique_visitor_count,
			   play_count, download_count, copy_link_count,
			   linkedin_share_count, twitter_share_count, facebook_share_count,
			   whatsapp_share_count, email_share_count, created_at, updated_at
		FROM public_share_metrics
		WHERE public_share_id = $1
	`

	var metrics models.PublicShareMetrics
	err := db.QueryRowContext(ctx, query, shareID).Scan(
		&metrics.ID,
		&metrics.PublicShareID,
		&metrics.ViewCount,
		&metrics.UniqueVisitorCount,
		&metrics.PlayCount,
		&metrics.DownloadCount,
		&metrics.CopyLinkCount,
		&metrics.LinkedInShareCount,
		&metrics.TwitterShareCount,
		&metrics.FacebookShareCount,
		&metrics.WhatsAppShareCount,
		&metrics.EmailShareCount,
		&metrics.CreatedAt,
		&metrics.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("metrics not found")
		}
		return nil, fmt.Errorf("failed to get metrics: %w", err)
	}

	return &metrics, nil
}

// GetEvents gets events for a share with optional filtering
func (r PublicShareRepository) GetEvents(ctx context.Context, shareID uuid.UUID, eventType string, limit int, db DB) ([]models.PublicShareEvent, error) {
	query := `
		SELECT id, public_share_id, event_type, visitor_id, ip_address,
			   user_agent, referrer, country_code, city, metadata, created_at
		FROM public_share_events
		WHERE public_share_id = $1
	`

	args := []interface{}{shareID}

	if eventType != "" {
		query += ` AND event_type = $2`
		args = append(args, eventType)
	}

	query += ` ORDER BY created_at DESC`

	if limit > 0 {
		query += fmt.Sprintf(` LIMIT %d`, limit)
	}

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get events: %w", err)
	}
	defer rows.Close()

	var events []models.PublicShareEvent
	for rows.Next() {
		var event models.PublicShareEvent
		err := rows.Scan(
			&event.ID,
			&event.PublicShareID,
			&event.EventType,
			&event.VisitorID,
			&event.IPAddress,
			&event.UserAgent,
			&event.Referrer,
			&event.CountryCode,
			&event.City,
			&event.Metadata,
			&event.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, event)
	}

	return events, rows.Err()
}

// Helper: Initialize metrics row for a new share
func (r PublicShareRepository) initializeMetrics(ctx context.Context, shareID uuid.UUID, db DB) error {
	query := `
		INSERT INTO public_share_metrics (
			id, public_share_id, view_count, unique_visitor_count,
			play_count, download_count, copy_link_count,
			linkedin_share_count, twitter_share_count, facebook_share_count,
			whatsapp_share_count, email_share_count
		) VALUES (
			$1, $2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
		)
		ON CONFLICT (public_share_id) DO NOTHING
	`

	_, err := db.ExecContext(ctx, query, uuid.New(), shareID)
	return err
}

// Helper: Invalidate share caches
func (r PublicShareRepository) invalidateShareCaches(ctx context.Context, workspaceID uuid.UUID, shareID *uuid.UUID) {
	if shareID != nil {
		cacheKey := fmt.Sprintf("share:%s", shareID.String())
		if err := r.DeleteCache(ctx, cacheKey, r.redis); err != nil {
			r.logger.Warn("Failed to invalidate share cache",
				zap.Error(err),
				zap.String("cache_key", cacheKey))
		}
	}

	// Invalidate workspace shares pattern
	pattern := fmt.Sprintf("shares:workspace:%s:*", workspaceID.String())
	if err := r.DeleteCachePattern(ctx, pattern, r.redis); err != nil {
		r.logger.Warn("Failed to invalidate workspace shares cache pattern",
			zap.Error(err),
			zap.String("pattern", pattern))
	}
}
