// models/testimonial.go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
)

type TestimonialType string

const (
	TestimonialTypeText  TestimonialType = "text"
	TestimonialTypeImage TestimonialType = "image"
	TestimonialTypeAudio TestimonialType = "audio"
	TestimonialTypeVideo TestimonialType = "video"
)

type ContentStatus string

const (
	StatusPendingReview ContentStatus = "pending_review"
	StatusApproved      ContentStatus = "approved"
	StatusRejected      ContentStatus = "rejected"
)

type CollectionMethod string

const (
	CollectionAPI         CollectionMethod = "api"
	CollectionManual      CollectionMethod = "manual"
	CollectionEmail       CollectionMethod = "email"
	CollectionWebForm     CollectionMethod = "web_form"
	CollectionIntegration CollectionMethod = "integration"
)

type VerificationType string

const (
	VerificationNone      VerificationType = "none"
	VerificationEmail     VerificationType = "email"
	VerificationSMSCode   VerificationType = "sms_code"
	VerificationModerator VerificationType = "moderator"
)

type StringArray []string
type JSONMap map[string]interface{}

type Testimonial struct {
	ID          uuid.UUID       `json:"id" db:"id"`
	WorkspaceID uuid.UUID       `json:"workspace_id" db:"workspace_id"`
	Type        TestimonialType `json:"type" db:"type"`
	Status      ContentStatus   `json:"status" db:"status"`

	// Content
	Content   string      `json:"content,omitempty" db:"content"`
	MediaURLs StringArray `json:"media_urls,omitempty" db:"media_urls"`
	Rating    *float32    `json:"rating,omitempty" db:"rating"`
	Language  string      `json:"language,omitempty" db:"language"`

	// Customer Information
	CustomerName      string  `json:"customer_name,omitempty" db:"customer_name"`
	CustomerEmail     *string `json:"customer_email,omitempty" db:"customer_email"`
	CustomerTitle     string  `json:"customer_title,omitempty" db:"customer_title"`
	CustomerCompany   string  `json:"customer_company,omitempty" db:"customer_company"`
	CustomerLocation  string  `json:"customer_location,omitempty" db:"customer_location"`
	CustomerAvatarURL string  `json:"customer_avatar_url,omitempty" db:"customer_avatar_url"`
	CustomerMetadata  JSONMap `json:"customer_metadata,omitempty" db:"customer_metadata"`

	// Collection and Verification
	CollectionMethod   CollectionMethod `json:"collection_method" db:"collection_method"`
	VerificationMethod VerificationType `json:"verification_method,omitempty" db:"verification_method"`
	VerificationData   JSONMap          `json:"verification_data,omitempty" db:"verification_data"`
	VerifiedAt         *time.Time       `json:"verified_at" db:"verified_at"`
	SourceData         JSONMap          `json:"source_data" db:"source_data"`

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
}

type TestimonialFilter struct {
	Types       []TestimonialType
	Statuses    []ContentStatus
	MinRating   int
	MaxRating   int
	Tags        []string
	Categories  []string
	DateRange   DateRange
	SearchQuery string
}

type DateRange struct {
	Start time.Time
	End   time.Time
}

func (a *StringArray) Scan(value any) error {
	if value == nil {
		*a = StringArray{}
		return nil
	}

	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, a)
	case string:
		return json.Unmarshal([]byte(v), a)
	default:
		return fmt.Errorf("cannot scan type %T into StringArray", value)
	}
}

func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	return json.Marshal(a)
}

func (m *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*m = JSONMap{}
		return nil
	}

	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, m)
	case string:
		return json.Unmarshal([]byte(v), m)
	default:
		return fmt.Errorf("cannot scan type %T into JSONMap", value)
	}
}

func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

func (t *TestimonialType) Scan(value any) error {
	if value == nil {
		*t = ""
		return nil
	}

	// Assuming the value is a string
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

// Add database type handling for custom enums
func (t TestimonialType) Value() (driver.Value, error) {
	return string(t), nil
}

func (s ContentStatus) Value() (driver.Value, error) {
	return string(s), nil
}

func (c CollectionMethod) Value() (driver.Value, error) {
	return string(c), nil
}

func (v VerificationType) Value() (driver.Value, error) {
	return string(v), nil
}

func (t *Testimonial) Validate() error {
	if t.WorkspaceID == uuid.Nil {
		return apperrors.ErrInvalidWorkspaceID
	}
	if t.Type == "" {
		return errors.New("type is required")
	}
	if t.Status == "" {
		t.Status = StatusPendingReview
	}

	if t.Rating != nil && (*t.Rating < 1 || *t.Rating > 5) {
		return errors.New("rating must be between 1 and 5")
	}

	if t.CustomerEmail != nil && *t.CustomerEmail != "" && !isValidEmail(*t.CustomerEmail) {
		return errors.New("invalid customer email format")
	}
	return nil
}

// isValidEmail validates an email format
func isValidEmail(email string) bool {
	// Basic email validation regex
	const emailRegex = `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	return regexMatch(emailRegex, email)
}

// regexMatch is a helper function for regex validation
func regexMatch(pattern, input string) bool {
	rgx := regexp.MustCompile(pattern)
	return rgx.MatchString(input)
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

	filter.Tags = queryParams["tags"]
	filter.Categories = queryParams["categories"]

	// For date range, you might expect something like ?startDate=2025-01-01&endDate=2025-02-01
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

	return filter
}
