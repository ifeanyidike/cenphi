// models/provider_config.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type ProviderConfig struct {
	ID           uuid.UUID         `json:"id"`
	UserID       string            `json:"user_id"`
	WorkspaceID  uuid.UUID         `json:"workspaceID"`
	ProviderName string            `json:"providerName"`
	Credentials  map[string]string `json:"credentials"`
	IsActive     bool              `json:"isActive"`
	Schedule     string            `json:"schedule"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}
