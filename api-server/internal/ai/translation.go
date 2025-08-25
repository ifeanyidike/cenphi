package ai

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ifeanyidike/cenphi/internal/cache"
)

type TranslationResult struct {
	TranslatedText string  `json:"translated_text"`
	Confidence     float64 `json:"confidence"`
	SourceLang     string  `json:"source_lang"`
	TargetLang     string  `json:"target_lang"`
}

type TranslationService struct {
	aiClient     AIClient
	cacheService cache.RedisCache
}

func NewTranslationService(aiClient AIClient, cacheService cache.RedisCache) TranslationService {
	return TranslationService{
		aiClient:     aiClient,
		cacheService: cacheService,
	}
}

func (s TranslationService) TranslateTextSync(ctx context.Context, text, sourceLang, targetLang, prompt string) (TranslationResult, error) {
	// Include prompt in cache key to ensure different prompts don't share cache
	cacheKey := fmt.Sprintf("translation:%x", md5.Sum([]byte(text+sourceLang+targetLang+prompt)))
	var cached TranslationResult
	if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
		fmt.Println("cache error", err)
		return cached, nil
	}

	systemPrompt := `You are a professional translator`

	translationPrompt := s.buildTranslationPrompt(text, sourceLang, targetLang, prompt)
	response, err := s.aiClient.Complete(ctx, translationPrompt, systemPrompt)

	fmt.Println("AI Response:", response) // 🔍 Inspect this before decoding

	if !json.Valid([]byte(response)) {
		fmt.Println("Invalid JSON from AI:", response)
		return TranslationResult{}, fmt.Errorf("invalid JSON in AI response")
	}

	if err != nil {
		return TranslationResult{}, fmt.Errorf("translation failed: %w", err)
	}

	var result TranslationResult
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return TranslationResult{}, fmt.Errorf("failed to parse translation response: %w", err)
	}

	// Cache for 24 hours
	s.cacheService.Set(ctx, cacheKey, result, 24*time.Hour)

	return result, nil
}

func (s TranslationService) TranslateTextStream(ctx context.Context, text, sourceLang, targetLang, prompt string) (<-chan StreamChunk, error) {
	// Include prompt in cache key to ensure different prompts don't share cache

	systemPrompt := `You are a professional translator`

	translationPrompt := s.buildTranslationPrompt(text, sourceLang, targetLang, prompt)
	return s.aiClient.Stream(ctx, translationPrompt, systemPrompt)

}

func (s TranslationService) buildTranslationPrompt(text, sourceLang, targetLang, customPrompt string) string {
	basePrompt := fmt.Sprintf(`Translate the following text from %s to %s. Maintain the tone, style, and context appropriate for testimonial content.`, sourceLang, targetLang)

	// Add custom prompt instructions if provided
	var customInstructions string
	if customPrompt != "" {
		customInstructions = fmt.Sprintf("\n\nAdditional Instructions:\n%s", customPrompt)
	}

	return fmt.Sprintf(`%s%s

Source text: %s

Return ONLY the translated text. No explanations, no JSON, no additional formatting - just the accurately translated text that maintains the original meaning and tone.

Guidelines:
- Preserve emotional impact and testimonial authenticity
- Maintain professional or conversational tone as appropriate
- Keep cultural context relevant to target language
- Ensure grammatical accuracy and natural flow
- Translate directly without adding commentary or notes
- Keep the same paragraph structure and formatting as the original%s`,
		basePrompt, customInstructions, text,
		func() string {
			if customPrompt != "" {
				return "\n- Follow the additional instructions provided above"
			}
			return ""
		}())
}
