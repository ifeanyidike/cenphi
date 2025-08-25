// internal/mailing/interfaces.go
package mailing

import (
	"context"

	"github.com/ifeanyidike/cenphi/internal/models"
)

// EmailProvider defines the interface for email providers (Brevo, SendGrid, etc.)
type Provider interface {
	SendEmail(ctx context.Context, req *ProviderEmailRequest) (*models.EmailResponse, error)
	ValidateConfiguration(ctx context.Context) error
	GetProviderName() string
}

// TemplateRenderer handles email template rendering
type TemplateRenderer interface {
	RenderTemplate(templateName string, data models.TemplateData) (*models.RenderedEmail, error)
	GetTemplate(name string) (*models.EmailTemplate, error)
	LoadDefaultTemplates() error
}

// ProviderEmailRequest represents the standardized request to email providers
type ProviderEmailRequest struct {
	To          EmailRecipient `json:"to"`
	From        EmailRecipient `json:"from"`
	Subject     string         `json:"subject"`
	HTMLContent string         `json:"html_content"`
	TextContent string         `json:"text_content"`
	TrackingID  string         `json:"tracking_id"` // For webhook correlation
}

type EmailRecipient struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}
