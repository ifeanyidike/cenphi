package ai

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/utils"
)

type PolishResult struct {
	PolishedText     string       `json:"polished_text"`
	EditDiff         []EditChange `json:"edit_diff"`
	ImprovementScore float64      `json:"improvement_score"`
}

type EditChange struct {
	Type     string `json:"type"` // "addition", "deletion", "modification"
	Original string `json:"original"`
	Modified string `json:"modified"`
	Reason   string `json:"reason"`
	Position int    `json:"position"`
}

type PolishService struct {
	aiClient     AIClient
	cacheService cache.RedisCache
}

func NewPolishService(aiClient AIClient, cacheService cache.RedisCache) PolishService {
	return PolishService{
		aiClient:     aiClient,
		cacheService: cacheService,
	}
}

func (s PolishService) PolishTextSync(ctx context.Context, text string, brandContext *models.BrandContext, preserveAuthenticity bool, targetStyle string, customPrompt string) (PolishResult, error) {
	// Include custom prompt in cache key to ensure different prompts don't share cache
	cacheKey := fmt.Sprintf("polish:%x", md5.Sum([]byte(text+targetStyle+customPrompt)))
	var cached PolishResult
	if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
		return cached, nil
	}

	systemPrompt := "You are an expert content editor specializing in testimonial optimization. Polish the given testimonial text while maintaining authenticity level"
	polishPrompt := s.buildPolishPrompt(text, brandContext, preserveAuthenticity, targetStyle, customPrompt)

	response, err := s.aiClient.Complete(ctx, polishPrompt, systemPrompt)

	if err != nil {
		return PolishResult{}, fmt.Errorf("text polishing failed: %w", err)
	}

	var result PolishResult
	cleanedResponse := utils.CleanAIJSONResponse(response)
	if err := json.Unmarshal([]byte(cleanedResponse), &result); err != nil {
		return PolishResult{}, fmt.Errorf("failed to parse polish response: %w", err)
	}

	s.cacheService.Set(ctx, cacheKey, result, time.Hour)

	return result, nil
}

func (s PolishService) PolishTextStream(ctx context.Context, text string, brandContext *models.BrandContext, preserveAuthenticity bool, targetStyle string, customPrompt string) (<-chan StreamChunk, error) {

	systemPrompt := "You are an expert content editor specializing in testimonial optimization. Polish the given testimonial text while maintaining authenticity level"
	polishPrompt := s.buildPolishPrompt(text, brandContext, preserveAuthenticity, targetStyle, customPrompt)

	return s.aiClient.Stream(ctx, polishPrompt, systemPrompt)
}

func (s PolishService) buildPolishPrompt(text string, brandContext *models.BrandContext, preserveAuthenticity bool, targetStyle string, customPrompt string) string {
	brandJSON, _ := json.Marshal(brandContext)

	authenticityGuidance := "while preserving the authentic voice and personal experience"
	if !preserveAuthenticity {
		authenticityGuidance = "optimizing for maximum impact and professionalism"
	}

	styleGuidance := ""
	if targetStyle != "" {
		styleGuidance = fmt.Sprintf("Target style: %s", targetStyle)
	}

	var customInstructions string
	if customPrompt != "" {
		customInstructions = fmt.Sprintf("\n\nAdditional Instructions:\n%s", customPrompt)
	}

	return fmt.Sprintf(`Polish and improve this testimonial text %s. Make it more compelling, clear, and aligned with the brand context while maintaining its core message and emotional impact.%s

Original text: %s

Brand context: %s

%s

Return ONLY the polished text. No explanations, no JSON, no additional formatting - just the improved testimonial text.

Improvement Guidelines:
- Enhance clarity and readability
- Improve grammar and sentence structure  
- Strengthen emotional impact and persuasive power
- Align tone with brand voice
- Remove redundancy and filler content
- Enhance credibility and specificity
- Maintain authentic voice %s
- Optimize for quotability and shareability
- Ensure professional presentation
- Preserve key emotional moments and personal details%s`,
		authenticityGuidance, customInstructions, text, string(brandJSON), styleGuidance, authenticityGuidance,
		func() string {
			if customPrompt != "" {
				return "\n- Follow the additional instructions provided above"
			}
			return ""
		}())
}
