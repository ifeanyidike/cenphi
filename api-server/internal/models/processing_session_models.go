package models

import (
	"time"

	"github.com/google/uuid"
)

// ProcessingSession represents a studio processing session in the database
type ProcessingSession struct {
	ID                uuid.UUID              `db:"id" json:"id"`
	TestimonialID     *uuid.UUID             `db:"testimonial_id" json:"testimonial_id,omitempty"`
	WorkspaceID       uuid.UUID              `db:"workspace_id" json:"workspace_id"`
	SessionType       string                 `db:"session_type" json:"session_type"` // 'single_testimonial', 'story_generation'
	Status            string                 `db:"status" json:"status"`             // 'active', 'paused', 'completed', 'cancelled', 'partial_saved'
	CurrentStageID    *string                `db:"current_stage_id" json:"current_stage_id,omitempty"`
	AcceptedVersions  JSONMap                `db:"accepted_versions" json:"accepted_versions"` // Maps stage_id to version_id
	SelectedStages    JSONArray              `db:"selected_stages" json:"selected_stages"`     // Array of stage IDs user selected
	AutoProceed       bool                   `db:"auto_proceed" json:"auto_proceed"`           // Auto-proceed vs wait for user input
	PausedAt          *time.Time             `db:"paused_at" json:"paused_at,omitempty"`
	PausedByUser      bool                   `db:"paused_by_user" json:"paused_by_user"`
	ResumeFromStageID *string                `db:"resume_from_stage_id" json:"resume_from_stage_id,omitempty"`
	TotalSteps        int                    `db:"total_steps" json:"total_steps"`
	CompletedSteps    int                    `db:"completed_steps" json:"completed_steps"`
	SkippedSteps      int                    `db:"skipped_steps" json:"skipped_steps"`
	Metadata          JSONMap                `db:"metadata" json:"metadata"`
	StartedAt         time.Time              `db:"started_at" json:"started_at"`
	UpdatedAt         time.Time              `db:"updated_at" json:"updated_at"`
	CompletedAt       *time.Time             `db:"completed_at" json:"completed_at,omitempty"`
	LastActivityAt    time.Time              `db:"last_activity_at" json:"last_activity_at"` // Last user interaction (accept/skip/retry)
	IsStale           bool                   `db:"is_stale" json:"is_stale"`                 // Marked stale due to 30min inactivity
	StaleMarkedAt     *time.Time             `db:"stale_marked_at" json:"stale_marked_at,omitempty"`
}

// ProcessingStage represents a processing stage in the database
type ProcessingStage struct {
	ID              uuid.UUID  `db:"id" json:"id"`
	SessionID       uuid.UUID  `db:"session_id" json:"session_id"`
	StageID         string     `db:"stage_id" json:"stage_id"` // Identifier like 'crop_resize', 'burn_captions'
	StageName       string     `db:"stage_name" json:"stage_name"`
	DisplayName     string     `db:"display_name" json:"display_name"`
	StageOrder      int        `db:"stage_order" json:"stage_order"`
	Status          string     `db:"status" json:"status"` // 'pending', 'processing', 'completed', 'reviewing', 'accepted', 'skipped', 'skipped_auto', 'failed'
	Progress        int        `db:"progress" json:"progress"`
	Message         *string    `db:"message" json:"message,omitempty"`
	Metadata        JSONMap    `db:"metadata" json:"metadata"` // BUGFIX #12: Store stage config and outputs for next stages
	Dependencies    JSONArray  `db:"dependencies" json:"dependencies"` // Array of stage_ids that must complete first
	SkipReason      *string    `db:"skip_reason" json:"skip_reason,omitempty"` // 'user_manual_skip', 'dependency_skipped', 'not_applicable'
	InputFromStageID *uuid.UUID `db:"input_from_stage_id" json:"input_from_stage_id,omitempty"` // Which stage's output to use as input
	CanSkip         bool       `db:"can_skip" json:"can_skip"`
	IsOptional      bool       `db:"is_optional" json:"is_optional"`
	AttemptCount    int        `db:"attempt_count" json:"attempt_count"` // For retry tracking
	StartedAt       *time.Time `db:"started_at" json:"started_at,omitempty"`
	CompletedAt     *time.Time `db:"completed_at" json:"completed_at,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
}

// StageVersion represents a version of stage output in the database
type StageVersion struct {
	ID          uuid.UUID  `db:"id" json:"id"`
	StageID     uuid.UUID  `db:"stage_id" json:"stage_id"`
	VersionData JSONMap    `db:"version_data" json:"version_data"`     // The actual processed data/result
	PreviewData JSONMap    `db:"preview_data" json:"preview_data"`     // Preview/snippet for UI display
	QualityScore *float64  `db:"quality_score" json:"quality_score"`   // 0.0-1.0 confidence score
	IsAccepted  bool       `db:"is_accepted" json:"is_accepted"`
	IsTemporary bool       `db:"is_temporary" json:"is_temporary"`     // Temporary versions can be discarded
	Metadata    JSONMap    `db:"metadata" json:"metadata"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
}

// SessionCheckpoint represents a checkpoint for pause/resume functionality
type SessionCheckpoint struct {
	ID               uuid.UUID `db:"id" json:"id"`
	SessionID        uuid.UUID `db:"session_id" json:"session_id"`
	CheckpointStageID string   `db:"checkpoint_stage_id" json:"checkpoint_stage_id"`
	CheckpointData   JSONMap   `db:"checkpoint_data" json:"checkpoint_data"` // Complete state to resume from
	CreatedAt        time.Time `db:"created_at" json:"created_at"`
}

// ContextualSuggestion represents AI-generated suggestions in the database
type ContextualSuggestion struct {
	ID               uuid.UUID  `db:"id" json:"id"`
	StageID          uuid.UUID  `db:"stage_id" json:"stage_id"`
	SuggestionType   string     `db:"suggestion_type" json:"suggestion_type"` // 'improvement', 'alternative', 'enhancement', 'fix'
	Title            string     `db:"title" json:"title"`
	Description      *string    `db:"description" json:"description,omitempty"`
	Category         string     `db:"category" json:"category"` // 'quality', 'style', 'content', 'technical'
	Confidence       float64    `db:"confidence" json:"confidence"` // 0.0-1.0
	Impact           string     `db:"impact" json:"impact"` // 'low', 'medium', 'high'
	ActionType       string     `db:"action_type" json:"action_type"` // 'regenerate', 'adjust_parameter', 'apply_filter'
	ActionParameters JSONMap    `db:"action_parameters" json:"action_parameters"`
	PreviewData      JSONMap    `db:"preview_data" json:"preview_data"` // Preview of applying suggestion
	IsApplied        bool       `db:"is_applied" json:"is_applied"`
	AppliedAt        *time.Time `db:"applied_at" json:"applied_at,omitempty"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
}

// StudioActionLog represents audit trail for user actions
type StudioActionLog struct {
	ID         uuid.UUID `db:"id" json:"id"`
	SessionID  uuid.UUID `db:"session_id" json:"session_id"`
	StageID    *string   `db:"stage_id" json:"stage_id,omitempty"`
	ActionType string    `db:"action_type" json:"action_type"` // 'accept', 'discard', 'regenerate', 'apply_suggestion', 'pause', 'resume', 'skip'
	ActionData JSONMap   `db:"action_data" json:"action_data"`
	UserID     *uuid.UUID `db:"user_id" json:"user_id,omitempty"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}

// SessionStatus constants
const (
	SessionStatusActive       = "active"
	SessionStatusPaused       = "paused"
	SessionStatusCompleted    = "completed"
	SessionStatusCancelled    = "cancelled"
	SessionStatusPartialSaved = "partial_saved"
)

// StageStatus constants
const (
	StageStatusPending     = "pending"
	StageStatusProcessing  = "processing"
	StageStatusCompleted   = "completed"
	StageStatusReviewing   = "reviewing"
	StageStatusAccepted    = "accepted"
	StageStatusSkipped     = "skipped"
	StageStatusSkippedAuto = "skipped_auto"
	StageStatusFailed      = "failed"
	StageStatusCancelled   = "cancelled"
)

// SkipReason constants
const (
	SkipReasonUserManual       = "user_manual_skip"
	SkipReasonDependencySkipped = "dependency_skipped"
	SkipReasonNotApplicable    = "not_applicable"
)

// ActionType constants
const (
	ActionTypeAccept           = "accept"
	ActionTypeDiscard          = "discard"
	ActionTypeRegenerate       = "regenerate"
	ActionTypeApplySuggestion  = "apply_suggestion"
	ActionTypePause            = "pause"
	ActionTypeResume           = "resume"
	ActionTypeSkip             = "skip"
)

// TempArtifact represents a temporary processing artifact with TTL
type TempArtifact struct {
	ID             uuid.UUID  `db:"id" json:"id"`
	SessionID      uuid.UUID  `db:"session_id" json:"session_id"`
	StageID        *uuid.UUID `db:"stage_id" json:"stage_id,omitempty"`
	StoragePath    string     `db:"storage_path" json:"storage_path"`
	PreviewURL     *string    `db:"preview_url" json:"preview_url,omitempty"`
	ArtifactType   string     `db:"artifact_type" json:"artifact_type"` // 'video', 'audio', 'image', 'json'
	FileSizeBytes  *int64     `db:"file_size_bytes" json:"file_size_bytes,omitempty"`
	TTLExpiresAt   time.Time  `db:"ttl_expires_at" json:"ttl_expires_at"`
	ExtendedTTL    bool       `db:"extended_ttl" json:"extended_ttl"`
	IsCheckpoint   bool       `db:"is_checkpoint" json:"is_checkpoint"`
	Metadata       JSONMap    `db:"metadata" json:"metadata"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
}
