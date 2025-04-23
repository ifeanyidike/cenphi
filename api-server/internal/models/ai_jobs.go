package models

// models/ai_jobs.go

import (
	"time"

	"github.com/google/uuid"
)

// AIJob represents the AI processing job with input and output data
type AIJob struct {
	ID            uuid.UUID         `json:"id" db:"id"`
	TestimonialID uuid.UUID         `json:"testimonial_id" db:"testimonial_id"`
	JobType       AIServiceCategory `json:"job_type" db:"job_type"`
	Status        string            `json:"status" db:"status"`
	Priority      int               `json:"priority" db:"priority"`

	// Input parameters
	InputParameters JSONMap `json:"input_parameters" db:"input_parameters"`

	// Processing metadata
	StartedAt    *time.Time `json:"started_at,omitempty" db:"started_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	ErrorDetails JSONMap    `json:"error_details,omitempty" db:"error_details"`

	// Result data
	OutputData        JSONMap    `json:"output_data,omitempty" db:"output_data"`
	OutputReferenceID *uuid.UUID `json:"output_reference_id,omitempty" db:"output_reference_id"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
