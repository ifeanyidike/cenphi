// internal/models/public_share_models.go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// JSONB is a custom type for PostgreSQL JSONB columns
type JSONB map[string]interface{}

// Value implements the driver.Valuer interface
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// PublicShare represents a public sharing link
type PublicShare struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	WorkspaceID       uuid.UUID  `json:"workspace_id" db:"workspace_id"`
	ShareType         string     `json:"share_type" db:"share_type"`
	TestimonialID     *uuid.UUID `json:"testimonial_id,omitempty" db:"testimonial_id"`
	ArtifactID        *uuid.UUID `json:"artifact_id,omitempty" db:"artifact_id"`
	Description       *string    `json:"description,omitempty" db:"description"`
	IsPublic          bool       `json:"is_public" db:"is_public"`
	IsActive          bool       `json:"is_active" db:"is_active"`
	PasswordProtected bool       `json:"password_protected" db:"password_protected"`
	PasswordHash      *string    `json:"-" db:"password_hash"`
	ExpiresAt         *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CustomBranding    JSONB      `json:"custom_branding,omitempty" db:"custom_branding"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`

	// Joined data
	Metrics *PublicShareMetrics `json:"metrics,omitempty" db:"-"`
}

// PublicShareMetrics represents aggregated metrics
type PublicShareMetrics struct {
	ID                  uuid.UUID `json:"id" db:"id"`
	PublicShareID       uuid.UUID `json:"public_share_id" db:"public_share_id"`
	ViewCount           int       `json:"view_count" db:"view_count"`
	UniqueVisitorCount  int       `json:"unique_visitor_count" db:"unique_visitor_count"`
	PlayCount           int       `json:"play_count" db:"play_count"`
	DownloadCount       int       `json:"download_count" db:"download_count"`
	CopyLinkCount       int       `json:"copy_link_count" db:"copy_link_count"`
	LinkedInShareCount  int       `json:"linkedin_share_count" db:"linkedin_share_count"`
	TwitterShareCount   int       `json:"twitter_share_count" db:"twitter_share_count"`
	FacebookShareCount  int       `json:"facebook_share_count" db:"facebook_share_count"`
	WhatsAppShareCount  int       `json:"whatsapp_share_count" db:"whatsapp_share_count"`
	EmailShareCount     int       `json:"email_share_count" db:"email_share_count"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" db:"updated_at"`
}

// PublicShareEvent represents a tracking event
type PublicShareEvent struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	PublicShareID uuid.UUID  `json:"public_share_id" db:"public_share_id"`
	EventType     string     `json:"event_type" db:"event_type"`
	VisitorID     *uuid.UUID `json:"visitor_id,omitempty" db:"visitor_id"`
	IPAddress     *string    `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent     *string    `json:"user_agent,omitempty" db:"user_agent"`
	Referrer      *string    `json:"referrer,omitempty" db:"referrer"`
	CountryCode   *string    `json:"country_code,omitempty" db:"country_code"`
	City          *string    `json:"city,omitempty" db:"city"`
	Metadata      JSONB      `json:"metadata,omitempty" db:"metadata"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
}

// CreatePublicShareRequest is the request for creating a share
type CreatePublicShareRequest struct {
	WorkspaceID    uuid.UUID  `json:"workspace_id" validate:"required"`
	ShareType      string     `json:"share_type" validate:"required,oneof=testimonial artifact"`
	TestimonialID  *uuid.UUID `json:"testimonial_id,omitempty"`
	ArtifactID     *uuid.UUID `json:"artifact_id,omitempty"`
	Description    *string    `json:"description,omitempty"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
	CustomBranding JSONB      `json:"custom_branding,omitempty"`
}

// TrackEventRequest is the request for tracking events
type TrackEventRequest struct {
	EventType string     `json:"event_type" validate:"required"`
	VisitorID *uuid.UUID `json:"visitor_id,omitempty"`
	Referrer  *string    `json:"referrer,omitempty"`
	UserAgent *string    `json:"user_agent,omitempty"`
	Metadata  JSONB      `json:"metadata,omitempty"`
}

// PublicShareWithContent includes the shared content
type PublicShareWithContent struct {
	PublicShare
	Testimonial *Testimonial         `json:"testimonial,omitempty"`
	Artifact    *TestimonialArtifact `json:"artifact,omitempty"`
}

// AIPostSuggestion represents AI-generated post content
type AIPostSuggestion struct {
	Platform     string   `json:"platform"`
	Content      string   `json:"content"`
	Hashtags     []string `json:"hashtags"`
	Tone         string   `json:"tone"`
	CharCount    int      `json:"char_count"`
	EngagementScore float64 `json:"engagement_score"`
}

// AITimeSuggestion represents AI-suggested posting time
type AITimeSuggestion struct {
	SuggestedTime    time.Time          `json:"suggested_time"`
	ConfidenceScore  float64            `json:"confidence_score"`
	Reasoning        string             `json:"reasoning"`
	AlternativeTimes []AlternativeTime  `json:"alternative_times"`
}

// AlternativeTime represents an alternative posting time
type AlternativeTime struct {
	Time   time.Time `json:"time"`
	Score  float64   `json:"score"`
	Reason string    `json:"reason"`
}
