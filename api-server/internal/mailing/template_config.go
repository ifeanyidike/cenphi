// internal/mailing/template_config.go
package mailing

import (
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
)

// TemplateConfig holds workspace-specific template configuration
type TemplateConfig struct {
	WorkspaceID uuid.UUID              `json:"workspace_id"`
	BrandColors map[string]string      `json:"brand_colors"`
	DefaultData map[string]interface{} `json:"default_data"`
	Preferences TemplatePreferences    `json:"preferences"`
}

type TemplatePreferences struct {
	ShowSocialProof    bool        `json:"show_social_proof"`
	DefaultUrgency     string      `json:"default_urgency"` // "low", "medium", "high"
	EstimatedTime      string      `json:"estimated_time"`
	IncentiveEnabled   bool        `json:"incentive_enabled"`
	IncentiveText      string      `json:"incentive_text"`
	CompanyTagline     string      `json:"company_tagline"`
	DefaultSenderTitle string      `json:"default_sender_title"`
	FooterLinks        FooterLinks `json:"footer_links"`
}

type FooterLinks struct {
	Website        string `json:"website"`
	UnsubscribeURL string `json:"unsubscribe_url"`
	PreferencesURL string `json:"preferences_url"`
	CompanyAddress string `json:"company_address"`
}

// TemplateBuilder helps construct template data with workspace defaults
type TemplateBuilder struct {
	config    *TemplateConfig
	baseData  models.TemplateData
	workspace *WorkspaceInfo // You'd need to define this based on your workspace model
}

type WorkspaceInfo struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Website  string    `json:"website"`
	Industry string    `json:"industry"`
}

// NewTemplateBuilder creates a new template builder with workspace config
func NewTemplateBuilder(workspaceID uuid.UUID) *TemplateBuilder {
	return &TemplateBuilder{
		config: &TemplateConfig{
			WorkspaceID: workspaceID,
			BrandColors: map[string]string{
				"primary":   "#2563eb",
				"secondary": "#1d4ed8",
			},
			DefaultData: make(map[string]interface{}),
			Preferences: TemplatePreferences{
				ShowSocialProof:    true,
				DefaultUrgency:     "medium",
				EstimatedTime:      "2-3",
				IncentiveEnabled:   false,
				DefaultSenderTitle: "Customer Success Manager",
			},
		},
	}
}

// WithBrandColors sets the brand colors for the template
func (tb *TemplateBuilder) WithBrandColors(colors map[string]string) *TemplateBuilder {
	if tb.config.BrandColors == nil {
		tb.config.BrandColors = make(map[string]string)
	}
	for k, v := range colors {
		tb.config.BrandColors[k] = v
	}
	return tb
}

// WithWorkspaceInfo sets workspace information
func (tb *TemplateBuilder) WithWorkspaceInfo(workspace *WorkspaceInfo) *TemplateBuilder {
	tb.workspace = workspace
	return tb
}

// WithRecipient sets the recipient information
func (tb *TemplateBuilder) WithRecipient(name, email, company string) *TemplateBuilder {
	tb.baseData.ContactName = name
	tb.baseData.CompanyName = company
	return tb
}

// WithSender sets the sender information
func (tb *TemplateBuilder) WithSender(name, title, company, phone string) *TemplateBuilder {
	tb.baseData.SenderName = name
	if title != "" {
		tb.baseData.SenderTitle = title
	} else {
		tb.baseData.SenderTitle = tb.config.Preferences.DefaultSenderTitle
	}
	tb.baseData.SenderCompany = company
	tb.baseData.SenderPhone = phone
	return tb
}

// WithCustomMessage sets a personalized message
func (tb *TemplateBuilder) WithCustomMessage(message string) *TemplateBuilder {
	tb.baseData.CustomMessage = message
	return tb
}

// WithProject sets project-specific information
func (tb *TemplateBuilder) WithProject(projectName string) *TemplateBuilder {
	tb.baseData.ProjectName = projectName
	return tb
}

// WithUrgency sets the urgency level
func (tb *TemplateBuilder) WithUrgency(level string) *TemplateBuilder {
	tb.baseData.UrgencyLevel = level
	return tb
}

// WithIncentive enables and configures an incentive
func (tb *TemplateBuilder) WithIncentive(description string) *TemplateBuilder {
	tb.baseData.IncentiveOffered = true
	tb.baseData.IncentiveDescription = description
	return tb
}

// WithSocialProof enables social proof with testimonial count
func (tb *TemplateBuilder) WithSocialProof(count string) *TemplateBuilder {
	tb.baseData.SocialProofEnabled = true
	tb.baseData.TestimonialsCount = count
	return tb
}

// WithCollectionURL sets the testimonial collection URL
func (tb *TemplateBuilder) WithCollectionURL(url, token string) *TemplateBuilder {
	tb.baseData.CollectionURL = url
	tb.baseData.TrackingToken = token
	return tb
}

// Build constructs the final template data
func (tb *TemplateBuilder) Build() models.TemplateData {
	// Apply workspace defaults
	if tb.baseData.UrgencyLevel == "" {
		tb.baseData.UrgencyLevel = tb.config.Preferences.DefaultUrgency
	}

	if tb.baseData.EstimatedTime == "" {
		tb.baseData.EstimatedTime = tb.config.Preferences.EstimatedTime
	}

	if !tb.baseData.IncentiveOffered && tb.config.Preferences.IncentiveEnabled {
		tb.baseData.IncentiveOffered = true
		tb.baseData.IncentiveDescription = tb.config.Preferences.IncentiveText
	}

	if !tb.baseData.SocialProofEnabled {
		tb.baseData.SocialProofEnabled = tb.config.Preferences.ShowSocialProof
	}

	// Set brand colors
	tb.baseData.BrandColors = make(map[string]interface{})
	for k, v := range tb.config.BrandColors {
		tb.baseData.BrandColors[k] = v
	}

	// Set footer information
	if tb.workspace != nil {
		if tb.baseData.CompanyWebsite == "" {
			tb.baseData.CompanyWebsite = tb.workspace.Website
		}
	}

	tb.baseData.UnsubscribeURL = tb.config.Preferences.FooterLinks.UnsubscribeURL
	tb.baseData.PreferencesURL = tb.config.Preferences.FooterLinks.PreferencesURL
	tb.baseData.CompanyAddress = tb.config.Preferences.FooterLinks.CompanyAddress

	// Set company tagline
	if tb.baseData.CompanyTagline == "" {
		tb.baseData.CompanyTagline = tb.config.Preferences.CompanyTagline
	}

	return tb.baseData
}

// TemplateVariations provides different template configurations for A/B testing
type TemplateVariations struct {
	Default   string `json:"default"`
	Urgent    string `json:"urgent"`
	Casual    string `json:"casual"`
	Incentive string `json:"incentive"`
}

// GetVariationConfig returns template configuration for different variations
func GetVariationConfig(variation string) TemplatePreferences {
	switch variation {
	case "urgent":
		return TemplatePreferences{
			ShowSocialProof:    true,
			DefaultUrgency:     "high",
			EstimatedTime:      "2",
			IncentiveEnabled:   false,
			CompanyTagline:     "Quick Response Team",
			DefaultSenderTitle: "Customer Success Manager",
		}
	case "casual":
		return TemplatePreferences{
			ShowSocialProof:    false,
			DefaultUrgency:     "low",
			EstimatedTime:      "5",
			IncentiveEnabled:   false,
			CompanyTagline:     "We'd love to hear from you",
			DefaultSenderTitle: "Customer Success Team",
		}
	case "incentive":
		return TemplatePreferences{
			ShowSocialProof:    true,
			DefaultUrgency:     "medium",
			EstimatedTime:      "3",
			IncentiveEnabled:   true,
			IncentiveText:      "Small gift card as a thank you",
			CompanyTagline:     "Customer Success Team",
			DefaultSenderTitle: "Customer Success Manager",
		}
	default: // "default"
		return TemplatePreferences{
			ShowSocialProof:    true,
			DefaultUrgency:     "medium",
			EstimatedTime:      "2-3",
			IncentiveEnabled:   false,
			CompanyTagline:     "Customer Success Team",
			DefaultSenderTitle: "Customer Success Manager",
		}
	}
}

// Example usage function for documentation
func ExampleTemplateUsage() models.TemplateData {
	workspace := &WorkspaceInfo{
		ID:       uuid.New(),
		Name:     "Acme Corp",
		Website:  "https://acme.com",
		Industry: "SaaS",
	}

	return NewTemplateBuilder(workspace.ID).
		WithWorkspaceInfo(workspace).
		WithBrandColors(map[string]string{
			"primary":   "#6366f1",
			"secondary": "#4f46e5",
		}).
		WithRecipient("John Doe", "john@example.com", "Example Corp").
		WithSender("Sarah Johnson", "Customer Success Manager", "Acme Corp", "+1-555-0123").
		WithCustomMessage("Thank you for choosing Acme Corp for your recent project. Your feedback would mean the world to us!").
		WithProject("Website Redesign").
		WithUrgency("medium").
		WithSocialProof("250+").
		WithCollectionURL("https://acme.com/testimonials/collect", "abc123token").
		Build()
}

// Email template variations
const (
	TemplateDefault   = "testimonial_request"
	TemplateUrgent    = "testimonial_request_urgent"
	TemplateCasual    = "testimonial_request_casual"
	TemplateIncentive = "testimonial_request_incentive"
)
