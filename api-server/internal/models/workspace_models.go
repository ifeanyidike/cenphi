package models

import (
	"time"

	"github.com/google/uuid"
)

// id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//     name VARCHAR(255) NOT NULL,
//     plan workspace_plan DEFAULT 'free',
//     settings JSONB DEFAULT '{}',
//     branding_settings JSONB DEFAULT '{}',
//     custom_domain VARCHAR(255),
//     analytics_settings JSONB DEFAULT '{}',
//     integration_settings JSONB DEFAULT '{}',
//     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

type Workspace struct {
	ID                  uuid.UUID              `json:"id"`
	Name                string                 `json:"name"`
	Plan                string                 `json:"plan"`
	Settings            map[string]interface{} `json:"settings"`
	BrandingSettings    map[string]interface{} `json:"branding_settings"`
	CustomDomain        string                 `json:"custom_domain"`
	AnalyticsSettings   map[string]interface{} `json:"analytics_settings"`
	IntegrationSettings map[string]interface{} `json:"integration_settings"`
	CreatedAt           time.Time              `json:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at"`
}
