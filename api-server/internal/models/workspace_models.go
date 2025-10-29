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

type BrandContext struct {
	WorkspaceID      uuid.UUID `json:"workspace_id" db:"workspace_id"`
	AboutInfo        string    `json:"about_info" db:"about_info"`
	Keywords         []string  `json:"keywords" db:"keywords"`
	Tone             string    `json:"tone" db:"tone"`
	BrandColors      JSONMap   `json:"brand_colors" db:"brand_colors"`
	ColorSlice       []string  `json:"color_slice" db:"color_slice"`
	BrandFonts       JSONMap   `json:"brand_fonts" db:"brand_fonts"`
	LogoURL          string    `json:"logo_url" db:"logo_url"`
	Values           []string  `json:"values" db:"values"`
	Tagline          string    `json:"tagline" db:"tagline"`
	TargetAudience   string    `json:"target_audience" db:"target_audience"`
	MissionStatement string    `json:"mission_statement" db:"mission_statement"`
	BusinessModel    string    `json:"business_model" db:"business_model"`
	CompanySize      string    `json:"company_size" db:"company_size"`
	ExtractedData    JSONMap   `json:"extracted_data" db:"extracted_data"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

type Workspace struct {
	ID                uuid.UUID       `json:"id" db:"id"`
	Name              string          `json:"name" db:"name" validate:"omitempty,min=3,max=255"`
	WebsiteURL        string          `json:"website_url,omitempty" db:"website_url" validate:"omitempty,url"`
	Industry          string          `json:"industry" db:"industry" validate:"omitempty,min=3,max=100"`
	Plan              Plan            `json:"plan" db:"plan" validate:"required,oneof=essentials growth accelerate transform enterprise"`
	Settings          JSONMap         `json:"settings,omitempty" db:"settings"`
	BrandContext      json.RawMessage `json:"brand_context,omitempty" db:"brand_context"`
	VectorStoreID     *string         `json:"vector_store_id,omitempty" db:"vector_store_id"`
	TotalTestimonials int             `json:"total_testimonials" db:"total_testimonials"`
	CreatedAt         time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at" db:"updated_at"`
}

type WorkspaceWithUserID struct {
	Workspace
	UserID uuid.UUID `json:"user_id" db:"user_id"`
}

type GetWorkspaceDataParam struct {
	Workspace
	Testimonials []Testimonial
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
			if settings, ok := value.(*BrandContext); ok && settings != nil {
				if err := validate.Struct(settings); err != nil {
					return fmt.Errorf("%w: invalid branding settings: %w", apperrors.ErrValidationFailed, err)
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

func (w *Workspace) MarshalBrandContext() (string, error) {
	if w.BrandContext == nil {
		return "{}", nil
	}
	data, err := json.Marshal(w.BrandContext)
	return string(data), err
}

// Helper to unmarshal fields
func (w *Workspace) UnmarshalSettings(data string) error {
	return json.Unmarshal([]byte(data), &w.Settings)
}

func (w *Workspace) UnmarshalBrandContext(data string) error {
	return json.Unmarshal([]byte(data), &w.BrandContext)
}
