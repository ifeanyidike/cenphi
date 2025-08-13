// internal/models/google_drive.go
package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/oauth2"
)

type GoogleDriveAccount struct {
	ID          uuid.UUID `json:"id" db:"id"`
	WorkspaceID uuid.UUID `json:"workspace_id" db:"workspace_id"`
	UserID      uuid.UUID `json:"user_id" db:"user_id"`

	// OAuth tokens
	AccessToken  string     `json:"-" db:"access_token"`  // Don't expose in JSON
	RefreshToken *string    `json:"-" db:"refresh_token"` // Don't expose in JSON
	TokenType    string     `json:"token_type" db:"token_type"`
	ExpiresAt    *time.Time `json:"expires_at" db:"expires_at"`

	// Account info
	AccountEmail *string `json:"account_email" db:"account_email"`
	AccountName  *string `json:"account_name" db:"account_name"`

	// Status
	Status    string  `json:"status" db:"status"` // connected, expired, revoked, error
	LastError *string `json:"last_error" db:"last_error"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// ToOAuth2Token converts to oauth2.Token
func (gda *GoogleDriveAccount) ToOAuth2Token() *oauth2.Token {
	token := &oauth2.Token{
		AccessToken: gda.AccessToken,
		TokenType:   gda.TokenType,
	}

	if gda.RefreshToken != nil {
		token.RefreshToken = *gda.RefreshToken
	}

	if gda.ExpiresAt != nil {
		token.Expiry = *gda.ExpiresAt
	}

	return token
}
