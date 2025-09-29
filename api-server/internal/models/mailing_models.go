// internal/models/email.go
package models

import (
	"time"

	"github.com/google/uuid"
)

// EmailRequest represents a testimonial collection email request
type EmailRequest struct {
	ID           uuid.UUID `json:"id" db:"id"`
	WorkspaceID  uuid.UUID `json:"workspace_id" db:"workspace_id"`
	ContactName  string    `json:"contact_name" db:"contact_name"`
	ContactEmail string    `json:"contact_email" db:"contact_email"`
	CompanyName  string    `json:"company_name" db:"company_name"`

	Subject       string `json:"subject" db:"subject"`
	CustomMessage string `json:"custom_message" db:"custom_message"`
	TemplateName  string `json:"template_name" db:"template_name"`
	CollectionURL string `json:"collection_url" db:"collection_url"`
	TrackingToken string `json:"tracking_token" db:"tracking_token"`

	Status      string     `json:"status" db:"status"`
	SentAt      *time.Time `json:"sent_at" db:"sent_at"`
	OpenedAt    *time.Time `json:"opened_at" db:"opened_at"`
	ClickedAt   *time.Time `json:"clicked_at" db:"clicked_at"`
	RespondedAt *time.Time `json:"responded_at" db:"responded_at"`

	ProviderMessageID string  `json:"provider_message_id" db:"provider_message_id"`
	ProviderResponse  JSONMap `json:"provider_response" db:"provider_response"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// EmailTemplate represents an email template
type EmailTemplate struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	WorkspaceID *uuid.UUID `json:"workspace_id" db:"workspace_id"`
	Name        string     `json:"name" db:"name"`
	Subject     string     `json:"subject" db:"subject"`
	HTMLContent string     `json:"html_content" db:"html_content"`
	TextContent string     `json:"text_content" db:"text_content"`
	Variables   JSONArray  `json:"variables" db:"variables"`
	IsDefault   bool       `json:"is_default" db:"is_default"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// EmailLog represents email delivery tracking (simplified without webhooks)
type EmailLog struct {
	ID                uuid.UUID `json:"id" db:"id"`
	EmailRequestID    uuid.UUID `json:"email_request_id" db:"email_request_id"`
	Provider          string    `json:"provider" db:"provider"`
	ProviderMessageID string    `json:"provider_message_id" db:"provider_message_id"`
	Status            string    `json:"status" db:"status"`
	EventType         string    `json:"event_type" db:"event_type"`
	ErrorMessage      string    `json:"error_message" db:"error_message"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}

// Provider response models
type EmailResponse struct {
	MessageID string                 `json:"message_id"`
	Status    string                 `json:"status"`
	Provider  string                 `json:"provider"`
	Metadata  map[string]interface{} `json:"metadata"`
	SentAt    time.Time              `json:"sent_at"`
}

// Template rendering models
type TemplateData struct {
	// Required fields
	ContactName   string `json:"contact_name"`
	CompanyName   string `json:"company_name"`
	CollectionURL string `json:"collection_url"`
	TrackingToken string `json:"tracking_token"`
	SenderName    string `json:"sender_name"`

	Subject string `json:"subject"`
	Rating  int    `json:"rating"`
	// Optional core fields
	CustomMessage string `json:"custom_message"`
	SenderTitle   string `json:"sender_title"`
	SenderCompany string `json:"sender_company"`
	SenderPhone   string `json:"sender_phone"`

	// Enhanced personalization
	ProjectName    string `json:"project_name"`
	CustomerType   string `json:"customer_type"`
	CompanyTagline string `json:"company_tagline"`

	// Urgency and timing
	UrgencyLevel  string `json:"urgency_level"`  // "low", "medium", "high"
	EstimatedTime string `json:"estimated_time"` // "2-3", "5", etc.

	// Incentives
	IncentiveOffered     bool   `json:"incentive_offered"`
	IncentiveDescription string `json:"incentive_description"`

	// Social proof
	SocialProofEnabled bool   `json:"social_proof_enabled"`
	TestimonialsCount  string `json:"testimonials_count"`

	// Branding
	BrandColors map[string]interface{} `json:"brand_colors"`

	// Footer links
	UnsubscribeURL string `json:"unsubscribe_url"`
	PreferencesURL string `json:"preferences_url"`
	CompanyWebsite string `json:"company_website"`
	CompanyAddress string `json:"company_address"`
}

type RenderedEmail struct {
	Subject     string `json:"subject"`
	HTMLContent string `json:"html_content"`
	TextContent string `json:"text_content"`
}

// Request/Response DTOs
type SendEmailRequest struct {
	WorkspaceID   string `json:"workspace_id" validate:"required"`
	ContactName   string `json:"contact_name" validate:"required"`
	ContactEmail  string `json:"contact_email" validate:"required,email"`
	CompanyName   string `json:"company_name" validate:"required"`
	CustomMessage string `json:"custom_message"`
	TemplateName  string `json:"template_name"`

	// Enhanced sender information
	SenderTitle   string `json:"sender_title"`
	SenderCompany string `json:"sender_company"`
	SenderPhone   string `json:"sender_phone"`

	// Project and context
	ProjectName  string `json:"project_name"`
	CustomerType string `json:"customer_type"`

	// Email customization
	UrgencyLevel         string            `json:"urgency_level"` // "low", "medium", "high"
	BrandColors          map[string]string `json:"brand_colors"`
	IncentiveDescription string            `json:"incentive_description"`
	TestimonialsCount    string            `json:"testimonials_count"`

	// Template variation for A/B testing
	TemplateVariation string `json:"template_variation"` // "default", "urgent", "casual", "incentive"
}

type BulkEmailRequest struct {
	WorkspaceID   string           `json:"workspace_id" validate:"required"`
	Recipients    []EmailRecipient `json:"recipients" validate:"required,min=1"`
	CustomMessage string           `json:"custom_message"`
	TemplateName  string           `json:"template_name"`

	// Enhanced bulk features
	SenderTitle   string `json:"sender_title"`
	SenderCompany string `json:"sender_company"`
	SenderPhone   string `json:"sender_phone"`

	// Global settings for all recipients
	UrgencyLevel         string            `json:"urgency_level"`
	BrandColors          map[string]string `json:"brand_colors"`
	IncentiveDescription string            `json:"incentive_description"`
	TestimonialsCount    string            `json:"testimonials_count"`
	TemplateVariation    string            `json:"template_variation"`
}

type EmailRecipient struct {
	Name         string `json:"name" validate:"required"`
	Email        string `json:"email" validate:"required,email"`
	Company      string `json:"company" validate:"required"`
	ProjectName  string `json:"project_name"`  // Individual project context
	CustomerType string `json:"customer_type"` // Individual customer type
}

// Status constants
const (
	EmailStatusPending   = "pending"
	EmailStatusSent      = "sent"
	EmailStatusDelivered = "delivered"
	EmailStatusOpened    = "opened"
	EmailStatusClicked   = "clicked"
	EmailStatusResponded = "responded"
	EmailStatusFailed    = "failed"
	EmailStatusBounced   = "bounced"
)
