// internal/repositories/social_repository.go
package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type SocialAccountRepository interface {
	CreateAccount(ctx context.Context, account *models.SocialAccount, db DB) error
	GetAccountByID(ctx context.Context, id uuid.UUID, db DB) (*models.SocialAccount, error)
	GetAccountsByWorkspace(ctx context.Context, workspaceID uuid.UUID, db DB) ([]*models.SocialAccount, error)
	GetAccountByPlatform(ctx context.Context, workspaceID uuid.UUID, platform string, db DB) (*models.SocialAccount, error)
	UpdateAccount(ctx context.Context, account *models.SocialAccount, db DB) error
	UpdateAccountStatus(ctx context.Context, accountID uuid.UUID, status string, lastError string, db DB) error
	DeleteAccount(ctx context.Context, id uuid.UUID, db DB) error
	UpdateTokens(ctx context.Context, accountID uuid.UUID, accessToken, refreshToken string, expiresAt *time.Time, db DB) error
}

type SocialPostRepository interface {
	CreatePost(ctx context.Context, post *models.SocialPost, db DB) error
	GetPostByID(ctx context.Context, id uuid.UUID, db DB) (*models.SocialPost, error)
	GetPostsByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int, offset int, db DB) ([]*models.SocialPost, error)
	GetPostsByAccount(ctx context.Context, accountID uuid.UUID, limit int, offset int, db DB) ([]*models.SocialPost, error)
	GetScheduledPosts(ctx context.Context, before time.Time, limit int, db DB) ([]*models.SocialPost, error)
	UpdatePost(ctx context.Context, post *models.SocialPost, db DB) error
	UpdatePostStatus(ctx context.Context, postID uuid.UUID, status string, platformPostID, platformURL string, publishedAt *time.Time, db DB) error
	UpdatePostMetrics(ctx context.Context, postID uuid.UUID, metrics models.PostMetrics, db DB) error
	DeletePost(ctx context.Context, id uuid.UUID, db DB) error
	GetPostsNeedingMetricsSync(ctx context.Context, platform string, since time.Time, limit int, db DB) ([]*models.SocialPost, error)
}

type socialAccountRepository struct {
	redis *redis.Client
}

type socialPostRepository struct {
	redis *redis.Client
}

func NewSocialAccountRepository(redis *redis.Client) SocialAccountRepository {
	return &socialAccountRepository{redis: redis}
}

func NewSocialPostRepository(redis *redis.Client) SocialPostRepository {
	return &socialPostRepository{redis: redis}
}

// Social Account Repository Implementation
func (r *socialAccountRepository) CreateAccount(ctx context.Context, account *models.SocialAccount, db DB) error {
	query := `
		INSERT INTO social_accounts (
			id, workspace_id, user_id, platform, access_token, refresh_token, 
			token_expires_at, platform_user_id, platform_username, platform_email,
			account_name, account_type, platform_data, permissions, status, 
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
		)
	`

	platformDataJSON, err := json.Marshal(account.PlatformData)
	if err != nil {
		return fmt.Errorf("failed to marshal platform data: %w", err)
	}

	_, err = db.ExecContext(ctx, query,
		account.ID, account.WorkspaceID, account.UserID, account.Platform,
		account.AccessToken, account.RefreshToken, account.TokenExpiresAt,
		account.PlatformUserID, account.PlatformUsername, account.PlatformEmail,
		account.AccountName, account.AccountType, platformDataJSON, pq.Array(account.Permissions),
		account.Status, account.CreatedAt, account.UpdatedAt,
	)

	return err
}

func (r *socialAccountRepository) GetAccountByID(ctx context.Context, id uuid.UUID, db DB) (*models.SocialAccount, error) {
	query := `
		SELECT id, workspace_id, user_id, platform, access_token, refresh_token,
			   token_expires_at, platform_user_id, platform_username, platform_email,
			   account_name, account_type, platform_data, permissions, status,
			   last_error, last_sync_at, created_at, updated_at
		FROM social_accounts 
		WHERE id = $1
	`

	var account models.SocialAccount
	var platformDataJSON []byte
	var permissions pq.StringArray

	err := db.QueryRowContext(ctx, query, id).Scan(
		&account.ID, &account.WorkspaceID, &account.UserID, &account.Platform,
		&account.AccessToken, &account.RefreshToken, &account.TokenExpiresAt,
		&account.PlatformUserID, &account.PlatformUsername, &account.PlatformEmail,
		&account.AccountName, &account.AccountType, &platformDataJSON, &permissions,
		&account.Status, &account.LastError, &account.LastSyncAt,
		&account.CreatedAt, &account.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if len(platformDataJSON) > 0 {
		if err := json.Unmarshal(platformDataJSON, &account.PlatformData); err != nil {
			return nil, fmt.Errorf("failed to unmarshal platform data: %w", err)
		}
	}

	account.Permissions = []string(permissions)

	return &account, nil
}

func (r *socialAccountRepository) GetAccountsByWorkspace(ctx context.Context, workspaceID uuid.UUID, db DB) ([]*models.SocialAccount, error) {
	query := `
		SELECT id, workspace_id, user_id, platform, access_token, refresh_token,
			   token_expires_at, platform_user_id, platform_username, platform_email,
			   account_name, account_type, platform_data, permissions, status,
			   last_error, last_sync_at, created_at, updated_at
		FROM social_accounts 
		WHERE workspace_id = $1
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var accounts []*models.SocialAccount

	for rows.Next() {
		var account models.SocialAccount
		var platformDataJSON []byte
		var permissions pq.StringArray

		err := rows.Scan(
			&account.ID, &account.WorkspaceID, &account.UserID, &account.Platform,
			&account.AccessToken, &account.RefreshToken, &account.TokenExpiresAt,
			&account.PlatformUserID, &account.PlatformUsername, &account.PlatformEmail,
			&account.AccountName, &account.AccountType, &platformDataJSON, &permissions,
			&account.Status, &account.LastError, &account.LastSyncAt,
			&account.CreatedAt, &account.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		if len(platformDataJSON) > 0 {
			if err := json.Unmarshal(platformDataJSON, &account.PlatformData); err != nil {
				return nil, fmt.Errorf("failed to unmarshal platform data: %w", err)
			}
		}

		account.Permissions = []string(permissions)
		accounts = append(accounts, &account)
	}

	return accounts, rows.Err()
}

func (r *socialAccountRepository) GetAccountByPlatform(ctx context.Context, workspaceID uuid.UUID, platform string, db DB) (*models.SocialAccount, error) {
	query := `
		SELECT id, workspace_id, user_id, platform, access_token, refresh_token,
			   token_expires_at, platform_user_id, platform_username, platform_email,
			   account_name, account_type, platform_data, permissions, status,
			   last_error, last_sync_at, created_at, updated_at
		FROM social_accounts 
		WHERE workspace_id = $1 AND platform = $2 AND status = 'connected'
		ORDER BY created_at DESC
		LIMIT 1
	`

	var account models.SocialAccount
	var platformDataJSON []byte
	var permissions pq.StringArray

	err := db.QueryRowContext(ctx, query, workspaceID, platform).Scan(
		&account.ID, &account.WorkspaceID, &account.UserID, &account.Platform,
		&account.AccessToken, &account.RefreshToken, &account.TokenExpiresAt,
		&account.PlatformUserID, &account.PlatformUsername, &account.PlatformEmail,
		&account.AccountName, &account.AccountType, &platformDataJSON, &permissions,
		&account.Status, &account.LastError, &account.LastSyncAt,
		&account.CreatedAt, &account.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if len(platformDataJSON) > 0 {
		if err := json.Unmarshal(platformDataJSON, &account.PlatformData); err != nil {
			return nil, fmt.Errorf("failed to unmarshal platform data: %w", err)
		}
	}

	account.Permissions = []string(permissions)

	return &account, nil
}

func (r *socialAccountRepository) UpdateAccount(ctx context.Context, account *models.SocialAccount, db DB) error {
	query := `
		UPDATE social_accounts SET
			access_token = $2, refresh_token = $3, token_expires_at = $4,
			platform_username = $5, platform_email = $6, account_name = $7,
			account_type = $8, platform_data = $9, permissions = $10,
			status = $11, last_error = $12, last_sync_at = $13, updated_at = $14
		WHERE id = $1
	`

	platformDataJSON, err := json.Marshal(account.PlatformData)
	if err != nil {
		return fmt.Errorf("failed to marshal platform data: %w", err)
	}

	account.UpdatedAt = time.Now()

	_, err = db.ExecContext(ctx, query,
		account.ID, account.AccessToken, account.RefreshToken, account.TokenExpiresAt,
		account.PlatformUsername, account.PlatformEmail, account.AccountName,
		account.AccountType, platformDataJSON, pq.Array(account.Permissions),
		account.Status, account.LastError, account.LastSyncAt, account.UpdatedAt,
	)

	return err
}

func (r *socialAccountRepository) UpdateAccountStatus(ctx context.Context, accountID uuid.UUID, status string, lastError string, db DB) error {
	query := `
		UPDATE social_accounts SET
			status = $2, last_error = $3, updated_at = $4
		WHERE id = $1
	`

	_, err := db.ExecContext(ctx, query, accountID, status, lastError, time.Now())
	return err
}

func (r *socialAccountRepository) UpdateTokens(ctx context.Context, accountID uuid.UUID, accessToken, refreshToken string, expiresAt *time.Time, db DB) error {
	query := `
		UPDATE social_accounts SET
			access_token = $2, refresh_token = $3, token_expires_at = $4,
			status = 'connected', last_error = NULL, updated_at = $5
		WHERE id = $1
	`

	_, err := db.ExecContext(ctx, query, accountID, accessToken, refreshToken, expiresAt, time.Now())
	return err
}

// DeleteAccount deletes a social account repository
func (r *socialAccountRepository) DeleteAccount(ctx context.Context, id uuid.UUID, db DB) error {
	query := `DELETE FROM social_accounts WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id)
	return err
}

// Social Post Repository Implementation
func (r *socialPostRepository) CreatePost(ctx context.Context, post *models.SocialPost, db DB) error {
	query := `
		INSERT INTO social_posts (
			id, workspace_id, testimonial_id, social_account_id, content, post_type,
			media_urls, hashtags, platform, platform_post_id, platform_url,
			status, scheduled_at, published_at, views_count, likes_count,
			comments_count, shares_count, platform_data, error_details,
			retry_count, max_retries, last_metrics_sync, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
		)
	`

	platformDataJSON, err := json.Marshal(post.PlatformData)
	if err != nil {
		return fmt.Errorf("failed to marshal platform data: %w", err)
	}

	errorDetailsJSON, err := json.Marshal(post.ErrorDetails)
	if err != nil {
		return fmt.Errorf("failed to marshal error details: %w", err)
	}

	_, err = db.ExecContext(ctx, query,
		post.ID, post.WorkspaceID, post.TestimonialID, post.SocialAccountID,
		post.Content, post.PostType, pq.Array(post.MediaURLs), pq.Array(post.Hashtags),
		post.Platform, post.PlatformPostID, post.PlatformURL, post.Status,
		post.ScheduledAt, post.PublishedAt, post.ViewsCount, post.LikesCount,
		post.CommentsCount, post.SharesCount, platformDataJSON, errorDetailsJSON,
		post.RetryCount, post.MaxRetries, post.LastMetricsSync,
		post.CreatedAt, post.UpdatedAt,
	)

	return err
}

func (r *socialPostRepository) GetPostByID(ctx context.Context, id uuid.UUID, db DB) (*models.SocialPost, error) {
	query := `
		SELECT id, workspace_id, testimonial_id, social_account_id, content, post_type,
			   media_urls, hashtags, platform, platform_post_id, platform_url,
			   status, scheduled_at, published_at, views_count, likes_count,
			   comments_count, shares_count, platform_data, error_details,
			   retry_count, max_retries, last_metrics_sync, created_at, updated_at
		FROM social_posts 
		WHERE id = $1
	`

	var post models.SocialPost
	var mediaURLs, hashtags pq.StringArray
	var platformDataJSON, errorDetailsJSON []byte

	err := db.QueryRowContext(ctx, query, id).Scan(
		&post.ID, &post.WorkspaceID, &post.TestimonialID, &post.SocialAccountID,
		&post.Content, &post.PostType, &mediaURLs, &hashtags, &post.Platform,
		&post.PlatformPostID, &post.PlatformURL, &post.Status, &post.ScheduledAt,
		&post.PublishedAt, &post.ViewsCount, &post.LikesCount, &post.CommentsCount,
		&post.SharesCount, &platformDataJSON, &errorDetailsJSON, &post.RetryCount,
		&post.MaxRetries, &post.LastMetricsSync, &post.CreatedAt, &post.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	post.MediaURLs = []string(mediaURLs)
	post.Hashtags = []string(hashtags)

	if len(platformDataJSON) > 0 {
		if err := json.Unmarshal(platformDataJSON, &post.PlatformData); err != nil {
			return nil, fmt.Errorf("failed to unmarshal platform data: %w", err)
		}
	}

	if len(errorDetailsJSON) > 0 {
		if err := json.Unmarshal(errorDetailsJSON, &post.ErrorDetails); err != nil {
			return nil, fmt.Errorf("failed to unmarshal error details: %w", err)
		}
	}

	return &post, nil
}

func (r *socialPostRepository) GetPostsByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int, offset int, db DB) ([]*models.SocialPost, error) {
	query := `
		SELECT id, workspace_id, testimonial_id, social_account_id, content, post_type,
			   media_urls, hashtags, platform, platform_post_id, platform_url,
			   status, scheduled_at, published_at, views_count, likes_count,
			   comments_count, shares_count, platform_data, error_details,
			   retry_count, max_retries, last_metrics_sync, created_at, updated_at
		FROM social_posts 
		WHERE workspace_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := db.QueryContext(ctx, query, workspaceID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.SocialPost

	for rows.Next() {
		var post models.SocialPost
		var mediaURLs, hashtags pq.StringArray
		var platformDataJSON, errorDetailsJSON []byte

		err := rows.Scan(
			&post.ID, &post.WorkspaceID, &post.TestimonialID, &post.SocialAccountID,
			&post.Content, &post.PostType, &mediaURLs, &hashtags, &post.Platform,
			&post.PlatformPostID, &post.PlatformURL, &post.Status, &post.ScheduledAt,
			&post.PublishedAt, &post.ViewsCount, &post.LikesCount, &post.CommentsCount,
			&post.SharesCount, &platformDataJSON, &errorDetailsJSON, &post.RetryCount,
			&post.MaxRetries, &post.LastMetricsSync, &post.CreatedAt, &post.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		post.MediaURLs = []string(mediaURLs)
		post.Hashtags = []string(hashtags)

		if len(platformDataJSON) > 0 {
			if err := json.Unmarshal(platformDataJSON, &post.PlatformData); err != nil {
				return nil, fmt.Errorf("failed to unmarshal platform data: %w", err)
			}
		}

		if len(errorDetailsJSON) > 0 {
			if err := json.Unmarshal(errorDetailsJSON, &post.ErrorDetails); err != nil {
				return nil, fmt.Errorf("failed to unmarshal error details: %w", err)
			}
		}

		posts = append(posts, &post)
	}

	return posts, rows.Err()
}

// Fix in your repository - GetScheduledPosts method
func (r *socialPostRepository) GetScheduledPosts(ctx context.Context, before time.Time, limit int, db DB) ([]*models.SocialPost, error) {
	query := `
		SELECT id, workspace_id, testimonial_id, social_account_id, content, post_type,
			   media_urls, hashtags, platform, platform_post_id, platform_url,
			   status, scheduled_at, published_at, views_count, likes_count,
			   comments_count, shares_count, platform_data, error_details,
			   retry_count, max_retries, last_metrics_sync, created_at, updated_at
		FROM social_posts 
		WHERE status = 'scheduled' 
		  AND scheduled_at <= $1
		  AND platform_post_id IS NULL
		ORDER BY scheduled_at ASC
		LIMIT $2
	`

	rows, err := db.QueryContext(ctx, query, before, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query scheduled posts: %w", err)
	}
	defer rows.Close()

	var posts []*models.SocialPost

	for rows.Next() {
		var post models.SocialPost
		var mediaURLs, hashtags pq.StringArray
		var platformDataJSON, errorDetailsJSON []byte

		err := rows.Scan(
			&post.ID, &post.WorkspaceID, &post.TestimonialID, &post.SocialAccountID,
			&post.Content, &post.PostType, &mediaURLs, &hashtags, &post.Platform,
			&post.PlatformPostID, &post.PlatformURL, &post.Status, &post.ScheduledAt,
			&post.PublishedAt, &post.ViewsCount, &post.LikesCount, &post.CommentsCount,
			&post.SharesCount, &platformDataJSON, &errorDetailsJSON, &post.RetryCount,
			&post.MaxRetries, &post.LastMetricsSync, &post.CreatedAt, &post.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan scheduled post: %w", err)
		}

		post.MediaURLs = []string(mediaURLs)
		post.Hashtags = []string(hashtags)

		if len(platformDataJSON) > 0 {
			if err := json.Unmarshal(platformDataJSON, &post.PlatformData); err != nil {
				return nil, fmt.Errorf("failed to unmarshal platform data: %w", err)
			}
		}

		if len(errorDetailsJSON) > 0 {
			if err := json.Unmarshal(errorDetailsJSON, &post.ErrorDetails); err != nil {
				return nil, fmt.Errorf("failed to unmarshal error details: %w", err)
			}
		}

		posts = append(posts, &post)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating scheduled posts: %w", err)
	}

	return posts, nil
}

func (r *socialPostRepository) UpdatePost(ctx context.Context, post *models.SocialPost, db DB) error {
	query := `
		UPDATE social_posts SET
			content = $2, post_type = $3, media_urls = $4, hashtags = $5,
			platform_post_id = $6, platform_url = $7, status = $8,
			scheduled_at = $9, published_at = $10, views_count = $11,
			likes_count = $12, comments_count = $13, shares_count = $14,
			platform_data = $15, error_details = $16, retry_count = $17,
			last_metrics_sync = $18, updated_at = $19
		WHERE id = $1
	`

	platformDataJSON, err := json.Marshal(post.PlatformData)
	if err != nil {
		return fmt.Errorf("failed to marshal platform data: %w", err)
	}

	errorDetailsJSON, err := json.Marshal(post.ErrorDetails)
	if err != nil {
		return fmt.Errorf("failed to marshal error details: %w", err)
	}

	post.UpdatedAt = time.Now()

	_, err = db.ExecContext(ctx, query,
		post.ID, post.Content, post.PostType, pq.Array(post.MediaURLs),
		pq.Array(post.Hashtags), post.PlatformPostID, post.PlatformURL,
		post.Status, post.ScheduledAt, post.PublishedAt, post.ViewsCount,
		post.LikesCount, post.CommentsCount, post.SharesCount,
		platformDataJSON, errorDetailsJSON, post.RetryCount,
		post.LastMetricsSync, post.UpdatedAt,
	)

	return err
}

func (r *socialPostRepository) UpdatePostStatus(ctx context.Context, postID uuid.UUID, status string, platformPostID, platformURL string, publishedAt *time.Time, db DB) error {
	query := `
		UPDATE social_posts SET
			status = $2, platform_post_id = $3, platform_url = $4,
			published_at = $5, updated_at = $6
		WHERE id = $1
	`

	_, err := db.ExecContext(ctx, query, postID, status, platformPostID, platformURL, publishedAt, time.Now())
	return err
}

func (r *socialPostRepository) UpdatePostMetrics(ctx context.Context, postID uuid.UUID, metrics models.PostMetrics, db DB) error {
	query := `
		UPDATE social_posts SET
			views_count = $2, likes_count = $3, comments_count = $4,
			shares_count = $5, last_metrics_sync = $6, updated_at = $7
		WHERE id = $1
	`

	now := time.Now()
	_, err := db.ExecContext(ctx, query, postID, metrics.Views, metrics.Likes, metrics.Comments, metrics.Shares, now, now)
	return err
}

func (r *socialPostRepository) DeletePost(ctx context.Context, id uuid.UUID, db DB) error {
	query := `DELETE FROM social_posts WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id)
	return err
}

func (r *socialPostRepository) GetPostsNeedingMetricsSync(ctx context.Context, platform string, since time.Time, limit int, db DB) ([]*models.SocialPost, error) {
	query := `
		SELECT id, workspace_id, testimonial_id, social_account_id, content, post_type,
			   media_urls, hashtags, platform, platform_post_id, platform_url,
			   status, scheduled_at, published_at, views_count, likes_count,
			   comments_count, shares_count, platform_data, error_details,
			   retry_count, max_retries, last_metrics_sync, created_at, updated_at
		FROM social_posts 
		WHERE platform = $1 
		  AND status = 'published' 
		  AND platform_post_id IS NOT NULL
		  AND published_at >= $2
		  AND (last_metrics_sync IS NULL OR last_metrics_sync < NOW() - INTERVAL '1 hour')
		ORDER BY published_at DESC
		LIMIT $3
	`

	// FIXED: Now using 3 parameters to match the 3 placeholders ($1, $2, $3)
	rows, err := db.QueryContext(ctx, query, platform, since, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts needing metrics sync: %w", err)
	}
	defer rows.Close()

	var posts []*models.SocialPost

	for rows.Next() {
		var post models.SocialPost
		var mediaURLs, hashtags pq.StringArray
		var platformDataJSON, errorDetailsJSON []byte

		err := rows.Scan(
			&post.ID, &post.WorkspaceID, &post.TestimonialID, &post.SocialAccountID,
			&post.Content, &post.PostType, &mediaURLs, &hashtags, &post.Platform,
			&post.PlatformPostID, &post.PlatformURL, &post.Status, &post.ScheduledAt,
			&post.PublishedAt, &post.ViewsCount, &post.LikesCount, &post.CommentsCount,
			&post.SharesCount, &platformDataJSON, &errorDetailsJSON, &post.RetryCount,
			&post.MaxRetries, &post.LastMetricsSync, &post.CreatedAt, &post.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan post needing metrics sync: %w", err)
		}

		post.MediaURLs = []string(mediaURLs)
		post.Hashtags = []string(hashtags)

		if len(platformDataJSON) > 0 {
			if err := json.Unmarshal(platformDataJSON, &post.PlatformData); err != nil {
				return nil, fmt.Errorf("failed to unmarshal platform data: %w", err)
			}
		}

		if len(errorDetailsJSON) > 0 {
			if err := json.Unmarshal(errorDetailsJSON, &post.ErrorDetails); err != nil {
				return nil, fmt.Errorf("failed to unmarshal error details: %w", err)
			}
		}

		posts = append(posts, &post)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating posts needing metrics sync: %w", err)
	}

	return posts, nil
}

func (r *socialPostRepository) GetPostsByAccount(ctx context.Context, accountID uuid.UUID, limit int, offset int, db DB) ([]*models.SocialPost, error) {
	query := `
		SELECT id, workspace_id, testimonial_id, social_account_id, content, post_type,
			   media_urls, hashtags, platform, platform_post_id, platform_url,
			   status, scheduled_at, published_at, views_count, likes_count,
			   comments_count, shares_count, platform_data, error_details,
			   retry_count, max_retries, last_metrics_sync, created_at, updated_at
		FROM social_posts 
		WHERE social_account_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	log.Printf("query statement is %#v", query)

	rows, err := db.QueryContext(ctx, query, accountID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.SocialPost

	for rows.Next() {
		var post models.SocialPost
		var mediaURLs, hashtags pq.StringArray
		var platformDataJSON, errorDetailsJSON []byte

		err := rows.Scan(
			&post.ID, &post.WorkspaceID, &post.TestimonialID, &post.SocialAccountID,
			&post.Content, &post.PostType, &mediaURLs, &hashtags, &post.Platform,
			&post.PlatformPostID, &post.PlatformURL, &post.Status, &post.ScheduledAt,
			&post.PublishedAt, &post.ViewsCount, &post.LikesCount, &post.CommentsCount,
			&post.SharesCount, &platformDataJSON, &errorDetailsJSON, &post.RetryCount,
			&post.MaxRetries, &post.LastMetricsSync, &post.CreatedAt, &post.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		post.MediaURLs = []string(mediaURLs)
		post.Hashtags = []string(hashtags)

		if len(platformDataJSON) > 0 {
			if err := json.Unmarshal(platformDataJSON, &post.PlatformData); err != nil {
				return nil, fmt.Errorf("failed to unmarshal platform data: %w", err)
			}
		}

		if len(errorDetailsJSON) > 0 {
			if err := json.Unmarshal(errorDetailsJSON, &post.ErrorDetails); err != nil {
				return nil, fmt.Errorf("failed to unmarshal error details: %w", err)
			}
		}

		posts = append(posts, &post)
	}

	return posts, rows.Err()
}
