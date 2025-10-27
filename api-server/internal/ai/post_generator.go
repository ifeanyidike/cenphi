package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/ifeanyidike/cenphi/internal/models"
)

// Platform-specific constraints
var platformConstraints = map[string]struct {
	maxLength   int
	maxHashtags int
	tone        string
}{
	"linkedin": {
		maxLength:   3000,
		maxHashtags: 5,
		tone:        "professional and insightful",
	},
	"twitter": {
		maxLength:   280,
		maxHashtags: 3,
		tone:        "concise and engaging",
	},
	"facebook": {
		maxLength:   63206,
		maxHashtags: 5,
		tone:        "friendly and conversational",
	},
	"instagram": {
		maxLength:   2200,
		maxHashtags: 10,
		tone:        "visual and authentic",
	},
}

// GeneratePostSuggestions generates AI-powered post suggestions for all platforms
func (ai AIClient) GeneratePostSuggestions(ctx context.Context, testimonial *models.Testimonial) (map[string]*models.AIPostSuggestion, error) {
	suggestions := make(map[string]*models.AIPostSuggestion)

	// Extract testimonial content
	content := extractTestimonialContent(testimonial)
	if content == "" {
		return nil, fmt.Errorf("no content available in testimonial")
	}

	// Generate for each platform
	platforms := []string{"linkedin", "twitter", "facebook", "instagram"}
	for _, platform := range platforms {
		suggestion, err := ai.generateForPlatform(ctx, platform, content, testimonial)
		if err != nil {
			// Log error but continue with other platforms
			fmt.Printf("Failed to generate post for %s: %v\n", platform, err)
			continue
		}
		suggestions[platform] = suggestion
	}

	if len(suggestions) == 0 {
		return nil, fmt.Errorf("failed to generate suggestions for any platform")
	}

	return suggestions, nil
}

// GeneratePostForPlatform generates a post suggestion for a specific platform
func (ai AIClient) GeneratePostForPlatform(ctx context.Context, platform string, testimonial *models.Testimonial) (*models.AIPostSuggestion, error) {
	content := extractTestimonialContent(testimonial)
	if content == "" {
		return nil, fmt.Errorf("no content available in testimonial")
	}

	return ai.generateForPlatform(ctx, platform, content, testimonial)
}

func (ai AIClient) generateForPlatform(ctx context.Context, platform, content string, testimonial *models.Testimonial) (*models.AIPostSuggestion, error) {
	constraints, ok := platformConstraints[platform]
	if !ok {
		return nil, fmt.Errorf("unsupported platform: %s", platform)
	}

	// Build prompt
	systemPrompt := buildSystemPrompt(platform, constraints)
	userPrompt := buildUserPrompt(content, testimonial, constraints)

	// Call LLM
	response, err := ai.Complete(ctx, userPrompt, systemPrompt)
	if err != nil {
		return nil, fmt.Errorf("LLM call failed: %w", err)
	}

	// Parse response
	suggestion, err := parsePostSuggestion(response, platform)
	if err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %w", err)
	}

	return suggestion, nil
}

func extractTestimonialContent(testimonial *models.Testimonial) string {
	// Priority: content > transcript segments
	if testimonial.Content != nil && *testimonial.Content != "" {
		return *testimonial.Content
	}
	// Extract text from transcript segments
	if testimonial.TranscriptSegments != nil && len(*testimonial.TranscriptSegments) > 0 {
		var transcript strings.Builder
		for _, segment := range *testimonial.TranscriptSegments {
			transcript.WriteString(segment.Text)
			transcript.WriteString(" ")
		}
		return strings.TrimSpace(transcript.String())
	}
	return ""
}

func buildSystemPrompt(platform string, constraints struct {
	maxLength   int
	maxHashtags int
	tone        string
}) string {
	return fmt.Sprintf(`You are an expert social media content creator specializing in %s.

Your task is to transform customer testimonials into compelling social media posts that:
- Match the %s tone of %s
- Stay within %d characters (including spaces)
- Include up to %d relevant, trending hashtags
- Drive engagement and authenticity
- Highlight customer success and value

Return your response as a JSON object with this exact structure:
{
  "content": "the post text without hashtags",
  "hashtags": ["hashtag1", "hashtag2"],
  "tone": "the tone used",
  "engagement_score": 0.85
}

The engagement_score should be between 0 and 1, representing how likely this post is to drive engagement.
Do not include any markdown formatting or code blocks, just the raw JSON.`,
		platform, constraints.tone, platform, constraints.maxLength, constraints.maxHashtags)
}

func buildUserPrompt(content string, testimonial *models.Testimonial, constraints struct {
	maxLength   int
	maxHashtags int
	tone        string
}) string {
	// Build context
	var context strings.Builder
	context.WriteString(fmt.Sprintf("Testimonial: %s\n\n", content))

	if testimonial.AuthorName != nil {
		context.WriteString(fmt.Sprintf("Author: %s\n", *testimonial.AuthorName))
	}
	if testimonial.AuthorCompany != nil {
		context.WriteString(fmt.Sprintf("Company: %s\n", *testimonial.AuthorCompany))
	}
	if testimonial.AuthorTitle != nil {
		context.WriteString(fmt.Sprintf("Title: %s\n", *testimonial.AuthorTitle))
	}
	if testimonial.Rating != nil {
		context.WriteString(fmt.Sprintf("Rating: %d/5 stars\n", *testimonial.Rating))
	}

	prompt := fmt.Sprintf(`%s
Generate a compelling social media post based on this testimonial.

Requirements:
- Maximum %d characters
- %s tone
- Include %d relevant hashtags
- Focus on the customer's success story and transformation
- Make it authentic and relatable
- Include a clear call-to-action if appropriate

Return only the JSON object as specified in the system prompt.`,
		context.String(),
		constraints.maxLength,
		constraints.tone,
		constraints.maxHashtags,
	)

	return prompt
}

func parsePostSuggestion(response, platform string) (*models.AIPostSuggestion, error) {
	// Clean response - remove markdown code blocks if present
	cleaned := strings.TrimSpace(response)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	// Parse JSON
	var parsed struct {
		Content         string   `json:"content"`
		Hashtags        []string `json:"hashtags"`
		Tone            string   `json:"tone"`
		EngagementScore float64  `json:"engagement_score"`
	}

	if err := json.Unmarshal([]byte(cleaned), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w (response: %s)", err, cleaned)
	}

	// Validate
	if parsed.Content == "" {
		return nil, fmt.Errorf("empty content in response")
	}

	// Build hashtag string
	var hashtagStr string
	if len(parsed.Hashtags) > 0 {
		// Ensure hashtags have # prefix
		for i, tag := range parsed.Hashtags {
			if !strings.HasPrefix(tag, "#") {
				parsed.Hashtags[i] = "#" + tag
			}
		}
		hashtagStr = strings.Join(parsed.Hashtags, " ")
	}

	// Calculate character count (content + hashtags + space between)
	charCount := len(parsed.Content)
	if hashtagStr != "" {
		charCount += 1 + len(hashtagStr) // +1 for space
	}

	return &models.AIPostSuggestion{
		Platform:        platform,
		Content:         parsed.Content,
		Hashtags:        parsed.Hashtags,
		Tone:            parsed.Tone,
		CharCount:       charCount,
		EngagementScore: parsed.EngagementScore,
	}, nil
}

// GeneratePostVariations generates multiple variations of a post for A/B testing
func (ai AIClient) GeneratePostVariations(ctx context.Context, platform string, testimonial *models.Testimonial, count int) ([]*models.AIPostSuggestion, error) {
	if count < 1 || count > 5 {
		return nil, fmt.Errorf("count must be between 1 and 5")
	}

	content := extractTestimonialContent(testimonial)
	if content == "" {
		return nil, fmt.Errorf("no content available in testimonial")
	}

	constraints, ok := platformConstraints[platform]
	if !ok {
		return nil, fmt.Errorf("unsupported platform: %s", platform)
	}

	systemPrompt := fmt.Sprintf(`You are an expert social media content creator specializing in %s.

Generate %d different variations of a social media post based on a testimonial.
Each variation should:
- Have a different angle or hook (e.g., problem-solution, transformation, specific benefit)
- Match the %s tone
- Stay within %d characters
- Include up to %d relevant hashtags
- Be unique from the other variations

Return a JSON array of %d objects, each with this structure:
{
  "content": "the post text without hashtags",
  "hashtags": ["hashtag1", "hashtag2"],
  "tone": "the tone/angle used",
  "engagement_score": 0.85
}

Do not include markdown formatting, just the raw JSON array.`,
		platform, count, constraints.tone, constraints.maxLength, constraints.maxHashtags, count)

	userPrompt := buildUserPrompt(content, testimonial, constraints)

	response, err := ai.Complete(ctx, userPrompt, systemPrompt)
	if err != nil {
		return nil, fmt.Errorf("LLM call failed: %w", err)
	}

	// Parse array response
	variations, err := parsePostVariations(response, platform)
	if err != nil {
		return nil, fmt.Errorf("failed to parse variations: %w", err)
	}

	if len(variations) == 0 {
		return nil, fmt.Errorf("no variations generated")
	}

	return variations, nil
}

// StreamLinkedInPost streams the generation of a LinkedIn post in real-time
func (ai AIClient) StreamLinkedInPost(ctx context.Context, testimonial *models.Testimonial, writer func(chunk string) error) error {
	content := extractTestimonialContent(testimonial)
	if content == "" {
		return fmt.Errorf("no content available in testimonial")
	}

	constraints := platformConstraints["linkedin"]

	// Build prompt for LinkedIn
	systemPrompt := fmt.Sprintf(`You are an expert LinkedIn content creator.

Your task is to transform this customer testimonial into a compelling LinkedIn post that:
- Matches a %s tone
- Stays within %d characters (including spaces and hashtags)
- Includes up to %d relevant, professional hashtags
- Drives engagement and authenticity
- Highlights customer success and value
- Includes a subtle call-to-action

Write the post directly - no JSON, no formatting, just the natural post text with hashtags at the end.`,
		constraints.tone, constraints.maxLength, constraints.maxHashtags)

	userPrompt := buildLinkedInUserPrompt(content, testimonial)

	// Call LLM with streaming enabled
	resp, err := ai.makeClaudeCall(ctx, userPrompt, systemPrompt, true)
	if err != nil {
		return fmt.Errorf("LLM streaming call failed: %w", err)
	}
	defer resp.Body.Close()

	// Stream the response
	return streamClaudeResponse(resp, writer)
}

func buildLinkedInUserPrompt(content string, testimonial *models.Testimonial) string {
	var context strings.Builder
	context.WriteString(fmt.Sprintf("Testimonial: %s\n\n", content))

	if testimonial.AuthorName != nil {
		context.WriteString(fmt.Sprintf("Author: %s\n", *testimonial.AuthorName))
	}
	if testimonial.AuthorCompany != nil {
		context.WriteString(fmt.Sprintf("Company: %s\n", *testimonial.AuthorCompany))
	}
	if testimonial.AuthorTitle != nil {
		context.WriteString(fmt.Sprintf("Title: %s\n", *testimonial.AuthorTitle))
	}
	if testimonial.Rating != nil {
		context.WriteString(fmt.Sprintf("Rating: %d/5 stars\n", *testimonial.Rating))
	}

	prompt := fmt.Sprintf(`%s
Create a compelling LinkedIn post based on this testimonial.

Requirements:
- Professional and engaging tone
- Focus on the customer's success story and transformation
- Make it authentic and relatable
- Include 3-5 relevant professional hashtags at the end
- Keep it concise but impactful
- Add a subtle call-to-action

Write naturally as if you're sharing a success story with your network.`,
		context.String())

	return prompt
}

func parsePostVariations(response, platform string) ([]*models.AIPostSuggestion, error) {
	// Clean response
	cleaned := strings.TrimSpace(response)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	// Parse JSON array
	var parsed []struct {
		Content         string   `json:"content"`
		Hashtags        []string `json:"hashtags"`
		Tone            string   `json:"tone"`
		EngagementScore float64  `json:"engagement_score"`
	}

	if err := json.Unmarshal([]byte(cleaned), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse JSON array: %w", err)
	}

	var variations []*models.AIPostSuggestion
	for _, p := range parsed {
		if p.Content == "" {
			continue
		}

		// Ensure hashtags have # prefix
		for i, tag := range p.Hashtags {
			if !strings.HasPrefix(tag, "#") {
				p.Hashtags[i] = "#" + tag
			}
		}

		hashtagStr := strings.Join(p.Hashtags, " ")
		charCount := len(p.Content)
		if hashtagStr != "" {
			charCount += 1 + len(hashtagStr)
		}

		variations = append(variations, &models.AIPostSuggestion{
			Platform:        platform,
			Content:         p.Content,
			Hashtags:        p.Hashtags,
			Tone:            p.Tone,
			CharCount:       charCount,
			EngagementScore: p.EngagementScore,
		})
	}

	return variations, nil
}
