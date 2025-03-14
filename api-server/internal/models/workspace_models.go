package models

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
)

type Plan string

// const (
// 	PlanFree       Plan = "free"
// 	PlanPro        Plan = "pro"
// 	PlanEnterprise Plan = "enterprise"
// )

const (
	PlanEssential  Plan = "essentials" //free
	PlanGrowth     Plan = "growth"
	PlanAccelerate Plan = "accelerate"
	PlanTransform  Plan = "transform"
	PlanEnterprise Plan = "enterprise"
)

type BrandingSettings struct {
	PrimaryColor string `json:"primary_color" validate:"required"`
	LogoURL      string `json:"logo_url" validate:"required,url"`
}

type IntegrationSettings struct {
	GoogleAnalyticsID string `json:"google_analytics_id" validate:"omitempty,url"`
	SlackWebhookURL   string `json:"slack_webhook_url" validate:"omitempty,url"`
}

type Workspace struct {
	ID                  uuid.UUID            `json:"id" db:"id"`
	Name                string               `json:"name" db:"name" validate:"omitempty,min=3,max=255"`
	WebsiteURL          string               `json:"website_url,omitempty" db:"website_url" validate:"omitempty,url"`
	Industry            string               `json:"industry" db:"industry" validate:"omitempty,min=3,max=100"`
	Plan                Plan                 `json:"plan" db:"plan" validate:"required,oneof=essentials growth accelerate transform enterprise"`
	CustomDomain        string               `json:"custom_domain,omitempty" db:"custom_domain" validate:"omitempty,hostname_rfc1123"`
	Settings            map[string]any       `json:"settings,omitempty" db:"settings"`
	BrandingSettings    *BrandingSettings    `json:"branding_settings,omitempty" db:"branding_settings"`
	AnalyticsSettings   map[string]any       `json:"analytics_settings,omitempty" db:"analytics_settings"`
	IntegrationSettings *IntegrationSettings `json:"integration_settings,omitempty" db:"integration_settings"`
	CreatedAt           time.Time            `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time            `json:"updated_at" db:"updated_at"`
}

func PrepareURL(url string) string {
	// If the URL doesn't have a scheme, add https://
	if url != "" && !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		return "https://" + url
	}
	return url
}

func ValidateWorkspace(updates map[string]any) error {
	validate := validator.New()
	for field, value := range updates {
		switch field {
		case "name":
			if name, ok := value.(string); ok {
				if err := validate.Var(name, "omitempty,min=3,max=255"); err != nil {
					return fmt.Errorf("%w: invalid name: %w", apperrors.ErrValidationFailed, err)
				}
			}
		case "website_url":
			if url, ok := value.(string); ok {
				if err := validate.Var(url, "omitempty,url"); err != nil {
					return fmt.Errorf("%w: invalid website URL: %w", apperrors.ErrValidationFailed, err)
				}
			}
		case "industry":
			if industry, ok := value.(string); ok {
				if err := validate.Var(industry, "omitempty,min=3,max=100"); err != nil {
					return fmt.Errorf("%w: invalid industry: %w", apperrors.ErrValidationFailed, err)
				}
			}
		case "plan":
			if plan, ok := value.(string); ok {
				if err := validate.Var(plan, "required,oneof=essentials growth accelerate transform enterprise"); err != nil {
					return fmt.Errorf("%w: invalid plan: %w", apperrors.ErrValidationFailed, err)
				}
			}
		case "custom_domain":
			if domain, ok := value.(string); ok {
				if domain != "" {
					if err := validate.Var(domain, "omitempty,hostname_rfc1123"); err != nil {
						return fmt.Errorf("%w: invalid custom domain: %w", apperrors.ErrValidationFailed, err)
					}
				}
			}
		case "branding_settings":
			if settings, ok := value.(*BrandingSettings); ok && settings != nil {
				if err := validate.Struct(settings); err != nil {
					return fmt.Errorf("%w: invalid branding settings: %w", apperrors.ErrValidationFailed, err)
				}
			}

		case "integration_settings":
			if settings, ok := value.(*IntegrationSettings); ok && settings != nil {
				if err := validate.Struct(settings); err != nil {
					return fmt.Errorf("%w: invalid integration settings: %w", apperrors.ErrValidationFailed, err)
				}
			}
		}
	}

	return nil
}

func (w *Workspace) MarshalSettings() (string, error) {
	if w.Settings == nil {
		return "{}", nil
	}
	data, err := json.Marshal(w.Settings)
	return string(data), err
}

func (w *Workspace) MarshalBrandingSettings() (string, error) {
	if w.BrandingSettings == nil {
		return "{}", nil
	}
	data, err := json.Marshal(w.BrandingSettings)
	return string(data), err
}

func (w *Workspace) MarshalAnalyticsSettings() (string, error) {
	if w.AnalyticsSettings == nil {
		return "{}", nil
	}
	data, err := json.Marshal(w.AnalyticsSettings)
	return string(data), err
}

func (w *Workspace) MarshalIntegrationSettings() (string, error) {
	if w.IntegrationSettings == nil {
		return "{}", nil
	}
	data, err := json.Marshal(w.IntegrationSettings)
	return string(data), err
}

// Helper to unmarshal fields
func (w *Workspace) UnmarshalSettings(data string) error {
	return json.Unmarshal([]byte(data), &w.Settings)
}

func (w *Workspace) UnmarshalBrandingSettings(data string) error {
	return json.Unmarshal([]byte(data), &w.BrandingSettings)
}

func (w *Workspace) UnmarshalAnalyticsSettings(data string) error {
	return json.Unmarshal([]byte(data), &w.AnalyticsSettings)
}

func (w *Workspace) UnmarshalIntegrationSettings(data string) error {
	return json.Unmarshal([]byte(data), &w.IntegrationSettings)
}
