package models

import (
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
	Settings            map[string]interface{} `json:"settings,omitempty" db:"settings"`
	BrandingSettings    *BrandingSettings      `json:"branding_settings,omitempty" db:"branding_settings"`
	CustomDomain        string                 `json:"custom_domain,omitempty" db:"custom_domain" validate:"omitempty,hostname_rfc1123"`
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
