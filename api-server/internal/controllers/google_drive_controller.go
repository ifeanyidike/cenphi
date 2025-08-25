// internal/controllers/google_drive_controller.go
package controllers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type GoogleDriveController interface {
	GetAuthURL(w http.ResponseWriter, r *http.Request)
	HandleOAuthCallback(w http.ResponseWriter, r *http.Request)
	ListFiles(w http.ResponseWriter, r *http.Request)
	ListTestimonialFiles(w http.ResponseWriter, r *http.Request)
	CheckConnectionStatus(w http.ResponseWriter, r *http.Request)
}

type googleDriveController struct {
	driveService                 *services.DriveService
	testimonialCollectionService services.TestimonialCollectionService
	logger                       *zap.Logger
	config                       config.Config
}

func NewGoogleDriveController(
	config config.Config,
	driveService *services.DriveService,
	testimonialCollectionService services.TestimonialCollectionService,
	logger *zap.Logger,
) GoogleDriveController {
	return &googleDriveController{
		config:                       config,
		driveService:                 driveService,
		testimonialCollectionService: testimonialCollectionService,
		logger:                       logger,
	}
}

// GetAuthURL generates OAuth URL for Google Drive authentication
func (gdc *googleDriveController) GetAuthURL(w http.ResponseWriter, r *http.Request) {
	log.Println("In Get Auth url")
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	// Get user ID from context (set by auth middleware)
	userClaims, ok := r.Context().Value("user").(map[string]any)
	if !ok {
		gdc.logger.Warn("User not authenticated")
		// utils.RespondWithError(w, http.StatusUnauthorized, "User not authenticated")
		// return
	}
	gdc.logger.Warn("User claims information", zap.Any("user claims", userClaims))

	// userID, err := uuid.Parse(userClaims["uid"].(string))
	// if err != nil {
	// 	utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
	// 	return
	// }

	// Use a consistent user ID for testing
	userID, _ := uuid.Parse("6fe5d4ae-3627-4103-af42-39fb40cc0a12")

	authURL, err := gdc.driveService.GetAuthURL(workspaceID, userID)
	if err != nil {
		gdc.logger.Error("Failed to generate auth URL", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to generate auth URL")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"auth_url": authURL,
		"message":  "Redirect user to this URL to authorize Google Drive access",
	})
}

// HandleOAuthCallback processes OAuth callback from Google
func (gdc *googleDriveController) HandleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	errorParam := r.URL.Query().Get("error")

	if errorParam != "" {
		gdc.logger.Error("OAuth error", zap.String("error", errorParam))
		utils.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("OAuth error: %s", errorParam))
		return
	}

	if code == "" || state == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Missing code or state parameter")
		return
	}

	token, authState, err := gdc.driveService.HandleOAuthCallback(r.Context(), code, state)
	if err != nil {
		gdc.logger.Error("Failed to handle OAuth callback", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Failed to process OAuth callback")
		return
	}

	tempService, err := gdc.driveService.CreateServiceWithToken(r.Context(), token)
	if err != nil {
		gdc.logger.Error("Failed to create service with token", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Failed to create service with token")
		return
	}

	// GET USER INFO FROM GOOGLE DRIVE API
	accountInfo, err := tempService.GetUserInfo(r.Context())
	if err != nil {
		gdc.logger.Warn("Failed to get user info", zap.Error(err))
		// Continue without user info
	}

	log.Printf("userID %s, \n, workspaceID %s \n, accountInfo: %#v\n\n", authState.UserID, authState.WorkspaceID, accountInfo)

	// SAVE THE ACCOUNT
	err = gdc.driveService.SaveUserAccount(r.Context(), authState.WorkspaceID, authState.UserID, token, accountInfo)
	if err != nil {
		gdc.logger.Error("Failed to save user account", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Failed to save user account")
		return
	}

	redirectURL := fmt.Sprintf("%s/oauth/success?platform=google_drive&workspace_id=%s", gdc.config.Server.BaseURL, authState.WorkspaceID.String())

	// utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
	// 	"message": "Connected successfully",
	// })

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

// ListFiles lists all files from Google Drive
// func (gdc *googleDriveController) ListFiles(w http.ResponseWriter, r *http.Request) {
// 	// Get authenticated drive service from token in request
// 	token, authenticatedService, err := gdc.getAuthenticatedService(r)
// 	if err != nil {
// 		utils.RespondWithError(w, http.StatusUnauthorized, err.Error())
// 		return
// 	}

// 	// Parse query parameters
// 	query := r.URL.Query().Get("query")
// 	pageSizeStr := r.URL.Query().Get("page_size")
// 	pageSize := 50 // default
// 	if pageSizeStr != "" {
// 		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 1000 {
// 			pageSize = ps
// 		}
// 	}

// 	files, err := authenticatedService.ListFiles(r.Context(), query, pageSize)
// 	if err != nil {
// 		gdc.logger.Error("Failed to list files", zap.Error(err))
// 		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to list files")
// 		return
// 	}

// 	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
// 		"files":     files,
// 		"query":     query,
// 		"page_size": pageSize,
// 		"total":     len(files),
// 		"token_info": map[string]interface{}{
// 			"expires_at": token.Expiry,
// 			"valid":      token.Valid(),
// 		},
// 	})
// }

func (gdc *googleDriveController) ListFiles(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	
	// Get user ID from context (set by auth middleware)
	userClaims, ok := r.Context().Value("user").(map[string]any)
	var userID uuid.UUID
	var workspaceID uuid.UUID
	var err error
	
	if !ok {
		gdc.logger.Warn("User not authenticated, using default user ID for testing")
		// For development/testing, use a default user ID
		userID, _ = uuid.Parse("6fe5d4ae-3627-4103-af42-39fb40cc0a12")
	} else {
		userID, err = uuid.Parse(userClaims["uid"].(string))
		if err != nil {
			gdc.logger.Error("Invalid user ID from claims", zap.Error(err))
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
			return
		}
	}

	log.Println("workspace: ", workspaceIDStr, "user: ", userID.String())
	workspaceID, err = uuid.Parse(workspaceIDStr)
	if err != nil {
		gdc.logger.Error("invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "invalid workspace ID")
		return
	}

	token, err := gdc.driveService.RefreshTokenIfNeeded(r.Context(), workspaceID, userID)
	if err != nil {
		gdc.logger.Error("Please reconnect Google Drive", zap.Error(err))
		utils.RespondWithError(w, http.StatusUnauthorized, "Please reconnect Google Drive")
		return
	}

	authenticatedService, err := gdc.driveService.CreateServiceWithToken(r.Context(), token)

	if err != nil {
		gdc.logger.Error("Failed to get authenticated service", zap.Error(err))
		utils.RespondWithError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Parse query parameters
	query := r.URL.Query().Get("query")
	pageSizeStr := r.URL.Query().Get("page_size")
	pageSize := 50 // default
	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 1000 {
			pageSize = ps
		}
	}

	files, err := authenticatedService.ListFiles(r.Context(), query, pageSize)
	if err != nil {
		gdc.logger.Error("Failed to list files", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to list files")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"files":     files,
		"query":     query,
		"page_size": pageSize,
		"total":     len(files),
		"token_info": map[string]interface{}{
			"expires_at": token.Expiry,
			"valid":      token.Valid(),
		},
	})
}

// ListTestimonialFiles lists files suitable for testimonials
func (gdc *googleDriveController) ListTestimonialFiles(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	
	// Get user ID from context (set by auth middleware)
	userClaims, ok := r.Context().Value("user").(map[string]any)
	var userID uuid.UUID
	var workspaceID uuid.UUID
	var err error
	
	if !ok {
		gdc.logger.Warn("User not authenticated, using default user ID for testing")
		// For development/testing, use a default user ID
		userID, _ = uuid.Parse("6fe5d4ae-3627-4103-af42-39fb40cc0a12")
	} else {
		userID, err = uuid.Parse(userClaims["uid"].(string))
		if err != nil {
			gdc.logger.Error("Invalid user ID from claims", zap.Error(err))
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid user ID")
			return
		}
	}

	log.Println("workspace: ", workspaceIDStr, "user: ", userID.String())
	workspaceID, err = uuid.Parse(workspaceIDStr)
	if err != nil {
		gdc.logger.Error("invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "invalid workspace ID")
		return
	}

	token, err := gdc.driveService.RefreshTokenIfNeeded(r.Context(), workspaceID, userID)
	if err != nil {
		gdc.logger.Error("Please reconnect Google Drive", zap.Error(err))
		utils.RespondWithError(w, http.StatusUnauthorized, "Please reconnect Google Drive")
		return
	}

	authenticatedService, err := gdc.driveService.CreateServiceWithToken(r.Context(), token)

	if err != nil {
		gdc.logger.Error("Failed to get authenticated service", zap.Error(err))
		utils.RespondWithError(w, http.StatusUnauthorized, err.Error())
		return
	}

	files, err := authenticatedService.ListTestimonialFiles(r.Context())
	if err != nil {
		gdc.logger.Error("Failed to list testimonial files", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to list testimonial files")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"files":           files,
		"total":           len(files),
		"supported_types": []string{"video/*", "application/pdf", "text/plain", "application/msword"},
	})
}

// Helper method to get authenticated service from request
func (gdc *googleDriveController) getAuthenticatedService(r *http.Request) (*oauth2.Token, *services.DriveService, error) {
	// Get token from Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, nil, fmt.Errorf("missing authorization header")
	}

	// Parse token (expecting "Bearer <token>")
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		return nil, nil, fmt.Errorf("invalid authorization header format")
	}

	accessToken := authHeader[7:]
	token := &oauth2.Token{
		AccessToken: accessToken,
		TokenType:   "Bearer",
	}

	// Create authenticated service
	authenticatedService, err := gdc.driveService.CreateServiceWithToken(r.Context(), token)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create authenticated service: %w", err)
	}

	return token, authenticatedService, nil
}

// CheckConnectionStatus checks if the user has a valid Google Drive connection
func (gdc *googleDriveController) CheckConnectionStatus(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	userID, _ := uuid.Parse("6fe5d4ae-3627-4103-af42-39fb40cc0a12")

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		gdc.logger.Error("invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "invalid workspace ID")
		return
	}

	// Try to get a valid token
	_, err = gdc.driveService.RefreshTokenIfNeeded(r.Context(), workspaceID, userID)
	if err != nil {
		// Connection is not valid
		utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"connected": false,
			"message":   "Google Drive not connected",
		})
		return
	}

	// Connection is valid
	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"connected": true,
		"message":   "Google Drive connected successfully",
	})
}
