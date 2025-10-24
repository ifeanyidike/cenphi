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
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type ProcessingStageRepository interface {
	Create(ctx context.Context, stage *models.ProcessingStage, db *sql.DB) error
	GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.ProcessingStage, error)
	GetBySessionID(ctx context.Context, sessionID uuid.UUID, db *sql.DB) ([]*models.ProcessingStage, error)
	GetBySessionAndStageID(ctx context.Context, sessionID uuid.UUID, stageID string, db *sql.DB) (*models.ProcessingStage, error)
	Update(ctx context.Context, stage *models.ProcessingStage, db *sql.DB) error
	UpdateStatusIfIn(ctx context.Context, db *sql.DB, sessionID uuid.UUID, stageID string, newStatus string, completedAt *time.Time, allowedStatuses []string) (*models.ProcessingStage, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string, progress int, message *string, db *sql.DB) error
	SkipStage(ctx context.Context, id uuid.UUID, skipReason string, db *sql.DB) error
	SkipIfAllowed(ctx context.Context, db *sql.DB, sessionID uuid.UUID, stageID string, skipReason string, allowedStatuses []string) (*models.ProcessingStage, error)
	RetryIfFailed(ctx context.Context, db *sql.DB, sessionID uuid.UUID, stageID string) (*models.ProcessingStage, error)
	IncrementAttempt(ctx context.Context, id uuid.UUID, db *sql.DB) error
	Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error
	DeleteOldStagesBySessionStatus(ctx context.Context, db *sql.DB, status string, cutoff time.Time) (int, error)
}

var ErrNoRowsUpdated = errors.New("no rows updated")

type processingStageRepository struct {
	*BaseRepository[models.ProcessingStage]
}

func NewProcessingStageRepository(redis *redis.Client) ProcessingStageRepository {
	return &processingStageRepository{
		BaseRepository: NewBaseRepository[models.ProcessingStage](redis, "processing_stages"),
	}
}

func (r *processingStageRepository) Create(ctx context.Context, stage *models.ProcessingStage, db *sql.DB) error {
	query := `
		INSERT INTO processing_stages (
			id, session_id, stage_id, stage_name, display_name, stage_order,
			status, progress, message, metadata, dependencies, skip_reason, input_from_stage_id,
			can_skip, is_optional, attempt_count, started_at, completed_at, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
		)
	`

	if stage.ID == uuid.Nil {
		stage.ID = uuid.New()
	}

	now := time.Now()
	if stage.CreatedAt.IsZero() {
		stage.CreatedAt = now
	}
	stage.UpdatedAt = now

	// Initialize metadata if nil
	if stage.Metadata == nil {
		stage.Metadata = models.JSONMap{}
	}

	// Marshal JSONB fields manually to string
	dependenciesBytes, err := json.Marshal(stage.Dependencies)
	if err != nil {
		return err
	}

	metadataBytes, err := json.Marshal(stage.Metadata)
	if err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, query,
		stage.ID,
		stage.SessionID,
		stage.StageID,
		stage.StageName,
		stage.DisplayName,
		stage.StageOrder,
		stage.Status,
		stage.Progress,
		stage.Message,
		string(metadataBytes),
		string(dependenciesBytes),
		stage.SkipReason,
		stage.InputFromStageID,
		stage.CanSkip,
		stage.IsOptional,
		stage.AttemptCount,
		stage.StartedAt,
		stage.CompletedAt,
		stage.CreatedAt,
		stage.UpdatedAt,
	)

	return err
}

func (r *processingStageRepository) GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.ProcessingStage, error) {
	query := `
		SELECT id, session_id, stage_id, stage_name, display_name, stage_order,
			   status, progress, message, metadata, dependencies, skip_reason, input_from_stage_id,
			   can_skip, is_optional, attempt_count, started_at, completed_at, created_at, updated_at
		FROM processing_stages
		WHERE id = $1
	`

	var stage models.ProcessingStage
	err := db.QueryRowContext(ctx, query, id).Scan(
		&stage.ID,
		&stage.SessionID,
		&stage.StageID,
		&stage.StageName,
		&stage.DisplayName,
		&stage.StageOrder,
		&stage.Status,
		&stage.Progress,
		&stage.Message,
		&stage.Metadata,
		&stage.Dependencies,
		&stage.SkipReason,
		&stage.InputFromStageID,
		&stage.CanSkip,
		&stage.IsOptional,
		&stage.AttemptCount,
		&stage.StartedAt,
		&stage.CompletedAt,
		&stage.CreatedAt,
		&stage.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &stage, nil
}

func (r *processingStageRepository) GetBySessionID(ctx context.Context, sessionID uuid.UUID, db *sql.DB) ([]*models.ProcessingStage, error) {
	query := `
		SELECT id, session_id, stage_id, stage_name, display_name, stage_order,
			   status, progress, message, metadata, dependencies, skip_reason, input_from_stage_id,
			   can_skip, is_optional, attempt_count, started_at, completed_at, created_at, updated_at
		FROM processing_stages
		WHERE session_id = $1
		ORDER BY stage_order ASC
	`

	rows, err := db.QueryContext(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stages []*models.ProcessingStage
	for rows.Next() {
		var stage models.ProcessingStage
		err := rows.Scan(
			&stage.ID,
			&stage.SessionID,
			&stage.StageID,
			&stage.StageName,
			&stage.DisplayName,
			&stage.StageOrder,
			&stage.Status,
			&stage.Progress,
			&stage.Message,
			&stage.Metadata,
			&stage.Dependencies,
			&stage.SkipReason,
			&stage.InputFromStageID,
			&stage.CanSkip,
			&stage.IsOptional,
			&stage.AttemptCount,
			&stage.StartedAt,
			&stage.CompletedAt,
			&stage.CreatedAt,
			&stage.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		stages = append(stages, &stage)
	}

	return stages, rows.Err()
}

func (r *processingStageRepository) GetBySessionAndStageID(ctx context.Context, sessionID uuid.UUID, stageID string, db *sql.DB) (*models.ProcessingStage, error) {
	query := `
		SELECT id, session_id, stage_id, stage_name, display_name, stage_order,
			   status, progress, message, metadata, dependencies, skip_reason, input_from_stage_id,
			   can_skip, is_optional, attempt_count, started_at, completed_at, created_at, updated_at
		FROM processing_stages
		WHERE session_id = $1 AND stage_id = $2
	`

	var stage models.ProcessingStage
	err := db.QueryRowContext(ctx, query, sessionID, stageID).Scan(
		&stage.ID,
		&stage.SessionID,
		&stage.StageID,
		&stage.StageName,
		&stage.DisplayName,
		&stage.StageOrder,
		&stage.Status,
		&stage.Progress,
		&stage.Message,
		&stage.Metadata,
		&stage.Dependencies,
		&stage.SkipReason,
		&stage.InputFromStageID,
		&stage.CanSkip,
		&stage.IsOptional,
		&stage.AttemptCount,
		&stage.StartedAt,
		&stage.CompletedAt,
		&stage.CreatedAt,
		&stage.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &stage, nil
}

func (r *processingStageRepository) Update(ctx context.Context, stage *models.ProcessingStage, db *sql.DB) error {
	query := `
		UPDATE processing_stages SET
			status = $2, progress = $3, message = $4, skip_reason = $5,
			input_from_stage_id = $6, attempt_count = $7, started_at = $8,
			completed_at = $9, metadata = $10, updated_at = $11
		WHERE id = $1
	`

	stage.UpdatedAt = time.Now()

	// Initialize metadata if nil
	if stage.Metadata == nil {
		stage.Metadata = models.JSONMap{}
	}

	// Marshal metadata to JSON string
	metadataBytes, err := json.Marshal(stage.Metadata)
	if err != nil {
		return err
	}

	result, err := db.ExecContext(ctx, query,
		stage.ID,
		stage.Status,
		stage.Progress,
		stage.Message,
		stage.SkipReason,
		stage.InputFromStageID,
		stage.AttemptCount,
		stage.StartedAt,
		stage.CompletedAt,
		string(metadataBytes),
		stage.UpdatedAt,
	)

	if err != nil {
		return err
	}

	// CRITICAL DIAGNOSTIC: Check rows affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("UPDATE affected 0 rows - stage ID may not exist: %s", stage.ID.String())
	}

	// Log successful update for debugging
	// Note: This is a repository layer so we don't have logger, but we can use fmt for now
	// Remove this after debugging
	fmt.Printf("[DEBUG] Successfully updated stage %s to status=%s, rows_affected=%d\n",
		stage.ID.String(), stage.Status, rowsAffected)

	return nil
}

func (r *processingStageRepository) UpdateStatusIfIn(ctx context.Context, db *sql.DB, sessionID uuid.UUID, stageID string, newStatus string, completedAt *time.Time, allowedStatuses []string) (*models.ProcessingStage, error) {
	if len(allowedStatuses) == 0 {
		return nil, fmt.Errorf("allowedStatuses must not be empty")
	}

	placeholders := make([]string, len(allowedStatuses))
	args := make([]interface{}, 0, len(allowedStatuses)+4)

	// args ordering: 1=session_id, 2=stage_id, 3=newStatus, 4=completedAt, then allowedStatuses...
	args = append(args, sessionID, stageID, newStatus, completedAt)

	for i := range allowedStatuses {
		placeholders[i] = fmt.Sprintf("$%d", 5+i)
		args = append(args, allowedStatuses[i])
	}

	query := fmt.Sprintf(`
		UPDATE processing_stages
		SET status = $3, completed_at = $4, updated_at = now()
		WHERE session_id = $1 AND stage_id = $2 AND status IN (%s)
		RETURNING id, session_id, stage_id, stage_name, display_name, stage_order,
		          status, progress, message, metadata, dependencies, skip_reason,
		          input_from_stage_id, can_skip, is_optional, attempt_count,
		          started_at, completed_at, created_at, updated_at
	`, strings.Join(placeholders, ","))

	row := db.QueryRowContext(ctx, query, args...)

	var out models.ProcessingStage
	var metadataStr sql.NullString

	if err := row.Scan(
		&out.ID,
		&out.SessionID,
		&out.StageID,
		&out.StageName,
		&out.DisplayName,
		&out.StageOrder,
		&out.Status,
		&out.Progress,
		&out.Message,
		&metadataStr,
		&out.Dependencies,
		&out.SkipReason,
		&out.InputFromStageID,
		&out.CanSkip,
		&out.IsOptional,
		&out.AttemptCount,
		&out.StartedAt,
		&out.CompletedAt,
		&out.CreatedAt,
		&out.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsUpdated
		}
		return nil, err
	}

	if metadataStr.Valid && metadataStr.String != "" {
		var mm models.JSONMap
		if err := json.Unmarshal([]byte(metadataStr.String), &mm); err == nil {
			out.Metadata = mm
		} else {
			out.Metadata = models.JSONMap{}
		}
	} else {
		out.Metadata = models.JSONMap{}
	}

	return &out, nil
}

func (r *processingStageRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string, progress int, message *string, db *sql.DB) error {
	// First, get current stage state for logging
	var currentStatus string
	checkQuery := `SELECT status FROM processing_stages WHERE id = $1`
	_ = db.QueryRowContext(ctx, checkQuery, id).Scan(&currentStatus)

	query := `
		UPDATE processing_stages
		SET status = $2, progress = $3, message = $4, updated_at = $5
		WHERE id = $1
		  AND status NOT IN ('reviewing', 'completed', 'accepted', 'failed', 'cancelled', 'skipped', 'skipped_auto')
	`

	result, err := db.ExecContext(ctx, query, id, status, progress, message, time.Now())
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		// CRITICAL DIAGNOSTIC: Atomic protection triggered - stage already in terminal state
		fmt.Printf("[RACE-PROTECTION] UpdateStatus blocked: stage_id=%s, current_status=%s, attempted_status=%s, progress=%d (this is expected and correct behavior)\n",
			id.String(), currentStatus, status, progress)
		return nil
	}

	// Log successful update
	fmt.Printf("[DEBUG] UpdateStatus success: stage_id=%s, old_status=%s → new_status=%s, progress=%d, rows_affected=%d\n",
		id.String(), currentStatus, status, progress, rowsAffected)

	return nil
}

func (r *processingStageRepository) SkipStage(ctx context.Context, id uuid.UUID, skipReason string, db *sql.DB) error {
	query := `
		UPDATE processing_stages
		SET status = $2, skip_reason = $3, completed_at = $4, updated_at = $5
		WHERE id = $1
	`

	now := time.Now()
	_, err := db.ExecContext(ctx, query, id, models.StageStatusSkipped, skipReason, now, now)
	return err
}

func (r *processingStageRepository) IncrementAttempt(ctx context.Context, id uuid.UUID, db *sql.DB) error {
	query := `
		UPDATE processing_stages
		SET attempt_count = attempt_count + 1, updated_at = $2
		WHERE id = $1
	`

	_, err := db.ExecContext(ctx, query, id, time.Now())
	return err
}

func (r *processingStageRepository) Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM processing_stages WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id)
	return err
}

// SkipIfAllowed atomically skips a stage only if it's in an allowed status
// Returns ErrNoRowsUpdated if stage is not in an allowed status (e.g., already completed)
func (r *processingStageRepository) SkipIfAllowed(ctx context.Context, db *sql.DB, sessionID uuid.UUID, stageID string, skipReason string, allowedStatuses []string) (*models.ProcessingStage, error) {
	if len(allowedStatuses) == 0 {
		return nil, fmt.Errorf("allowedStatuses must not be empty")
	}

	placeholders := make([]string, len(allowedStatuses))
	args := make([]interface{}, 0, len(allowedStatuses)+4)

	now := time.Now()
	// args ordering: 1=session_id, 2=stage_id, 3=skipReason, 4=completedAt, then allowedStatuses...
	args = append(args, sessionID, stageID, skipReason, now)

	for i := range allowedStatuses {
		placeholders[i] = fmt.Sprintf("$%d", 5+i)
		args = append(args, allowedStatuses[i])
	}

	query := fmt.Sprintf(`
		UPDATE processing_stages
		SET status = '%s', skip_reason = $3, completed_at = $4, updated_at = now()
		WHERE session_id = $1 AND stage_id = $2 AND status IN (%s)
		RETURNING id, session_id, stage_id, stage_name, display_name, stage_order,
		          status, progress, message, metadata, dependencies, skip_reason,
		          input_from_stage_id, can_skip, is_optional, attempt_count,
		          started_at, completed_at, created_at, updated_at
	`, models.StageStatusSkipped, strings.Join(placeholders, ","))

	row := db.QueryRowContext(ctx, query, args...)

	var out models.ProcessingStage
	var metadataStr sql.NullString

	if err := row.Scan(
		&out.ID,
		&out.SessionID,
		&out.StageID,
		&out.StageName,
		&out.DisplayName,
		&out.StageOrder,
		&out.Status,
		&out.Progress,
		&out.Message,
		&metadataStr,
		&out.Dependencies,
		&out.SkipReason,
		&out.InputFromStageID,
		&out.CanSkip,
		&out.IsOptional,
		&out.AttemptCount,
		&out.StartedAt,
		&out.CompletedAt,
		&out.CreatedAt,
		&out.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsUpdated
		}
		return nil, err
	}

	if metadataStr.Valid && metadataStr.String != "" {
		var mm models.JSONMap
		if err := json.Unmarshal([]byte(metadataStr.String), &mm); err == nil {
			out.Metadata = mm
		} else {
			out.Metadata = models.JSONMap{}
		}
	} else {
		out.Metadata = models.JSONMap{}
	}

	return &out, nil
}

// RetryIfFailed atomically resets a stage to pending status only if it's in a failed/skipped/cancelled/processing state
// Also increments attempt_count and clears error fields
// Returns ErrNoRowsUpdated if stage is not in a retryable status
func (r *processingStageRepository) RetryIfFailed(ctx context.Context, db *sql.DB, sessionID uuid.UUID, stageID string) (*models.ProcessingStage, error) {
	query := fmt.Sprintf(`
		UPDATE processing_stages
		SET status = '%s',
		    started_at = NULL,
		    completed_at = NULL,
		    message = NULL,
		    skip_reason = NULL,
		    progress = 0,
		    attempt_count = attempt_count + 1,
		    updated_at = now()
		WHERE session_id = $1 AND stage_id = $2
		  AND status IN ($3, $4, $5, $6, $7)
		RETURNING id, session_id, stage_id, stage_name, display_name, stage_order,
		          status, progress, message, metadata, dependencies, skip_reason,
		          input_from_stage_id, can_skip, is_optional, attempt_count,
		          started_at, completed_at, created_at, updated_at
	`, models.StageStatusPending)

	row := db.QueryRowContext(ctx, query, sessionID, stageID,
		models.StageStatusFailed, models.StageStatusSkipped,
		models.StageStatusSkippedAuto, models.StageStatusCancelled,
		models.StageStatusProcessing)

	var out models.ProcessingStage
	var metadataStr sql.NullString

	if err := row.Scan(
		&out.ID,
		&out.SessionID,
		&out.StageID,
		&out.StageName,
		&out.DisplayName,
		&out.StageOrder,
		&out.Status,
		&out.Progress,
		&out.Message,
		&metadataStr,
		&out.Dependencies,
		&out.SkipReason,
		&out.InputFromStageID,
		&out.CanSkip,
		&out.IsOptional,
		&out.AttemptCount,
		&out.StartedAt,
		&out.CompletedAt,
		&out.CreatedAt,
		&out.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsUpdated
		}
		return nil, err
	}

	if metadataStr.Valid && metadataStr.String != "" {
		var mm models.JSONMap
		if err := json.Unmarshal([]byte(metadataStr.String), &mm); err == nil {
			out.Metadata = mm
		} else {
			out.Metadata = models.JSONMap{}
		}
	} else {
		out.Metadata = models.JSONMap{}
	}

	return &out, nil
}

func IsRetryableDBError(err error) bool {
	if err == nil {
		return false
	}
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		switch string(pqErr.Code) {
		case "40001", "40P01":
			return true
		}
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.SQLState() {
		case "40001", "40P01":
			return true
		}
	}
	return false
}

// DeleteOldStagesBySessionStatus deletes stages for sessions with the given status older than cutoff
// Uses appropriate timestamp column based on session status:
// - Cancelled: last_activity_at (when user last interacted)
// - Completed/Failed: completed_at (when session finished)
func (r *processingStageRepository) DeleteOldStagesBySessionStatus(ctx context.Context, db *sql.DB, status string, cutoff time.Time) (int, error) {
	var query string

	if status == "cancelled" {
		query = `
			DELETE FROM processing_stages
			WHERE session_id IN (
				SELECT id FROM processing_sessions
				WHERE status = $1 AND last_activity_at < $2
			)
		`
	} else {
		// For completed/failed sessions, use completed_at
		query = `
			DELETE FROM processing_stages
			WHERE session_id IN (
				SELECT id FROM processing_sessions
				WHERE status = $1 AND completed_at < $2
			)
		`
	}

	result, err := db.ExecContext(ctx, query, status, cutoff)
	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, err
	}

	return int(rowsAffected), nil
}
