// internal/sharing/worker.go
package sharing

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

// CircuitBreaker prevents infinite retries (reuse existing pattern)
type CircuitBreaker struct {
	failures    int
	lastFailure time.Time
	state       string // "CLOSED", "OPEN", "HALF_OPEN"
	threshold   int
	timeout     time.Duration
	mutex       sync.RWMutex
	logger      *zap.Logger
}

func NewCircuitBreaker(threshold int, timeout time.Duration, logger *zap.Logger) *CircuitBreaker {
	return &CircuitBreaker{
		threshold: threshold,
		timeout:   timeout,
		state:     "CLOSED",
		logger:    logger,
	}
}

func (cb *CircuitBreaker) Call(fn func() error) error {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	if cb.state == "OPEN" {
		if time.Since(cb.lastFailure) > cb.timeout {
			cb.state = "HALF_OPEN"
			cb.logger.Info("🔄 Social circuit breaker attempting reset")
		} else {
			remaining := cb.timeout - time.Since(cb.lastFailure)
			return &queue.NonRetryableError{
				Message: fmt.Sprintf("circuit breaker OPEN, %v remaining", remaining),
			}
		}
	}

	err := fn()
	if err != nil {
		cb.failures++
		cb.lastFailure = time.Now()
		if cb.failures >= cb.threshold {
			cb.state = "OPEN"
			cb.logger.Error("🔴 Social circuit breaker OPEN due to repeated failures",
				zap.Int("failures", cb.failures))
		}
		return err
	}

	// Success - reset circuit breaker
	if cb.failures > 0 {
		cb.logger.Info("✅ Social circuit breaker reset - service restored")
	}
	cb.failures = 0
	cb.state = "CLOSED"
	return nil
}

type SharingWorker struct {
	config          config.SocialConfig
	db              *sql.DB
	cache           cache.RedisCache
	queueService    queue.Service
	logger          *zap.Logger
	accountRepo     repositories.SocialAccountRepository
	postRepo        repositories.SocialPostRepository
	linkedinService LinkedInClient
	sharingService  SharingClient
	ctx             context.Context
	cancel          context.CancelFunc
	wg              sync.WaitGroup
	circuitBreaker  *CircuitBreaker
	queues          []string
}

func NewSharingWorker(
	cfg config.SocialConfig,
	db *sql.DB,
	cache cache.RedisCache,
	queueService queue.Service,
	logger *zap.Logger,
	accountRepo repositories.SocialAccountRepository,
	postRepo repositories.SocialPostRepository,
	linkedinService LinkedInClient,
	sharingService SharingClient,
) *SharingWorker {
	ctx, cancel := context.WithCancel(context.Background())

	return &SharingWorker{
		config:          cfg,
		db:              db,
		cache:           cache,
		queueService:    queueService,
		logger:          logger,
		accountRepo:     accountRepo,
		postRepo:        postRepo,
		linkedinService: linkedinService,
		sharingService:  sharingService,
		ctx:             ctx,
		cancel:          cancel,
		circuitBreaker:  NewCircuitBreaker(3, 5*time.Minute, logger),
		queues:          []string{"social_publishing", "social_analytics", "social_scheduler"},
	}
}

func (w *SharingWorker) Start() error {
	w.logger.Info("🚀 Starting Social Sharing Worker with circuit breaker protection")

	// Health check first
	if err := w.queueService.HealthCheck(); err != nil {
		w.logger.Warn("Queue service health check failed, continuing anyway", zap.Error(err))
	}

	// Add a small delay between starting workers to avoid connection conflicts
	for i, queueName := range w.queues {
		w.wg.Add(1)

		// Add a small delay between workers to avoid startup conflicts
		time.Sleep(time.Duration(i) * 100 * time.Millisecond)

		go func(name string, index int) {
			defer w.wg.Done()

			// Add retry logic for worker startup
			maxRetries := 3
			for attempt := 1; attempt <= maxRetries; attempt++ {
				if err := w.startWorker(name); err != nil {
					w.logger.Error("Failed to start social worker",
						zap.String("queue", name),
						zap.Int("attempt", attempt),
						zap.Error(err))

					if attempt < maxRetries {
						backoff := time.Duration(attempt) * 5 * time.Second
						w.logger.Info("Retrying social worker startup",
							zap.String("queue", name),
							zap.Duration("backoff", backoff))

						select {
						case <-time.After(backoff):
							continue
						case <-w.ctx.Done():
							return
						}
					}
				} else {
					// Worker started successfully
					return
				}
			}

			w.logger.Error("Social worker failed to start after all retries",
				zap.String("queue", name))
		}(queueName, i)
	}

	// Start scheduler for handling scheduled posts
	w.wg.Add(1)
	go func() {
		defer w.wg.Done()
		w.runScheduler()
	}()

	// Start periodic metrics sync
	w.wg.Add(1)
	go func() {
		defer w.wg.Done()
		w.runMetricsSync()
	}()

	return nil
}

func (w *SharingWorker) Stop() {
	w.logger.Info("🛑 Stopping Social Sharing Worker")
	w.cancel()

	done := make(chan struct{})
	go func() {
		w.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		w.logger.Info("✅ All social sharing workers stopped")
	case <-time.After(60 * time.Second):
		w.logger.Warn("⚠️ Timeout waiting for social sharing workers to stop")
	}
}

func (w *SharingWorker) Name() string {
	return "Social Sharing Worker"
}

func (w *SharingWorker) startWorker(queueName string) error {
	w.logger.Info("Starting social worker", zap.String("queue", queueName))

	return w.queueService.Consume(w.ctx, queueName, func(ctx context.Context, m queue.Message) error {
		start := time.Now()
		w.logger.Info("Received social message",
			zap.String("queue", queueName),
			zap.String("type", m.Type),
			zap.String("id", m.ID))

		var err error
		switch m.Type {
		case "publish_post":
			err = w.handlePublishPost(ctx, m)
		case "sync_post_metrics":
			err = w.handleSyncPostMetrics(ctx, m)
		case "refresh_account_token":
			err = w.handleRefreshAccountToken(ctx, m)
		default:
			w.logger.Warn("Unknown social message type", zap.String("type", m.Type))
			return nil
		}

		duration := time.Since(start)
		if err != nil {
			w.logger.Error("Failed to process social message",
				zap.String("queue", queueName),
				zap.String("type", m.Type),
				zap.String("id", m.ID),
				zap.Duration("duration", duration),
				zap.Error(err))
			return err
		}

		w.logger.Info("Successfully processed social message",
			zap.String("queue", queueName),
			zap.String("type", m.Type),
			zap.String("id", m.ID),
			zap.Duration("duration", duration))

		return nil
	})
}

func (w *SharingWorker) handlePublishPost(ctx context.Context, msg queue.Message) error {
	var req struct {
		PostID      uuid.UUID `json:"post_id"`
		WorkspaceID uuid.UUID `json:"workspace_id"`
		Platform    string    `json:"platform"`
		Immediate   bool      `json:"immediate"`
	}

	w.updateSocialJobStatus(ctx, msg.ID, "processing", nil)

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal publish post request: %v", err),
		}
	}

	// Get post details
	post, err := w.postRepo.GetPostByID(ctx, req.PostID, w.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return &queue.NonRetryableError{
				Message: fmt.Sprintf("post not found: %s", req.PostID.String()),
			}
		}
		return fmt.Errorf("failed to get post: %w", err)
	}

	// Check if post is ready to be published
	if !req.Immediate && post.ScheduledAt != nil && post.ScheduledAt.After(time.Now()) {
		w.logger.Info("Post not ready for publishing yet",
			zap.String("post_id", req.PostID.String()),
			zap.Time("scheduled_at", *post.ScheduledAt))
		return nil
	}

	// Get social account
	account, err := w.accountRepo.GetAccountByID(ctx, post.SocialAccountID, w.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return &queue.NonRetryableError{
				Message: fmt.Sprintf("social account not found: %s", post.SocialAccountID.String()),
			}
		}
		return fmt.Errorf("failed to get social account: %w", err)
	}

	// Check account status
	if account.Status != "connected" {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("account is not connected (status: %s)", account.Status),
		}
	}

	// Check if token is expired and refresh if needed
	if account.TokenExpiresAt != nil && account.TokenExpiresAt.Before(time.Now()) {
		if err := w.sharingService.RefreshAccountToken(ctx, account.ID); err != nil {
			w.logger.Error("Failed to refresh account token",
				zap.String("account_id", account.ID.String()),
				zap.Error(err))
			return fmt.Errorf("failed to refresh account token: %w", err)
		}

		// Re-fetch account with updated token
		account, err = w.accountRepo.GetAccountByID(ctx, post.SocialAccountID, w.db)
		if err != nil {
			return fmt.Errorf("failed to get updated account: %w", err)
		}
	}

	// Publish to the specific platform
	switch req.Platform {
	case "linkedin":
		return w.publishToLinkedIn(ctx, msg.ID, post, account)
	default:
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("unsupported platform: %s", req.Platform),
		}
	}
}

// Fix in internal/sharing/worker.go - publishToLinkedIn method
func (w *SharingWorker) publishToLinkedIn(ctx context.Context, msgID string, post *models.SocialPost, account *models.SocialAccount) error {
	return w.circuitBreaker.Call(func() error {
		authorURN := w.linkedinService.EnsurePersonURN(account.PlatformUserID)

		resp, err := w.linkedinService.CreatePostFromContent(
			ctx,
			account.AccessToken,
			authorURN,
			post.Content,
			post.MediaURLs,
			post.PostType,
		)

		if err != nil {
			// Check if it's a non-retryable error
			if w.isNonRetryableError(err) {
				// Update post status to failed
				post.Status = "failed"
				post.RetryCount++
				post.ErrorDetails = models.JSONMap{
					"error":     err.Error(),
					"timestamp": time.Now(),
				}
				post.UpdatedAt = time.Now()

				w.postRepo.UpdatePost(ctx, post, w.db)
				return &queue.NonRetryableError{
					Message: fmt.Sprintf("LinkedIn post creation failed: %v", err),
				}
			}

			// Update post status to failed for retryable errors
			post.Status = "failed"
			post.RetryCount++
			post.ErrorDetails = models.JSONMap{
				"error":     err.Error(),
				"timestamp": time.Now(),
			}
			post.UpdatedAt = time.Now()

			w.postRepo.UpdatePost(ctx, post, w.db)
			return fmt.Errorf("failed to publish to LinkedIn: %w", err)
		}

		// Update post with success details
		now := time.Now()
		post.Status = "published"
		post.PlatformPostID = &resp.ID
		post.PublishedAt = &now
		post.PlatformData = models.JSONMap{
			"linkedin_response": resp,
			"published_at":      now,
		}
		post.UpdatedAt = now

		if err := w.postRepo.UpdatePost(ctx, post, w.db); err != nil {
			w.logger.Error("Failed to update post after successful publish",
				zap.String("post_id", post.ID.String()),
				zap.Error(err))
		}
		w.updateSocialJobStatus(ctx, msgID, "completed", map[string]interface{}{
			"published_at": time.Now().Unix(),
		})
		w.logger.Info("Successfully published post to LinkedIn",
			zap.String("post_id", post.ID.String()),
			zap.String("platform_post_id", resp.ID))

		return nil
	})
}

func (w *SharingWorker) handleSyncPostMetrics(ctx context.Context, msg queue.Message) error {
	var req struct {
		PostID uuid.UUID `json:"post_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal sync metrics request: %v", err),
		}
	}

	// Get post details
	post, err := w.postRepo.GetPostByID(ctx, req.PostID, w.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return &queue.NonRetryableError{
				Message: fmt.Sprintf("post not found: %s", req.PostID.String()),
			}
		}
		return fmt.Errorf("failed to get post: %w", err)
	}

	// Only sync metrics for published posts
	if post.Status != "published" || post.PlatformPostID == nil {
		w.logger.Info("Skipping metrics sync for non-published post",
			zap.String("post_id", req.PostID.String()),
			zap.String("status", post.Status))
		return nil
	}

	// Get social account
	account, err := w.accountRepo.GetAccountByID(ctx, post.SocialAccountID, w.db)
	if err != nil {
		if err == sql.ErrNoRows {
			return &queue.NonRetryableError{
				Message: fmt.Sprintf("social account not found: %s", post.SocialAccountID.String()),
			}
		}
		return fmt.Errorf("failed to get social account: %w", err)
	}

	// Sync metrics based on platform
	switch post.Platform {
	case "linkedin":
		return w.syncLinkedInMetrics(ctx, post, account)
	default:
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("unsupported platform for metrics sync: %s", post.Platform),
		}
	}
}

func (w *SharingWorker) syncLinkedInMetrics(ctx context.Context, post *models.SocialPost, account *models.SocialAccount) error {
	return w.circuitBreaker.Call(func() error {
		// Get metrics from LinkedIn
		metrics, err := w.linkedinService.GetPostMetrics(ctx, account.AccessToken, *post.PlatformPostID)
		if err != nil {
			w.logger.Error("Failed to get LinkedIn metrics",
				zap.String("post_id", post.ID.String()),
				zap.String("platform_post_id", *post.PlatformPostID),
				zap.Error(err))
			return fmt.Errorf("failed to get LinkedIn metrics: %w", err)
		}

		// Update post metrics
		postMetrics := models.PostMetrics{
			Views:    metrics.Impressions,
			Likes:    metrics.Likes,
			Comments: metrics.Comments,
			Shares:   metrics.Shares,
		}

		if err := w.postRepo.UpdatePostMetrics(ctx, post.ID, postMetrics, w.db); err != nil {
			return fmt.Errorf("failed to update post metrics: %w", err)
		}

		w.logger.Info("Successfully synced LinkedIn metrics",
			zap.String("post_id", post.ID.String()),
			zap.Int("impressions", metrics.Impressions),
			zap.Int("likes", metrics.Likes),
			zap.Int("comments", metrics.Comments),
			zap.Int("shares", metrics.Shares))

		return nil
	})
}

func (w *SharingWorker) handleRefreshAccountToken(ctx context.Context, msg queue.Message) error {
	var req struct {
		AccountID uuid.UUID `json:"account_id"`
	}

	data, _ := json.Marshal(msg.Payload)
	if err := json.Unmarshal(data, &req); err != nil {
		return &queue.NonRetryableError{
			Message: fmt.Sprintf("failed to unmarshal refresh token request: %v", err),
		}
	}

	return w.sharingService.RefreshAccountToken(ctx, req.AccountID)
}

// isNonRetryableError determines if an error should not be retried
func (w *SharingWorker) isNonRetryableError(err error) bool {
	errorStr := err.Error()

	// LinkedIn API specific errors
	nonRetryablePatterns := []string{
		"invalid_request",
		"invalid_client",
		"invalid_grant",
		"unauthorized_client",
		"unsupported_grant_type",
		"invalid_scope",
		"access_denied",
		"validation failed",
		"required field",
		"malformed request",
		"token is invalid",
		"expired",
		"Invalid request body",
	}

	for _, pattern := range nonRetryablePatterns {
		if strings.Contains(strings.ToLower(errorStr), strings.ToLower(pattern)) {
			return true
		}
	}

	return false
}

// runScheduler checks for scheduled posts that need to be published
func (w *SharingWorker) runScheduler() {
	ticker := time.NewTicker(1 * time.Minute) // Check every minute
	defer ticker.Stop()

	w.logger.Info("Starting social post scheduler")

	for {
		select {
		case <-w.ctx.Done():
			w.logger.Info("Stopping social post scheduler")
			return
		case <-ticker.C:
			w.processScheduledPosts()
		}
	}
}

func (w *SharingWorker) processScheduledPosts() {
	ctx, cancel := context.WithTimeout(w.ctx, 30*time.Second)
	defer cancel()

	posts, err := w.postRepo.GetScheduledPosts(ctx, time.Now().Add(1*time.Minute), 50, w.db)
	if err != nil {
		w.logger.Error("Failed to get scheduled posts", zap.Error(err), zap.String("operation", "processScheduledPosts"))
		return
	}

	if len(posts) == 0 {
		return
	}

	w.logger.Info("Processing scheduled posts", zap.Int("count", len(posts)))

	for _, post := range posts {
		jobID := uuid.New().String()

		// Queue for immediate publishing
		jobPayload := map[string]interface{}{
			"job_type":     "publish_post",
			"post_id":      post.ID.String(),
			"workspace_id": post.WorkspaceID.String(),
			"platform":     post.Platform,
		}

		w.queueService.SetJobStatus(ctx, jobID, "pending", 0, jobPayload)

		queuePayload := map[string]interface{}{
			"post_id":      post.ID,
			"workspace_id": post.WorkspaceID,
			"platform":     post.Platform,
			"immediate":    false,
		}

		message := queue.Message{
			ID:      jobID,
			Type:    "publish_post",
			Payload: queuePayload,
		}

		if _, err := w.queueService.Publish(ctx, "social_publishing", message); err != nil {
			w.logger.Error("Failed to queue scheduled post",
				zap.String("post_id", post.ID.String()),
				zap.Error(err))
		}
	}
}

// runMetricsSync periodically syncs metrics for published posts
func (w *SharingWorker) runMetricsSync() {
	ticker := time.NewTicker(15 * time.Minute) // Sync every 15 minutes
	defer ticker.Stop()

	w.logger.Info("Starting periodic metrics sync")

	for {
		select {
		case <-w.ctx.Done():
			w.logger.Info("Stopping periodic metrics sync")
			return
		case <-ticker.C:
			w.syncMetricsForPlatforms()
		}
	}
}

func (w *SharingWorker) syncMetricsForPlatforms() {
	ctx, cancel := context.WithTimeout(w.ctx, 5*time.Minute)
	defer cancel()

	platforms := []string{"linkedin"} // Add more platforms as they're implemented

	for _, platform := range platforms {
		// Get posts that need metrics sync (published in last 30 days)
		since := time.Now().Add(-30 * 24 * time.Hour)
		posts, err := w.postRepo.GetPostsNeedingMetricsSync(ctx, platform, since, 100, w.db)
		if err != nil {
			w.logger.Error("Failed to get posts needing metrics sync",
				zap.String("platform", platform),
				zap.Error(err))
			continue
		}

		if len(posts) == 0 {
			continue
		}

		w.logger.Info("Queueing metrics sync jobs",
			zap.String("platform", platform),
			zap.Int("count", len(posts)))

		for _, post := range posts {
			jobPayload := map[string]interface{}{
				"post_id": post.ID,
			}

			message := queue.Message{
				Type:    "sync_post_metrics",
				Payload: jobPayload,
				ID:      uuid.New().String(),
			}

			if _, err := w.queueService.Publish(ctx, "social_analytics", message); err != nil {
				w.logger.Error("Failed to queue metrics sync job",
					zap.String("post_id", post.ID.String()),
					zap.Error(err))
			}

			// Small delay to avoid overwhelming the API
			time.Sleep(100 * time.Millisecond)
		}
	}
}

func (w *SharingWorker) updateSocialJobStatus(ctx context.Context, jobID, status string, additionalData map[string]interface{}) {
	jobPayload := map[string]interface{}{
		"job_type": "publish_post",
	}

	for k, v := range additionalData {
		jobPayload[k] = v
	}

	progress := 0
	switch status {
	case "processing":
		progress = 50
	case "completed":
		progress = 100
	}

	w.queueService.SetJobStatus(ctx, jobID, status, progress, jobPayload)
}
