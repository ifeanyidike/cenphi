package ai

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
)

type SentimentResult struct {
	SentimentScore          float64                  `json:"sentiment_score"`
	Label                   string                   `json:"label"`
	Emotions                []string                 `json:"emotions"`
	BusinessRecommendations []BusinessRecommendation `json:"business_recommendations"`
}

type BusinessRecommendation struct {
	Category  string `json:"category"`
	Action    string `json:"action"`
	Priority  string `json:"priority"`
	Reasoning string `json:"reasoning"`
}

type SentimentService struct {
	aiClient     AIClient
	cacheService cache.RedisCache
}

func NewSentimentService(aiClient AIClient, cacheService cache.RedisCache) SentimentService {
	return SentimentService{
		aiClient:     aiClient,
		cacheService: cacheService,
	}
}

func (s SentimentService) AnalyzeSentiments(ctx context.Context, texts []string, brandContext *models.BrandContext, customPrompt string) ([]SentimentResult, error) {
	type cacheEntry struct {
		index int
		text  string
		key   string
	}

	var (
		results      = make([]SentimentResult, len(texts))
		uncached     []string
		uncachedRefs []cacheEntry
	)

	for i, text := range texts {
		cacheKey := fmt.Sprintf("sentiment:%x", md5.Sum([]byte(text+customPrompt)))
		var cached SentimentResult
		if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
			results[i] = cached
			continue
		}

		uncached = append(uncached, text)
		uncachedRefs = append(uncachedRefs, cacheEntry{i, text, cacheKey})
	}

	if len(uncached) == 0 {
		return results, nil
	}

	systemPrompt := `You are an expert sentiment analyst specializing in business testimonials. Analyze the given testimonial text and provide a comprehensive sentiment analysis.`

	// Fixed: Use a different variable name to avoid shadowing the parameter
	sentimentPrompt := s.BuildMultipleSentimentsPrompt(texts, brandContext, customPrompt)

	response, err := s.aiClient.Complete(ctx, sentimentPrompt, systemPrompt)

	if err != nil {
		return nil, fmt.Errorf("sentiment analysis failed: %w", err)
	}

	var newResults []SentimentResult
	if err := json.Unmarshal([]byte(response), &newResults); err != nil {
		return nil, fmt.Errorf("failed to parse sentiment response: %w", err)
	}

	if len(newResults) != len(uncachedRefs) {
		return nil, fmt.Errorf("response count mismatch: expected %d, got %d", len(uncachedRefs), len(newResults))
	}

	for i, entry := range uncachedRefs {
		results[entry.index] = newResults[i]

		// Fixed: Cache the result directly since Get expects the same type
		s.cacheService.Set(ctx, entry.key, newResults[i], time.Hour)
	}

	return results, nil
}

func (s SentimentService) AnalyzeSentiment(ctx context.Context, text string, brandContext *models.BrandContext, customPrompt string) (SentimentResult, error) {
	cacheKey := fmt.Sprintf("sentiment:%x", md5.Sum([]byte(text+customPrompt)))
	var cached SentimentResult
	if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
		return cached, nil
	}

	systemPrompt := `You are an expert sentiment analyst specializing in business testimonials. Analyze the given testimonial text and provide a comprehensive sentiment analysis.`

	log.Printf("Sentiment text to analyze: \t\t%s\n\n", text)

	// Fixed: Use a different variable name to avoid shadowing the parameter
	sentimentPrompt := s.BuildSingleSentimentPrompt(text, brandContext, customPrompt)
	log.Printf("Sentiment prompt to analyze: \t\t%s\n", sentimentPrompt)

	response, err := s.aiClient.Complete(ctx, sentimentPrompt, systemPrompt)

	if err != nil {
		return SentimentResult{}, fmt.Errorf("sentiment analysis failed: %w", err)
	}

	var result SentimentResult
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return SentimentResult{}, fmt.Errorf("failed to parse sentiment response: %w", err)
	}

	s.cacheService.Set(ctx, cacheKey, result, time.Hour)

	return result, nil
}

func (s SentimentService) buildSentimentPrompt(
	isMultiple bool,
	testimonials interface{},
	brandContext *models.BrandContext,
	customPrompt string,
) string {
	brandJSON, _ := json.Marshal(brandContext)
	testimonialJSON, _ := json.Marshal(testimonials)

	var customInstructions string
	if customPrompt != "" {
		customInstructions = fmt.Sprintf("\n\nAdditional Instructions:\n%s", customPrompt)
	}

	var returnFormat string
	if isMultiple {
		returnFormat = `Return a JSON array where each element corresponds to a testimonial and contains:`
	} else {
		returnFormat = `Return a JSON object that contains:`
	}

	additionalNote := ""
	if customPrompt != "" {
		additionalNote = "\n- Follow the additional instructions provided above"
	}

	return fmt.Sprintf(`Analyze the sentiment and emotional content of these testimonials in the context of the provided brand information. Return detailed business insights and recommendations.%s

Brand Context: %s

Testimonials to analyze: %s

%s
{
  "sentiment_score": -1.0 to 1.0 (negative to positive),
  "label": "very_positive|positive|neutral|negative|very_negative",
  "emotions": ["joy", "trust", "satisfaction", "excitement", "concern", etc.],
  "business_recommendations": [
    {
      "category": "marketing|product|customer_service|sales",
      "action": "specific actionable recommendation",
      "priority": "high|medium|low",
      "reasoning": "explanation of why this action is recommended"
    }
  ]
}
Return the result as *only* a JSON object, no explanations or additional text.

Analysis Guidelines:
- Consider industry-specific sentiment patterns
- Identify specific emotional triggers and pain points
- Focus on actionable business insights
- Evaluate authenticity and credibility indicators
- Consider competitive positioning implications
- Assess impact on brand perception
- Identify opportunities for improvement or amplification
- Recommend specific follow-up actions%s

Provide comprehensive analysis that helps businesses understand both the emotional impact and strategic implications of each testimonial.`,
		customInstructions,
		string(brandJSON),
		string(testimonialJSON),
		returnFormat,
		additionalNote,
	)
}

func (s SentimentService) BuildSingleSentimentPrompt(text string, brandContext *models.BrandContext, customPrompt string) string {
	return s.buildSentimentPrompt(false, text, brandContext, customPrompt)
}

func (s SentimentService) BuildMultipleSentimentsPrompt(texts []string, brandContext *models.BrandContext, customPrompt string) string {
	return s.buildSentimentPrompt(true, texts, brandContext, customPrompt)
}
