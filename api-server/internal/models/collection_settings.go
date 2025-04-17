// models/collection_settings.go
package models

import (
	"time"

	"github.com/google/uuid"
)

// BrandGuide represents brand identity and display preferences
type BrandGuide struct {
	ID          uuid.UUID `json:"id" db:"id"`
	WorkspaceID uuid.UUID `json:"workspace_id" db:"workspace_id"`
	Name        string    `json:"name" db:"name"`

	// Brand identity
	Colors     JSONMap `json:"colors" db:"colors"`
	Typography JSONMap `json:"typography" db:"typography"`

	// Testimonial display settings
	TestimonialStyle  string `json:"testimonial_style" db:"testimonial_style"`
	TestimonialShape  string `json:"testimonial_shape" db:"testimonial_shape"`
	TestimonialLayout string `json:"testimonial_layout" db:"testimonial_layout"`

	// Display options
	ShowRating  bool `json:"show_rating" db:"show_rating"`
	ShowAvatar  bool `json:"show_avatar" db:"show_avatar"`
	ShowDate    bool `json:"show_date" db:"show_date"`
	ShowCompany bool `json:"show_company" db:"show_company"`

	// Animation and styling
	Animation   bool   `json:"animation" db:"animation"`
	Shadow      string `json:"shadow" db:"shadow"`
	Border      bool   `json:"border" db:"border"`
	RatingStyle string `json:"rating_style" db:"rating_style"`

	// Brand voice and UI
	Voice      JSONMap `json:"voice" db:"voice"`
	UISettings JSONMap `json:"ui_settings" db:"ui_settings"`

	IsDefault bool      `json:"is_default" db:"is_default"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CollectionTrigger defines when and how to collect testimonials
type CollectionTrigger struct {
	ID            uuid.UUID `json:"id" db:"id"`
	WorkspaceID   uuid.UUID `json:"workspace_id" db:"workspace_id"`
	Name          string    `json:"name" db:"name"`
	Description   string    `json:"description,omitempty" db:"description"`
	Type          string    `json:"type" db:"type"`
	BusinessEvent string    `json:"business_event,omitempty" db:"business_event"`

	CollectionMethod string `json:"collection_method" db:"collection_method"`
	Enabled          bool   `json:"enabled" db:"enabled"`

	// Targeting & Display rules
	UserSegments JSONArray `json:"user_segments" db:"user_segments"`
	Conditions   JSONArray `json:"conditions" db:"conditions"`

	// Timing
	Delay     int    `json:"delay" db:"delay"`
	DelayUnit string `json:"delay_unit" db:"delay_unit"`

	// Throttling
	Frequency      string `json:"frequency" db:"frequency"`
	FrequencyLimit *int   `json:"frequency_limit,omitempty" db:"frequency_limit"`
	Priority       string `json:"priority" db:"priority"`

	// Data expectations
	DataSchema   JSONMap `json:"data_schema,omitempty" db:"data_schema"`
	ExpectedData JSONMap `json:"expected_data,omitempty" db:"expected_data"`

	// Customizations
	TemplateID     *uuid.UUID `json:"template_id,omitempty" db:"template_id"`
	CustomSettings JSONMap    `json:"custom_settings" db:"custom_settings"`

	// Analytics
	Tags StringArray `json:"tags,omitempty" db:"tags"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// MessageTemplate stores reusable message templates for requests/responses
type MessageTemplate struct {
	ID           uuid.UUID `json:"id" db:"id"`
	WorkspaceID  uuid.UUID `json:"workspace_id" db:"workspace_id"`
	Name         string    `json:"name" db:"name"`
	TemplateType string    `json:"template_type" db:"template_type"`
	ContextType  string    `json:"context_type,omitempty" db:"context_type"`
	Tone         string    `json:"tone,omitempty" db:"tone"`

	Subject   string    `json:"subject,omitempty" db:"subject"`
	Content   string    `json:"content" db:"content"`
	Variables JSONArray `json:"variables" db:"variables"`

	DesignSettings JSONMap `json:"design_settings" db:"design_settings"`
	IsDefault      bool    `json:"is_default" db:"is_default"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// SocialCampaign represents a structured social media campaign for collecting testimonials
type SocialCampaign struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	WorkspaceID    uuid.UUID  `json:"workspace_id" db:"workspace_id"`
	Name           string     `json:"name" db:"name"`
	Type           string     `json:"type" db:"type"`
	Identifier     string     `json:"identifier" db:"identifier"`
	Status         string     `json:"status" db:"status"`
	StartDate      *time.Time `json:"start_date,omitempty" db:"start_date"`
	EndDate        *time.Time `json:"end_date,omitempty" db:"end_date"`
	Platforms      JSONArray  `json:"platforms" db:"platforms"`
	TargetCount    int        `json:"target_count" db:"target_count"`
	CollectedCount int        `json:"collected_count" db:"collected_count"`

	Description string   `json:"description,omitempty" db:"description"`
	Incentive   string   `json:"incentive,omitempty" db:"incentive"`
	Rules       string   `json:"rules,omitempty" db:"rules"`
	Budget      *float64 `json:"budget,omitempty" db:"budget"`

	TeamMembers      StringArray `json:"team_members,omitempty" db:"team_members"`
	ReportFrequency  string      `json:"report_frequency,omitempty" db:"report_frequency"`
	ReportRecipients StringArray `json:"report_recipients,omitempty" db:"report_recipients"`
	Keywords         StringArray `json:"keywords,omitempty" db:"keywords"`
	Blacklist        StringArray `json:"blacklist,omitempty" db:"blacklist"`

	SentimentAnalysis bool `json:"sentiment_analysis" db:"sentiment_analysis"`
	AICategorization  bool `json:"ai_categorization" db:"ai_categorization"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
