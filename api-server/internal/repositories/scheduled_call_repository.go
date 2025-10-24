// internal/repositories/scheduled_call_repository.go
package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"go.uber.org/zap"
)

type ScheduledCallRepositoryImpl struct {
	logger *zap.Logger
}

func NewScheduledCallRepository(logger *zap.Logger) models.ScheduledCallRepository {
	return &ScheduledCallRepositoryImpl{
		logger: logger,
	}
}

// Create creates a new scheduled call record
func (r *ScheduledCallRepositoryImpl) Create(ctx context.Context, call *models.ScheduledCall, db *sql.DB) error {
	query := `
		INSERT INTO scheduled_calls (
			id, testimonial_id, workspace_id, customer_name, customer_email,
			customer_phone, company, scheduled_at, timezone, preferred_call_time,
			provider, additional_notes, status, attempt_count, max_attempts,
			created_at, updated_at, metadata
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
		)`

	metadataBytes, err := json.Marshal(call.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	_, err = db.ExecContext(ctx, query,
		call.ID, call.TestimonialID, call.WorkspaceID, call.CustomerName, call.CustomerEmail,
		call.CustomerPhone, call.Company, call.ScheduledAt, call.Timezone, call.PreferredCallTime,
		call.Provider, call.AdditionalNotes, call.Status, call.AttemptCount, call.MaxAttempts,
		call.CreatedAt, call.UpdatedAt, metadataBytes,
	)

	if err != nil {
		r.logger.Error("Failed to create scheduled call", zap.Error(err))
		return fmt.Errorf("failed to create scheduled call: %w", err)
	}

	r.logger.Info("Scheduled call created successfully", zap.String("call_id", call.ID.String()))
	return nil
}

// Update updates an existing scheduled call record
func (r *ScheduledCallRepositoryImpl) Update(ctx context.Context, call *models.ScheduledCall, id uuid.UUID, db *sql.DB) error {
	query := `
		UPDATE scheduled_calls SET
			customer_name = $2, customer_email = $3, customer_phone = $4, company = $5,
			scheduled_at = $6, timezone = $7, preferred_call_time = $8, provider = $9,
			additional_notes = $10, status = $11, call_id = $12, attempt_count = $13,
			max_attempts = $14, updated_at = $15, executed_at = $16, metadata = $17
		WHERE id = $1`

	metadataBytes, err := json.Marshal(call.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	result, err := db.ExecContext(ctx, query,
		id, call.CustomerName, call.CustomerEmail, call.CustomerPhone, call.Company,
		call.ScheduledAt, call.Timezone, call.PreferredCallTime, call.Provider,
		call.AdditionalNotes, call.Status, call.CallID, call.AttemptCount,
		call.MaxAttempts, time.Now(), call.ExecutedAt, metadataBytes,
	)

	if err != nil {
		r.logger.Error("Failed to update scheduled call", zap.Error(err))
		return fmt.Errorf("failed to update scheduled call: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("scheduled call not found with id: %s", id.String())
	}

	r.logger.Info("Scheduled call updated successfully", zap.String("call_id", id.String()))
	return nil
}

// FetchByID retrieves a scheduled call by ID
func (r *ScheduledCallRepositoryImpl) FetchByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.ScheduledCall, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, customer_name, customer_email,
			   customer_phone, company, scheduled_at, timezone, preferred_call_time,
			   provider, additional_notes, status, call_id, attempt_count,
			   max_attempts, created_at, updated_at, executed_at, metadata
		FROM scheduled_calls WHERE id = $1`

	var call models.ScheduledCall
	var metadataBytes []byte

	err := db.QueryRowContext(ctx, query, id).Scan(
		&call.ID, &call.TestimonialID, &call.WorkspaceID, &call.CustomerName, &call.CustomerEmail,
		&call.CustomerPhone, &call.Company, &call.ScheduledAt, &call.Timezone, &call.PreferredCallTime,
		&call.Provider, &call.AdditionalNotes, &call.Status, &call.CallID, &call.AttemptCount,
		&call.MaxAttempts, &call.CreatedAt, &call.UpdatedAt, &call.ExecutedAt, &metadataBytes,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("scheduled call not found with id: %s", id.String())
		}
		r.logger.Error("Failed to fetch scheduled call", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch scheduled call: %w", err)
	}

	// Unmarshal metadata
	if err := json.Unmarshal(metadataBytes, &call.Metadata); err != nil {
		r.logger.Warn("Failed to unmarshal metadata", zap.Error(err))
		call.Metadata = make(models.JSONMap)
	}

	return &call, nil
}

// FetchByTestimonialID retrieves a scheduled call by testimonial ID
func (r *ScheduledCallRepositoryImpl) FetchByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) (*models.ScheduledCall, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, customer_name, customer_email,
			   customer_phone, company, scheduled_at, timezone, preferred_call_time,
			   provider, additional_notes, status, call_id, attempt_count,
			   max_attempts, created_at, updated_at, executed_at, metadata
		FROM scheduled_calls WHERE testimonial_id = $1 ORDER BY created_at DESC LIMIT 1`

	var call models.ScheduledCall
	var metadataBytes []byte

	err := db.QueryRowContext(ctx, query, testimonialID).Scan(
		&call.ID, &call.TestimonialID, &call.WorkspaceID, &call.CustomerName, &call.CustomerEmail,
		&call.CustomerPhone, &call.Company, &call.ScheduledAt, &call.Timezone, &call.PreferredCallTime,
		&call.Provider, &call.AdditionalNotes, &call.Status, &call.CallID, &call.AttemptCount,
		&call.MaxAttempts, &call.CreatedAt, &call.UpdatedAt, &call.ExecutedAt, &metadataBytes,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no scheduled call found for testimonial: %s", testimonialID.String())
		}
		r.logger.Error("Failed to fetch scheduled call by testimonial", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch scheduled call: %w", err)
	}

	// Unmarshal metadata
	if err := json.Unmarshal(metadataBytes, &call.Metadata); err != nil {
		r.logger.Warn("Failed to unmarshal metadata", zap.Error(err))
		call.Metadata = make(models.JSONMap)
	}

	return &call, nil
}

// FetchPendingCalls retrieves scheduled calls that are pending execution
func (r *ScheduledCallRepositoryImpl) FetchPendingCalls(ctx context.Context, limit int, db *sql.DB) ([]*models.ScheduledCall, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, customer_name, customer_email,
			   customer_phone, company, scheduled_at, timezone, preferred_call_time,
			   provider, additional_notes, status, call_id, attempt_count,
			   max_attempts, created_at, updated_at, executed_at, metadata
		FROM scheduled_calls
		WHERE status = 'scheduled'
		ORDER BY scheduled_at ASC
		LIMIT $1`

	rows, err := db.QueryContext(ctx, query, limit)
	if err != nil {
		r.logger.Error("Failed to fetch pending calls", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch pending calls: %w", err)
	}
	defer rows.Close()

	var calls []*models.ScheduledCall
	for rows.Next() {
		var call models.ScheduledCall
		var metadataBytes []byte

		err := rows.Scan(
			&call.ID, &call.TestimonialID, &call.WorkspaceID, &call.CustomerName, &call.CustomerEmail,
			&call.CustomerPhone, &call.Company, &call.ScheduledAt, &call.Timezone, &call.PreferredCallTime,
			&call.Provider, &call.AdditionalNotes, &call.Status, &call.CallID, &call.AttemptCount,
			&call.MaxAttempts, &call.CreatedAt, &call.UpdatedAt, &call.ExecutedAt, &metadataBytes,
		)

		if err != nil {
			r.logger.Error("Failed to scan pending call", zap.Error(err))
			continue
		}

		// Unmarshal metadata
		if err := json.Unmarshal(metadataBytes, &call.Metadata); err != nil {
			r.logger.Warn("Failed to unmarshal metadata", zap.Error(err))
			call.Metadata = make(models.JSONMap)
		}

		calls = append(calls, &call)
	}

	return calls, nil
}

// FetchDueCalls retrieves calls that are due for execution
func (r *ScheduledCallRepositoryImpl) FetchDueCalls(ctx context.Context, beforeTime time.Time, limit int, db *sql.DB) ([]*models.ScheduledCall, error) {
	query := `
		SELECT id, testimonial_id, workspace_id, customer_name, customer_email,
			   customer_phone, company, scheduled_at, timezone, preferred_call_time,
			   provider, additional_notes, status, call_id, attempt_count,
			   max_attempts, created_at, updated_at, executed_at, metadata
		FROM scheduled_calls
		WHERE status = 'scheduled' AND scheduled_at <= $1 AND attempt_count < max_attempts
		ORDER BY scheduled_at ASC
		LIMIT $2`

	rows, err := db.QueryContext(ctx, query, beforeTime, limit)
	if err != nil {
		r.logger.Error("Failed to fetch due calls", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch due calls: %w", err)
	}
	defer rows.Close()

	var calls []*models.ScheduledCall
	for rows.Next() {
		var call models.ScheduledCall
		var metadataBytes []byte

		err := rows.Scan(
			&call.ID, &call.TestimonialID, &call.WorkspaceID, &call.CustomerName, &call.CustomerEmail,
			&call.CustomerPhone, &call.Company, &call.ScheduledAt, &call.Timezone, &call.PreferredCallTime,
			&call.Provider, &call.AdditionalNotes, &call.Status, &call.CallID, &call.AttemptCount,
			&call.MaxAttempts, &call.CreatedAt, &call.UpdatedAt, &call.ExecutedAt, &metadataBytes,
		)

		if err != nil {
			r.logger.Error("Failed to scan due call", zap.Error(err))
			continue
		}

		// Unmarshal metadata
		if err := json.Unmarshal(metadataBytes, &call.Metadata); err != nil {
			r.logger.Warn("Failed to unmarshal metadata", zap.Error(err))
			call.Metadata = make(models.JSONMap)
		}

		calls = append(calls, &call)
	}

	return calls, nil
}

// Delete removes a scheduled call record
func (r *ScheduledCallRepositoryImpl) Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM scheduled_calls WHERE id = $1`

	result, err := db.ExecContext(ctx, query, id)
	if err != nil {
		r.logger.Error("Failed to delete scheduled call", zap.Error(err))
		return fmt.Errorf("failed to delete scheduled call: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("scheduled call not found with id: %s", id.String())
	}

	r.logger.Info("Scheduled call deleted successfully", zap.String("call_id", id.String()))
	return nil
}