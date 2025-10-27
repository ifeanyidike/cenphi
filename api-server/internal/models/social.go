// internal/models/social.go
package models

import (
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// SocialAccount represents a connected social media account
type SocialAccount struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	WorkspaceID      uuid.UUID  `json:"workspace_id" db:"workspace_id" validate:"required"`
	UserID           uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	Platform         string     `json:"platform" db:"platform" validate:"required,oneof=linkedin facebook twitter instagram"`
	AccessToken      string     `json:"-" db:"access_token"`  // Never expose in JSON
	RefreshToken     *string    `json:"-" db:"refresh_token"` // Never expose in JSON
	TokenExpiresAt   *time.Time `json:"token_expires_at" db:"token_expires_at"`
	PlatformUserID   string     `json:"platform_user_id" db:"platform_user_id" validate:"required"`
	PlatformUsername *string    `json:"platform_username" db:"platform_username"`
	PlatformEmail    *string    `json:"platform_email" db:"platform_email"`
	AccountName      *string    `json:"account_name" db:"account_name"`
	AccountType      *string    `json:"account_type" db:"account_type"`   // personal, business, page
	PlatformData     JSONMap    `json:"platform_data" db:"platform_data"` // Platform-specific data
	Permissions      []string   `json:"permissions" db:"permissions"`     // OAuth scopes
	Status           string     `json:"status" db:"status" validate:"oneof=connected expired revoked error"`
	LastError        *string    `json:"last_error" db:"last_error"`
	LastSyncAt       *time.Time `json:"last_sync_at" db:"last_sync_at"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// SocialPost represents a social media post
type SocialPost struct {
	ID              uuid.UUID   `json:"id" db:"id"`
	WorkspaceID     uuid.UUID   `json:"workspace_id" db:"workspace_id" validate:"required"`
	TestimonialID   *uuid.UUID  `json:"testimonial_id" db:"testimonial_id"`
	TestimonialIDs  []uuid.UUID `json:"testimonial_ids" db:"testimonial_ids"`
	SocialAccountID uuid.UUID   `json:"social_account_id" db:"social_account_id" validate:"required"`
	Content         string      `json:"content" db:"content" validate:"required,min=1,max=3000"`
	PostType        string      `json:"post_type" db:"post_type" validate:"oneof=text image video carousel"`
	MediaURLs       []string    `json:"media_urls" db:"media_urls"`
	Hashtags        []string    `json:"hashtags" db:"hashtags"`
	Platform        string      `json:"platform" db:"platform" validate:"required,oneof=linkedin facebook twitter instagram"`
	PlatformPostID  *string     `json:"platform_post_id" db:"platform_post_id"`
	PlatformURL     *string     `json:"platform_url" db:"platform_url"`
	Status          string      `json:"status" db:"status" validate:"oneof=draft scheduled published failed"`
	ScheduledAt     *time.Time  `json:"scheduled_at" db:"scheduled_at"`
	PublishedAt     *time.Time  `json:"published_at" db:"published_at"`
	AiBestTime      *time.Time  `json:"ai_best_time" db:"ai_best_time"`
	AiBestTimeScore *float64    `json:"ai_best_time_score" db:"ai_best_time_score"`
	ViewsCount      int         `json:"views_count" db:"views_count"`
	LikesCount      int         `json:"likes_count" db:"likes_count"`
	CommentsCount   int         `json:"comments_count" db:"comments_count"`
	SharesCount     int         `json:"shares_count" db:"shares_count"`
	PlatformData    JSONMap     `json:"platform_data" db:"platform_data"`
	ErrorDetails    JSONMap     `json:"error_details" db:"error_details"`
	RetryCount      int         `json:"retry_count" db:"retry_count"`
	MaxRetries      int         `json:"max_retries" db:"max_retries"`
	LastMetricsSync *time.Time  `json:"last_metrics_sync" db:"last_metrics_sync"`
	CreatedAt       time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at" db:"updated_at"`

	// Computed fields (not in DB)
	Account     *SocialAccount `json:"account,omitempty" db:"-"`
	Testimonial *Testimonial   `json:"testimonial,omitempty" db:"-"`
}

// PostMetrics represents post engagement metrics
type PostMetrics struct {
	Views    int `json:"views"`
	Likes    int `json:"likes"`
	Comments int `json:"comments"`
	Shares   int `json:"shares"`
}

// LinkedIn specific structures
type LinkedInProfile struct {
	ID             string `json:"id"`
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	EmailAddress   string `json:"emailAddress"`
	ProfilePicture string `json:"profilePicture"`
}

type LinkedInPosition struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Company   string `json:"company"`
	IsCurrent bool   `json:"isCurrent"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}

// LinkedIn OAuth token response
type LinkedInTokenResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

// LinkedIn post creation request
type LinkedInPostRequest struct {
	Author          string                 `json:"author"`
	LifecycleState  string                 `json:"lifecycleState"`
	SpecificContent map[string]interface{} `json:"specificContent"`
	Visibility      map[string]interface{} `json:"visibility"`
}

// LinkedIn post response
type LinkedInPostResponse struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Activity  string    `json:"activity"`
}

// LinkedIn post metrics response
type LinkedInPostMetrics struct {
	Impressions int `json:"impressions"`
	Clicks      int `json:"clicks"`
	Likes       int `json:"likes"`
	Comments    int `json:"comments"`
	Shares      int `json:"shares"`
}

// OAuth state for preventing CSRF attacks
type OAuthState struct {
	State       string    `json:"state"`
	WorkspaceID uuid.UUID `json:"workspace_id"`
	UserID      uuid.UUID `json:"user_id"`
	Platform    string    `json:"platform"`
	ReturnURL   string    `json:"return_url"` // URL to redirect user after OAuth
	CreatedAt   time.Time `json:"created_at"`
}

// Post creation request from API
type CreatePostRequest struct {
	Content         string      `json:"content" validate:"required,min=1,max=3000"`
	TestimonialID   *uuid.UUID  `json:"testimonial_id"`
	TestimonialIDs  []uuid.UUID `json:"testimonial_ids"`
	SocialAccountID *uuid.UUID  `json:"social_account_id"`
	PostType        string      `json:"post_type" validate:"omitempty,oneof=text image video carousel"`
	MediaURLs       []string    `json:"media_urls"`
	Hashtags        []string    `json:"hashtags"`
	ScheduledAt     *time.Time  `json:"scheduled_at"`
	AiPickBestTime  bool        `json:"ai_pick_best_time"`
}

// Post update request from API
type UpdatePostRequest struct {
	Content     *string    `json:"content" validate:"omitempty,min=1,max=3000"`
	PostType    *string    `json:"post_type" validate:"omitempty,oneof=text image video carousel"`
	MediaURLs   []string   `json:"media_urls"`
	Hashtags    []string   `json:"hashtags"`
	ScheduledAt *time.Time `json:"scheduled_at"`
}

// OAuth callback request
type OAuthCallbackRequest struct {
	Code  string `json:"code" validate:"required"`
	State string `json:"state" validate:"required"`
}

// Schedule post request
type SchedulePostRequest struct {
	ScheduledAt    *time.Time `json:"scheduled_at"`
	AiPickBestTime bool       `json:"ai_pick_best_time"`
}

// Analytics response
type PostAnalytics struct {
	PostID      uuid.UUID              `json:"post_id"`
	Platform    string                 `json:"platform"`
	Metrics     PostMetrics            `json:"metrics"`
	Engagement  map[string]interface{} `json:"engagement"`
	LastUpdated time.Time              `json:"last_updated"`
}

// Validation functions
func ValidateSocialAccount(account *SocialAccount) error {
	validate := validator.New()
	return validate.Struct(account)
}

func ValidateSocialPost(post *SocialPost) error {
	validate := validator.New()
	return validate.Struct(post)
}

func ValidateCreatePostRequest(req *CreatePostRequest) error {
	validate := validator.New()

	// Custom validation for testimonial IDs
	if req.TestimonialID != nil && len(req.TestimonialIDs) > 0 {
		return fmt.Errorf("cannot specify both testimonial_id and testimonial_ids")
	}

	// Validate scheduling logic
	if req.AiPickBestTime && req.ScheduledAt != nil {
		return fmt.Errorf("cannot specify both ai_pick_best_time and scheduled_at")
	}

	return validate.Struct(req)
}

func ValidateUpdatePostRequest(req *UpdatePostRequest) error {
	validate := validator.New()
	return validate.Struct(req)
}

func ValidateOAuthCallbackRequest(req *OAuthCallbackRequest) error {
	validate := validator.New()
	return validate.Struct(req)
}

// BestTimeRequest represents a request for AI-powered optimal posting time
type BestTimeRequest struct {
	Platform        string `json:"platform" validate:"required,oneof=linkedin facebook twitter instagram"`
	PostType        string `json:"post_type" validate:"required,oneof=text image video carousel"`
	ContentCategory string `json:"content_category,omitempty"`
}

// BestTimeResponse represents the AI-generated optimal posting time recommendation
type BestTimeResponse struct {
	SuggestedTime    string                  `json:"suggested_time"`
	ConfidenceScore  float64                 `json:"confidence_score"`
	Reasoning        string                  `json:"reasoning"`
	AlternativeTimes []AlternativeTimeOption `json:"alternative_times"`
}

// AlternativeTimeOption represents an alternative posting time with score and reason
type AlternativeTimeOption struct {
	Time   string  `json:"time"`
	Score  float64 `json:"score"`
	Reason string  `json:"reason"`
}

func ValidateBestTimeRequest(req *BestTimeRequest) error {
	validate := validator.New()
	return validate.Struct(req)
}
