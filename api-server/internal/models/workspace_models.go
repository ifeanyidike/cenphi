package models

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
)

type Plan string

const (
	PlanFree       Plan = "free"
	PlanBasic      Plan = "basic"
	PlanPro        Plan = "pro"
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
	ID                  uuid.UUID              `json:"id" db:"id"`
	Name                string                 `json:"name" db:"name" validate:"required,min=3,max=100"`
	WebsiteURL          string                 `json:"website_url,omitempty" db:"website_url" validate:"omitempty,url"`
	Plan                Plan                   `json:"plan" db:"plan" validate:"required,oneof=free basic pro enterprise"`
	CustomDomain        string                 `json:"custom_domain,omitempty" db:"custom_domain" validate:"omitempty,hostname_rfc1123"`
	Settings            map[string]interface{} `json:"settings,omitempty" db:"settings"`
	BrandingSettings    *BrandingSettings      `json:"branding_settings,omitempty" db:"branding_settings"`
	AnalyticsSettings   map[string]interface{} `json:"analytics_settings,omitempty" db:"analytics_settings"`
	IntegrationSettings *IntegrationSettings   `json:"integration_settings,omitempty" db:"integration_settings"`
	CreatedAt           time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at" db:"updated_at"`
}

func ValidateWorkspace(workspace *Workspace) error {
	validate := validator.New()
	if workspace.BrandingSettings != nil {
		if err := validate.Struct(workspace.BrandingSettings); err != nil {
			return fmt.Errorf("%w: %w", apperrors.ErrValidationFailed, err)
		}
	}
	if workspace.IntegrationSettings != nil {
		if err := validate.Struct(workspace.IntegrationSettings); err != nil {
			return fmt.Errorf("%w: %w", apperrors.ErrValidationFailed, err)
		}
	}

	if err := validate.Struct(workspace); err != nil {
		return fmt.Errorf("%w: %w", apperrors.ErrValidationFailed, err)
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
