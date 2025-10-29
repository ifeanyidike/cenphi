// internal/models/scheduled_call.go
package models

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// ScheduledCall represents a scheduled voice testimonial call
type ScheduledCall struct {
	ID            uuid.UUID `json:"id" db:"id"`
	TestimonialID uuid.UUID `json:"testimonial_id" db:"testimonial_id"`
	WorkspaceID   uuid.UUID `json:"workspace_id" db:"workspace_id"`

	// Call details
	CustomerName  string  `json:"customer_name" db:"customer_name"`
	CustomerEmail *string `json:"customer_email" db:"customer_email"`
	CustomerPhone string  `json:"customer_phone" db:"customer_phone"`
	Company       *string `json:"company" db:"company"`

	// Scheduling information
	ScheduledAt         time.Time `json:"scheduled_at" db:"scheduled_at"`
	Timezone            string    `json:"timezone" db:"timezone"`
	PreferredCallTime   *string   `json:"preferred_call_time" db:"preferred_call_time"`

	// Call configuration
	Provider        string  `json:"provider" db:"provider"` // 'vapi' or 'twilio'
	AdditionalNotes *string `json:"additional_notes" db:"additional_notes"`

	// Status tracking
	Status       string  `json:"status" db:"status"` // 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled'
	CallID       *string `json:"call_id" db:"call_id"` // Vapi call ID or Twilio call SID
	AttemptCount int     `json:"attempt_count" db:"attempt_count"`
	MaxAttempts  int     `json:"max_attempts" db:"max_attempts"`

	// Timestamps
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at" db:"updated_at"`
	ExecutedAt *time.Time `json:"executed_at" db:"executed_at"`

	// Metadata
	Metadata JSONMap `json:"metadata" db:"metadata"`
}

// ScheduledCallRepository defines the interface for scheduled call operations
type ScheduledCallRepository interface {
	Create(ctx context.Context, call *ScheduledCall, db *sql.DB) error
	Update(ctx context.Context, call *ScheduledCall, id uuid.UUID, db *sql.DB) error
	FetchByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*ScheduledCall, error)
	FetchByTestimonialID(ctx context.Context, testimonialID uuid.UUID, db *sql.DB) (*ScheduledCall, error)
	FetchPendingCalls(ctx context.Context, limit int, db *sql.DB) ([]*ScheduledCall, error)
	FetchDueCalls(ctx context.Context, beforeTime time.Time, limit int, db *sql.DB) ([]*ScheduledCall, error)
	Delete(ctx context.Context, id uuid.UUID, db *sql.DB) error
}