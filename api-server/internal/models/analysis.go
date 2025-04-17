// models/analysis.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type AnalysisType string

const (
	AnalysisTypeSentiment     AnalysisType = "sentiment"
	AnalysisTypeNarrative     AnalysisType = "narrative"
	AnalysisTypeAuthenticity  AnalysisType = "authenticity"
	AnalysisTypeAudience      AnalysisType = "audience"
	AnalysisTypeBusinessValue AnalysisType = "business_value"
	AnalysisTypeCredibility   AnalysisType = "credibility"
	AnalysisTypeCompetitor    AnalysisType = "competitor"
	AnalysisTypeStory         AnalysisType = "story"
)

// TestimonialAnalysis represents the consolidated analysis data structure
// TestimonialAnalysis represents a consolidated analysis performed on a testimonial
type TestimonialAnalysis struct {
	ID            uuid.UUID    `json:"id" db:"id"`
	TestimonialID uuid.UUID    `json:"testimonial_id" db:"testimonial_id"`
	AnalysisType  AnalysisType `json:"analysis_type" db:"analysis_type"`

	// Core metrics
	SentimentScore     *float32 `json:"sentiment_score,omitempty" db:"sentiment_score"`
	AuthenticityScore  *float32 `json:"authenticity_score,omitempty" db:"authenticity_score"`
	EmotionalScore     *float32 `json:"emotional_score,omitempty" db:"emotional_score"`
	NarrativeScore     *float32 `json:"narrative_score,omitempty" db:"narrative_score"`
	BusinessValueScore *float32 `json:"business_value_score,omitempty" db:"business_value_score"`
	CredibilityScore   *float32 `json:"credibility_score,omitempty" db:"credibility_score"`

	// Detailed data
	AnalysisData      JSONMap   `json:"analysis_data" db:"analysis_data"`
	ExtractedInsights JSONArray `json:"extracted_insights,omitempty" db:"extracted_insights"`

	// Metadata
	AnalysisVersion string    `json:"analysis_version,omitempty" db:"analysis_version"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at,omitempty" db:"updated_at"`
}
