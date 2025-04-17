package models

import (
	"time"

	"github.com/google/uuid"
)

// CompetitorMention represents a mention of a competitor in a testimonial
type CompetitorMention struct {
	ID                uuid.UUID `json:"id" db:"id"`
	TestimonialID     uuid.UUID `json:"testimonial_id" db:"testimonial_id"`
	CompetitorName    string    `json:"competitor_name" db:"competitor_name"`
	Context           string    `json:"context,omitempty" db:"context"`
	Sentiment         Sentiment `json:"sentiment,omitempty" db:"sentiment"`
	SentimentScore    *float32  `json:"sentiment_score,omitempty" db:"sentiment_score"`
	ComparisonType    string    `json:"comparison_type,omitempty" db:"comparison_type"`
	AIConfidenceScore *float32  `json:"ai_confidence_score,omitempty" db:"ai_confidence_score"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}
