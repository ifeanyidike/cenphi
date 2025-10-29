package ai

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"github.com/ifeanyidike/cenphi/pb"
)

type PlatformOptimizerService struct {
	aiClient      AIClient
	cacheService  cache.RedisCache
	db            *sql.DB
	workspaceRepo repositories.WorkspaceRepository
}

type OptimizationResult struct {
	Content        string            `json:"content"`
	MediaURL       string            `json:"media_url,omitempty"`
	Platform       string            `json:"platform"`
	Specifications map[string]string `json:"specifications"`
	Hashtags       []string          `json:"hashtags,omitempty"`
	OptimalTiming  string            `json:"optimal_timing,omitempty"`
}

func NewPlatformOptimizerService(aiClient AIClient, cacheService cache.RedisCache, db *sql.DB, workspaceRepo repositories.WorkspaceRepository) PlatformOptimizerService {
	return PlatformOptimizerService{
		aiClient:      aiClient,
		cacheService:  cacheService,
		db:            db,
		workspaceRepo: workspaceRepo,
	}
}

func (s PlatformOptimizerService) OptimizeForPlatform(ctx context.Context, workspace_id, text string, brandContext *pb.BrandContext, targetPlatform string, customPrompt string) (*OptimizationResult, error) {
	// Include custom prompt in cache key to ensure different prompts don't share cache
	cacheKey := fmt.Sprintf("platform_opt:%x", md5.Sum([]byte(text+targetPlatform+customPrompt)))
	var cached OptimizationResult
	if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
		return &cached, nil
	}

	if brandContext == nil {
		workspaceID, err := uuid.Parse(workspace_id)
		if err == nil {
			brandContext, _ = s.workspaceRepo.GetPbBrandContext(ctx, workspaceID, s.db)
		}

	}

	result, err := s.OptimizeText(ctx, text, brandContext, targetPlatform, customPrompt)
	if err != nil {
		return nil, fmt.Errorf("text optimization failed: %w", err)
	}

	// // Handle media optimization if media URL is provided
	// if media_url != "" {
	// 	mediaURL, err := s.optimizeMedia(ctx, media_url, targetPlatform)
	// 	if err != nil {
	// 		// Log error but don't fail - text optimization is still valuable
	// 		fmt.Printf("Media optimization failed: %v", err)
	// 	} else {
	// 		result.MediaURL = mediaURL
	// 	}
	// }

	return result, nil
}

func (s PlatformOptimizerService) OptimizeText(ctx context.Context, text string, brandContext *pb.BrandContext, targetPlatform string, customPrompt string) (*OptimizationResult, error) {
	systemPrompt := "You are a social media expert."
	optimizationPrompt := s.buildOptimizationPrompt(text, brandContext, targetPlatform, customPrompt)

	fmt.Printf("optimization length:\n %d \t", len(systemPrompt)+len(optimizationPrompt))
	response, err := s.aiClient.Complete(ctx, optimizationPrompt, systemPrompt)
	fmt.Printf("AI Response: %s\n", response)
	if err != nil {
		return nil, fmt.Errorf("AI optimization failed: %w", err)
	}

	// result, err := s.parseOptimizationResponse(response, targetPlatform)
	// if err != nil {
	// 	return nil, fmt.Errorf("failed to parse optimization response: %w", err)
	// }

	// result.Platform = targetPlatform

	if response == "" {
		return nil, fmt.Errorf("AI optimization failed: empty response")
	}

	response = utils.CleanAIJSONResponse(response)
	fmt.Printf("[DEBUG] After cleaning, response length: %d, first 100 chars: %s\n", len(response), response[:min(100, len(response))])

	if !strings.HasPrefix(response, "{") {
		return nil, fmt.Errorf("AI optimization failed: invalid response format - expected JSON but got: %s", response[:min(100, len(response))])
	}

	var result OptimizationResult
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		fmt.Printf("[DEBUG] JSON unmarshal failed. Response length: %d\n", len(response))
		fmt.Printf("[DEBUG] Full response: %s\n", response)
		return nil, fmt.Errorf("failed to parse optimization response: %w - response length: %d", err, len(response))
	}

	fmt.Printf("[DEBUG] Successfully parsed optimization result. Content length: %d\n", len(result.Content))

	if result.Content == "" {
		return nil, fmt.Errorf("AI optimization failed: no content in response")
	}

	result.Platform = targetPlatform
	return &result, nil
}

// OptimizeForPlatformStream streams the text optimization response via callback
// This allows real-time preview of text generation without waiting for completion
func (s PlatformOptimizerService) OptimizeForPlatformStream(
	ctx context.Context,
	workspaceID, text string,
	brandContext *pb.BrandContext,
	targetPlatform string,
	customPrompt string,
	onChunk func(chunk string, isComplete bool, result *OptimizationResult) error,
) error {
	systemPrompt := "You are a social media expert."
	optimizationPrompt := s.buildOptimizationPrompt(text, brandContext, targetPlatform, customPrompt)

	// Stream the AI response using channel-based streaming
	streamChan, err := s.aiClient.Stream(ctx, optimizationPrompt, systemPrompt)
	if err != nil {
		return fmt.Errorf("AI streaming failed: %w", err)
	}

	fullResponse := ""
	for chunk := range streamChan {
		if chunk.Error != nil {
			return fmt.Errorf("streaming error: %w", chunk.Error)
		}

		if chunk.Content != "" {
			fullResponse += chunk.Content
			// Send chunk to callback for real-time display
			if err := onChunk(chunk.Content, false, nil); err != nil {
				return err
			}
		}
	}

	// Parse the complete response
	fullResponse = utils.CleanAIJSONResponse(fullResponse)

	if !strings.HasPrefix(fullResponse, "{") {
		return fmt.Errorf("invalid response format - expected JSON")
	}

	var result OptimizationResult
	if err := json.Unmarshal([]byte(fullResponse), &result); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Content == "" {
		return fmt.Errorf("no content in response")
	}

	result.Platform = targetPlatform

	// Send final complete result
	return onChunk("", true, &result)
}

// func (s PlatformOptimizerService) optimizeMedia(ctx context.Context, mediaURL, targetPlatform string) (string, error) {
// 	if s.grpcClient.optimizerClient == nil {
// 		return "", fmt.Errorf("platform optimizer gRPC client not available")
// 	}

// 	req := &pb.OptimizeRequest{
// 		MediaUrl:       mediaURL,
// 		TargetPlatform: targetPlatform,
// 	}

// 	resp, err := s.grpcClient.OptimizeMediaForPlatform(ctx, req)
// 	if err != nil {
// 		return "", err
// 	}
// 	return resp.OptimizedUrl, nil
// }

func (s PlatformOptimizerService) buildOptimizationPrompt(text string, brandContext *pb.BrandContext, targetPlatform string, customPrompt string) string {
	brandJSON, _ := json.Marshal(brandContext)

	platformSpecs := s.getPlatformSpecs(targetPlatform)

	var customInstructions string
	if customPrompt != "" {
		customInstructions = fmt.Sprintf("\n\nAdditional Instructions:\n%s", customPrompt)
	}

	return fmt.Sprintf(`Optimize this testimonial content for %s, following platform-specific best practices for maximum engagement and reach.%s

Testimonial: %s

Brand Context: %s

Platform Specifications for %s:
%s

CRITICAL: Return ONLY a valid JSON object with this exact structure, no additional text or explanations:
{
  "content": "platform-optimized version of the testimonial",
  "specifications": {
    "character_count": "actual count",
    "word_count": "actual count", 
    "format": "format used",
    "tone": "adjusted tone",
    "style": "writing style applied"
  },
  "hashtags": ["platform", "appropriate", "hashtags"],
  "optimal_timing": "best posting time guidance"
}

Optimization Guidelines:
- Adapt length to platform optimal ranges
- Adjust tone for platform audience
- Include platform-appropriate hashtags and mentions
- Optimize hook and call-to-action for platform behavior
- Ensure mobile-friendly formatting
- Follow platform content policies
- Maximize engagement potential
- Preserve testimonial authenticity while optimizing presentation
- Include platform-specific features (polls, questions, etc.) where appropriate%s`,
		targetPlatform, customInstructions, text, string(brandJSON), targetPlatform, platformSpecs,
		func() string {
			if customPrompt != "" {
				return "\n- Follow the additional instructions provided above"
			}
			return ""
		}())
}

func (s PlatformOptimizerService) getPlatformSpecs(platform string) string {
	specs := map[string]string{
		"instagram_feed": `
- Caption: 125-150 words optimal, 2,200 max
- Hashtags: 5-10 relevant hashtags
- Visual-first platform, descriptive captions
- Square (1:1) or portrait (4:5) aspect ratio preferred
- Use line breaks for readability`,

		"instagram_story": `
- Text overlay: 15-20 words maximum
- Vertical format (9:16)
- 15-second duration limit
- Interactive elements: polls, questions, stickers
- Casual, behind-the-scenes tone`,

		"instagram_reels": `
- Caption: 30-50 words optimal
- Hashtags: 3-5 trending hashtags
- Vertical video (9:16)
- Hook in first 3 seconds
- 15-90 seconds duration`,

		"twitter": `
- Character limit: 280 characters
- Hashtags: 1-2 maximum for optimal engagement
- Conversational, immediate tone
- Threading for longer content
- Visual content performs 150% better`,

		"linkedin": `
- Post length: 150-300 words optimal
- Professional tone with personal touch
- Hashtags: 3-5 industry-relevant
- Line breaks for readability
- Thought leadership angle`,

		"facebook": `
- Short posts: 40-80 characters for best reach
- Longer posts: up to 500 words for engagement
- Emotional storytelling
- Questions to encourage comments
- Native video preferred`,

		"youtube_standard": `
- Title: 60 characters or less
- Description: front-load key information
- Timestamps and chapters
- Call-to-action in first 15 seconds
- Thumbnail text readable at small sizes
- Longer form content 5-15 minutes optimal`,

		"youtube_shorts": `
- Title: 60 characters or less
- Vertical video format (9:16)
- Hook in first 3 seconds
- 15-60 seconds optimal length
- Trending hashtags
- Quick, snappy content`,

		"tiktok": `
- Vertical video format (9:16)
- Hook in first 3 seconds
- 15-60 seconds optimal length
- Trending hashtags and sounds
- Authentic, unpolished aesthetic
- Clear captions for accessibility`,

		"whatsapp": `
- Message length: 25-30 words optimal
- Personal, conversational tone
- Emojis for emphasis
- Forward-friendly content
- Status updates: short and engaging`,

		"snapchat": `
- Vertical format (9:16)
- Text overlay: 10-15 words
- Casual, authentic tone
- Story duration: 3-10 seconds
- Interactive lenses and filters`,

		"pinterest": `
- Pin description: 100-200 characters
- Hashtags: 2-5 relevant hashtags
- Vertical images (2:3 or 1:2.1 ratio)
- SEO-optimized descriptions
- Call-to-action included`,

		"telegram": `
- Message length: flexible, up to 4,096 characters
- Rich formatting supported
- Channel posts: informative tone
- Group messages: conversational
- Link previews optimized`,

		"discord": `
- Message length: up to 2,000 characters
- Community-focused tone
- Thread-friendly format
- Markdown formatting supported
- Server context awareness`,
	}

	if spec, exists := specs[platform]; exists {
		return spec
	}

	return "General social media best practices apply"
}
