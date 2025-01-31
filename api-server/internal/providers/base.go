// internal/providers/provider.go
package providers

import (
	"context"
	"time"

	"github.com/ifeanyidike/cenphi/internal/models"
)

// Provider defines the interface for all testimonial providers
type Provider interface {
	// Identifier for the provider
	Name() string

	// Core functionality to fetch testimonials
	Fetch(ctx context.Context) ([]models.Testimonial, error)

	// Rate limiting configuration
	RateLimit() int            // Number of requests allowed
	RateWindow() time.Duration // Time window for rate limits

	// Scheduling configuration
	Schedule() string // Cron-formatted schedule

	// Authentication configuration
	OAuthConfig() *OAuthConfig // Returns nil for non-OAuth providers

	// Initialization status
	IsConfigured() bool // Check if provider is properly configured
}

// OAuthConfig contains common OAuth2 parameters
type OAuthConfig struct {
	ClientID     string
	ClientSecret string
	AuthURL      string
	TokenURL     string
	Scopes       []string
}

// BaseProvider contains common provider functionality
type BaseProvider struct {
	name        string
	rateLimit   int
	rateWindow  time.Duration
	schedule    string
	oauthConfig *OAuthConfig
}

func (p *BaseProvider) Name() string {
	return p.name
}

func (p *BaseProvider) RateLimit() int {
	return p.rateLimit
}

func (p *BaseProvider) RateWindow() time.Duration {
	return p.rateWindow
}

func (p *BaseProvider) Schedule() string {
	return p.schedule
}

func (p *BaseProvider) OAuthConfig() *OAuthConfig {
	return p.oauthConfig
}

func (p *BaseProvider) IsConfigured() bool {
	// Implementation varies per provider
	return true
}
