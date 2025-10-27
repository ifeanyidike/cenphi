// internal/controllers/test_controller.go
package controllers

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/sharing"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type TestController interface {
	TestOAuthStatus(w http.ResponseWriter, r *http.Request)
	TestGetGoogleDriveAuthURL(w http.ResponseWriter, r *http.Request)
	TestGetSocialAuthURL(w http.ResponseWriter, r *http.Request)
	TestHandleOAuthCallback(w http.ResponseWriter, r *http.Request)
}

type testController struct {
	driveService  *services.DriveService
	sharingClient sharing.SharingClient
	logger        *zap.Logger
}

func NewTestController(
	driveService *services.DriveService,
	sharingClient sharing.SharingClient,
	logger *zap.Logger,
) TestController {
	return &testController{
		driveService:  driveService,
		sharingClient: sharingClient,
		logger:        logger,
	}
}

// TestOAuthStatus checks OAuth configuration status
func (tc *testController) TestOAuthStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"google_drive": map[string]interface{}{
			"client_id_set":     os.Getenv("GOOGLE_DRIVE_CLIENT_ID") != "",
			"client_secret_set": os.Getenv("GOOGLE_DRIVE_CLIENT_SECRET") != "",
			"redirect_uri":      os.Getenv("GOOGLE_DRIVE_REDIRECT_URI"),
		},
		"linkedin": map[string]interface{}{
			"client_id_set":     os.Getenv("LINKEDIN_CLIENT_ID") != "",
			"client_secret_set": os.Getenv("LINKEDIN_CLIENT_SECRET") != "",
			"redirect_uri":      os.Getenv("LINKEDIN_REDIRECT_URI"),
		},
		"environment": os.Getenv("APP_ENV"),
		"test_mode":   true,
	}

	utils.RespondWithJSON(w, http.StatusOK, status)
}

// TestGetGoogleDriveAuthURL generates test Google Drive OAuth URL without auth middleware
func (tc *testController) TestGetGoogleDriveAuthURL(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	// Use a test user ID for testing (no auth required)
	testUserID, _ := uuid.Parse("6fe5d4ae-3627-4103-af42-39fb40cc0a12")

	authURL, err := tc.driveService.GetAuthURL(r.Context(), workspaceID)
	if err != nil {
		tc.logger.Error("Failed to generate auth URL", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to generate auth URL")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"auth_url":     authURL,
		"message":      "Redirect user to this URL to authorize Google Drive access",
		"test_user_id": testUserID.String(),
		"workspace_id": workspaceID.String(),
	})
}

// TestGetSocialAuthURL generates test social OAuth URL without auth middleware
func (tc *testController) TestGetSocialAuthURL(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	platform := chi.URLParam(r, "platform")
	if platform == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Platform is required")
		return
	}

	// Validate platform
	validPlatforms := map[string]bool{
		"linkedin":  true,
		"facebook":  true,
		"twitter":   true,
		"instagram": true,
	}
	if !validPlatforms[platform] {
		utils.RespondWithError(w, http.StatusBadRequest, "Unsupported platform")
		return
	}

	// Use a test user ID for testing (no auth required)
	testUserID, _ := uuid.Parse("6fe5d4ae-3627-4103-af42-39fb40cc0a12")

	// Get return_url from query parameter or use default
	returnURL := r.URL.Query().Get("return_url")
	if returnURL == "" {
		returnURL = "/settings" // Default return URL for testing
	}

	authURL, err := tc.sharingClient.GetAuthURL(r.Context(), workspaceID, platform, returnURL)
	if err != nil {
		tc.logger.Error("Failed to generate auth URL", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to generate authorization URL")
		return
	}

	response := map[string]string{
		"auth_url":     authURL,
		"platform":     platform,
		"test_user_id": testUserID.String(),
		"workspace_id": workspaceID.String(),
	}

	utils.RespondWithJSON(w, http.StatusOK, response)
}

// TestHandleOAuthCallback handles OAuth callback for testing without auth middleware
func (tc *testController) TestHandleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	var callbackData struct {
		Code        string    `json:"code"`
		State       string    `json:"state"`
		Platform    string    `json:"platform"`
		WorkspaceID uuid.UUID `json:"workspace_id"`
		UserID      uuid.UUID `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&callbackData); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	switch callbackData.Platform {
	case "google_drive":
		// Handle Google Drive OAuth callback
		token, authState, err := tc.driveService.HandleOAuthCallback(r.Context(), callbackData.Code, callbackData.State)
		if err != nil {
			tc.logger.Error("Failed to handle Google Drive OAuth callback", zap.Error(err))
			utils.RespondWithError(w, http.StatusBadRequest, "Failed to process OAuth callback")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"message":      "Google Drive OAuth successful",
			"platform":     "google_drive",
			"token_type":   token.TokenType,
			"workspace_id": authState.WorkspaceID,
			"user_id":      authState.UserID,
		})

	case "linkedin", "facebook", "twitter":
		// Handle Social Media OAuth callback
		req := &models.OAuthCallbackRequest{
			Code:  callbackData.Code,
			State: callbackData.State,
			// Platform:    callbackData.Platform,
			// WorkspaceID: callbackData.WorkspaceID,
			// UserID:      callbackData.UserID,
		}

		account, oauthState, err := tc.sharingClient.HandleOAuthCallback(r.Context(), req)
		if err != nil {
			tc.logger.Error("Failed to handle social OAuth callback", zap.Error(err))
			utils.RespondWithError(w, http.StatusBadRequest, "Failed to process OAuth callback")
			return
		}

		utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"message":     "Social OAuth successful",
			"platform":    callbackData.Platform,
			"account":     account,
			"return_url":  oauthState.ReturnURL,
			"workspace_id": oauthState.WorkspaceID,
		})

	default:
		utils.RespondWithError(w, http.StatusBadRequest, "Unsupported platform: "+callbackData.Platform)
	}
}
