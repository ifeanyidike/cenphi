// internal/controllers/google_drive_controller.go
package controllers

import (
	"encoding/json"
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
	GetAccounts(w http.ResponseWriter, r *http.Request)
	ListFiles(w http.ResponseWriter, r *http.Request)
	ListTestimonialFiles(w http.ResponseWriter, r *http.Request)
	ImportFile(w http.ResponseWriter, r *http.Request)
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

	authURL, err := gdc.driveService.GetAuthURL(r.Context(), workspaceID)
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

	redirectURL := fmt.Sprintf("%s/settings?platform=google_drive&workspace_id=%s", gdc.config.Server.BaseURL, authState.WorkspaceID.String())

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

// GetAccounts returns all connected Google Drive accounts for workspace
func (gdc *googleDriveController) GetAccounts(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		gdc.logger.Error("Invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	accounts, err := gdc.driveService.GetWorkspaceAccounts(r.Context(), workspaceID)
	if err != nil {
		gdc.logger.Error("Failed to get Google Drive accounts", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get Google Drive accounts")
		return
	}

	// Convert to response format (remove sensitive token information)
	type AccountResponse struct {
		ID           string `json:"id"`
		AccountEmail string `json:"email"`
		AccountName  string `json:"name"`
		Status       string `json:"status"`
		ConnectedAt  string `json:"connected_at"`
		Platform     string `json:"platform"`
	}

	var responseAccounts []AccountResponse
	for _, account := range accounts {
		email := ""
		if account.AccountEmail != nil {
			email = *account.AccountEmail
		}

		name := ""
		if account.AccountName != nil {
			name = *account.AccountName
		}

		responseAccounts = append(responseAccounts, AccountResponse{
			ID:           account.ID.String(),
			AccountEmail: email,
			AccountName:  name,
			Status:       account.Status,
			ConnectedAt:  account.CreatedAt.Format("2006-01-02T15:04:05Z"),
			Platform:     "google_drive",
		})
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"accounts": responseAccounts,
		"message":  "Google Drive accounts retrieved successfully",
	})
}

func (gdc *googleDriveController) ListFiles(w http.ResponseWriter, r *http.Request) {

	// Get workspace from URL parameter (for now - can be enhanced to derive from user)
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		gdc.logger.Error("invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "invalid workspace ID")
		return
	}

	token, err := gdc.driveService.RefreshTokenIfNeeded(r.Context(), workspaceID)
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

	// Get workspace from URL parameter (for now - can be enhanced to derive from user)
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		gdc.logger.Error("invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "invalid workspace ID")
		return
	}

	token, err := gdc.driveService.RefreshTokenIfNeeded(r.Context(), workspaceID)
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

// ImportFile imports a single file from Google Drive as a testimonial
func (gdc *googleDriveController) ImportFile(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		FileID      string `json:"file_id"`
		FileName    string `json:"file_name"`
		MimeType    string `json:"mime_type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.FileID == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "File ID is required")
		return
	}

	if req.WorkspaceID == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Workspace ID is required")
		return
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID format")
		return
	}

	gdc.logger.Info("Processing import request",
		zap.String("workspace", workspaceID.String()),
		zap.String("file", req.FileID),
		zap.String("filename", req.FileName))

	// Get user's Google Drive token and create authenticated service
	token, err := gdc.driveService.RefreshTokenIfNeeded(r.Context(), workspaceID)
	if err != nil {
		gdc.logger.Error("Failed to get valid token", zap.Error(err))
		utils.RespondWithError(w, http.StatusUnauthorized, "Please reconnect Google Drive")
		return
	}

	authenticatedService, err := gdc.driveService.CreateServiceWithToken(r.Context(), token)
	if err != nil {
		gdc.logger.Error("Failed to create authenticated service", zap.Error(err))
		utils.RespondWithError(w, http.StatusUnauthorized, "Failed to authenticate with Google Drive")
		return
	}

	// Get file metadata to verify it exists and get full details
	fileMetadata, err := authenticatedService.GetFileMetadata(r.Context(), req.FileID)
	if err != nil {
		gdc.logger.Error("Failed to get file metadata", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "File not found or inaccessible")
		return
	}

	// Validate file size (max 250MB)
	const maxFileSize int64 = 250 * 1024 * 1024 // 250MB in bytes
	if fileMetadata.Size > maxFileSize {
		gdc.logger.Warn("File too large for import",
			zap.String("file", fileMetadata.Name),
			zap.Int64("size", fileMetadata.Size),
			zap.Int64("max_size", maxFileSize))
		sizeMB := float64(fileMetadata.Size) / (1024 * 1024)
		utils.RespondWithError(w, http.StatusRequestEntityTooLarge,
			fmt.Sprintf("File too large (%.1f MB). Maximum file size is 250 MB", sizeMB))
		return
	}

	// Use existing bulk import service with single file
	result, err := gdc.testimonialCollectionService.ProcessGoogleDriveImportWithAuth(
		r.Context(),
		workspaceID,
		[]string{req.FileID},
		token,
	)
	if err != nil {
		gdc.logger.Error("Failed to import file", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to import file as testimonial")
		return
	}

	// Check if import was successful
	if result.FailureCount > 0 {
		errorMsg := "Failed to import file"
		if len(result.Errors) > 0 {
			errorMsg = result.Errors[0].Message
		}
		gdc.logger.Error("Import failed", zap.String("error", errorMsg))
		utils.RespondWithError(w, http.StatusInternalServerError, errorMsg)
		return
	}

	if result.SuccessCount == 0 || len(result.Testimonials) == 0 {
		gdc.logger.Error("No testimonial created from import")
		utils.RespondWithError(w, http.StatusInternalServerError, "No testimonial was created from the file")
		return
	}

	testimonialID := result.Testimonials[0]

	gdc.logger.Info("Successfully imported file as testimonial",
		zap.String("testimonial_id", testimonialID.String()),
		zap.String("file", req.FileID))

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":        true,
		"message":        "File imported successfully",
		"testimonial_id": testimonialID.String(),
		"file_name":      fileMetadata.Name,
		"file_size":      fileMetadata.Size,
	})
}
