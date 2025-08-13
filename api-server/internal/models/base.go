package models

import (
	"time"

	"github.com/google/uuid"
)

// BaseModel is a shared structure for common fields.
type BaseModel struct {
	ID        int64     `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Job struct {
	ID      uuid.UUID `db:"id" json:"id"`
	JobType string    `db:"job_type" json:"job_type"`

	TestimonialID   *uuid.UUID `db:"testimonial_id" json:"testimonial_id,omitempty"`
	SocialPostID    *uuid.UUID `db:"social_post_id" json:"social_post_id,omitempty"`
	SocialAccountID *uuid.UUID `db:"social_account_id" json:"social_account_id,omitempty"`
	WorkspaceID     *uuid.UUID `db:"workspace_id" json:"workspace_id,omitempty"`

	Status      string     `db:"status" json:"status"`
	Priority    int        `db:"priority" json:"priority"`
	ScheduledAt *time.Time `db:"scheduled_at" json:"scheduled_at,omitempty"`

	Payload JSONMap `db:"payload" json:"payload"`
	Result  JSONMap `db:"result" json:"result"`

	ErrorMessage *string `db:"error_message" json:"error_message,omitempty"`
	RetryCount   int     `db:"retry_count" json:"retry_count"`
	MaxRetries   int     `db:"max_retries" json:"max_retries"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}
