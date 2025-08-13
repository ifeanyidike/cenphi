// internal/services/sharing_service.go
package sharing

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type SharingClient interface {
	// OAuth Management
	GetAuthURL(ctx context.Context, workspaceID, userID uuid.UUID, platform string) (string, error)
	HandleOAuthCallback(ctx context.Context, req *models.OAuthCallbackRequest) (*models.SocialAccount, error)
	DisconnectAccount(ctx context.Context, accountID uuid.UUID) error
	RefreshAccountToken(ctx context.Context, accountID uuid.UUID) error

	// Post Management
	CreatePost(ctx context.Context, workspaceID uuid.UUID, platform string, req *models.CreatePostRequest) (*models.SocialPost, error)
	UpdatePost(ctx context.Context, postID uuid.UUID, req *models.UpdatePostRequest) (*models.SocialPost, error)
	DeletePost(ctx context.Context, postID uuid.UUID) error
	GetPost(ctx context.Context, postID uuid.UUID) (*models.SocialPost, error)
	GetPostsByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit, offset int) ([]*models.SocialPost, error)

	// Publishing
	PublishPost(ctx context.Context, postID uuid.UUID) (string, error)
	SchedulePost(ctx context.Context, postID uuid.UUID, scheduledAt time.Time) (string, error)

	// Analytics
	SyncPostMetrics(ctx context.Context, postID uuid.UUID) (string, error)
	GetPostAnalytics(ctx context.Context, postID uuid.UUID) (*models.PostAnalytics, error)

	// Account Management
	GetAccounts(ctx context.Context, workspaceID uuid.UUID) ([]*models.SocialAccount, error)
	GetAccountByPlatform(ctx context.Context, workspaceID uuid.UUID, platform string) (*models.SocialAccount, error)
}

type sharingClient struct {
	config         config.SocialConfig
	db             *sql.DB
	cache          cache.RedisCache
	queue          queue.Service
	logger         *zap.Logger
	accountRepo    repositories.SocialAccountRepository
	postRepo       repositories.SocialPostRepository
	linkedinClient LinkedInClient
}

func NewSharingClient(
	cfg config.SocialConfig,
	db *sql.DB,
	cache cache.RedisCache,
	queueService queue.Service,
	logger *zap.Logger,
	accountRepo repositories.SocialAccountRepository,
	postRepo repositories.SocialPostRepository,
	linkedinClient LinkedInClient,
) SharingClient {
	return &sharingClient{
		config:         cfg,
		db:             db,
		cache:          cache,
		queue:          queueService,
		logger:         logger,
		accountRepo:    accountRepo,
		postRepo:       postRepo,
		linkedinClient: linkedinClient,
	}
}

// OAuth Management
func (s *sharingClient) GetAuthURL(ctx context.Context, workspaceID, userID uuid.UUID, platform string) (string, error) {
	switch platform {
	case "linkedin":
		return s.linkedinClient.GetAuthURL(workspaceID, userID)
	default:
		return "", fmt.Errorf("unsupported platform: %s", platform)
	}
}

func (s *sharingClient) HandleOAuthCallback(ctx context.Context, req *models.OAuthCallbackRequest) (*models.SocialAccount, error) {
	// Validate request
	if err := models.ValidateOAuthCallbackRequest(req); err != nil {
		return nil, fmt.Errorf("invalid callback request: %w", err)
	}

	// Exchange code for tokens and get state - this validates the state internally
	tokenResp, state, err := s.linkedinClient.ExchangeCode(ctx, req.Code, req.State)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange OAuth code: %w", err)
	}

	switch state.Platform {
	case "linkedin":
		return s.handleLinkedInCallback(ctx, tokenResp, state)
	default:
		return nil, fmt.Errorf("unsupported platform: %s", state.Platform)
	}
}

func (s *sharingClient) handleLinkedInCallback(ctx context.Context, tokenResp *models.LinkedInTokenResponse, state *models.OAuthState) (*models.SocialAccount, error) {
	// Get user profile
	profile, err := s.linkedinClient.GetProfile(ctx, tokenResp.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get LinkedIn profile: %w", err)
	}

	// Calculate token expiration
	var expiresAt *time.Time
	if tokenResp.ExpiresIn > 0 {
		expiry := time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
		expiresAt = &expiry
	}

	// Check if account already exists
	existingAccount, err := s.accountRepo.GetAccountByPlatform(ctx, state.WorkspaceID, "linkedin", s.db)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to check existing account: %w", err)
	}

	if existingAccount != nil {
		// Update existing account
		existingAccount.AccessToken = tokenResp.AccessToken
		existingAccount.RefreshToken = &tokenResp.RefreshToken
		existingAccount.TokenExpiresAt = expiresAt
		existingAccount.PlatformUsername = &profile.FirstName
		existingAccount.PlatformEmail = &profile.EmailAddress
		accountName := fmt.Sprintf("%s %s", profile.FirstName, profile.LastName)
		existingAccount.AccountName = &accountName
		existingAccount.Status = "connected"
		existingAccount.LastError = nil
		existingAccount.UpdatedAt = time.Now()

		// Update platform data
		existingAccount.PlatformData = models.JSONMap{
			"profile_picture": profile.ProfilePicture,
			"author_urn":      s.linkedinClient.EnsurePersonURN(profile.ID),
		}

		if err := s.accountRepo.UpdateAccount(ctx, existingAccount, s.db); err != nil {
			return nil, fmt.Errorf("failed to update existing account: %w", err)
		}

		return existingAccount, nil
	}

	// Create new account
	accountType := "personal"
	accountName := fmt.Sprintf("%s %s", profile.FirstName, profile.LastName)

	account := &models.SocialAccount{
		ID:               uuid.New(),
		WorkspaceID:      state.WorkspaceID,
		UserID:           state.UserID,
		Platform:         "linkedin",
		AccessToken:      tokenResp.AccessToken,
		RefreshToken:     &tokenResp.RefreshToken,
		TokenExpiresAt:   expiresAt,
		PlatformUserID:   profile.ID,
		PlatformUsername: &profile.FirstName,
		PlatformEmail:    &profile.EmailAddress,
		AccountName:      &accountName,
		AccountType:      &accountType,
		PlatformData: models.JSONMap{
			"profile_picture": profile.ProfilePicture,
			"author_urn":      fmt.Sprintf("urn:li:person:%s", profile.ID),
		},
		Permissions: []string{"profile", "w_member_social"},
		Status:      "connected",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Validate account before saving
	if err := models.ValidateSocialAccount(account); err != nil {
		return nil, fmt.Errorf("account validation failed: %w", err)
	}

	if err := s.accountRepo.CreateAccount(ctx, account, s.db); err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}

	return account, nil
}

func (s *sharingClient) DisconnectAccount(ctx context.Context, accountID uuid.UUID) error {
	return s.accountRepo.UpdateAccountStatus(ctx, accountID, "revoked", "Account disconnected by user", s.db)
}

func (s *sharingClient) RefreshAccountToken(ctx context.Context, accountID uuid.UUID) error {
	account, err := s.accountRepo.GetAccountByID(ctx, accountID, s.db)
	if err != nil {
		return fmt.Errorf("failed to get account: %w", err)
	}

	if account.RefreshToken == nil {
		return fmt.Errorf("no refresh token available")
	}

	switch account.Platform {
	case "linkedin":
		tokenResp, err := s.linkedinClient.RefreshToken(ctx, *account.RefreshToken)
		if err != nil {
			errorMsg := fmt.Sprintf("Token refresh failed: %v", err)
			s.accountRepo.UpdateAccountStatus(ctx, accountID, "expired", errorMsg, s.db)
			return fmt.Errorf("failed to refresh LinkedIn token: %w", err)
		}

		var expiresAt *time.Time
		if tokenResp.ExpiresIn > 0 {
			expiry := time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
			expiresAt = &expiry
		}

		return s.accountRepo.UpdateTokens(ctx, accountID, tokenResp.AccessToken, tokenResp.RefreshToken, expiresAt, s.db)
	default:
		return fmt.Errorf("unsupported platform for token refresh: %s", account.Platform)
	}
}

// Post Management
func (s *sharingClient) CreatePost(ctx context.Context, workspaceID uuid.UUID, platform string, req *models.CreatePostRequest) (*models.SocialPost, error) {
	// Validate request
	if err := models.ValidateCreatePostRequest(req); err != nil {
		return nil, fmt.Errorf("invalid post request: %w", err)
	}

	// Get social account for this platform
	account, err := s.accountRepo.GetAccountByPlatform(ctx, workspaceID, platform, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no connected %s account found for workspace %s. Please authenticate with %s first using the /auth/%s endpoint",
				platform, workspaceID.String(), platform, platform)
		}
		return nil, fmt.Errorf("failed to get %s account: %w", platform, err)
	}

	// Validate account status
	if account.Status != "connected" {
		return nil, fmt.Errorf("account is not connected (status: %s)", account.Status)
	}

	// Set default post type if not provided
	postType := req.PostType
	if postType == "" {
		postType = "text"
	}

	// Create post entity
	post := &models.SocialPost{
		ID:              uuid.New(),
		WorkspaceID:     workspaceID,
		TestimonialID:   req.TestimonialID,
		SocialAccountID: account.ID,
		Content:         req.Content,
		PostType:        postType,
		MediaURLs:       req.MediaURLs,
		Hashtags:        req.Hashtags,
		Platform:        platform,
		Status:          "draft",
		ScheduledAt:     req.ScheduledAt,
		RetryCount:      0,
		MaxRetries:      3,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Set initial status based on scheduling
	if req.ScheduledAt != nil && req.ScheduledAt.After(time.Now()) {
		post.Status = "scheduled"
	}

	// Validate post before saving
	if err := models.ValidateSocialPost(post); err != nil {
		return nil, fmt.Errorf("post validation failed: %w", err)
	}

	if err := s.postRepo.CreatePost(ctx, post, s.db); err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	// If post is scheduled, queue it for publishing
	if post.Status == "scheduled" {
		if _, err := s.queuePostForPublishing(ctx, post); err != nil {
			s.logger.Error("Failed to queue scheduled post", zap.Error(err), zap.String("post_id", post.ID.String()))
		}
	}

	return post, nil
}

func (s *sharingClient) UpdatePost(ctx context.Context, postID uuid.UUID, req *models.UpdatePostRequest) (*models.SocialPost, error) {
	// Validate request
	if err := models.ValidateUpdatePostRequest(req); err != nil {
		return nil, fmt.Errorf("invalid update request: %w", err)
	}

	post, err := s.postRepo.GetPostByID(ctx, postID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("post not found")
		}
		return nil, fmt.Errorf("failed to get post: %w", err)
	}

	// Only allow updates on draft or scheduled posts
	if post.Status != "draft" && post.Status != "scheduled" {
		return nil, fmt.Errorf("cannot update post with status: %s", post.Status)
	}

	// Update fields if provided
	if req.Content != nil {
		post.Content = *req.Content
	}
	if req.PostType != nil {
		post.PostType = *req.PostType
	}
	if req.MediaURLs != nil {
		post.MediaURLs = req.MediaURLs
	}
	if req.Hashtags != nil {
		post.Hashtags = req.Hashtags
	}
	if req.ScheduledAt != nil {
		post.ScheduledAt = req.ScheduledAt
		// Update status based on scheduling
		if req.ScheduledAt.After(time.Now()) {
			post.Status = "scheduled"
		} else {
			post.Status = "draft"
		}
	}

	post.UpdatedAt = time.Now()

	// Validate updated post
	if err := models.ValidateSocialPost(post); err != nil {
		return nil, fmt.Errorf("post validation failed after update: %w", err)
	}

	if err := s.postRepo.UpdatePost(ctx, post, s.db); err != nil {
		return nil, fmt.Errorf("failed to update post: %w", err)
	}

	return post, nil
}

func (s *sharingClient) DeletePost(ctx context.Context, postID uuid.UUID) error {
	post, err := s.postRepo.GetPostByID(ctx, postID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("post not found")
		}
		return fmt.Errorf("failed to get post: %w", err)
	}

	// Only allow deletion of draft, scheduled, or failed posts
	if post.Status == "published" {
		return fmt.Errorf("cannot delete published post")
	}

	return s.postRepo.DeletePost(ctx, postID, s.db)
}

func (s *sharingClient) GetPost(ctx context.Context, postID uuid.UUID) (*models.SocialPost, error) {
	post, err := s.postRepo.GetPostByID(ctx, postID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("post not found")
		}
		return nil, fmt.Errorf("failed to get post: %w", err)
	}
	return post, nil
}

func (s *sharingClient) GetPostsByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit, offset int) ([]*models.SocialPost, error) {
	return s.postRepo.GetPostsByWorkspace(ctx, workspaceID, limit, offset, s.db)
}

// Publishing
func (s *sharingClient) PublishPost(ctx context.Context, postID uuid.UUID) (string, error) {
	post, err := s.postRepo.GetPostByID(ctx, postID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("post not found")
		}
		return "", fmt.Errorf("failed to get post: %w", err)
	}

	if post.Status == "published" {
		return "", fmt.Errorf("post already published")
	}

	// Queue job for immediate publishing
	return s.queuePublishJob(ctx, post)
}

func (s *sharingClient) SchedulePost(ctx context.Context, postID uuid.UUID, scheduledAt time.Time) (string, error) {
	post, err := s.postRepo.GetPostByID(ctx, postID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("post not found")
		}
		return "", fmt.Errorf("failed to get post: %w", err)
	}

	if post.Status == "published" {
		return "", fmt.Errorf("cannot reschedule published post")
	}

	// Validate scheduled time is in the future
	if scheduledAt.Before(time.Now()) {
		return "", fmt.Errorf("scheduled time must be in the future")
	}

	// Update scheduled time
	post.ScheduledAt = &scheduledAt
	post.Status = "scheduled"
	post.UpdatedAt = time.Now()

	if err := s.postRepo.UpdatePost(ctx, post, s.db); err != nil {
		return "", fmt.Errorf("failed to update post schedule: %w", err)
	}

	// Queue for scheduled publishing
	return s.queuePostForPublishing(ctx, post)
}

// Analytics
func (s *sharingClient) SyncPostMetrics(ctx context.Context, postID uuid.UUID) (string, error) {
	// Verify post exists and is published
	post, err := s.postRepo.GetPostByID(ctx, postID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("post not found")
		}
		return "", fmt.Errorf("failed to get post: %w", err)
	}

	if post.Status != "published" {
		return "", fmt.Errorf("can only sync metrics for published posts")
	}

	// Queue job for metrics sync
	return s.queueMetricsSyncJob(ctx, postID)
}

func (s *sharingClient) GetPostAnalytics(ctx context.Context, postID uuid.UUID) (*models.PostAnalytics, error) {
	post, err := s.postRepo.GetPostByID(ctx, postID, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("post not found")
		}
		return nil, fmt.Errorf("failed to get post: %w", err)
	}

	analytics := &models.PostAnalytics{
		PostID:   postID,
		Platform: post.Platform,
		Metrics: models.PostMetrics{
			Views:    post.ViewsCount,
			Likes:    post.LikesCount,
			Comments: post.CommentsCount,
			Shares:   post.SharesCount,
		},
		Engagement: map[string]interface{}{
			"total_engagement": post.LikesCount + post.CommentsCount + post.SharesCount,
			"engagement_rate":  calculateEngagementRate(post.ViewsCount, post.LikesCount+post.CommentsCount+post.SharesCount),
		},
		LastUpdated: post.UpdatedAt,
	}

	if post.LastMetricsSync != nil {
		analytics.LastUpdated = *post.LastMetricsSync
	}

	return analytics, nil
}

// Account Management
func (s *sharingClient) GetAccounts(ctx context.Context, workspaceID uuid.UUID) ([]*models.SocialAccount, error) {
	return s.accountRepo.GetAccountsByWorkspace(ctx, workspaceID, s.db)
}

func (s *sharingClient) GetAccountByPlatform(ctx context.Context, workspaceID uuid.UUID, platform string) (*models.SocialAccount, error) {
	account, err := s.accountRepo.GetAccountByPlatform(ctx, workspaceID, platform, s.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no %s account found for workspace", platform)
		}
		return nil, fmt.Errorf("failed to get %s account: %w", platform, err)
	}
	return account, nil
}

// Helper methods
func (s *sharingClient) queuePostForPublishing(ctx context.Context, post *models.SocialPost) (string, error) {
	jobPayload := map[string]interface{}{
		"post_id":      post.ID,
		"workspace_id": post.WorkspaceID,
		"platform":     post.Platform,
	}

	message := queue.Message{
		Type:    "publish_post",
		Payload: jobPayload,
		ID:      uuid.New().String(),
	}

	return s.queue.Publish(ctx, "social_publishing", message)
}

func (s *sharingClient) queuePublishJob(ctx context.Context, post *models.SocialPost) (string, error) {
	jobPayload := map[string]interface{}{
		"post_id":      post.ID,
		"workspace_id": post.WorkspaceID,
		"platform":     post.Platform,
		"immediate":    true,
	}

	message := queue.Message{
		Type:    "publish_post",
		Payload: jobPayload,
		ID:      uuid.New().String(),
	}

	return s.queue.Publish(ctx, "social_publishing", message)
}

func (s *sharingClient) queueMetricsSyncJob(ctx context.Context, postID uuid.UUID) (string, error) {
	jobPayload := map[string]interface{}{
		"post_id": postID,
	}

	message := queue.Message{
		Type:    "sync_post_metrics",
		Payload: jobPayload,
		ID:      uuid.New().String(),
	}

	return s.queue.Publish(ctx, "social_analytics", message)
}

func calculateEngagementRate(views, engagements int) float64 {
	if views == 0 {
		return 0.0
	}
	return float64(engagements) / float64(views) * 100
}
