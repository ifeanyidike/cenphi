// internal/controllers/oauth_controller.go
package controllers

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/contracts"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type OauthController interface {
	InitiateOAuth(w http.ResponseWriter, r *http.Request)
}

type oauthController struct {
	oauthService contracts.OAuthService
	logger       *zap.Logger
}

func NewOAuthController(oauthService contracts.OAuthService, logger *zap.Logger) OauthController {
	return &oauthController{
		oauthService: oauthService,
		logger:       logger,
	}
}

// InitiateOAuth starts the OAuth flow for a provider
func (c *oauthController) InitiateOAuth(w http.ResponseWriter, r *http.Request) {
	// provider := ctx.Param("provider")
	// userID := ctx.GetString("userID") // From auth middleware
	provider := chi.URLParam(r, "provider")
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "userID not found", http.StatusUnauthorized)
		return
	}

	authURL, err := c.oauthService.GetAuthURL(provider, userID)
	if err != nil {
		c.logger.Error("Failed to get auth URL", zap.Error(err), zap.String("provider", provider))
		utils.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("Failed to initiate OAuth: %v", err))
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, authURL)
}

// HandleCallback processes the OAuth callback
func (c *oauthController) HandleCallback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	if code == "" || state == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Missing code or state parameter")
		return
	}

	token, err := c.oauthService.HandleCallback(provider, code, state)
	if err != nil {
		c.logger.Error("OAuth callback failed", zap.Error(err), zap.String("provider", provider))
		utils.RespondWithJSON(w, http.StatusBadRequest, fmt.Sprintf("OAuth callback failed: %v", err))
		return
	}

	// Return success with partial token info (don't expose the actual tokens)
	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"provider":  provider,
		"expiresAt": token.Expiry,
		"message":   fmt.Sprintf("Successfully connected to %s", provider),
	})
}

// GetConnectedPlatforms returns all platforms the user has connected
func (c *oauthController) GetConnectedPlatforms(w http.ResponseWriter, r *http.Request) {
	// userID := ctx.GetString("userID") // From auth middleware
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "userID not found", http.StatusUnauthorized)
		return
	}

	providers := []string{"facebook", "twitter", "instagram", "linkedin", "google"}

	connectedProviders := []map[string]interface{}{}

	for _, provider := range providers {
		token, err := c.oauthService.GetToken(userID, provider)
		if err == nil && token != nil {
			connectedProviders = append(connectedProviders, map[string]interface{}{
				"name":      provider,
				"connected": true,
				"expiresAt": token.Expiry,
			})
		} else {
			connectedProviders = append(connectedProviders, map[string]interface{}{
				"name":      provider,
				"connected": false,
			})
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, connectedProviders)
}

// DisconnectPlatform removes the connection to a platform
func (c *oauthController) DisconnectPlatform(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "userID not found", http.StatusUnauthorized)
		return
	} // From auth middleware

	err := c.oauthService.RemoveToken(userID, provider)
	if err != nil {
		c.logger.Error("Failed to disconnect platform", zap.Error(err), zap.String("provider", provider))
		utils.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("Failed to disconnect: %v", err))
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"success": true, "message": fmt.Sprintf("Successfully disconnected from %s", provider)})
}
