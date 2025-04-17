// models/testimonial.go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
)

// ---------------------------
// ENUM TYPES & CONSTANTS
// ---------------------------

type TestimonialType string

const (
	TestimonialTypeCustomer   TestimonialType = "customer"
	TestimonialTypeEmployee   TestimonialType = "employee"
	TestimonialTypePartner    TestimonialType = "partner"
	TestimonialTypeInfluencer TestimonialType = "influencer"
	TestimonialTypeExpert     TestimonialType = "expert"
	TestimonialTypeCaseStudy  TestimonialType = "case_study"
)

type ContentFormat string

const (
	ContentFormatText       ContentFormat = "text"
	ContentFormatVideo      ContentFormat = "video"
	ContentFormatAudio      ContentFormat = "audio"
	ContentFormatImage      ContentFormat = "image"
	ContentFormatSocialPost ContentFormat = "social_post"
	ContentFormatSurvey     ContentFormat = "survey"
	ContentFormatInterview  ContentFormat = "interview"
)

type ContentStatus string

const (
	StatusPendingReview ContentStatus = "pending_review"
	StatusApproved      ContentStatus = "approved"
	StatusRejected      ContentStatus = "rejected"
	StatusArchived      ContentStatus = "archived"
	StatusFeatured      ContentStatus = "featured"
	StatusScheduled     ContentStatus = "scheduled"
)

type CollectionMethod string

const (
	CollectionMethodWebsite         CollectionMethod = "website"
	CollectionMethodEmail           CollectionMethod = "email"
	CollectionMethodChat            CollectionMethod = "chat"
	CollectionMethodSocial          CollectionMethod = "social"
	CollectionMethodCustom          CollectionMethod = "custom"
	CollectionMethodDirectLink      CollectionMethod = "direct_link"
	CollectionMethodEmbedForm       CollectionMethod = "embed_form"
	CollectionMethodQRCode          CollectionMethod = "qr_code"
	CollectionMethodEmailRequest    CollectionMethod = "email_request"
	CollectionMethodSMSRequest      CollectionMethod = "sms_request"
	CollectionMethodAPI             CollectionMethod = "api"
	CollectionMethodSocialImport    CollectionMethod = "social_import"
	CollectionMethodInterview       CollectionMethod = "interview"
	CollectionMethodSurvey          CollectionMethod = "survey"
	CollectionMethodScreenRecording CollectionMethod = "screen_recording"
	CollectionMethodEventCapture    CollectionMethod = "event_capture"
)

type VerificationType string

const (
	VerificationTypeEmail                VerificationType = "email"
	VerificationTypePhone                VerificationType = "phone"
	VerificationTypeSocialLogin          VerificationType = "social_login"
	VerificationTypeOrderVerification    VerificationType = "order_verification"
	VerificationTypeEmployeeVerification VerificationType = "employee_verification"
	VerificationTypeDomainVerification   VerificationType = "domain_verification"
)

type Sentiment string

const (
	SentimentVeryNegative Sentiment = "very_negative"
	SentimentNegative     Sentiment = "negative"
	SentimentNeutral      Sentiment = "neutral"
	SentimentPositive     Sentiment = "positive"
	SentimentVeryPositive Sentiment = "very_positive"
)

type AIServiceCategory string

const (
	AIServiceCategoryAnalysis       AIServiceCategory = "analysis"
	AIServiceCategoryEnhancement    AIServiceCategory = "enhancement"
	AIServiceCategoryGeneration     AIServiceCategory = "generation"
	AIServiceCategoryOptimization   AIServiceCategory = "optimization"
	AIServiceCategoryVerification   AIServiceCategory = "verification"
	AIServiceCategorySegmentation   AIServiceCategory = "segmentation"
	AIServiceCategoryRecommendation AIServiceCategory = "recommendation"
)

// -------------------------
// ASSOCIATED DATA MODELS
// -------------------------

// -------------------------
// THE TESTIMONIAL MODEL
// -------------------------

type Testimonial struct {
	ID          uuid.UUID `json:"id" db:"id"`
	WorkspaceID uuid.UUID `json:"workspace_id" db:"workspace_id"`

	// Customer relationship
	CustomerProfileID *uuid.UUID       `json:"customer_profile_id,omitempty" db:"customer_profile_id"`
	CustomerProfile   *CustomerProfile `json:"customer_profile,omitempty" db:"-"`

	// Categorization & Status
	TestimonialType TestimonialType `json:"testimonial_type" db:"testimonial_type"`
	Format          ContentFormat   `json:"format" db:"format"`
	Status          ContentStatus   `json:"status" db:"status"`
	Language        string          `json:"language,omitempty" db:"language"`

	// Content
	Title      string      `json:"title,omitempty" db:"title"`
	Summary    string      `json:"summary,omitempty" db:"summary"`
	Content    string      `json:"content,omitempty" db:"content"`
	Transcript string      `json:"transcript,omitempty" db:"transcript"`
	MediaURLs  StringArray `json:"media_urls,omitempty" db:"media_urls"`
	Rating     *float32    `json:"rating,omitempty" db:"rating"`

	// Media Metadata
	MediaURL         string          `json:"media_url,omitempty" db:"media_url"`
	MediaDuration    int             `json:"media_duration,omitempty" db:"media_duration"`
	ThumbnailURL     string          `json:"thumbnail_url,omitempty" db:"thumbnail_url"`
	AdditionalMedia  json.RawMessage `json:"additional_media,omitempty" db:"additional_media"`
	CustomFormatting JSONMap         `json:"custom_formatting" db:"custom_formatting"`

	// Context
	ProductContext    JSONMap `json:"product_context,omitempty" db:"product_context"`
	PurchaseContext   JSONMap `json:"purchase_context,omitempty" db:"purchase_context"`
	ExperienceContext JSONMap `json:"experience_context,omitempty" db:"experience_context"`

	// Collection & Verification
	CollectionMethod   CollectionMethod `json:"collection_method" db:"collection_method"`
	TriggerSource      string           `json:"trigger_source,omitempty" db:"trigger_source"`
	TriggerData        JSONMap          `json:"trigger_data,omitempty" db:"trigger_data"`
	VerificationMethod VerificationType `json:"verification_method,omitempty" db:"verification_method"`
	VerificationData   JSONMap          `json:"verification_data,omitempty" db:"verification_data"`
	VerificationStatus string           `json:"verification_status" db:"verification_status"`
	VerifiedAt         *time.Time       `json:"verified_at,omitempty" db:"verified_at"`
	AuthenticityScore  *float32         `json:"authenticity_score,omitempty" db:"authenticity_score"`
	SourceData         JSONMap          `json:"source_data,omitempty" db:"source_data"`

	// Publishing
	Published          bool       `json:"published" db:"published"`
	PublishedAt        *time.Time `json:"published_at,omitempty" db:"published_at"`
	ScheduledPublishAt *time.Time `json:"scheduled_publish_at,omitempty" db:"scheduled_publish_at"`

	// Organization
	Tags         StringArray `json:"tags,omitempty" db:"tags"`
	Categories   StringArray `json:"categories,omitempty" db:"categories"`
	CustomFields JSONMap     `json:"custom_fields,omitempty" db:"custom_fields"`

	// Usage Metrics
	ViewCount         int     `json:"view_count" db:"view_count"`
	ShareCount        int     `json:"share_count" db:"share_count"`
	ConversionCount   int     `json:"conversion_count" db:"conversion_count"`
	EngagementMetrics JSONMap `json:"engagement_metrics" db:"engagement_metrics"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// Associated Data (populated in FetchByID but not stored directly in the DB)
	Analyses           []TestimonialAnalysis `json:"analyses,omitempty" db:"-"`
	CompetitorMentions []CompetitorMention   `json:"competitor_mentions,omitempty" db:"-"`
	AIJobs             []AIJob               `json:"ai_jobs,omitempty" db:"-"`
}

// ---------------------------
// VALIDATION METHODS
// ---------------------------

func (t *Testimonial) Validate() error {
	if t.WorkspaceID == uuid.Nil {
		return apperrors.ErrInvalidWorkspaceID
	}
	if t.TestimonialType == "" {
		return errors.New("testimonial_type is required")
	}
	if t.Status == "" {
		t.Status = StatusPendingReview
	}
	if t.Rating != nil && (*t.Rating < 1 || *t.Rating > 5) {
		return errors.New("rating must be between 1 and 5")
	}
	if t.Published && t.PublishedAt == nil {
		return errors.New("published testimonial must have a published_at timestamp")
	}
	return nil
}

// --------------------------
// FILTER & HELPER FUNCTIONS
// --------------------------

type TestimonialFilter struct {
	Types             []TestimonialType
	Statuses          []ContentStatus
	MinRating         int
	MaxRating         int
	Tags              []string
	Categories        []string
	DateRange         DateRange
	SearchQuery       string
	CollectionMethods []CollectionMethod // Added field
}

type DateRange struct {
	Start time.Time
	End   time.Time
}

func GetFilterFromParam(queryParams url.Values) TestimonialFilter {
	var filter TestimonialFilter

	if typeStr := queryParams.Get("types"); typeStr != "" {
		types := strings.Split(typeStr, ",")
		for _, t := range types {
			filter.Types = append(filter.Types, TestimonialType(t))
		}
	}
	if statusesStr := queryParams.Get("statuses"); statusesStr != "" {
		statuses := strings.Split(statusesStr, ",")
		for _, s := range statuses {
			filter.Statuses = append(filter.Statuses, ContentStatus(s))
		}
	}
	if minRatingStr := queryParams.Get("minRating"); minRatingStr != "" {
		if minRating, err := strconv.Atoi(minRatingStr); err == nil {
			filter.MinRating = minRating
		}
	}
	if maxRatingStr := queryParams.Get("maxRating"); maxRatingStr != "" {
		if maxRating, err := strconv.Atoi(maxRatingStr); err == nil {
			filter.MaxRating = maxRating
		}
	}
	filter.Tags = queryParams["tags"]
	filter.Categories = queryParams["categories"]

	if startDateStr := queryParams.Get("startDate"); startDateStr != "" {
		if startDate, err := time.Parse(time.RFC3339, startDateStr); err == nil {
			filter.DateRange.Start = startDate
		}
	}
	if endDateStr := queryParams.Get("endDate"); endDateStr != "" {
		if endDate, err := time.Parse(time.RFC3339, endDateStr); err == nil {
			filter.DateRange.End = endDate
		}
	}
	filter.SearchQuery = queryParams.Get("searchQuery")

	// Added collection methods filtering
	if methodsStr := queryParams.Get("collectionMethods"); methodsStr != "" {
		methods := strings.Split(methodsStr, ",")
		for _, m := range methods {
			filter.CollectionMethods = append(filter.CollectionMethods, CollectionMethod(m))
		}
	}

	return filter
}

func (t *TestimonialType) Scan(value any) error {
	if value == nil {
		*t = ""
		return nil
	}
	switch v := value.(type) {
	case []byte:
		*t = TestimonialType(string(v))
	case string:
		*t = TestimonialType(v)
	default:
		return fmt.Errorf("cannot scan type %T into TestimonialType", value)
	}
	return nil
}

func (t TestimonialType) Value() (driver.Value, error) {
	return string(t), nil
}

func (s ContentStatus) Value() (driver.Value, error) {
	return string(s), nil
}

func (f ContentFormat) Value() (driver.Value, error) {
	return string(f), nil
}

func (c CollectionMethod) Value() (driver.Value, error) {
	return string(c), nil
}

func (v VerificationType) Value() (driver.Value, error) {
	return string(v), nil
}
