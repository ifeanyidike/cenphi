// internal/models/testimonial.go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type MediaOpt struct {
	TestimonialID string `json:"testimonial_id"`
	MediaURL      string `json:"media_url"`
}

type TranscriptSegment struct {
	Text      string  `json:"text"`
	StartTime float64 `json:"start_time"`
	EndTime   float64 `json:"end_time"`
	Speaker   string  `json:"speaker,omitempty"`
	Words     []Word  `json:"words,omitempty"`
}

type HighlightMoment struct {
	StartTime           float64  `json:"start_time"`
	EndTime             float64  `json:"end_time"`
	Text                string   `json:"text"`
	Theme               string   `json:"theme,omitempty"`
	Words               []Word   `json:"words,omitempty"`
	SocialMediaOptimize bool     `json:"social_media_optimize,omitempty"`
	EnhanceClip         bool     `json:"enhance_clip,omitempty"`
	IncludeLogo         bool     `json:"include_logo,omitempty"`
	IncludeSubtitle     bool     `json:"include_subtitle,omitempty"`
	IncludeWatermark    bool     `json:"include_watermark,omitempty"`
	Quality             string   `json:"quality,omitempty"`
	AddBackgroundMusic  bool     `json:"add_background_music,omitempty"`
	IncludeTheme        bool     `json:"include_theme,omitempty"`
	RemoveNoise         bool     `json:"remove_noise,omitempty"`
	ImportanceScore     float64  `json:"importance_score,omitempty"`
	HighlightType       string   `json:"highlight_type,omitempty"`
	SuggestedTitle      string   `json:"suggested_title,omitempty"`
	Keywords            []string `json:"keywords,omitempty"`
	EmotionalIntensity  float64  `json:"emotional_intensity,omitempty"`
	Shareability        float64  `json:"shareability,omitempty"`
}

type BrandingOptions struct {
	LogoURL           string `json:"logo_url,omitempty"`
	BrandColor        string `json:"brand_color,omitempty"`
	WatermarkPosition string `json:"watermark_position,omitempty"`
}

type TestimonialSegment struct {
	TestimonialID string            `json:"testimonial_id"`
	MediaURL      string            `json:"media_url"`
	Highlights    []HighlightMoment `json:"highlights,omitempty"`
}

type EmotionSegment struct {
	StartTime         float64            `json:"start_time"`
	EndTime           float64            `json:"end_time"`
	DominantEmotion   string             `json:"dominant_emotion"`
	Confidence        float64            `json:"confidence"`
	FacialExpression  string             `json:"facial_expression,omitempty"`
	EmotionScores     map[string]float64 `json:"emotion_scores,omitempty"`
	AuthenticityScore float64            `json:"authenticity_score,omitempty"`
}

type Clip struct {
	URL              string          `json:"url"`
	StartTime        float64         `json:"start_time"`
	EndTime          float64         `json:"end_time"`
	Title            string          `json:"title,omitempty"`
	Theme            string          `json:"theme,omitempty"`
	EngagementScore  float64         `json:"engagement_score,omitempty"`
	DurationSeconds  float64         `json:"duration_seconds,omitempty"`
	SocialMediaReady map[string]bool `json:"social_media_ready,omitempty"`
}

type Word struct {
	Text       string  `json:"text"`
	Start      float64 `json:"start"`
	End        float64 `json:"end"`
	Confidence float64 `json:"confidence,omitempty"`
	Speaker    string  `json:"speaker,omitempty"`
}

type TranscriptionSegment struct {
	Text      string  `json:"text"`
	StartTime float64 `json:"start_time"`
	EndTime   float64 `json:"end_time"`
	Speaker   string  `json:"speaker,omitempty"`
	Words     []Word  `json:"words"`
}

type TranscriptionResult struct {
	Transcript string                 `json:"transcript"`
	Segments   []TranscriptionSegment `json:"segments"`
	Language   string                 `json:"language"`
	Confidence float64                `json:"confidence"`
}

// Testimonial model matching your actual database schema
type Testimonial struct {
	ID          uuid.UUID `json:"id" db:"id"`
	WorkspaceID uuid.UUID `json:"workspace_id" db:"workspace_id"`

	// Author information
	AuthorName      *string `json:"author_name" db:"author_name"`
	AuthorEmail     *string `json:"author_email" db:"author_email"`
	AuthorCompany   *string `json:"author_company" db:"author_company"`
	AuthorTitle     *string `json:"author_title" db:"author_title"`
	AuthorAvatarURL *string `json:"author_avatar_url" db:"author_avatar_url"`

	// Content information
	Type               string                  `json:"type" db:"type"`
	Format             string                  `json:"format" db:"format"`
	Status             string                  `json:"status" db:"status"`
	Content            *string                 `json:"content" db:"content"`
	MediaURL           *string                 `json:"media_url" db:"media_url"`
	TranscriptSegments *[]TranscriptionSegment `json:"transcript_segment" db:"transcript_segment"`

	// Collection metadata
	CollectionMethod string  `json:"collection_method" db:"collection_method"`
	Metadata         JSONMap `json:"metadata" db:"metadata"`

	// Ratings and tags
	Rating *int           `json:"rating" db:"rating"`
	Tags   pq.StringArray `json:"tags" db:"tags"`

	// AI processing
	ProcessingStatus   string  `json:"processing_status" db:"processing_status"`
	ProcessingMetadata JSONMap `json:"processing_metadata" db:"processing_metadata"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// Relationships
	Workspace *Workspace            `json:"workspace,omitempty" db:"_"`
	Artifacts []TestimonialArtifact `json:"artifacts,omitempty" db:"-"`
}

type TestimonialArtifact struct {
	ID            uuid.UUID  `db:"id" json:"id"`
	TestimonialID *uuid.UUID `db:"testimonial_id" json:"testimonial_id"`
	WorkspaceID   uuid.UUID  `db:"workspace_id" json:"workspace_id"`

	ProcessingType string `db:"processing_type" json:"processing_type"` // e.g. sentiment_analysis
	ResultCategory string `db:"result_category" json:"result_category"` // e.g. analysis, content

	TextContent *string `db:"text_content" json:"text_content,omitempty"` // nullable
	Data        JSONMap `db:"data" json:"data"`                           // JSONB data
	AssetURL    *string `db:"asset_url" json:"asset_url,omitempty"`       // nullable

	ContentType string  `db:"content_type" json:"content_type,omitempty"`
	Platform    *string `db:"platform" json:"platform,omitempty"`
	Format      *string `db:"format" json:"format,omitempty"`

	IsUserSaved bool `db:"is_user_saved" json:"is_user_saved"`
	IsStreamed  bool `db:"is_streamed" json:"is_streamed"`

	ProcessingMetadata JSONMap `db:"processing_metadata" json:"processing_metadata"` // JSONB

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// TestimonialUpload represents file upload data
type TestimonialUpload struct {
	WorkspaceID      uuid.UUID `json:"workspace_id"`
	AuthorName       string    `json:"author_name"`
	AuthorEmail      string    `json:"author_email"`
	AuthorCompany    string    `json:"author_company"`
	AuthorTitle      string    `json:"author_title"`
	Content          string    `json:"content"`
	Rating           *int      `json:"rating"`
	CollectionMethod string    `json:"collection_method"`
	Tags             []string  `json:"tags"`
}

// BulkImportResult represents the result of a bulk import operation
type BulkImportResult struct {
	TotalProcessed int               `json:"total_processed"`
	SuccessCount   int               `json:"success_count"`
	FailureCount   int               `json:"failure_count"`
	Errors         []BulkImportError `json:"errors,omitempty"`
	Testimonials   []uuid.UUID       `json:"testimonials"`
}

type BulkImportError struct {
	Row     int         `json:"row"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Helper types for JSON fields
type JSONMap map[string]any
type JSONArray []any

// Implement Scanner and Valuer interfaces for JSONMap
func (j *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*j = make(JSONMap)
		return nil
	}

	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, j)
	case string:
		return json.Unmarshal([]byte(v), j)
	default:
		return errors.New("cannot scan into JSONMap")
	}
}

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return "{}", nil
	}
	return json.Marshal(j)
}

// Implement Scanner and Valuer interfaces for JSONArray
func (j *JSONArray) Scan(value interface{}) error {
	if value == nil {
		*j = make(JSONArray, 0)
		return nil
	}

	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, j)
	case string:
		return json.Unmarshal([]byte(v), j)
	default:
		return errors.New("cannot scan into JSONArray")
	}
}

func (j JSONArray) Value() (driver.Value, error) {
	if j == nil {
		return "[]", nil
	}
	return json.Marshal(j)
}

// TestimonialStats represents aggregate statistics for testimonials
type TestimonialStats struct {
	Total       int      `json:"total"`
	Published   int      `json:"published"`
	Draft       int      `json:"draft"`
	Processed   int      `json:"processed"`
	VideoCount  int      `json:"video_count"`
	TextCount   int      `json:"text_count"`
	AvgRating   *float64 `json:"avg_rating"`
	Archived    int      `json:"archived"`
	RecentCount int      `json:"recent_count"`
	WeeklyCount int      `json:"weekly_count"`
}

type AuthorStats struct {
	AuthorName       *string  `json:"author_name" db:"author_name"`
	AuthorEmail      *string  `json:"author_email" db:"author_email"`
	AuthorCompany    *string  `json:"author_company" db:"author_company"`
	TestimonialCount int      `json:"testimonial_count" db:"testimonial_count"`
	AvgRating        *float64 `json:"avg_rating" db:"avg_rating"`
}

type TestimonialFilter struct {
	Status        string     `json:"status"`
	Type          string     `json:"type"`
	MinRating     *int       `json:"min_rating"`
	AuthorEmail   string     `json:"author_email"`
	Tags          []string   `json:"tags"`
	CreatedAfter  *time.Time `json:"created_after"`
	CreatedBefore *time.Time `json:"created_before"`
	SortBy        string     `json:"sort_by"`
	SortOrder     string     `json:"sort_order"`
	Limit         int        `json:"limit"`
	Offset        int        `json:"offset"`
}

// GetFilterFromParam creates a filter from URL query parameters
func GetFilterFromParam(params map[string][]string) TestimonialFilter {
	filter := TestimonialFilter{
		Limit:     20,
		Offset:    0,
		SortBy:    "created_at",
		SortOrder: "desc",
	}

	// Parse workspace_id
	// if workspaceID := getParam(params, "workspace_id"); workspaceID != "" {
	// 	if id, err := uuid.Parse(workspaceID); err == nil {
	// 		filter.WorkspaceID = &id
	// 	}
	// }

	// Parse format
	// if format := getParam(params, "format"); format != "" {
	// 	filter.Format = &format
	// }

	// Parse status
	// if status := getParam(params, "status"); status != "" {
	// 	filter.Status = &status
	// }

	// // Parse collection_method
	// if method := getParam(params, "collection_method"); method != "" {
	// 	filter.CollectionMethod = &method
	// }

	// // Parse search term
	// if searchTerm := getParam(params, "search"); searchTerm != "" {
	// 	filter.SearchTerm = &searchTerm
	// }

	// Parse tags
	if tags := params["tags"]; len(tags) > 0 {
		filter.Tags = tags
	}

	// Parse pagination and sorting
	if limit := getParam(params, "limit"); limit != "" {
		if l, err := parseIntParam(limit); err == nil && l > 0 {
			filter.Limit = l
		}
	}

	if offset := getParam(params, "offset"); offset != "" {
		if o, err := parseIntParam(offset); err == nil && o >= 0 {
			filter.Offset = o
		}
	}

	if sortBy := getParam(params, "sort_by"); sortBy != "" {
		filter.SortBy = sortBy
	}

	if sortOrder := getParam(params, "sort_order"); sortOrder == "asc" || sortOrder == "desc" {
		filter.SortOrder = sortOrder
	}

	return filter
}

func getParam(params map[string][]string, key string) string {
	if values := params[key]; len(values) > 0 {
		return values[0]
	}
	return ""
}

func parseIntParam(s string) (int, error) {
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	return i, err
}

type StringArray []string

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
