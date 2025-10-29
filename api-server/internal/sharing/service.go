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
	"github.com/ifeanyidike/cenphi/internal/middleware"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/services"
	"go.uber.org/zap"
)

type SharingClient interface {
	// OAuth Management
	GetAuthURL(ctx context.Context, workspaceID uuid.UUID, platform, returnURL string) (string, error)
	HandleOAuthCallback(ctx context.Context, req *models.OAuthCallbackRequest) (*models.SocialAccount, *models.OAuthState, error)
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
	SchedulePostWithAI(ctx context.Context, postID uuid.UUID, req *models.SchedulePostRequest) (string, error)

	// Analytics
	SyncPostMetrics(ctx context.Context, postID uuid.UUID) (string, error)
	GetPostAnalytics(ctx context.Context, postID uuid.UUID) (*models.PostAnalytics, error)

	// Account Management
	GetAccounts(ctx context.Context, workspaceID uuid.UUID) ([]*models.SocialAccount, error)
	GetAccountByPlatform(ctx context.Context, workspaceID uuid.UUID, platform string) (*models.SocialAccount, error)

	// AI Features
	GetBestPostingTime(ctx context.Context, workspaceID uuid.UUID, req models.BestTimeRequest) (*models.BestTimeResponse, error)
}

type sharingClient struct {
	config          config.SocialConfig
	db              *sql.DB
	cache           cache.RedisCache
	queue           queue.Service
	logger          *zap.Logger
	accountRepo     repositories.SocialAccountRepository
	postRepo        repositories.SocialPostRepository
	userRepo        repositories.UserRepository
	linkedinClient  LinkedInClient
	bestTimeService services.BestTimeService
}

func NewSharingClient(
	cfg config.SocialConfig,
	db *sql.DB,
	cache cache.RedisCache,
	queueService queue.Service,
	logger *zap.Logger,
	accountRepo repositories.SocialAccountRepository,
	postRepo repositories.SocialPostRepository,
	userRepo repositories.UserRepository,
	linkedinClient LinkedInClient,
	bestTimeService services.BestTimeService,
) SharingClient {
	return &sharingClient{
		config:          cfg,
		db:              db,
		cache:           cache,
		queue:           queueService,
		logger:          logger,
		accountRepo:     accountRepo,
		postRepo:        postRepo,
		userRepo:        userRepo,
		linkedinClient:  linkedinClient,
		bestTimeService: bestTimeService,
	}
}

// OAuth Management
func (s *sharingClient) GetAuthURL(ctx context.Context, workspaceID uuid.UUID, platform, returnURL string) (string, error) {
	userUID, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return "", err
	}

	user, err := s.userRepo.FindByUID(ctx, userUID, s.db)
	if err != nil {
		return "", err
	}

	switch platform {
	case "linkedin":
		return s.linkedinClient.GetAuthURL(workspaceID, user.ID, returnURL)
	default:
		return "", fmt.Errorf("unsupported platform: %s", platform)
	}
}

func (s *sharingClient) HandleOAuthCallback(ctx context.Context, req *models.OAuthCallbackRequest) (*models.SocialAccount, *models.OAuthState, error) {
	// Validate request
	if err := models.ValidateOAuthCallbackRequest(req); err != nil {
		return nil, nil, fmt.Errorf("invalid callback request: %w", err)
	}

	// Exchange code for tokens and get state - this validates the state internally
	tokenResp, state, err := s.linkedinClient.ExchangeCode(ctx, req.Code, req.State)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to exchange OAuth code: %w", err)
	}

	switch state.Platform {
	case "linkedin":
		account, err := s.handleLinkedInCallback(ctx, tokenResp, state)
		return account, state, err
	default:
		return nil, nil, fmt.Errorf("unsupported platform: %s", state.Platform)
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
	s.logger.Info("📝 Creating social post",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("platform", platform),
		zap.String("post_type", req.PostType),
		zap.Bool("ai_pick_best_time", req.AiPickBestTime))

	// Validate request
	if err := models.ValidateCreatePostRequest(req); err != nil {
		return nil, fmt.Errorf("invalid post request: %w", err)
	}

	// Determine social account
	var account *models.SocialAccount
	var err error

	if req.SocialAccountID != nil {
		// Use specified account
		account, err = s.accountRepo.GetAccountByID(ctx, *req.SocialAccountID, s.db)
		if err != nil {
			if err == sql.ErrNoRows {
				return nil, fmt.Errorf("specified social account not found")
			}
			return nil, fmt.Errorf("failed to get specified account: %w", err)
		}
		// Validate account belongs to workspace and platform
		if account.WorkspaceID != workspaceID {
			return nil, fmt.Errorf("account does not belong to this workspace")
		}
		if account.Platform != platform {
			return nil, fmt.Errorf("account platform (%s) does not match requested platform (%s)", account.Platform, platform)
		}
	} else {
		// Get default account for this platform
		account, err = s.accountRepo.GetAccountByPlatform(ctx, workspaceID, platform, s.db)
		if err != nil {
			if err == sql.ErrNoRows {
				return nil, fmt.Errorf("no connected %s account found for workspace %s. Please authenticate with %s first using the /auth/%s endpoint",
					platform, workspaceID.String(), platform, platform)
			}
			return nil, fmt.Errorf("failed to get %s account: %w", platform, err)
		}
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

	// Handle AI best time suggestion
	var aiBestTime *time.Time
	var aiBestTimeScore *float64
	scheduledAt := req.ScheduledAt

	if req.AiPickBestTime && scheduledAt == nil {
		s.logger.Info("🤖 Generating AI best time suggestion")
		suggestedTime, score, err := s.bestTimeService.SuggestBestTime(ctx, workspaceID, platform, postType)
		if err != nil {
			s.logger.Error("Failed to generate AI best time", zap.Error(err))
			// Don't fail the request, just log the error and continue without AI suggestion
		} else {
			aiBestTime = &suggestedTime
			aiBestTimeScore = &score
			scheduledAt = &suggestedTime
			s.logger.Info("✅ AI best time suggested",
				zap.Time("suggested_time", suggestedTime),
				zap.Float64("confidence", score))
		}
	}

	// Create post entity
	post := &models.SocialPost{
		ID:              uuid.New(),
		WorkspaceID:     workspaceID,
		TestimonialID:   req.TestimonialID,
		TestimonialIDs:  req.TestimonialIDs,
		SocialAccountID: account.ID,
		Content:         req.Content,
		PostType:        postType,
		MediaURLs:       req.MediaURLs,
		Hashtags:        req.Hashtags,
		Platform:        platform,
		Status:          "draft",
		ScheduledAt:     scheduledAt,
		AiBestTime:      aiBestTime,
		AiBestTimeScore: aiBestTimeScore,
		RetryCount:      0,
		MaxRetries:      3,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Set initial status based on scheduling
	if scheduledAt != nil && scheduledAt.After(time.Now()) {
		post.Status = "scheduled"
	}

	// Validate post before saving
	if err := models.ValidateSocialPost(post); err != nil {
		return nil, fmt.Errorf("post validation failed: %w", err)
	}

	if err := s.postRepo.CreatePost(ctx, post, s.db); err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	s.logger.Info("✅ Social post created successfully",
		zap.String("post_id", post.ID.String()),
		zap.String("status", post.Status),
		zap.Bool("has_ai_suggestion", aiBestTime != nil))

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

// SchedulePostWithAI schedules a post using AI best time suggestion if requested
func (s *sharingClient) SchedulePostWithAI(ctx context.Context, postID uuid.UUID, req *models.SchedulePostRequest) (string, error) {
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

	var scheduledAt time.Time
	var aiBestTime *time.Time
	var aiBestTimeScore *float64

	if req.AiPickBestTime {
		// Use existing AI suggestion if available, otherwise generate new one
		if post.AiBestTime != nil && post.AiBestTime.After(time.Now()) {
			scheduledAt = *post.AiBestTime
			aiBestTime = post.AiBestTime
			aiBestTimeScore = post.AiBestTimeScore
			s.logger.Info("🔄 Using existing AI best time suggestion", zap.Time("time", scheduledAt))
		} else {
			s.logger.Info("🤖 Generating new AI best time suggestion for scheduling")
			suggestedTime, score, err := s.bestTimeService.SuggestBestTime(ctx, post.WorkspaceID, post.Platform, post.PostType)
			if err != nil {
				return "", fmt.Errorf("failed to generate AI best time: %w", err)
			}
			scheduledAt = suggestedTime
			aiBestTime = &suggestedTime
			aiBestTimeScore = &score
			s.logger.Info("✅ New AI best time generated", zap.Time("time", scheduledAt), zap.Float64("confidence", score))
		}
	} else if req.ScheduledAt != nil {
		scheduledAt = *req.ScheduledAt
	} else {
		return "", fmt.Errorf("either scheduled_at or ai_pick_best_time must be provided")
	}

	// Validate scheduled time is in the future
	if scheduledAt.Before(time.Now()) {
		return "", fmt.Errorf("scheduled time must be in the future")
	}

	// Update post with new schedule and AI data
	post.ScheduledAt = &scheduledAt
	post.AiBestTime = aiBestTime
	post.AiBestTimeScore = aiBestTimeScore
	post.Status = "scheduled"
	post.UpdatedAt = time.Now()

	if err := s.postRepo.UpdatePost(ctx, post, s.db); err != nil {
		return "", fmt.Errorf("failed to update post schedule: %w", err)
	}

	s.logger.Info("📅 Post scheduled successfully",
		zap.String("post_id", postID.String()),
		zap.Time("scheduled_at", scheduledAt),
		zap.Bool("used_ai", req.AiPickBestTime))

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
	accounts, err := s.accountRepo.GetAccountsByWorkspace(ctx, workspaceID, s.db)
	if err != nil {
		return nil, err
	}

	// Create safe versions without sensitive data
	safeAccounts := make([]*models.SocialAccount, len(accounts))
	for i, account := range accounts {
		safeAccount := &models.SocialAccount{
			ID:               account.ID,
			WorkspaceID:      account.WorkspaceID,
			UserID:           account.UserID,
			Platform:         account.Platform,
			PlatformUserID:   account.PlatformUserID,
			PlatformUsername: account.PlatformUsername,
			PlatformEmail:    account.PlatformEmail,
			AccountName:      account.AccountName,
			AccountType:      account.AccountType,
			Status:           account.Status,
			LastSyncAt:       account.LastSyncAt,
			CreatedAt:        account.CreatedAt,
			UpdatedAt:        account.UpdatedAt,
			// Deliberately omit AccessToken, RefreshToken, TokenExpiresAt, PlatformData for security
		}
		safeAccounts[i] = safeAccount
	}

	return safeAccounts, nil
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

// GetBestPostingTime generates AI-powered optimal posting time recommendation
func (s *sharingClient) GetBestPostingTime(ctx context.Context, workspaceID uuid.UUID, req models.BestTimeRequest) (*models.BestTimeResponse, error) {
	s.logger.Info("Generating best posting time recommendation",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("platform", req.Platform),
		zap.String("post_type", req.PostType))

	// Validate request
	if err := models.ValidateBestTimeRequest(&req); err != nil {
		return nil, fmt.Errorf("invalid request: %w", err)
	}

	// Use the existing best time service if available
	if s.bestTimeService != nil {
		suggestedTime, confidence, err := s.bestTimeService.SuggestBestTime(ctx, workspaceID, req.Platform, req.PostType)
		if err != nil {
			s.logger.Error("Failed to get AI best time from service", zap.Error(err))
			// Fall through to fallback logic
		} else {
			return &models.BestTimeResponse{
				SuggestedTime:   suggestedTime.Format(time.RFC3339),
				ConfidenceScore: confidence,
				Reasoning:       "AI-powered recommendation based on historical engagement data",
				AlternativeTimes: []models.AlternativeTimeOption{
					{
						Time:   suggestedTime.Add(2 * time.Hour).Format(time.RFC3339),
						Score:  confidence * 0.9,
						Reason: "Alternative high-engagement time slot",
					},
					{
						Time:   suggestedTime.Add(-3 * time.Hour).Format(time.RFC3339),
						Score:  confidence * 0.8,
						Reason: "Earlier engagement opportunity",
					},
				},
			}, nil
		}
	}

	// Fallback: Generate a reasonable suggestion based on general best practices
	s.logger.Info("Using fallback best time logic")

	now := time.Now()
	var suggestedTime time.Time
	reasoning := "Based on general social media best practices"

	switch req.Platform {
	case "linkedin":
		// LinkedIn: Tuesday-Thursday, 8-10 AM or 12-1 PM
		suggestedTime = getNextBusinessDay(now.Add(24 * time.Hour))
		suggestedTime = time.Date(suggestedTime.Year(), suggestedTime.Month(), suggestedTime.Day(), 9, 0, 0, 0, suggestedTime.Location())
		reasoning = "LinkedIn engagement is highest on weekdays between 8-10 AM when professionals check their feeds"
	case "twitter":
		// Twitter: Monday-Friday, 12-1 PM or 5-6 PM
		suggestedTime = getNextBusinessDay(now.Add(24 * time.Hour))
		suggestedTime = time.Date(suggestedTime.Year(), suggestedTime.Month(), suggestedTime.Day(), 12, 30, 0, 0, suggestedTime.Location())
		reasoning = "Twitter engagement peaks during lunch hours when people browse social media"
	case "facebook":
		// Facebook: Wednesday-Friday, 1-3 PM
		suggestedTime = getNextBusinessDay(now.Add(24 * time.Hour))
		suggestedTime = time.Date(suggestedTime.Year(), suggestedTime.Month(), suggestedTime.Day(), 14, 0, 0, 0, suggestedTime.Location())
		reasoning = "Facebook users are most active in the early afternoon on weekdays"
	default:
		// Default to next day at 10 AM
		suggestedTime = now.Add(24 * time.Hour)
		suggestedTime = time.Date(suggestedTime.Year(), suggestedTime.Month(), suggestedTime.Day(), 10, 0, 0, 0, suggestedTime.Location())
		reasoning = "Optimal posting time based on general engagement patterns"
	}

	return &models.BestTimeResponse{
		SuggestedTime:   suggestedTime.Format(time.RFC3339),
		ConfidenceScore: 0.75, // Medium confidence for fallback
		Reasoning:       reasoning,
		AlternativeTimes: []models.AlternativeTimeOption{
			{
				Time:   suggestedTime.Add(2 * time.Hour).Format(time.RFC3339),
				Score:  0.68,
				Reason: "Alternative peak engagement window",
			},
			{
				Time:   suggestedTime.Add(-3 * time.Hour).Format(time.RFC3339),
				Score:  0.62,
				Reason: "Earlier morning engagement opportunity",
			},
		},
	}, nil
}

// Helper function to get the next business day
func getNextBusinessDay(t time.Time) time.Time {
	for {
		if t.Weekday() >= time.Monday && t.Weekday() <= time.Friday {
			return t
		}
		t = t.Add(24 * time.Hour)
	}
}
