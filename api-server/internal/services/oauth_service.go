// internal/services/oauth_service.go
package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/contracts"
	"github.com/redis/go-redis/v9"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/facebook"
	"golang.org/x/oauth2/google"
)

// oauthService handles the OAuth flow for different platforms
type oauthService struct {
	configs     map[string]*oauth2.Config
	redisClient *redis.Client
	callbackURL string
}

// NewOAuthService creates a new OAuth service
func NewOAuthService(redisClient *redis.Client, callbackURL string, cfg *config.Config) contracts.OAuthService {
	// Initialize OAuth configs for each provider
	configs := map[string]*oauth2.Config{
		"facebook": {
			ClientID:     cfg.Providers.Facebook.ClientID,
			ClientSecret: cfg.Providers.Facebook.ClientSecret,
			RedirectURL:  callbackURL + "/facebook",
			Scopes:       []string{"pages_read_engagement", "pages_show_list", "pages_read_user_content"},
			Endpoint:     facebook.Endpoint,
		},

		"google": {
			ClientID:     cfg.Providers.Google.ClientID,
			ClientSecret: cfg.Providers.Google.ClientSecret,
			RedirectURL:  callbackURL + "/google",
			Scopes:       []string{"https://www.googleapis.com/auth/business.manage"},
			Endpoint:     google.Endpoint,
		},
	}

	return &oauthService{
		configs:     configs,
		redisClient: redisClient,
		callbackURL: callbackURL,
	}
}

// GetAuthURL returns the OAuth URL for the specified provider
func (s *oauthService) GetAuthURL(provider string, userID string) (string, error) {
	config, ok := s.configs[provider]
	if !ok {
		return "", fmt.Errorf("unsupported provider: %s", provider)
	}

	// Generate a state parameter to prevent CSRF
	state := fmt.Sprintf("%s:%s:%d", provider, userID, time.Now().Unix())

	// Store state in Redis for validation (with 15 min expiry)
	ctx := context.Background()
	err := s.redisClient.Set(ctx, "oauth:state:"+state, userID, 15*time.Minute).Err()
	if err != nil {
		return "", fmt.Errorf("failed to store state: %w", err)
	}

	return config.AuthCodeURL(state), nil
}

// HandleCallback processes the OAuth callback and returns the access token
func (s *oauthService) HandleCallback(provider, code, state string) (*oauth2.Token, error) {
	// Validate state to prevent CSRF
	ctx := context.Background()
	userID, err := s.redisClient.Get(ctx, "oauth:state:"+state).Result()
	if err != nil {
		return nil, fmt.Errorf("invalid or expired state parameter")
	}

	// Clean up the state
	s.redisClient.Del(ctx, "oauth:state:"+state)

	// Get the OAuth config
	config, ok := s.configs[provider]
	if !ok {
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}

	// Exchange the code for a token
	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}

	// Store the token in Redis (associated with the user ID)
	tokenJSON, err := json.Marshal(token)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize token: %w", err)
	}

	err = s.redisClient.Set(ctx, fmt.Sprintf("oauth:token:%s:%s", userID, provider), tokenJSON, 0).Err()
	if err != nil {
		return nil, fmt.Errorf("failed to store token: %w", err)
	}

	return token, nil
}

// GetToken retrieves a stored token for a user and provider
func (s *oauthService) GetToken(userID, provider string) (*oauth2.Token, error) {
	ctx := context.Background()
	tokenJSON, err := s.redisClient.Get(ctx, fmt.Sprintf("oauth:token:%s:%s", userID, provider)).Result()
	if err != nil {
		return nil, fmt.Errorf("no token found for user %s and provider %s", userID, provider)
	}

	var token oauth2.Token
	if err := json.Unmarshal([]byte(tokenJSON), &token); err != nil {
		return nil, fmt.Errorf("failed to deserialize token: %w", err)
	}

	// Check if token is expired and try to refresh it
	if token.Expiry.Before(time.Now()) {
		config, ok := s.configs[provider]
		if !ok {
			return nil, fmt.Errorf("unsupported provider: %s", provider)
		}

		tokenSource := config.TokenSource(ctx, &token)
		newToken, err := tokenSource.Token()
		if err != nil {
			return nil, fmt.Errorf("failed to refresh token: %w", err)
		}

		// Store the new token
		newTokenJSON, err := json.Marshal(newToken)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize token: %w", err)
		}

		err = s.redisClient.Set(ctx, fmt.Sprintf("oauth:token:%s:%s", userID, provider), newTokenJSON, 0).Err()
		if err != nil {
			return nil, fmt.Errorf("failed to store refreshed token: %w", err)
		}

		return newToken, nil
	}

	return &token, nil
}

func (s *oauthService) RemoveToken(string, string) error {
	return nil
}
