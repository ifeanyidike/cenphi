// models/customer_profile.go
package models

import (
	"errors"
	"regexp"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
)

// CustomerProfile represents a customer’s profile as stored in the database.
type CustomerProfile struct {
	ID             uuid.UUID `json:"id" db:"id"`
	WorkspaceID    uuid.UUID `json:"workspace_id" db:"workspace_id"`
	ExternalID     string    `json:"external_id,omitempty" db:"external_id"`
	Email          string    `json:"email,omitempty" db:"email"`
	Name           string    `json:"name,omitempty" db:"name"`
	Title          string    `json:"title,omitempty" db:"title"`
	Company        string    `json:"company,omitempty" db:"company"`
	Industry       string    `json:"industry,omitempty" db:"industry"`
	Location       string    `json:"location,omitempty" db:"location"`
	AvatarURL      string    `json:"avatar_url,omitempty" db:"avatar_url"`
	SocialProfiles JSONMap   `json:"social_profiles,omitempty" db:"social_profiles"`
	CustomFields   JSONMap   `json:"custom_fields,omitempty" db:"custom_fields"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// Validate ensures the CustomerProfile contains required fields.
func (cp *CustomerProfile) Validate() error {
	if cp.WorkspaceID == uuid.Nil {
		return apperrors.ErrInvalidWorkspaceID
	}

	if cp.Email != "" && !isValidEmail(cp.Email) {
		return errors.New("invalid customer email format")
	}
	// Optionally add more validations, e.g., email format.
	return nil
}

// Optional: If you need custom JSON handling for SocialProfiles or CustomFields,
// you can add custom Scan and Value methods here.
// In this example, we assume JSONMap is already defined with such methods in testimonial.go.

// Basic email validation if needed (e.g., if customer email is part of the profile logic)
func isValidEmail(email string) bool {
	const emailRegex = `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	return regexMatch(emailRegex, email)
}

func regexMatch(pattern, input string) bool {
	rgx := regexp.MustCompile(pattern)
	return rgx.MatchString(input)
}
