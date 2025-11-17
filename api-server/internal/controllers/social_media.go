// internal/controllers/social_controller.go
package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/sharing"
	"go.uber.org/zap"
)

type SocialController struct {
	sharingClient sharing.SharingClient
	logger        *zap.Logger
	config        config.Config
}

func NewSocialController(cfg config.Config, sharingClient sharing.SharingClient, logger *zap.Logger) *SocialController {
	return &SocialController{
		sharingClient: sharingClient,
		logger:        logger,
		config:        cfg,
	}
}

// OAuth endpoints

// GetAuthURL generates OAuth authorization URL for social platform
// @Summary Get OAuth authorization URL
// @Description Generate OAuth authorization URL for connecting social media account
// @Tags social
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param platform path string true "Platform (linkedin, facebook, twitter)"
// @Param return_url query string false "URL to redirect user after OAuth (defaults to /settings)"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /workspaces/{workspaceID}/social/auth/{platform} [get]
func (c *SocialController) GetAuthURL(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid workspace ID", err)
		return
	}

	platform := chi.URLParam(r, "platform")
	if platform == "" {
		c.respondError(w, http.StatusBadRequest, "Platform is required", nil)
		return
	}

	// Validate platform
	validPlatforms := map[string]bool{
		"linkedin": true,
		// "facebook":  true,
		// "twitter":   true,
		// "instagram": true,
	}
	if !validPlatforms[platform] {
		c.respondError(w, http.StatusBadRequest, "Unsupported platform", nil)
		return
	}

	// Get return_url from query parameter (optional)
	returnURL := r.URL.Query().Get("return_url")
	if returnURL == "" {
		returnURL = "/settings" // Default to settings page
	}

	// Get user ID from context
	// userID, err := middleware.GetUserFromContext(r.Context())
	// if err != nil {
	// 	c.respondError(w, http.StatusUnauthorized, err.Error(), nil)
	// 	return
	// }

	// userUUID, err := uuid.Parse(userID)
	// if err != nil {
	// 	c.logger.Error("Invalid user ID", zap.Error(err))
	// 	c.respondError(w, http.StatusBadRequest, "Invalid user ID", err)
	// 	return
	// }

	authURL, err := c.sharingClient.GetAuthURL(r.Context(), workspaceID, platform, returnURL)
	if err != nil {
		c.logger.Error("Failed to generate auth URL", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to generate authorization URL", err)
		return
	}

	response := map[string]string{
		"auth_url": authURL,
		"platform": platform,
	}

	c.respondSuccess(w, http.StatusOK, "Authorization URL generated successfully", response)
}

// HandleOAuthCallback handles OAuth callback from social platform
// @Summary Handle OAuth callback
// @Description Handle OAuth callback and create social media account connection
// @Tags social
// @Accept json
// @Produce json
// @Param request body models.OAuthCallbackRequest true "OAuth callback data"
// @Success 200 {object} models.SocialAccount
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/oauth/callback [post]
func (c *SocialController) HandleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	// var req models.OAuthCallbackRequest
	// if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
	// 	c.logger.Error("Failed to decode OAuth callback request", zap.Error(err))
	// 	c.respondError(w, http.StatusBadRequest, "Invalid request body", err)
	// 	return
	// }

	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	errorParam := r.URL.Query().Get("error")

	if errorParam != "" {
		c.logger.Error("OAuth error", zap.String("error", errorParam))
		// Redirect to settings with error
		redirectURL := fmt.Sprintf("https://cenphi.io/settings?error=%s", errorParam)
		http.Redirect(w, r, redirectURL, http.StatusFound)
		return
	}

	if code == "" || state == "" {
		// Redirect to settings with error
		redirectURL := "https://cenphi.io/settings?error=missing_parameters"
		http.Redirect(w, r, redirectURL, http.StatusFound)
		return
	}

	req := models.OAuthCallbackRequest{
		Code:  code,
		State: state,
	}

	// Validate request
	if err := models.ValidateOAuthCallbackRequest(&req); err != nil {
		c.logger.Error("OAuth callback validation failed", zap.Error(err))
		redirectURL := "https://cenphi.io/settings?error=validation_failed"
		http.Redirect(w, r, redirectURL, http.StatusFound)
		return
	}

	// Get both account and state (state contains returnURL)
	account, oauthState, err := c.sharingClient.HandleOAuthCallback(r.Context(), &req)
	if err != nil {
		c.logger.Error("Failed to handle OAuth callback", zap.Error(err))
		// Redirect to settings with error
		redirectURL := "https://cephi.io/settings?error=connection_failed"
		http.Redirect(w, r, redirectURL, http.StatusFound)
		return
	}

	// Build redirect URL using returnURL from state
	redirectURL := fmt.Sprintf("https://cenphi.io%s?platform=%s&status=connected&workspace_id=%s",
		oauthState.ReturnURL,
		account.Platform,
		account.WorkspaceID.String())

	c.logger.Info("Redirecting after OAuth success",
		zap.String("redirect_url", redirectURL),
		zap.String("platform", account.Platform))

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

// Account management endpoints

// GetAccounts returns all connected social accounts for workspace
// @Summary Get social accounts
// @Description Get all connected social media accounts for a workspace
// @Tags social
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Success 200 {array} models.SocialAccount
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /workspaces/{workspaceID}/social/accounts [get]
func (c *SocialController) GetAccounts(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid workspace ID", err)
		return
	}

	accounts, err := c.sharingClient.GetAccounts(r.Context(), workspaceID)
	if err != nil {
		c.logger.Error("Failed to get social accounts", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to get social accounts", err)
		return
	}

	c.respondSuccess(w, http.StatusOK, "Accounts retrieved successfully", accounts)
}

// DisconnectAccount disconnects a social media account
// @Summary Disconnect social account
// @Description Disconnect a social media account from workspace
// @Tags social
// @Param accountID path string true "Account ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/accounts/{accountID}/disconnect [post]
func (c *SocialController) DisconnectAccount(w http.ResponseWriter, r *http.Request) {
	accountID, err := uuid.Parse(chi.URLParam(r, "accountID"))
	if err != nil {
		c.logger.Error("Invalid account ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid account ID", err)
		return
	}

	if err := c.sharingClient.DisconnectAccount(r.Context(), accountID); err != nil {
		c.logger.Error("Failed to disconnect account", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to disconnect account", err)
		return
	}

	c.respondSuccess(w, http.StatusOK, "Account disconnected successfully", nil)
}

// Post management endpoints

// CreatePost creates a new social media post
// @Summary Create social post
// @Description Create a new social media post for a specific platform
// @Tags social
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param platform path string true "Platform (linkedin, facebook, twitter)"
// @Param request body models.CreatePostRequest true "Post creation data"
// @Success 201 {object} models.SocialPost
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /workspaces/{workspaceID}/social/{platform}/posts [post]
func (c *SocialController) CreatePost(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid workspace ID", err)
		return
	}

	platform := chi.URLParam(r, "platform")
	if platform == "" {
		c.respondError(w, http.StatusBadRequest, "Platform is required", nil)
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
		c.respondError(w, http.StatusBadRequest, "Unsupported platform", nil)
		return
	}

	var req models.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Failed to decode create post request", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate request
	if err := models.ValidateCreatePostRequest(&req); err != nil {
		c.logger.Error("Create post validation failed", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Request validation failed", err)
		return
	}

	// Set default post type if not provided
	if req.PostType == "" {
		req.PostType = "text"
	}

	post, err := c.sharingClient.CreatePost(r.Context(), workspaceID, platform, &req)
	if err != nil {
		c.logger.Error("Failed to create post", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to create post", err)
		return
	}

	c.respondSuccess(w, http.StatusCreated, "Post created successfully", post)
}

// GetPosts returns posts for a workspace
// @Summary Get social posts
// @Description Get social media posts for a workspace with pagination
// @Tags social
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param limit query int false "Limit (default 20)"
// @Param offset query int false "Offset (default 0)"
// @Success 200 {array} models.SocialPost
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /workspaces/{workspaceID}/social/posts [get]
func (c *SocialController) GetPosts(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid workspace ID", err)
		return
	}

	// Parse pagination parameters
	limit := 20
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	posts, err := c.sharingClient.GetPostsByWorkspace(r.Context(), workspaceID, limit, offset)
	if err != nil {
		c.logger.Error("Failed to get posts", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to get posts", err)
		return
	}

	c.respondSuccess(w, http.StatusOK, "Posts retrieved successfully", posts)
}

// GetPost returns a specific post
// @Summary Get social post
// @Description Get a specific social media post by ID
// @Tags social
// @Produce json
// @Param postID path string true "Post ID"
// @Success 200 {object} models.SocialPost
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/posts/{postID} [get]
func (c *SocialController) GetPost(w http.ResponseWriter, r *http.Request) {
	postID, err := uuid.Parse(chi.URLParam(r, "postID"))
	if err != nil {
		c.logger.Error("Invalid post ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid post ID", err)
		return
	}

	post, err := c.sharingClient.GetPost(r.Context(), postID)
	if err != nil {
		c.logger.Error("Failed to get post", zap.Error(err))
		if err.Error() == "post not found" {
			c.respondError(w, http.StatusNotFound, "Post not found", err)
		} else {
			c.respondError(w, http.StatusInternalServerError, "Failed to get post", err)
		}
		return
	}

	c.respondSuccess(w, http.StatusOK, "Post retrieved successfully", post)
}

// UpdatePost updates an existing post
// @Summary Update social post
// @Description Update an existing social media post
// @Tags social
// @Accept json
// @Produce json
// @Param postID path string true "Post ID"
// @Param request body models.UpdatePostRequest true "Post update data"
// @Success 200 {object} models.SocialPost
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/posts/{postID} [put]
func (c *SocialController) UpdatePost(w http.ResponseWriter, r *http.Request) {
	postID, err := uuid.Parse(chi.URLParam(r, "postID"))
	if err != nil {
		c.logger.Error("Invalid post ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid post ID", err)
		return
	}

	var req models.UpdatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Failed to decode update post request", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate request
	if err := models.ValidateUpdatePostRequest(&req); err != nil {
		c.logger.Error("Update post validation failed", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Request validation failed", err)
		return
	}

	post, err := c.sharingClient.UpdatePost(r.Context(), postID, &req)
	if err != nil {
		c.logger.Error("Failed to update post", zap.Error(err))
		if err.Error() == "post not found" {
			c.respondError(w, http.StatusNotFound, "Post not found", err)
		} else {
			c.respondError(w, http.StatusInternalServerError, "Failed to update post", err)
		}
		return
	}

	c.respondSuccess(w, http.StatusOK, "Post updated successfully", post)
}

// DeletePost deletes a post
// @Summary Delete social post
// @Description Delete a social media post
// @Tags social
// @Param postID path string true "Post ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/posts/{postID} [delete]
func (c *SocialController) DeletePost(w http.ResponseWriter, r *http.Request) {
	postID, err := uuid.Parse(chi.URLParam(r, "postID"))
	if err != nil {
		c.logger.Error("Invalid post ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid post ID", err)
		return
	}

	if err := c.sharingClient.DeletePost(r.Context(), postID); err != nil {
		c.logger.Error("Failed to delete post", zap.Error(err))
		if err.Error() == "post not found" {
			c.respondError(w, http.StatusNotFound, "Post not found", err)
		} else {
			c.respondError(w, http.StatusInternalServerError, "Failed to delete post", err)
		}
		return
	}

	c.respondSuccess(w, http.StatusOK, "Post deleted successfully", nil)
}

// Publishing endpoints

// PublishPost immediately publishes a post
// @Summary Publish social post
// @Description Immediately publish a social media post
// @Tags social
// @Param postID path string true "Post ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/posts/{postID}/publish [post]
func (c *SocialController) PublishPost(w http.ResponseWriter, r *http.Request) {
	postID, err := uuid.Parse(chi.URLParam(r, "postID"))
	if err != nil {
		c.logger.Error("Invalid post ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid post ID", err)
		return
	}

	if _, err := c.sharingClient.PublishPost(r.Context(), postID); err != nil {
		c.logger.Error("Failed to publish post", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to publish post", err)
		return
	}

	c.respondSuccess(w, http.StatusOK, "Post queued for publishing", nil)
}

// SchedulePost schedules a post for future publishing
// @Summary Schedule social post
// @Description Schedule a social media post for future publishing
// @Tags social
// @Accept json
// @Produce json
// @Param postID path string true "Post ID"
// @Param request body models.SchedulePostRequest true "Schedule data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/posts/{postID}/schedule [post]
func (c *SocialController) SchedulePost(w http.ResponseWriter, r *http.Request) {
	postID, err := uuid.Parse(chi.URLParam(r, "postID"))
	if err != nil {
		c.logger.Error("Invalid post ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid post ID", err)
		return
	}

	var req models.SchedulePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Failed to decode schedule post request", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate request logic
	if req.AiPickBestTime && req.ScheduledAt != nil {
		c.respondError(w, http.StatusBadRequest, "Cannot specify both ai_pick_best_time and scheduled_at", nil)
		return
	}

	if !req.AiPickBestTime && req.ScheduledAt == nil {
		c.respondError(w, http.StatusBadRequest, "Either scheduled_at or ai_pick_best_time must be provided", nil)
		return
	}

	// Validate scheduled time is in the future (if provided)
	if req.ScheduledAt != nil && req.ScheduledAt.Before(time.Now()) {
		c.respondError(w, http.StatusBadRequest, "Scheduled time must be in the future", nil)
		return
	}

	// Use the new AI-aware scheduling method
	jobID, err := c.sharingClient.SchedulePostWithAI(r.Context(), postID, &req)
	if err != nil {
		c.logger.Error("Failed to schedule post", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to schedule post", err)
		return
	}

	response := map[string]interface{}{
		"message": "Post scheduled successfully",
		"job_id":  jobID,
		"used_ai": req.AiPickBestTime,
	}

	if req.ScheduledAt != nil {
		response["scheduled_at"] = req.ScheduledAt.Format(time.RFC3339)
	}

	c.respondSuccess(w, http.StatusOK, "Post scheduled successfully", response)
}

// Analytics endpoints

// GetPostAnalytics returns analytics for a post
// @Summary Get post analytics
// @Description Get analytics and engagement metrics for a social media post
// @Tags social
// @Produce json
// @Param postID path string true "Post ID"
// @Success 200 {object} models.PostAnalytics
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/posts/{postID}/analytics [get]
func (c *SocialController) GetPostAnalytics(w http.ResponseWriter, r *http.Request) {
	postID, err := uuid.Parse(chi.URLParam(r, "postID"))
	if err != nil {
		c.logger.Error("Invalid post ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid post ID", err)
		return
	}

	analytics, err := c.sharingClient.GetPostAnalytics(r.Context(), postID)
	if err != nil {
		c.logger.Error("Failed to get post analytics", zap.Error(err))
		if err.Error() == "post not found" {
			c.respondError(w, http.StatusNotFound, "Post not found", err)
		} else {
			c.respondError(w, http.StatusInternalServerError, "Failed to get post analytics", err)
		}
		return
	}

	c.respondSuccess(w, http.StatusOK, "Analytics retrieved successfully", analytics)
}

// SyncPostMetrics triggers a manual metrics sync for a post
// @Summary Sync post metrics
// @Description Manually trigger metrics synchronization for a social media post
// @Tags social
// @Param postID path string true "Post ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/posts/{postID}/sync-metrics [post]
func (c *SocialController) SyncPostMetrics(w http.ResponseWriter, r *http.Request) {
	postID, err := uuid.Parse(chi.URLParam(r, "postID"))
	if err != nil {
		c.logger.Error("Invalid post ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid post ID", err)
		return
	}

	if _, err := c.sharingClient.SyncPostMetrics(r.Context(), postID); err != nil {
		c.logger.Error("Failed to sync post metrics", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to sync post metrics", err)
		return
	}

	c.respondSuccess(w, http.StatusOK, "Metrics sync queued successfully", nil)
}

// GetBestPostingTime generates AI-powered optimal posting time suggestion
// @Summary Get AI-powered best posting time
// @Description Generate optimal posting time recommendation based on historical data and AI analysis
// @Tags social
// @Accept json
// @Produce json
// @Param workspaceID path string true "Workspace ID"
// @Param request body models.BestTimeRequest true "Best time request parameters"
// @Success 200 {object} models.BestTimeResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /social/workspaces/{workspaceID}/ai/best-time [post]
func (c *SocialController) GetBestPostingTime(w http.ResponseWriter, r *http.Request) {
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		c.logger.Error("Invalid workspace ID", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid workspace ID", err)
		return
	}

	var req models.BestTimeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Failed to decode request body", zap.Error(err))
		c.respondError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate required fields
	if req.Platform == "" {
		c.respondError(w, http.StatusBadRequest, "Platform is required", nil)
		return
	}

	// Generate AI recommendation
	bestTime, err := c.sharingClient.GetBestPostingTime(r.Context(), workspaceID, req)
	if err != nil {
		c.logger.Error("Failed to get best posting time", zap.Error(err))
		c.respondError(w, http.StatusInternalServerError, "Failed to generate time recommendation", err)
		return
	}

	c.respondSuccess(w, http.StatusOK, "Best posting time generated successfully", bestTime)
}

// Helper methods for consistent response formatting
func (c *SocialController) respondSuccess(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := map[string]interface{}{
		"success": true,
		"message": message,
		"data":    data,
	}

	json.NewEncoder(w).Encode(response)
}

func (c *SocialController) respondError(w http.ResponseWriter, statusCode int, message string, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := map[string]interface{}{
		"success": false,
		"message": message,
	}

	if err != nil {
		c.logger.Error("Request error", zap.Error(err), zap.String("message", message))
		// Don't expose internal errors to clients in production
		if statusCode >= 500 {
			response["error"] = "Internal server error"
		} else {
			response["error"] = err.Error()
		}
	}

	json.NewEncoder(w).Encode(response)
}
