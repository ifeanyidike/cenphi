package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// ConversationSession stores chat conversation history for context
type ConversationSession struct {
	ID               uuid.UUID        `json:"id"`
	WorkspaceID      uuid.UUID        `json:"workspace_id"`
	UserID           uuid.UUID        `json:"user_id"`
	Title            *string          `json:"title,omitempty"`
	Messages         JSONBMessages    `json:"messages"`
	ActiveFilters    JSONB            `json:"active_filters"`
	ReferencedEntity JSONB            `json:"referenced_entities"`
	IsActive         bool             `json:"is_active"`
	LastActivity     time.Time        `json:"last_activity"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

// ConversationMessage represents a single message in a conversation
type ConversationMessage struct {
	Role      string     `json:"role"`      // user, assistant
	Content   string     `json:"content"`
	Timestamp time.Time  `json:"timestamp"`
	Filters   *JSONB     `json:"filters,omitempty"`
}

// JSONBMessages is a custom type for handling conversation messages
type JSONBMessages []ConversationMessage

// Scan implements sql.Scanner interface
func (m *JSONBMessages) Scan(value interface{}) error {
	if value == nil {
		*m = []ConversationMessage{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal JSONB value: %v", value)
	}

	var messages []ConversationMessage
	if err := json.Unmarshal(bytes, &messages); err != nil {
		return fmt.Errorf("failed to unmarshal messages: %w", err)
	}

	*m = messages
	return nil
}

// Value implements driver.Valuer interface
func (m JSONBMessages) Value() (driver.Value, error) {
	if m == nil {
		return []byte("[]"), nil
	}
	return json.Marshal(m)
}

// SavedQuery stores frequently used queries and filter combinations
type SavedQuery struct {
	ID          uuid.UUID  `json:"id"`
	WorkspaceID uuid.UUID  `json:"workspace_id"`
	UserID      uuid.UUID  `json:"user_id"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	QueryText   string     `json:"query_text"`
	Filters     JSONB      `json:"filters"`
	Category    *string    `json:"category,omitempty"`
	IsTemplate  bool       `json:"is_template"`
	IsDefault   bool       `json:"is_default"`
	UseCount    int        `json:"use_count"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// SegmentDefinition defines customer segments for cohort analysis
type SegmentDefinition struct {
	ID                      uuid.UUID  `json:"id"`
	WorkspaceID             uuid.UUID  `json:"workspace_id"`
	Name                    string     `json:"name"`
	Description             *string    `json:"description,omitempty"`
	Color                   *string    `json:"color,omitempty"`
	Criteria                JSONB      `json:"criteria"`
	SegmentType             string     `json:"segment_type"`
	CachedTestimonialCount  int        `json:"cached_testimonial_count"`
	CachedAvgSentiment      *float32   `json:"cached_avg_sentiment,omitempty"`
	CachedTopThemes         JSONB      `json:"cached_top_themes"`
	CacheUpdatedAt          *time.Time `json:"cache_updated_at,omitempty"`
	IsSystemDefined         bool       `json:"is_system_defined"`
	IsActive                bool       `json:"is_active"`
	CreatedAt               time.Time  `json:"created_at"`
	UpdatedAt               time.Time  `json:"updated_at"`
}

// SegmentCriteria defines the rules for a segment
type SegmentCriteria struct {
	RatingMin        *int      `json:"rating_min,omitempty"`
	RatingMax        *int      `json:"rating_max,omitempty"`
	Companies        []string  `json:"companies,omitempty"`
	Tags             []string  `json:"tags,omitempty"`
	NPSCategory      *string   `json:"nps_category,omitempty"` // promoter, passive, detractor
	SentimentMin     *float64  `json:"sentiment_min,omitempty"`
	SentimentMax     *float64  `json:"sentiment_max,omitempty"`
	Type             *string   `json:"type,omitempty"`          // video, text
	CollectionMethod *string   `json:"collection_method,omitempty"`
}

// AnalyticsCache stores pre-computed analytics for performance
type AnalyticsCache struct {
	ID                  uuid.UUID `json:"id"`
	WorkspaceID         uuid.UUID `json:"workspace_id"`
	CacheKey            string    `json:"cache_key"`
	CacheType           string    `json:"cache_type"`
	Filters             JSONB     `json:"filters"`
	Data                JSONB     `json:"data"`
	ExpiresAt           time.Time `json:"expires_at"`
	ComputationTimeMS   *int      `json:"computation_time_ms,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// ExportLog tracks export history
type ExportLog struct {
	ID            uuid.UUID  `json:"id"`
	WorkspaceID   uuid.UUID  `json:"workspace_id"`
	UserID        uuid.UUID  `json:"user_id"`
	ExportType    string     `json:"export_type"`
	ExportFormat  *string    `json:"export_format,omitempty"`
	ContentType   string     `json:"content_type"`
	Filters       JSONB      `json:"filters"`
	FileName      *string    `json:"file_name,omitempty"`
	FileSizeBytes *int64     `json:"file_size_bytes,omitempty"`
	FileURL       *string    `json:"file_url,omitempty"`
	Status        string     `json:"status"`
	ErrorMessage  *string    `json:"error_message,omitempty"`
	ExportParams  JSONB      `json:"export_params"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// SentimentTimelineData represents sentiment metrics over time
type SentimentTimelineData struct {
	Dates     []string           `json:"dates"`
	Sentiment SentimentBreakdown `json:"sentiment"`
	NPSScore  []float64          `json:"nps_score,omitempty"`
	Trend     string             `json:"trend"` // improving, declining, stable
	TrendPct  float64            `json:"trend_pct"`
}

// SentimentBreakdown categorizes sentiment counts
type SentimentBreakdown struct {
	Positive []int `json:"positive"`
	Neutral  []int `json:"neutral"`
	Negative []int `json:"negative"`
}

// FeatureHeatmapData represents feature mention frequency
type FeatureHeatmapData struct {
	Features  []string  `json:"features"`
	Mentions  []int     `json:"mentions"`
	Sentiment []string  `json:"sentiment"` // positive, negative, neutral per feature
}

// WordCloudData represents word frequency for word clouds
type WordCloudData struct {
	Words []WordCloudItem `json:"words"`
}

// WordCloudItem represents a single word in the word cloud
type WordCloudItem struct {
	Text      string  `json:"text"`
	Value     int     `json:"value"`
	Sentiment string  `json:"sentiment"` // positive, negative, neutral
}

// ComparativeAnalysisResult represents period-over-period comparison
type ComparativeAnalysisResult struct {
	Comparison ComparativeMetrics `json:"comparison"`
	Insights   []string           `json:"insights"`
}

// ComparativeMetrics contains comparison data
type ComparativeMetrics struct {
	Sentiment ComparativeSentiment `json:"sentiment"`
	Volume    ComparativeVolume    `json:"volume"`
	TopThemes ComparativeThemes    `json:"top_themes"`
	NPS       ComparativeNPS       `json:"nps"`
}

// ComparativeSentiment compares sentiment across periods
type ComparativeSentiment struct {
	Primary    SentimentStats `json:"primary"`
	Comparison SentimentStats `json:"comparison"`
	Change     string         `json:"change"`
}

// SentimentStats represents sentiment statistics
type SentimentStats struct {
	Positive float64 `json:"positive"`
	Neutral  float64 `json:"neutral"`
	Negative float64 `json:"negative"`
}

// ComparativeVolume compares testimonial volume
type ComparativeVolume struct {
	Primary    int     `json:"primary"`
	Comparison int     `json:"comparison"`
	Change     string  `json:"change"`
	ChangePct  float64 `json:"change_pct"`
}

// ComparativeThemes compares themes across periods
type ComparativeThemes struct {
	NewThemes       []string `json:"new_themes"`
	DecliningThemes []string `json:"declining_themes"`
}

// ComparativeNPS compares NPS scores
type ComparativeNPS struct {
	Primary    float64 `json:"primary"`
	Comparison float64 `json:"comparison"`
	Change     string  `json:"change"`
}

// SegmentAnalysisResult represents analysis for customer segments
type SegmentAnalysisResult struct {
	Segments []SegmentMetrics `json:"segments"`
	Insights []string         `json:"insights"`
}

// SegmentMetrics contains metrics for a segment
type SegmentMetrics struct {
	Name               string   `json:"name"`
	Criteria           JSONB    `json:"criteria"`
	TestimonialCount   int      `json:"testimonial_count"`
	AvgSentiment       float64  `json:"avg_sentiment"`
	TopThemes          []string `json:"top_themes"`
	NPS                float64  `json:"nps"`
	PainPoints         []string `json:"pain_points"`
	ComparisonToAvg    string   `json:"comparison_to_avg"`
}

// AdvancedFilters represents multi-dimensional filtering options
type AdvancedFilters struct {
	DateRange        *DateRange `json:"date_range,omitempty"`
	Rating           *RatingRange `json:"rating,omitempty"`
	Companies        []string   `json:"companies,omitempty"`
	AuthorTitles     []string   `json:"author_titles,omitempty"`
	Tags             []string   `json:"tags,omitempty"`
	TestimonialType  []string   `json:"testimonial_type,omitempty"` // video, text
	HasArtifacts     *bool      `json:"has_artifacts,omitempty"`
	Sentiment        []string   `json:"sentiment,omitempty"` // positive, negative, neutral
	CollectionMethod []string   `json:"collection_method,omitempty"`
}

// DateRange represents a time range filter
type DateRange struct {
	From time.Time `json:"from"`
	To   time.Time `json:"to"`
}

// RatingRange represents a rating filter
type RatingRange struct {
	Min int `json:"min"`
	Max int `json:"max"`
}

// SingleSegmentAnalysis represents analysis for a single segment
type SingleSegmentAnalysis struct {
	SegmentID        uuid.UUID      `json:"segment_id"`
	SegmentName      string         `json:"segment_name"`
	TestimonialCount int            `json:"testimonial_count"`
	SentimentStats   SentimentStats `json:"sentiment_stats"`
	NPSScore         float64        `json:"nps_score"`
	TopThemes        []string       `json:"top_themes"`
}

// SegmentComparisonResult compares metrics between two segments
type SegmentComparisonResult struct {
	Segment1 *SingleSegmentAnalysis `json:"segment1"`
	Segment2 *SingleSegmentAnalysis `json:"segment2"`
	Insights []string               `json:"insights"`
}

// ChatMessage represents a message in the chat interface
type ChatMessage struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}
