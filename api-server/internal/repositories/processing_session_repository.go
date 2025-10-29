package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type ProcessingSessionRepository interface {
	Create(ctx context.Context, session *models.ProcessingSession, db *sql.DB) error
	GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.ProcessingSession, error)
	GetByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]*models.ProcessingSession, error)
	GetActiveSession(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) (*models.ProcessingSession, error)
	GetActiveByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]*models.ProcessingSession, error)
	GetActiveByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) ([]*models.ProcessingSession, error)
	Update(ctx context.Context, session *models.ProcessingSession, db *sql.DB) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string, db *sql.DB) error
	UpdateStatusIfIn(ctx context.Context, db *sql.DB, id uuid.UUID, newStatus string, allowedStatuses []string) (*models.ProcessingSession, error)
	Pause(ctx context.Context, id uuid.UUID, pausedByUser bool, db *sql.DB) error
	PauseIfActive(ctx context.Context, db *sql.DB, id uuid.UUID, pausedByUser bool) (*models.ProcessingSession, error)
	Resume(ctx context.Context, id uuid.UUID, resumeFromStageID *string, db *sql.DB) error
	ResumeIfPaused(ctx context.Context, db *sql.DB, id uuid.UUID, resumeFromStageID *string) (*models.ProcessingSession, error)
	UpdateProgress(ctx context.Context, id uuid.UUID, completedSteps, skippedSteps int, db *sql.DB) error
	Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error
}

type processingSessionRepository struct {
	*BaseRepository[models.ProcessingSession]
}

func NewProcessingSessionRepository(redis *redis.Client) ProcessingSessionRepository {
	return &processingSessionRepository{
		BaseRepository: NewBaseRepository[models.ProcessingSession](redis, "processing_sessions"),
	}
}

func (r *processingSessionRepository) Create(ctx context.Context, session *models.ProcessingSession, db *sql.DB) error {
	query := `
		INSERT INTO processing_sessions (
			id, testimonial_id, workspace_id, session_type, status, current_stage_id,
			accepted_versions, selected_stages, auto_proceed, paused_at, paused_by_user,
			resume_from_stage_id, total_steps, completed_steps, skipped_steps,
			metadata, started_at, updated_at, completed_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
		)
	`

	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}

	now := time.Now()
	if session.StartedAt.IsZero() {
		session.StartedAt = now
	}
	session.UpdatedAt = now

	// Marshal JSONB fields manually to string
	acceptedVersionsBytes, err := json.Marshal(session.AcceptedVersions)
	if err != nil {
		return err
	}

	selectedStagesBytes, err := json.Marshal(session.SelectedStages)
	if err != nil {
		return err
	}

	metadataBytes, err := json.Marshal(session.Metadata)
	if err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, query,
		session.ID,
		session.TestimonialID,
		session.WorkspaceID,
		session.SessionType,
		session.Status,
		session.CurrentStageID,
		string(acceptedVersionsBytes),
		string(selectedStagesBytes),
		session.AutoProceed,
		session.PausedAt,
		session.PausedByUser,
		session.ResumeFromStageID,
		session.TotalSteps,
		session.CompletedSteps,
		session.SkippedSteps,
		string(metadataBytes),
		session.StartedAt,
		session.UpdatedAt,
		session.CompletedAt,
	)

	return err
}

func (r *processingSessionRepository) GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.ProcessingSession, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("session:%s", id.String())

	// Attempt to get from cache
	cachedData, err := r.redis.Get(ctx, cacheKey).Result()
	if err == nil {
		// Cache hit - unmarshal and return
		var session models.ProcessingSession
		if unmarshalErr := json.Unmarshal([]byte(cachedData), &session); unmarshalErr == nil {
			return &session, nil
		}
		// If unmarshal fails, continue to DB query
	} else if err != redis.Nil {
		// Redis error (not a cache miss) - log but continue to DB
		fmt.Printf("⚠️ Session cache error: %v\n", err)
	}

	// Cache miss or error - query database
	query := `
		SELECT id, testimonial_id, workspace_id, session_type, status, current_stage_id,
			   accepted_versions, selected_stages, auto_proceed, paused_at, paused_by_user,
			   resume_from_stage_id, total_steps, completed_steps, skipped_steps,
			   metadata, started_at, updated_at, completed_at
		FROM processing_sessions
		WHERE id = $1
	`

	var session models.ProcessingSession
	err = db.QueryRowContext(ctx, query, id).Scan(
		&session.ID,
		&session.TestimonialID,
		&session.WorkspaceID,
		&session.SessionType,
		&session.Status,
		&session.CurrentStageID,
		&session.AcceptedVersions,
		&session.SelectedStages,
		&session.AutoProceed,
		&session.PausedAt,
		&session.PausedByUser,
		&session.ResumeFromStageID,
		&session.TotalSteps,
		&session.CompletedSteps,
		&session.SkippedSteps,
		&session.Metadata,
		&session.StartedAt,
		&session.UpdatedAt,
		&session.CompletedAt,
	)

	if err != nil {
		return nil, err
	}

	// Cache the result for 5 minutes (sessions change frequently)
	sessionData, marshalErr := json.Marshal(session)
	if marshalErr == nil {
		cacheErr := r.redis.Set(ctx, cacheKey, sessionData, 5*time.Minute).Err()
		if cacheErr != nil {
			// Log warning but don't fail the request
			fmt.Printf("⚠️ Failed to cache session: %v\n", cacheErr)
		}
	}

	return &session, nil
}

func (r *processingSessionRepository) GetByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]*models.ProcessingSession, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, session_type, status, current_stage_id,
			   accepted_versions, selected_stages, auto_proceed, paused_at, paused_by_user,
			   resume_from_stage_id, total_steps, completed_steps, skipped_steps,
			   metadata, started_at, updated_at, completed_at
		FROM processing_sessions
		WHERE testimonial_id = $1
		ORDER BY started_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*models.ProcessingSession
	for rows.Next() {
		var session models.ProcessingSession
		err := rows.Scan(
			&session.ID,
			&session.TestimonialID,
			&session.WorkspaceID,
			&session.SessionType,
			&session.Status,
			&session.CurrentStageID,
			&session.AcceptedVersions,
			&session.SelectedStages,
			&session.AutoProceed,
			&session.PausedAt,
			&session.PausedByUser,
			&session.ResumeFromStageID,
			&session.TotalSteps,
			&session.CompletedSteps,
			&session.SkippedSteps,
			&session.Metadata,
			&session.StartedAt,
			&session.UpdatedAt,
			&session.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &session)
	}

	return sessions, rows.Err()
}

func (r *processingSessionRepository) GetActiveSession(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) (*models.ProcessingSession, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, session_type, status, current_stage_id,
			   accepted_versions, selected_stages, auto_proceed, paused_at, paused_by_user,
			   resume_from_stage_id, total_steps, completed_steps, skipped_steps,
			   metadata, started_at, updated_at, completed_at
		FROM processing_sessions
		WHERE testimonial_id = $1 AND status IN ('active', 'paused')
		ORDER BY started_at DESC
		LIMIT 1
	`

	var session models.ProcessingSession
	err := db.QueryRowContext(ctx, query, testimonialID).Scan(
		&session.ID,
		&session.TestimonialID,
		&session.WorkspaceID,
		&session.SessionType,
		&session.Status,
		&session.CurrentStageID,
		&session.AcceptedVersions,
		&session.SelectedStages,
		&session.AutoProceed,
		&session.PausedAt,
		&session.PausedByUser,
		&session.ResumeFromStageID,
		&session.TotalSteps,
		&session.CompletedSteps,
		&session.SkippedSteps,
		&session.Metadata,
		&session.StartedAt,
		&session.UpdatedAt,
		&session.CompletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &session, nil
}

func (r *processingSessionRepository) Update(ctx context.Context, session *models.ProcessingSession, db *sql.DB) error {
	query := `
		UPDATE processing_sessions SET
			status = $2, current_stage_id = $3, accepted_versions = $4,
			selected_stages = $5, auto_proceed = $6, paused_at = $7,
			paused_by_user = $8, resume_from_stage_id = $9, total_steps = $10,
			completed_steps = $11, skipped_steps = $12, metadata = $13,
			updated_at = $14, completed_at = $15
		WHERE id = $1
	`

	session.UpdatedAt = time.Now()

	// Marshal JSONB fields manually to string
	acceptedVersionsBytes, err := json.Marshal(session.AcceptedVersions)
	if err != nil {
		return err
	}

	selectedStagesBytes, err := json.Marshal(session.SelectedStages)
	if err != nil {
		return err
	}

	metadataBytes, err := json.Marshal(session.Metadata)
	if err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, query,
		session.ID,
		session.Status,
		session.CurrentStageID,
		string(acceptedVersionsBytes),
		string(selectedStagesBytes),
		session.AutoProceed,
		session.PausedAt,
		session.PausedByUser,
		session.ResumeFromStageID,
		session.TotalSteps,
		session.CompletedSteps,
		session.SkippedSteps,
		string(metadataBytes),
		session.UpdatedAt,
		session.CompletedAt,
	)

	if err != nil {
		return err
	}

	// Invalidate cache after successful update
	cacheKey := fmt.Sprintf("session:%s", session.ID.String())
	if delErr := r.redis.Del(ctx, cacheKey).Err(); delErr != nil {
		fmt.Printf("⚠️ Failed to invalidate session cache: %v\n", delErr)
	}

	return nil
}

func (r *processingSessionRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string, db *sql.DB) error {
	query := `UPDATE processing_sessions SET status = $2, updated_at = $3 WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id, status, time.Now())
	if err != nil {
		return err
	}

	// Invalidate cache after successful update
	cacheKey := fmt.Sprintf("session:%s", id.String())
	if delErr := r.redis.Del(ctx, cacheKey).Err(); delErr != nil {
		fmt.Printf("⚠️ Failed to invalidate session cache: %v\n", delErr)
	}

	return nil
}

func (r *processingSessionRepository) Pause(ctx context.Context, id uuid.UUID, pausedByUser bool, db *sql.DB) error {
	query := `
		UPDATE processing_sessions
		SET status = $2, paused_at = $3, paused_by_user = $4, updated_at = $5
		WHERE id = $1
	`

	now := time.Now()
	_, err := db.ExecContext(ctx, query, id, models.SessionStatusPaused, now, pausedByUser, now)
	if err != nil {
		return err
	}

	// Invalidate cache after successful pause
	cacheKey := fmt.Sprintf("session:%s", id.String())
	if delErr := r.redis.Del(ctx, cacheKey).Err(); delErr != nil {
		fmt.Printf("⚠️ Failed to invalidate session cache: %v\n", delErr)
	}

	return nil
}

func (r *processingSessionRepository) Resume(ctx context.Context, id uuid.UUID, resumeFromStageID *string, db *sql.DB) error {
	query := `
		UPDATE processing_sessions
		SET status = $2, paused_at = NULL, resume_from_stage_id = $3, updated_at = $4
		WHERE id = $1
	`

	_, err := db.ExecContext(ctx, query, id, models.SessionStatusActive, resumeFromStageID, time.Now())
	if err != nil {
		return err
	}

	// Invalidate cache after successful resume
	cacheKey := fmt.Sprintf("session:%s", id.String())
	if delErr := r.redis.Del(ctx, cacheKey).Err(); delErr != nil {
		fmt.Printf("⚠️ Failed to invalidate session cache: %v\n", delErr)
	}

	return nil
}

func (r *processingSessionRepository) UpdateProgress(ctx context.Context, id uuid.UUID, completedSteps, skippedSteps int, db *sql.DB) error {
	query := `
		UPDATE processing_sessions
		SET completed_steps = $2, skipped_steps = $3, updated_at = $4
		WHERE id = $1
	`

	_, err := db.ExecContext(ctx, query, id, completedSteps, skippedSteps, time.Now())
	if err != nil {
		return err
	}

	// Invalidate cache after successful progress update
	cacheKey := fmt.Sprintf("session:%s", id.String())
	if delErr := r.redis.Del(ctx, cacheKey).Err(); delErr != nil {
		fmt.Printf("⚠️ Failed to invalidate session cache: %v\n", delErr)
	}

	return nil
}

func (r *processingSessionRepository) Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM processing_sessions WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	// Invalidate cache after successful delete
	cacheKey := fmt.Sprintf("session:%s", id.String())
	if delErr := r.redis.Del(ctx, cacheKey).Err(); delErr != nil {
		fmt.Printf("⚠️ Failed to invalidate session cache: %v\n", delErr)
	}

	return nil
}

func (r *processingSessionRepository) GetActiveByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]*models.ProcessingSession, error) {
	// First, let's check what stages exist for debugging
	debugQuery := `
		SELECT ps.id, ps.status as session_status, pst.stage_id, pst.status as stage_status
		FROM processing_sessions ps
		LEFT JOIN processing_stages pst ON pst.session_id = ps.id
		WHERE ps.testimonial_id = $1 AND ps.status IN ('active', 'paused')
		ORDER BY ps.started_at DESC, pst.created_at
	`

	debugRows, err := db.QueryContext(ctx, debugQuery, testimonialID)
	if err == nil {
		defer debugRows.Close()
		for debugRows.Next() {
			var sessionID, sessionStatus, stageID, stageStatus sql.NullString
			if err := debugRows.Scan(&sessionID, &sessionStatus, &stageID, &stageStatus); err == nil {
				fmt.Printf("[DEBUG] Session: %s (status=%s), Stage: %s (status=%s)\n",
					sessionID.String, sessionStatus.String, stageID.String, stageStatus.String)
			}
		}
	}

	query := `
		SELECT DISTINCT ps.id, ps.testimonial_id, ps.workspace_id, ps.session_type, ps.status, ps.current_stage_id,
			   ps.accepted_versions, ps.selected_stages, ps.auto_proceed, ps.paused_at, ps.paused_by_user,
			   ps.resume_from_stage_id, ps.total_steps, ps.completed_steps, ps.skipped_steps,
			   ps.metadata, ps.started_at, ps.updated_at, ps.completed_at
		FROM processing_sessions ps
		WHERE ps.testimonial_id = $1
		  AND ps.status IN ('active', 'paused')
		  AND EXISTS (
		      SELECT 1 FROM processing_stages pst
		      WHERE pst.session_id = ps.id
		      AND pst.status IN ('pending', 'processing')
		  )
		ORDER BY ps.started_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*models.ProcessingSession
	for rows.Next() {
		var session models.ProcessingSession
		err := rows.Scan(
			&session.ID,
			&session.TestimonialID,
			&session.WorkspaceID,
			&session.SessionType,
			&session.Status,
			&session.CurrentStageID,
			&session.AcceptedVersions,
			&session.SelectedStages,
			&session.AutoProceed,
			&session.PausedAt,
			&session.PausedByUser,
			&session.ResumeFromStageID,
			&session.TotalSteps,
			&session.CompletedSteps,
			&session.SkippedSteps,
			&session.Metadata,
			&session.StartedAt,
			&session.UpdatedAt,
			&session.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &session)
	}

	return sessions, rows.Err()
}

func (r *processingSessionRepository) GetActiveByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, db *sql.DB) ([]*models.ProcessingSession, error) {
	query := `
		SELECT DISTINCT ps.id, ps.testimonial_id, ps.workspace_id, ps.session_type, ps.status, ps.current_stage_id,
			   ps.accepted_versions, ps.selected_stages, ps.auto_proceed, ps.paused_at, ps.paused_by_user,
			   ps.resume_from_stage_id, ps.total_steps, ps.completed_steps, ps.skipped_steps,
			   ps.metadata, ps.started_at, ps.updated_at, ps.completed_at
		FROM processing_sessions ps
		WHERE ps.workspace_id = $1
		  AND ps.status IN ('active', 'paused')
		  AND EXISTS (
		      SELECT 1 FROM processing_stages pst
		      WHERE pst.session_id = ps.id
		      AND pst.status IN ('pending', 'processing')
		  )
		ORDER BY ps.started_at DESC
	`

	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*models.ProcessingSession
	for rows.Next() {
		var session models.ProcessingSession
		err := rows.Scan(
			&session.ID,
			&session.TestimonialID,
			&session.WorkspaceID,
			&session.SessionType,
			&session.Status,
			&session.CurrentStageID,
			&session.AcceptedVersions,
			&session.SelectedStages,
			&session.AutoProceed,
			&session.PausedAt,
			&session.PausedByUser,
			&session.ResumeFromStageID,
			&session.TotalSteps,
			&session.CompletedSteps,
			&session.SkippedSteps,
			&session.Metadata,
			&session.StartedAt,
			&session.UpdatedAt,
			&session.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &session)
	}

	return sessions, rows.Err()
}

// UpdateStatusIfIn atomically updates session status only if current status is in allowedStatuses
// Returns ErrNoRowsUpdated if session is not in an allowed status (concurrency conflict)
func (r *processingSessionRepository) UpdateStatusIfIn(ctx context.Context, db *sql.DB, id uuid.UUID, newStatus string, allowedStatuses []string) (*models.ProcessingSession, error) {
	if len(allowedStatuses) == 0 {
		return nil, fmt.Errorf("allowedStatuses must not be empty")
	}

	placeholders := make([]string, len(allowedStatuses))
	args := make([]interface{}, 0, len(allowedStatuses)+2)

	// args ordering: 1=id, 2=newStatus, then allowedStatuses...
	args = append(args, id, newStatus)

	for i := range allowedStatuses {
		placeholders[i] = fmt.Sprintf("$%d", 3+i)
		args = append(args, allowedStatuses[i])
	}

	query := fmt.Sprintf(`
		UPDATE processing_sessions
		SET status = $2, updated_at = now()
		WHERE id = $1 AND status IN (%s)
		RETURNING id, testimonial_id, workspace_id, session_type, status, current_stage_id,
		          accepted_versions, selected_stages, auto_proceed, paused_at, paused_by_user,
		          resume_from_stage_id, total_steps, completed_steps, skipped_steps,
		          metadata, started_at, updated_at, completed_at
	`, strings.Join(placeholders, ","))

	row := db.QueryRowContext(ctx, query, args...)

	var session models.ProcessingSession
	if err := row.Scan(
		&session.ID,
		&session.TestimonialID,
		&session.WorkspaceID,
		&session.SessionType,
		&session.Status,
		&session.CurrentStageID,
		&session.AcceptedVersions,
		&session.SelectedStages,
		&session.AutoProceed,
		&session.PausedAt,
		&session.PausedByUser,
		&session.ResumeFromStageID,
		&session.TotalSteps,
		&session.CompletedSteps,
		&session.SkippedSteps,
		&session.Metadata,
		&session.StartedAt,
		&session.UpdatedAt,
		&session.CompletedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsUpdated
		}
		return nil, err
	}

	return &session, nil
}

// PauseIfActive atomically pauses a session only if it's active
// Returns ErrNoRowsUpdated if session is not in an active state
func (r *processingSessionRepository) PauseIfActive(ctx context.Context, db *sql.DB, id uuid.UUID, pausedByUser bool) (*models.ProcessingSession, error) {
	now := time.Now()
	query := fmt.Sprintf(`
		UPDATE processing_sessions
		SET status = '%s', paused_at = $2, paused_by_user = $3, updated_at = $4
		WHERE id = $1 AND status = $5
		RETURNING id, testimonial_id, workspace_id, session_type, status, current_stage_id,
		          accepted_versions, selected_stages, auto_proceed, paused_at, paused_by_user,
		          resume_from_stage_id, total_steps, completed_steps, skipped_steps,
		          metadata, started_at, updated_at, completed_at
	`, models.SessionStatusPaused)

	row := db.QueryRowContext(ctx, query, id, now, pausedByUser, now,
		models.SessionStatusActive)

	var session models.ProcessingSession
	if err := row.Scan(
		&session.ID,
		&session.TestimonialID,
		&session.WorkspaceID,
		&session.SessionType,
		&session.Status,
		&session.CurrentStageID,
		&session.AcceptedVersions,
		&session.SelectedStages,
		&session.AutoProceed,
		&session.PausedAt,
		&session.PausedByUser,
		&session.ResumeFromStageID,
		&session.TotalSteps,
		&session.CompletedSteps,
		&session.SkippedSteps,
		&session.Metadata,
		&session.StartedAt,
		&session.UpdatedAt,
		&session.CompletedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsUpdated
		}
		return nil, err
	}

	return &session, nil
}

// ResumeIfPaused atomically resumes a session only if it's paused
// Returns ErrNoRowsUpdated if session is not paused
func (r *processingSessionRepository) ResumeIfPaused(ctx context.Context, db *sql.DB, id uuid.UUID, resumeFromStageID *string) (*models.ProcessingSession, error) {
	query := fmt.Sprintf(`
		UPDATE processing_sessions
		SET status = '%s', paused_at = NULL, resume_from_stage_id = $2, updated_at = $3
		WHERE id = $1 AND status = $4
		RETURNING id, testimonial_id, workspace_id, session_type, status, current_stage_id,
		          accepted_versions, selected_stages, auto_proceed, paused_at, paused_by_user,
		          resume_from_stage_id, total_steps, completed_steps, skipped_steps,
		          metadata, started_at, updated_at, completed_at
	`, models.SessionStatusActive)

	now := time.Now()
	row := db.QueryRowContext(ctx, query, id, resumeFromStageID, now, models.SessionStatusPaused)

	var session models.ProcessingSession
	if err := row.Scan(
		&session.ID,
		&session.TestimonialID,
		&session.WorkspaceID,
		&session.SessionType,
		&session.Status,
		&session.CurrentStageID,
		&session.AcceptedVersions,
		&session.SelectedStages,
		&session.AutoProceed,
		&session.PausedAt,
		&session.PausedByUser,
		&session.ResumeFromStageID,
		&session.TotalSteps,
		&session.CompletedSteps,
		&session.SkippedSteps,
		&session.Metadata,
		&session.StartedAt,
		&session.UpdatedAt,
		&session.CompletedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsUpdated
		}
		return nil, err
	}

	return &session, nil
}
