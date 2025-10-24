package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type JobRepository interface {
	Create(ctx context.Context, job *models.Job, db *sql.DB) error
	GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.Job, error)
	GetByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]*models.Job, error)
	GetPendingJobs(ctx context.Context, limit int, db *sql.DB) ([]*models.Job, error)
	Update(ctx context.Context, job *models.Job, db *sql.DB) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string, result models.JSONMap, errorMessage *string, db *sql.DB) error
	UpdateStatusIfIn(ctx context.Context, db *sql.DB, id uuid.UUID, newStatus string, allowedStatuses []string) (*models.Job, error)
	ClaimNextJob(ctx context.Context, db *sql.DB) (*models.Job, error)
	Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error
}

type jobRepository struct {
	*BaseRepository[models.Job]
}

func NewJobRepository(redis *redis.Client) JobRepository {
	return &jobRepository{
		BaseRepository: NewBaseRepository[models.Job](redis, "job"),
	}
}

func (r *jobRepository) Create(ctx context.Context, job *models.Job, db *sql.DB) error {
	query := `
		INSERT INTO jobs (
			id, job_type, testimonial_id, social_post_id, workspace_id,
			status, priority, payload, result, error_message, retry_count,
			max_retries, scheduled_at, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
	`

	if job.ID == uuid.Nil {
		job.ID = uuid.New()
	}

	now := time.Now()
	if job.CreatedAt.IsZero() {
		job.CreatedAt = now
	}
	job.UpdatedAt = now

	_, err := db.ExecContext(ctx, query,
		job.ID,
		job.JobType,
		job.TestimonialID,
		job.SocialPostID,
		job.WorkspaceID,
		job.Status,
		job.Priority,
		job.Payload,
		job.Result,
		job.ErrorMessage,
		job.RetryCount,
		job.MaxRetries,
		job.ScheduledAt,
		job.CreatedAt,
		job.UpdatedAt,
	)

	return err
}

func (r *jobRepository) GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.Job, error) {
	query := `
		SELECT id, job_type, testimonial_id, social_post_id, workspace_id,
			   status, priority, payload, result, error_message, retry_count,
			   max_retries, scheduled_at, created_at, updated_at
		FROM jobs WHERE id = $1
	`

	var job models.Job
	err := db.QueryRowContext(ctx, query, id).Scan(
		&job.ID,
		&job.JobType,
		&job.TestimonialID,
		&job.SocialPostID,
		&job.WorkspaceID,
		&job.Status,
		&job.Priority,
		&job.Payload,
		&job.Result,
		&job.ErrorMessage,
		&job.RetryCount,
		&job.MaxRetries,
		&job.ScheduledAt,
		&job.CreatedAt,
		&job.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &job, nil
}

func (r *jobRepository) GetByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) ([]*models.Job, error) {
	query := `
		SELECT id, job_type, testimonial_id, social_post_id, workspace_id,
			   status, priority, payload, result, error_message, retry_count,
			   max_retries, scheduled_at, created_at, updated_at
		FROM jobs 
		WHERE testimonial_id = $1
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, testimonialID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []*models.Job
	for rows.Next() {
		var job models.Job
		err := rows.Scan(
			&job.ID,
			&job.JobType,
			&job.TestimonialID,
			&job.SocialPostID,
			&job.WorkspaceID,
			&job.Status,
			&job.Priority,
			&job.Payload,
			&job.Result,
			&job.ErrorMessage,
			&job.RetryCount,
			&job.MaxRetries,
			&job.ScheduledAt,
			&job.CreatedAt,
			&job.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		jobs = append(jobs, &job)
	}

	return jobs, rows.Err()
}

func (r *jobRepository) GetPendingJobs(ctx context.Context, limit int, db *sql.DB) ([]*models.Job, error) {
	query := `
		SELECT id, job_type, testimonial_id, social_post_id, workspace_id,
			   status, priority, payload, result, error_message, retry_count,
			   max_retries, scheduled_at, created_at, updated_at
		FROM jobs 
		WHERE status = 'pending' AND scheduled_at <= NOW()
		ORDER BY priority ASC, created_at ASC
		LIMIT $1
	`

	rows, err := db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []*models.Job
	for rows.Next() {
		var job models.Job
		err := rows.Scan(
			&job.ID,
			&job.JobType,
			&job.TestimonialID,
			&job.SocialPostID,
			&job.WorkspaceID,
			&job.Status,
			&job.Priority,
			&job.Payload,
			&job.Result,
			&job.ErrorMessage,
			&job.RetryCount,
			&job.MaxRetries,
			&job.ScheduledAt,
			&job.CreatedAt,
			&job.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		jobs = append(jobs, &job)
	}

	return jobs, rows.Err()
}

func (r *jobRepository) Update(ctx context.Context, job *models.Job, db *sql.DB) error {
	query := `
		UPDATE jobs SET
			status = $2, payload = $3, result = $4, error_message = $5,
			retry_count = $6, updated_at = $7
		WHERE id = $1
	`

	job.UpdatedAt = time.Now()

	_, err := db.ExecContext(ctx, query,
		job.ID,
		job.Status,
		job.Payload,
		job.Result,
		job.ErrorMessage,
		job.RetryCount,
		job.UpdatedAt,
	)

	return err
}

func (r *jobRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string, result models.JSONMap, errorMessage *string, db *sql.DB) error {
	query := `
		UPDATE jobs SET
			status = $2, result = $3, error_message = $4, updated_at = $5
		WHERE id = $1
	`

	now := time.Now()

	_, err := db.ExecContext(ctx, query,
		id,
		status,
		result,
		errorMessage,
		now,
	)

	return err
}

func (r *jobRepository) Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM jobs WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id)
	return err
}

// UpdateStatusIfIn atomically updates job status only if current status is in allowedStatuses
// Returns ErrNoRowsUpdated if job is not in an allowed status (concurrency conflict)
func (r *jobRepository) UpdateStatusIfIn(ctx context.Context, db *sql.DB, id uuid.UUID, newStatus string, allowedStatuses []string) (*models.Job, error) {
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
		UPDATE jobs
		SET status = $2, updated_at = now()
		WHERE id = $1 AND status IN (%s)
		RETURNING id, job_type, testimonial_id, social_post_id, workspace_id,
		          status, priority, payload, result, error_message, retry_count,
		          max_retries, scheduled_at, created_at, updated_at
	`, strings.Join(placeholders, ","))

	row := db.QueryRowContext(ctx, query, args...)

	var job models.Job
	if err := row.Scan(
		&job.ID,
		&job.JobType,
		&job.TestimonialID,
		&job.SocialPostID,
		&job.WorkspaceID,
		&job.Status,
		&job.Priority,
		&job.Payload,
		&job.Result,
		&job.ErrorMessage,
		&job.RetryCount,
		&job.MaxRetries,
		&job.ScheduledAt,
		&job.CreatedAt,
		&job.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsUpdated
		}
		return nil, err
	}

	return &job, nil
}

// ClaimNextJob atomically claims the next available pending job
// Uses FOR UPDATE SKIP LOCKED to prevent multiple workers from claiming the same job
// Returns nil if no jobs are available
func (r *jobRepository) ClaimNextJob(ctx context.Context, db *sql.DB) (*models.Job, error) {
	query := `
		UPDATE jobs
		SET status = 'processing', updated_at = now()
		WHERE id = (
			SELECT id FROM jobs
			WHERE status = 'pending' AND scheduled_at <= NOW()
			ORDER BY priority ASC, created_at ASC
			LIMIT 1
			FOR UPDATE SKIP LOCKED
		)
		RETURNING id, job_type, testimonial_id, social_post_id, workspace_id,
		          status, priority, payload, result, error_message, retry_count,
		          max_retries, scheduled_at, created_at, updated_at
	`

	row := db.QueryRowContext(ctx, query)

	var job models.Job
	if err := row.Scan(
		&job.ID,
		&job.JobType,
		&job.TestimonialID,
		&job.SocialPostID,
		&job.WorkspaceID,
		&job.Status,
		&job.Priority,
		&job.Payload,
		&job.Result,
		&job.ErrorMessage,
		&job.RetryCount,
		&job.MaxRetries,
		&job.ScheduledAt,
		&job.CreatedAt,
		&job.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // No jobs available - this is not an error
		}
		return nil, err
	}

	return &job, nil
}
