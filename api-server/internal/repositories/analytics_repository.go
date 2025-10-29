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
)

// AnalyticsRepository defines the interface for analytics operations
type AnalyticsRepository interface {
	// Conversation Sessions
	CreateConversationSession(ctx context.Context, session *models.ConversationSession, db DB) error
	GetConversationSession(ctx context.Context, sessionID uuid.UUID, db DB) (*models.ConversationSession, error)
	GetActiveSessionsForUser(ctx context.Context, workspaceID, userID uuid.UUID, limit int, db DB) ([]*models.ConversationSession, error)
	UpdateConversationSession(ctx context.Context, session *models.ConversationSession, db DB) error
	DeactivateConversationSession(ctx context.Context, sessionID uuid.UUID, db DB) error

	// Saved Queries
	CreateSavedQuery(ctx context.Context, query *models.SavedQuery, db DB) error
	GetSavedQuery(ctx context.Context, queryID uuid.UUID, db DB) (*models.SavedQuery, error)
	ListSavedQueries(ctx context.Context, workspaceID uuid.UUID, db DB) ([]*models.SavedQuery, error)
	UpdateSavedQuery(ctx context.Context, query *models.SavedQuery, db DB) error
	DeleteSavedQuery(ctx context.Context, queryID uuid.UUID, db DB) error
	IncrementQueryUseCount(ctx context.Context, queryID uuid.UUID, db DB) error

	// Segment Definitions
	CreateSegmentDefinition(ctx context.Context, segment *models.SegmentDefinition, db DB) error
	GetSegmentDefinition(ctx context.Context, segmentID uuid.UUID, db DB) (*models.SegmentDefinition, error)
	ListSegmentDefinitions(ctx context.Context, workspaceID uuid.UUID, includeInactive bool, db DB) ([]*models.SegmentDefinition, error)
	UpdateSegmentDefinition(ctx context.Context, segment *models.SegmentDefinition, db DB) error
	DeleteSegmentDefinition(ctx context.Context, segmentID uuid.UUID, db DB) error

	// Analytics Cache
	GetCachedAnalytics(ctx context.Context, workspaceID uuid.UUID, cacheKey string, filters models.JSONB, db DB) (*models.AnalyticsCache, error)
	SetCachedAnalytics(ctx context.Context, cache *models.AnalyticsCache, db DB) error
	ClearExpiredCache(ctx context.Context, db DB) (int, error)

	// Export Logs
	CreateExportLog(ctx context.Context, log *models.ExportLog, db DB) error
	GetExportLog(ctx context.Context, exportID uuid.UUID, db DB) (*models.ExportLog, error)
	ListExportLogs(ctx context.Context, workspaceID uuid.UUID, limit int, db DB) ([]*models.ExportLog, error)
	UpdateExportLog(ctx context.Context, log *models.ExportLog, db DB) error
}

type analyticsRepository struct {
	*BaseRepository[models.ConversationSession]
}

// NewAnalyticsRepository creates a new analytics repository
func NewAnalyticsRepository(redis *redis.Client) AnalyticsRepository {
	return &analyticsRepository{
		BaseRepository: NewBaseRepository[models.ConversationSession](redis, "analytics"),
	}
}

// CreateConversationSession creates a new conversation session
func (r *analyticsRepository) CreateConversationSession(ctx context.Context, session *models.ConversationSession, db DB) error {
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}

	now := time.Now()
	session.CreatedAt = now
	session.UpdatedAt = now
	session.LastActivity = now

	// Marshal messages
	messagesJSON, err := json.Marshal(session.Messages)
	if err != nil {
		return fmt.Errorf("failed to marshal messages: %w", err)
	}

	// Marshal filters
	filtersJSON, err := json.Marshal(session.ActiveFilters)
	if err != nil {
		return fmt.Errorf("failed to marshal filters: %w", err)
	}

	// Marshal referenced entities
	entitiesJSON, err := json.Marshal(session.ReferencedEntity)
	if err != nil {
		return fmt.Errorf("failed to marshal referenced entities: %w", err)
	}

	query := `
		INSERT INTO conversation_sessions (
			id, workspace_id, user_id, title, messages, active_filters,
			referenced_entities, is_active, last_activity, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err = db.ExecContext(ctx, query,
		session.ID,
		session.WorkspaceID,
		session.UserID,
		session.Title,
		string(messagesJSON),
		string(filtersJSON),
		string(entitiesJSON),
		session.IsActive,
		session.LastActivity,
		session.CreatedAt,
		session.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create conversation session: %w", err)
	}

	return nil
}

// GetConversationSession retrieves a conversation session by ID
func (r *analyticsRepository) GetConversationSession(ctx context.Context, sessionID uuid.UUID, db DB) (*models.ConversationSession, error) {
	query := `
		SELECT id, workspace_id, user_id, title, messages, active_filters,
			   referenced_entities, is_active, last_activity, created_at, updated_at
		FROM conversation_sessions
		WHERE id = $1
	`

	session := &models.ConversationSession{}
	var messagesJSON, filtersJSON, entitiesJSON []byte

	err := db.QueryRowContext(ctx, query, sessionID).Scan(
		&session.ID,
		&session.WorkspaceID,
		&session.UserID,
		&session.Title,
		&messagesJSON,
		&filtersJSON,
		&entitiesJSON,
		&session.IsActive,
		&session.LastActivity,
		&session.CreatedAt,
		&session.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("conversation session not found")
		}
		return nil, fmt.Errorf("failed to get conversation session: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(messagesJSON, &session.Messages); err != nil {
		return nil, fmt.Errorf("failed to unmarshal messages: %w", err)
	}
	if err := json.Unmarshal(filtersJSON, &session.ActiveFilters); err != nil {
		return nil, fmt.Errorf("failed to unmarshal filters: %w", err)
	}
	if err := json.Unmarshal(entitiesJSON, &session.ReferencedEntity); err != nil {
		return nil, fmt.Errorf("failed to unmarshal entities: %w", err)
	}

	return session, nil
}

// GetActiveSessionsForUser retrieves active sessions for a user
func (r *analyticsRepository) GetActiveSessionsForUser(ctx context.Context, workspaceID, userID uuid.UUID, limit int, db DB) ([]*models.ConversationSession, error) {
	query := `
		SELECT id, workspace_id, user_id, title, messages, active_filters,
			   referenced_entities, is_active, last_activity, created_at, updated_at
		FROM conversation_sessions
		WHERE workspace_id = $1 AND user_id = $2 AND is_active = true
		ORDER BY last_activity DESC
		LIMIT $3
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list active sessions: %w", err)
	}
	defer rows.Close()

	var sessions []*models.ConversationSession
	for rows.Next() {
		session := &models.ConversationSession{}
		var messagesJSON, filtersJSON, entitiesJSON []byte

		err := rows.Scan(
			&session.ID,
			&session.WorkspaceID,
			&session.UserID,
			&session.Title,
			&messagesJSON,
			&filtersJSON,
			&entitiesJSON,
			&session.IsActive,
			&session.LastActivity,
			&session.CreatedAt,
			&session.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan session row: %w", err)
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(messagesJSON, &session.Messages); err != nil {
			return nil, fmt.Errorf("failed to unmarshal messages: %w", err)
		}
		if err := json.Unmarshal(filtersJSON, &session.ActiveFilters); err != nil {
			return nil, fmt.Errorf("failed to unmarshal filters: %w", err)
		}
		if err := json.Unmarshal(entitiesJSON, &session.ReferencedEntity); err != nil {
			return nil, fmt.Errorf("failed to unmarshal entities: %w", err)
		}

		sessions = append(sessions, session)
	}

	return sessions, rows.Err()
}

// UpdateConversationSession updates an existing conversation session
func (r *analyticsRepository) UpdateConversationSession(ctx context.Context, session *models.ConversationSession, db DB) error {
	session.UpdatedAt = time.Now()
	session.LastActivity = time.Now()

	// Marshal JSON fields
	messagesJSON, err := json.Marshal(session.Messages)
	if err != nil {
		return fmt.Errorf("failed to marshal messages: %w", err)
	}

	filtersJSON, err := json.Marshal(session.ActiveFilters)
	if err != nil {
		return fmt.Errorf("failed to marshal filters: %w", err)
	}

	entitiesJSON, err := json.Marshal(session.ReferencedEntity)
	if err != nil {
		return fmt.Errorf("failed to marshal entities: %w", err)
	}

	query := `
		UPDATE conversation_sessions SET
			title = $2,
			messages = $3,
			active_filters = $4,
			referenced_entities = $5,
			is_active = $6,
			last_activity = $7,
			updated_at = $8
		WHERE id = $1
	`

	result, err := db.ExecContext(ctx, query,
		session.ID,
		session.Title,
		string(messagesJSON),
		string(filtersJSON),
		string(entitiesJSON),
		session.IsActive,
		session.LastActivity,
		session.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update conversation session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("conversation session not found")
	}

	return nil
}

// DeactivateConversationSession marks a session as inactive
func (r *analyticsRepository) DeactivateConversationSession(ctx context.Context, sessionID uuid.UUID, db DB) error {
	query := `
		UPDATE conversation_sessions SET
			is_active = false,
			updated_at = $2
		WHERE id = $1
	`

	result, err := db.ExecContext(ctx, query, sessionID, time.Now())
	if err != nil {
		return fmt.Errorf("failed to deactivate session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("conversation session not found")
	}

	return nil
}

// CreateSavedQuery creates a new saved query
func (r *analyticsRepository) CreateSavedQuery(ctx context.Context, query *models.SavedQuery, db DB) error {
	if query.ID == uuid.Nil {
		query.ID = uuid.New()
	}

	now := time.Now()
	query.CreatedAt = now
	query.UpdatedAt = now

	// Marshal filters
	filtersJSON, err := json.Marshal(query.Filters)
	if err != nil {
		return fmt.Errorf("failed to marshal filters: %w", err)
	}

	sqlQuery := `
		INSERT INTO saved_queries (
			id, workspace_id, user_id, name, description, query_text,
			filters, category, is_template, is_default, use_count,
			last_used_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`

	_, err = db.ExecContext(ctx, sqlQuery,
		query.ID,
		query.WorkspaceID,
		query.UserID,
		query.Name,
		query.Description,
		query.QueryText,
		string(filtersJSON),
		query.Category,
		query.IsTemplate,
		query.IsDefault,
		query.UseCount,
		query.LastUsedAt,
		query.CreatedAt,
		query.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create saved query: %w", err)
	}

	return nil
}

// GetSavedQuery retrieves a saved query by ID
func (r *analyticsRepository) GetSavedQuery(ctx context.Context, queryID uuid.UUID, db DB) (*models.SavedQuery, error) {
	sqlQuery := `
		SELECT id, workspace_id, user_id, name, description, query_text,
			   filters, category, is_template, is_default, use_count,
			   last_used_at, created_at, updated_at
		FROM saved_queries
		WHERE id = $1
	`

	query := &models.SavedQuery{}
	var filtersJSON []byte

	err := db.QueryRowContext(ctx, sqlQuery, queryID).Scan(
		&query.ID,
		&query.WorkspaceID,
		&query.UserID,
		&query.Name,
		&query.Description,
		&query.QueryText,
		&filtersJSON,
		&query.Category,
		&query.IsTemplate,
		&query.IsDefault,
		&query.UseCount,
		&query.LastUsedAt,
		&query.CreatedAt,
		&query.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("saved query not found")
		}
		return nil, fmt.Errorf("failed to get saved query: %w", err)
	}

	// Unmarshal filters
	if err := json.Unmarshal(filtersJSON, &query.Filters); err != nil {
		return nil, fmt.Errorf("failed to unmarshal filters: %w", err)
	}

	return query, nil
}

// ListSavedQueries retrieves all saved queries for a workspace
func (r *analyticsRepository) ListSavedQueries(ctx context.Context, workspaceID uuid.UUID, db DB) ([]*models.SavedQuery, error) {
	sqlQuery := `
		SELECT id, workspace_id, user_id, name, description, query_text,
			   filters, category, is_template, is_default, use_count,
			   last_used_at, created_at, updated_at
		FROM saved_queries
		WHERE workspace_id = $1
		ORDER BY use_count DESC, created_at DESC
	`

	rows, err := db.QueryContext(ctx, sqlQuery, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to list saved queries: %w", err)
	}
	defer rows.Close()

	var queries []*models.SavedQuery
	for rows.Next() {
		query := &models.SavedQuery{}
		var filtersJSON []byte

		err := rows.Scan(
			&query.ID,
			&query.WorkspaceID,
			&query.UserID,
			&query.Name,
			&query.Description,
			&query.QueryText,
			&filtersJSON,
			&query.Category,
			&query.IsTemplate,
			&query.IsDefault,
			&query.UseCount,
			&query.LastUsedAt,
			&query.CreatedAt,
			&query.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan query row: %w", err)
		}

		// Unmarshal filters
		if err := json.Unmarshal(filtersJSON, &query.Filters); err != nil {
			return nil, fmt.Errorf("failed to unmarshal filters: %w", err)
		}

		queries = append(queries, query)
	}

	return queries, rows.Err()
}

// UpdateSavedQuery updates an existing saved query
func (r *analyticsRepository) UpdateSavedQuery(ctx context.Context, query *models.SavedQuery, db DB) error {
	query.UpdatedAt = time.Now()

	// Marshal filters
	filtersJSON, err := json.Marshal(query.Filters)
	if err != nil {
		return fmt.Errorf("failed to marshal filters: %w", err)
	}

	sqlQuery := `
		UPDATE saved_queries SET
			name = $2,
			description = $3,
			query_text = $4,
			filters = $5,
			category = $6,
			is_template = $7,
			is_default = $8,
			updated_at = $9
		WHERE id = $1
	`

	result, err := db.ExecContext(ctx, sqlQuery,
		query.ID,
		query.Name,
		query.Description,
		query.QueryText,
		string(filtersJSON),
		query.Category,
		query.IsTemplate,
		query.IsDefault,
		query.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update saved query: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("saved query not found")
	}

	return nil
}

// DeleteSavedQuery deletes a saved query
func (r *analyticsRepository) DeleteSavedQuery(ctx context.Context, queryID uuid.UUID, db DB) error {
	sqlQuery := `DELETE FROM saved_queries WHERE id = $1`

	result, err := db.ExecContext(ctx, sqlQuery, queryID)
	if err != nil {
		return fmt.Errorf("failed to delete saved query: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("saved query not found")
	}

	return nil
}

// IncrementQueryUseCount increments the use count for a saved query
func (r *analyticsRepository) IncrementQueryUseCount(ctx context.Context, queryID uuid.UUID, db DB) error {
	sqlQuery := `
		UPDATE saved_queries SET
			use_count = use_count + 1,
			last_used_at = $2,
			updated_at = $2
		WHERE id = $1
	`

	now := time.Now()
	_, err := db.ExecContext(ctx, sqlQuery, queryID, now)
	if err != nil {
		return fmt.Errorf("failed to increment use count: %w", err)
	}

	return nil
}

// Segment Definitions methods
func (r *analyticsRepository) CreateSegmentDefinition(ctx context.Context, segment *models.SegmentDefinition, db DB) error {
	if segment.ID == uuid.Nil {
		segment.ID = uuid.New()
	}

	now := time.Now()
	segment.CreatedAt = now
	segment.UpdatedAt = now

	// Marshal criteria and top themes
	criteriaJSON, err := json.Marshal(segment.Criteria)
	if err != nil {
		return fmt.Errorf("failed to marshal criteria: %w", err)
	}

	themesJSON, err := json.Marshal(segment.CachedTopThemes)
	if err != nil {
		return fmt.Errorf("failed to marshal themes: %w", err)
	}

	query := `
		INSERT INTO segment_definitions (
			id, workspace_id, name, description, color, criteria, segment_type,
			cached_testimonial_count, cached_avg_sentiment, cached_top_themes,
			cache_updated_at, is_system_defined, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err = db.ExecContext(ctx, query,
		segment.ID,
		segment.WorkspaceID,
		segment.Name,
		segment.Description,
		segment.Color,
		string(criteriaJSON),
		segment.SegmentType,
		segment.CachedTestimonialCount,
		segment.CachedAvgSentiment,
		string(themesJSON),
		segment.CacheUpdatedAt,
		segment.IsSystemDefined,
		segment.IsActive,
		segment.CreatedAt,
		segment.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create segment definition: %w", err)
	}

	return nil
}

func (r *analyticsRepository) GetSegmentDefinition(ctx context.Context, segmentID uuid.UUID, db DB) (*models.SegmentDefinition, error) {
	query := `
		SELECT id, workspace_id, name, description, color, criteria, segment_type,
			   cached_testimonial_count, cached_avg_sentiment, cached_top_themes,
			   cache_updated_at, is_system_defined, is_active, created_at, updated_at
		FROM segment_definitions
		WHERE id = $1
	`

	segment := &models.SegmentDefinition{}
	var criteriaJSON, themesJSON []byte

	err := db.QueryRowContext(ctx, query, segmentID).Scan(
		&segment.ID,
		&segment.WorkspaceID,
		&segment.Name,
		&segment.Description,
		&segment.Color,
		&criteriaJSON,
		&segment.SegmentType,
		&segment.CachedTestimonialCount,
		&segment.CachedAvgSentiment,
		&themesJSON,
		&segment.CacheUpdatedAt,
		&segment.IsSystemDefined,
		&segment.IsActive,
		&segment.CreatedAt,
		&segment.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("segment definition not found")
		}
		return nil, fmt.Errorf("failed to get segment definition: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(criteriaJSON, &segment.Criteria); err != nil {
		return nil, fmt.Errorf("failed to unmarshal criteria: %w", err)
	}
	if err := json.Unmarshal(themesJSON, &segment.CachedTopThemes); err != nil {
		return nil, fmt.Errorf("failed to unmarshal themes: %w", err)
	}

	return segment, nil
}

func (r *analyticsRepository) ListSegmentDefinitions(ctx context.Context, workspaceID uuid.UUID, includeInactive bool, db DB) ([]*models.SegmentDefinition, error) {
	query := `
		SELECT id, workspace_id, name, description, color, criteria, segment_type,
			   cached_testimonial_count, cached_avg_sentiment, cached_top_themes,
			   cache_updated_at, is_system_defined, is_active, created_at, updated_at
		FROM segment_definitions
		WHERE workspace_id = $1
	`

	if !includeInactive {
		query += " AND is_active = true"
	}

	query += " ORDER BY is_system_defined DESC, created_at DESC"

	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to list segment definitions: %w", err)
	}
	defer rows.Close()

	var segments []*models.SegmentDefinition
	for rows.Next() {
		segment := &models.SegmentDefinition{}
		var criteriaJSON, themesJSON []byte

		err := rows.Scan(
			&segment.ID,
			&segment.WorkspaceID,
			&segment.Name,
			&segment.Description,
			&segment.Color,
			&criteriaJSON,
			&segment.SegmentType,
			&segment.CachedTestimonialCount,
			&segment.CachedAvgSentiment,
			&themesJSON,
			&segment.CacheUpdatedAt,
			&segment.IsSystemDefined,
			&segment.IsActive,
			&segment.CreatedAt,
			&segment.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan segment row: %w", err)
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(criteriaJSON, &segment.Criteria); err != nil {
			return nil, fmt.Errorf("failed to unmarshal criteria: %w", err)
		}
		if err := json.Unmarshal(themesJSON, &segment.CachedTopThemes); err != nil {
			return nil, fmt.Errorf("failed to unmarshal themes: %w", err)
		}

		segments = append(segments, segment)
	}

	return segments, rows.Err()
}

func (r *analyticsRepository) UpdateSegmentDefinition(ctx context.Context, segment *models.SegmentDefinition, db DB) error {
	segment.UpdatedAt = time.Now()

	// Marshal JSON fields
	criteriaJSON, err := json.Marshal(segment.Criteria)
	if err != nil {
		return fmt.Errorf("failed to marshal criteria: %w", err)
	}

	themesJSON, err := json.Marshal(segment.CachedTopThemes)
	if err != nil {
		return fmt.Errorf("failed to marshal themes: %w", err)
	}

	query := `
		UPDATE segment_definitions SET
			name = $2,
			description = $3,
			color = $4,
			criteria = $5,
			segment_type = $6,
			cached_testimonial_count = $7,
			cached_avg_sentiment = $8,
			cached_top_themes = $9,
			cache_updated_at = $10,
			is_active = $11,
			updated_at = $12
		WHERE id = $1
	`

	result, err := db.ExecContext(ctx, query,
		segment.ID,
		segment.Name,
		segment.Description,
		segment.Color,
		string(criteriaJSON),
		segment.SegmentType,
		segment.CachedTestimonialCount,
		segment.CachedAvgSentiment,
		string(themesJSON),
		segment.CacheUpdatedAt,
		segment.IsActive,
		segment.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update segment definition: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("segment definition not found")
	}

	return nil
}

func (r *analyticsRepository) DeleteSegmentDefinition(ctx context.Context, segmentID uuid.UUID, db DB) error {
	query := `DELETE FROM segment_definitions WHERE id = $1 AND is_system_defined = false`

	result, err := db.ExecContext(ctx, query, segmentID)
	if err != nil {
		return fmt.Errorf("failed to delete segment definition: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("segment definition not found or is system-defined")
	}

	return nil
}

// Analytics Cache methods
func (r *analyticsRepository) GetCachedAnalytics(ctx context.Context, workspaceID uuid.UUID, cacheKey string, filters models.JSONB, db DB) (*models.AnalyticsCache, error) {
	// Marshal filters for comparison
	filtersJSON, err := json.Marshal(filters)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal filters: %w", err)
	}

	query := `
		SELECT id, workspace_id, cache_key, cache_type, filters, data,
			   expires_at, computation_time_ms, created_at, updated_at
		FROM analytics_cache
		WHERE workspace_id = $1 AND cache_key = $2 AND filters = $3 AND expires_at > NOW()
	`

	cache := &models.AnalyticsCache{}
	var dataJSON, cachedFiltersJSON []byte

	err = db.QueryRowContext(ctx, query, workspaceID, cacheKey, string(filtersJSON)).Scan(
		&cache.ID,
		&cache.WorkspaceID,
		&cache.CacheKey,
		&cache.CacheType,
		&cachedFiltersJSON,
		&dataJSON,
		&cache.ExpiresAt,
		&cache.ComputationTimeMS,
		&cache.CreatedAt,
		&cache.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Cache miss - not an error
		}
		return nil, fmt.Errorf("failed to get cached analytics: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(dataJSON, &cache.Data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal data: %w", err)
	}
	if err := json.Unmarshal(cachedFiltersJSON, &cache.Filters); err != nil {
		return nil, fmt.Errorf("failed to unmarshal filters: %w", err)
	}

	return cache, nil
}

func (r *analyticsRepository) SetCachedAnalytics(ctx context.Context, cache *models.AnalyticsCache, db DB) error {
	if cache.ID == uuid.Nil {
		cache.ID = uuid.New()
	}

	now := time.Now()
	cache.CreatedAt = now
	cache.UpdatedAt = now

	// Marshal JSON fields
	filtersJSON, err := json.Marshal(cache.Filters)
	if err != nil {
		return fmt.Errorf("failed to marshal filters: %w", err)
	}

	dataJSON, err := json.Marshal(cache.Data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	query := `
		INSERT INTO analytics_cache (
			id, workspace_id, cache_key, cache_type, filters, data,
			expires_at, computation_time_ms, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (workspace_id, cache_key, filters)
		DO UPDATE SET
			data = EXCLUDED.data,
			expires_at = EXCLUDED.expires_at,
			computation_time_ms = EXCLUDED.computation_time_ms,
			updated_at = EXCLUDED.updated_at
	`

	_, err = db.ExecContext(ctx, query,
		cache.ID,
		cache.WorkspaceID,
		cache.CacheKey,
		cache.CacheType,
		string(filtersJSON),
		string(dataJSON),
		cache.ExpiresAt,
		cache.ComputationTimeMS,
		cache.CreatedAt,
		cache.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to set cached analytics: %w", err)
	}

	return nil
}

func (r *analyticsRepository) ClearExpiredCache(ctx context.Context, db DB) (int, error) {
	query := `DELETE FROM analytics_cache WHERE expires_at < NOW()`

	result, err := db.ExecContext(ctx, query)
	if err != nil {
		return 0, fmt.Errorf("failed to clear expired cache: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return int(rowsAffected), nil
}

// Export Logs methods
func (r *analyticsRepository) CreateExportLog(ctx context.Context, log *models.ExportLog, db DB) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}

	now := time.Now()
	log.CreatedAt = now
	log.UpdatedAt = now

	// Marshal JSON fields
	filtersJSON, err := json.Marshal(log.Filters)
	if err != nil {
		return fmt.Errorf("failed to marshal filters: %w", err)
	}

	paramsJSON, err := json.Marshal(log.ExportParams)
	if err != nil {
		return fmt.Errorf("failed to marshal export params: %w", err)
	}

	query := `
		INSERT INTO export_logs (
			id, workspace_id, user_id, export_type, export_format, content_type,
			filters, file_name, file_size_bytes, file_url, status, error_message,
			export_params, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err = db.ExecContext(ctx, query,
		log.ID,
		log.WorkspaceID,
		log.UserID,
		log.ExportType,
		log.ExportFormat,
		log.ContentType,
		string(filtersJSON),
		log.FileName,
		log.FileSizeBytes,
		log.FileURL,
		log.Status,
		log.ErrorMessage,
		string(paramsJSON),
		log.CreatedAt,
		log.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create export log: %w", err)
	}

	return nil
}

func (r *analyticsRepository) GetExportLog(ctx context.Context, exportID uuid.UUID, db DB) (*models.ExportLog, error) {
	query := `
		SELECT id, workspace_id, user_id, export_type, export_format, content_type,
			   filters, file_name, file_size_bytes, file_url, status, error_message,
			   export_params, created_at, updated_at
		FROM export_logs
		WHERE id = $1
	`

	log := &models.ExportLog{}
	var filtersJSON, paramsJSON []byte

	err := db.QueryRowContext(ctx, query, exportID).Scan(
		&log.ID,
		&log.WorkspaceID,
		&log.UserID,
		&log.ExportType,
		&log.ExportFormat,
		&log.ContentType,
		&filtersJSON,
		&log.FileName,
		&log.FileSizeBytes,
		&log.FileURL,
		&log.Status,
		&log.ErrorMessage,
		&paramsJSON,
		&log.CreatedAt,
		&log.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("export log not found")
		}
		return nil, fmt.Errorf("failed to get export log: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(filtersJSON, &log.Filters); err != nil {
		return nil, fmt.Errorf("failed to unmarshal filters: %w", err)
	}
	if err := json.Unmarshal(paramsJSON, &log.ExportParams); err != nil {
		return nil, fmt.Errorf("failed to unmarshal export params: %w", err)
	}

	return log, nil
}

func (r *analyticsRepository) ListExportLogs(ctx context.Context, workspaceID uuid.UUID, limit int, db DB) ([]*models.ExportLog, error) {
	query := `
		SELECT id, workspace_id, user_id, export_type, export_format, content_type,
			   filters, file_name, file_size_bytes, file_url, status, error_message,
			   export_params, created_at, updated_at
		FROM export_logs
		WHERE workspace_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list export logs: %w", err)
	}
	defer rows.Close()

	var logs []*models.ExportLog
	for rows.Next() {
		log := &models.ExportLog{}
		var filtersJSON, paramsJSON []byte

		err := rows.Scan(
			&log.ID,
			&log.WorkspaceID,
			&log.UserID,
			&log.ExportType,
			&log.ExportFormat,
			&log.ContentType,
			&filtersJSON,
			&log.FileName,
			&log.FileSizeBytes,
			&log.FileURL,
			&log.Status,
			&log.ErrorMessage,
			&paramsJSON,
			&log.CreatedAt,
			&log.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan export log row: %w", err)
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(filtersJSON, &log.Filters); err != nil {
			return nil, fmt.Errorf("failed to unmarshal filters: %w", err)
		}
		if err := json.Unmarshal(paramsJSON, &log.ExportParams); err != nil {
			return nil, fmt.Errorf("failed to unmarshal export params: %w", err)
		}

		logs = append(logs, log)
	}

	return logs, rows.Err()
}

func (r *analyticsRepository) UpdateExportLog(ctx context.Context, log *models.ExportLog, db DB) error {
	log.UpdatedAt = time.Now()

	// Marshal JSON fields
	filtersJSON, err := json.Marshal(log.Filters)
	if err != nil {
		return fmt.Errorf("failed to marshal filters: %w", err)
	}

	paramsJSON, err := json.Marshal(log.ExportParams)
	if err != nil {
		return fmt.Errorf("failed to marshal export params: %w", err)
	}

	query := `
		UPDATE export_logs SET
			file_name = $2,
			file_size_bytes = $3,
			file_url = $4,
			status = $5,
			error_message = $6,
			filters = $7,
			export_params = $8,
			updated_at = $9
		WHERE id = $1
	`

	result, err := db.ExecContext(ctx, query,
		log.ID,
		log.FileName,
		log.FileSizeBytes,
		log.FileURL,
		log.Status,
		log.ErrorMessage,
		string(filtersJSON),
		string(paramsJSON),
		log.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update export log: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("export log not found")
	}

	return nil
}
