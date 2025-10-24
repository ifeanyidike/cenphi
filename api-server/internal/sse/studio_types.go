package sse

import (
	"time"
)

// StudioEvent represents a studio-specific SSE event with rich processing data
type StudioEvent struct {
	ID           string                 `json:"id"`
	Type         string                 `json:"type"` // "session_created", "step_started", "step_progress", "step_complete", "preview_ready", "job_complete", "error", "heartbeat"
	SessionID    string                 `json:"session_id"` // Processing session ID
	StageID      *string                `json:"stage_id,omitempty"` // Current stage ID
	JobID        string                 `json:"job_id,omitempty"` // Legacy job ID for compatibility
	TestimonialID string                `json:"testimonial_id,omitempty"`
	WorkspaceID  string                 `json:"workspace_id,omitempty"`
	Stage        *ProcessingStageEvent  `json:"stage,omitempty"`
	Preview      *PreviewData          `json:"preview,omitempty"`
	Suggestions  []ContextualSuggestion `json:"suggestions,omitempty"`
	Options      []ActionOption        `json:"options,omitempty"`
	Data         map[string]interface{} `json:"data,omitempty"` // Generic event data
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	Timestamp    time.Time             `json:"timestamp"`
}

// ProcessingStageEvent represents the current stage of processing
type ProcessingStageEvent struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	DisplayName  string  `json:"display_name"`
	Order        int     `json:"order"`
	Status       string  `json:"status"` // "pending", "processing", "completed", "reviewing", "failed"
	Progress     int     `json:"progress"`
	Message      string  `json:"message,omitempty"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	Dependencies []string `json:"dependencies,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"` // Stage metadata including preview URLs
}

// PreviewData represents live preview content
type PreviewData struct {
	Type        string                 `json:"type"` // "text", "video_segment", "audio", "image", "json"
	Content     interface{}            `json:"content"` // Generic content (for backwards compatibility)
	PreviewURL  string                 `json:"preview_url,omitempty"` // URL for video/audio/image previews
	URL         string                 `json:"url,omitempty"` // Alias for preview_url
	Timestamp   *float64               `json:"timestamp,omitempty"` // For time-based content
	Quality     float64                `json:"quality"`             // 0.0-1.0 confidence score
	IsPartial   bool                   `json:"is_partial"`          // True if this is incremental data
	VersionID   string                 `json:"version_id,omitempty"`
	StageID     string                 `json:"stage_id"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"` // Metadata including aspect_ratio, duration, etc.
}

// ContextualSuggestion represents AI-generated suggestions
type ContextualSuggestion struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"` // "improvement", "alternative", "enhancement", "fix"
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"` // "quality", "style", "content", "technical"
	Confidence  float64               `json:"confidence"` // 0.0-1.0
	Impact      string                 `json:"impact"` // "low", "medium", "high"
	Action      SuggestionAction      `json:"action"`
	Preview     *PreviewData          `json:"preview,omitempty"` // Preview of applying suggestion
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// SuggestionAction defines the action to take for a suggestion
type SuggestionAction struct {
	Type       string                 `json:"type"` // "regenerate", "adjust_parameter", "apply_filter", "retry_with_config"
	Parameters map[string]interface{} `json:"parameters,omitempty"`
	StageID    string                 `json:"stage_id,omitempty"`
}

// ActionOption represents user actions available at each stage
type ActionOption struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"` // "accept", "discard", "regenerate", "edit", "skip"
	Label       string                 `json:"label"`
	Description string                 `json:"description,omitempty"`
	Icon        string                 `json:"icon,omitempty"`
	Variant     string                 `json:"variant"` // "primary", "secondary", "danger", "ghost"
	Enabled     bool                   `json:"enabled"`
	Parameters  map[string]interface{} `json:"parameters,omitempty"`
}

// StageDefinition defines the processing stages and their properties
type StageDefinition struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	DisplayName  string   `json:"display_name"`
	Description  string   `json:"description"`
	Order        int      `json:"order"`
	Dependencies []string `json:"dependencies"`
	EstimatedTime string   `json:"estimated_time"`
	OutputType   string   `json:"output_type"` // Expected output type for preview
	Category     string   `json:"category"`    // "analysis", "processing", "generation", "optimization"
	IsOptional   bool     `json:"is_optional"`
}

// ProcessingSession represents a complete studio processing session
type ProcessingSession struct {
	ID            string                         `json:"id"`
	TestimonialID string                         `json:"testimonial_id"`
	WorkspaceID   string                         `json:"workspace_id"`
	Type          string                         `json:"type"` // "single_testimonial", "story_generation"
	Status        string                         `json:"status"` // "active", "paused", "completed", "cancelled"
	AutoProceed   bool                           `json:"auto_proceed"` // Whether to auto-proceed through stages
	CurrentStage  string                         `json:"current_stage,omitempty"`
	Stages        map[string]*ProcessingStageEvent `json:"stages"`
	AcceptedVersions map[string]string           `json:"accepted_versions"` // stage_id -> version_id
	StartedAt     time.Time                      `json:"started_at"`
	UpdatedAt     time.Time                      `json:"updated_at"`
	CompletedAt   *time.Time                     `json:"completed_at,omitempty"`
	Metadata      map[string]interface{}         `json:"metadata,omitempty"`
}

// Standard processing stages for testimonials
var DefaultTestimonialStages = []StageDefinition{
	{
		ID:           "transcription",
		Name:         "transcription",
		DisplayName:  "Transcription",
		Description:  "Converting speech to text",
		Order:        1,
		Dependencies: []string{},
		EstimatedTime: "30-60s",
		OutputType:   "text",
		Category:     "analysis",
		IsOptional:   false,
	},
	{
		ID:           "sentiment_analysis",
		Name:         "sentiment_analysis",
		DisplayName:  "Sentiment Analysis",
		Description:  "Analyzing emotional tone and sentiment",
		Order:        2,
		Dependencies: []string{"transcription"},
		EstimatedTime: "10-20s",
		OutputType:   "json",
		Category:     "analysis",
		IsOptional:   false,
	},
	{
		ID:           "highlight_extraction",
		Name:         "highlight_extraction",
		DisplayName:  "Key Moments",
		Description:  "Identifying important segments",
		Order:        3,
		Dependencies: []string{"transcription", "sentiment_analysis"},
		EstimatedTime: "20-40s",
		OutputType:   "json",
		Category:     "analysis",
		IsOptional:   false,
	},
	{
		ID:           "enhancement",
		Name:         "enhancement",
		DisplayName:  "Video Enhancement",
		Description:  "Improving video quality and clarity",
		Order:        4,
		Dependencies: []string{},
		EstimatedTime: "60-120s",
		OutputType:   "video_segment",
		Category:     "processing",
		IsOptional:   true,
	},
	{
		ID:           "noise_removal",
		Name:         "noise_removal",
		DisplayName:  "Audio Cleanup",
		Description:  "Removing background noise",
		Order:        5,
		Dependencies: []string{},
		EstimatedTime: "30-60s",
		OutputType:   "audio",
		Category:     "processing",
		IsOptional:   true,
	},
	{
		ID:           "platform_optimization",
		Name:         "platform_optimization",
		DisplayName:  "Platform Optimization",
		Description:  "Optimizing for different social platforms",
		Order:        6,
		Dependencies: []string{"transcription"},
		EstimatedTime: "20-40s",
		OutputType:   "json",
		Category:     "optimization",
		IsOptional:   true,
	},
}