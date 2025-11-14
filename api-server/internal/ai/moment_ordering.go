package ai

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"go.uber.org/zap"

	pb "github.com/ifeanyidike/cenphi/pb"
)

// MomentOrderingService handles AI-based ordering of highlight moments
type MomentOrderingService struct {
	aiClient *AIClient
	logger   *zap.Logger
}

// NewMomentOrderingService creates a new moment ordering service
func NewMomentOrderingService(aiClient *AIClient, logger *zap.Logger) *MomentOrderingService {
	return &MomentOrderingService{
		aiClient: aiClient,
		logger:   logger,
	}
}

// OrderMomentsRequest represents the request structure for moment ordering
type OrderMomentsRequest struct {
	Moments        []*pb.HighlightMoment `json:"moments"`
	Context        string                `json:"context"`         // "story_video" or "clipping"
	TargetDuration float64               `json:"target_duration"` // optional
	CompanyName    string                `json:"company_name"`    // optional
	CustomPrompt   string                `json:"custom_prompt"`   // optional
}

// OrderMomentsResponse represents the response structure
type OrderMomentsResponse struct {
	OrderedMomentIDs  []string `json:"ordered_moment_ids"`
	Reasoning         string   `json:"reasoning"`
	EstimatedDuration float64  `json:"estimated_duration"`
	SemanticGaps      []int    `json:"semantic_gaps"` // Indices in the NEW order where semantic gaps exist
}

// momentSummary represents a simplified moment for AI analysis
type momentSummary struct {
	Index    int     `json:"index"`
	ID       string  `json:"id"`
	Text     string  `json:"text"`
	Theme    string  `json:"theme"`
	Duration float64 `json:"duration"`
	Summary  string  `json:"summary"`
}

// OrderMoments uses AI to determine optimal moment ordering for narrative flow
func (s *MomentOrderingService) OrderMoments(ctx context.Context, req OrderMomentsRequest) (*OrderMomentsResponse, error) {
	if len(req.Moments) <= 1 {
		// No ordering needed for 0 or 1 moment
		momentIDs := make([]string, len(req.Moments))
		var totalDuration float64
		for i, m := range req.Moments {
			momentIDs[i] = m.Id
			totalDuration += m.EndTime - m.StartTime
		}
		return &OrderMomentsResponse{
			OrderedMomentIDs:  momentIDs,
			Reasoning:         "Only one or zero moments provided, no ordering needed.",
			EstimatedDuration: totalDuration,
			SemanticGaps:      []int{}, // No gaps with single moment
		}, nil
	}

	s.logger.Info("AI analyzing optimal order for moments", zap.Int("count", len(req.Moments)))

	// Prepare moment data for AI analysis
	momentSummaries := make([]momentSummary, len(req.Moments))
	for i, moment := range req.Moments {
		duration := moment.EndTime - moment.StartTime
		summary := extractMomentSummary(moment.Text)

		momentSummaries[i] = momentSummary{
			Index:    i,
			ID:       moment.Id,
			Text:     truncateText(moment.Text, 500),
			Theme:    moment.Theme,
			Duration: duration,
			Summary:  summary,
		}
	}

	// Create AI prompt for moment ordering
	aiPrompt := s.createOrderingPrompt(momentSummaries, req.Context, req.CompanyName, req.CustomPrompt)

	// Call AI with retry logic
	var aiResponse string
	var err error

	systemPrompt := "You are an expert video editor and storyteller specializing in creating compelling narrative flows from customer testimonials and content segments."

	aiResponse, err = s.aiClient.Complete(ctx, aiPrompt, systemPrompt)
	if err != nil {
		s.logger.Warn("AI ordering primary attempt failed, trying fallback", zap.Error(err))

		// Fallback to simpler prompt
		simplePrompt := s.createSimpleOrderingPrompt(momentSummaries)
		systemPrompt = "You are a video editor. Reorder segments for best story flow."

		aiResponse, err = s.aiClient.Complete(ctx, simplePrompt, systemPrompt)
		if err != nil {
			return nil, fmt.Errorf("AI ordering failed: %w", err)
		}
	}

	s.logger.Debug("AI ordering response", zap.String("response", truncateText(aiResponse, 200)))

	// Parse AI response and reorder moments (now includes semantic gaps)
	newOrder, reasoning, gaps := s.parseAIOrderingResponse(aiResponse, len(req.Moments))

	if newOrder == nil || len(newOrder) != len(req.Moments) {
		s.logger.Warn("AI ordering validation failed, using original order",
			zap.Int("expected", len(req.Moments)),
			zap.Int("received", len(newOrder)))

		// Fallback to original order
		momentIDs := make([]string, len(req.Moments))
		var totalDuration float64
		for i, m := range req.Moments {
			momentIDs[i] = m.Id
			totalDuration += m.EndTime - m.StartTime
		}

		return &OrderMomentsResponse{
			OrderedMomentIDs:  momentIDs,
			Reasoning:         "AI ordering failed validation, using original chronological order.",
			EstimatedDuration: totalDuration,
			SemanticGaps:      []int{}, // No gaps in fallback
		}, nil
	}

	// Reorder moments according to AI suggestion
	orderedMomentIDs := make([]string, len(newOrder))
	var totalDuration float64

	for i, index := range newOrder {
		if index >= 0 && index < len(req.Moments) {
			orderedMomentIDs[i] = req.Moments[index].Id
			totalDuration += req.Moments[index].EndTime - req.Moments[index].StartTime
		}
	}

	s.logger.Info("AI successfully reordered moments",
		zap.Ints("new_order", newOrder),
		zap.String("reasoning", reasoning),
		zap.Ints("semantic_gaps", gaps))

	return &OrderMomentsResponse{
		OrderedMomentIDs:  orderedMomentIDs,
		Reasoning:         reasoning,
		EstimatedDuration: totalDuration,
		SemanticGaps:      gaps, // Include detected semantic gaps
	}, nil
}

// extractMomentSummary extracts a brief summary of moment content
func extractMomentSummary(text string) string {
	if text == "" {
		return "No content"
	}

	// Split into sentences and take first 2
	sentences := strings.Split(text, ".")
	if len(sentences) > 2 {
		sentences = sentences[:2]
	}

	summary := strings.Join(sentences, ".") + "."
	summary = strings.TrimSpace(summary)

	if len(summary) > 150 {
		summary = summary[:150] + "..."
	}

	return summary
}

// truncateText truncates text to maxLen characters
func truncateText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}

// createOrderingPrompt creates detailed AI prompt for moment ordering
func (s *MomentOrderingService) createOrderingPrompt(moments []momentSummary, context, companyName, userPrompt string) string {
	var momentsText strings.Builder
	for _, m := range moments {
		momentsText.WriteString(fmt.Sprintf("Moment %d: \"%s\" (Theme: %s, Duration: %.1fs)\n",
			m.Index, m.Summary, m.Theme, m.Duration))
	}

	contextDesc := "video story"
	if context == "clipping" {
		contextDesc = "video clips compilation"
	}

	entityName := "the content"
	if companyName != "" {
		entityName = companyName
	}

	basePrompt := fmt.Sprintf(`
I need to create an optimal narrative flow for a %s %s from these moments:

%s

Please analyze these moments and provide the optimal order (0-based indices) that creates:
1. A compelling narrative arc (setup → development → conclusion)
2. Smooth emotional progression
3. Logical flow of ideas
4. Strong opening and closing

IMPORTANT: After creating your optimal order, you MUST identify semantic gaps for context card insertion.

SEMANTIC GAP DEFINITION:
A semantic gap exists between two consecutive moments in your NEW order when:
- The topic shifts significantly (e.g., "product features" → "customer support")
- There's a speaker change (different person)
- The emotional tone changes dramatically (e.g., "celebration" → "struggle")
- The time period jumps (e.g., "early career" → "current role")

Even in an optimal order, semantic gaps are NORMAL and DESIRABLE for longer stories.
They mark natural chapter transitions where a brief context card helps the viewer mentally shift.

EXAMPLES:
✓ GAP: "Personal achievement in coding" → "Family inspiration for accessibility" (different focus areas)
✓ GAP: "Technical challenges" → "Business growth" (topic shift from tech to business)
✓ GAP: Person A speaking → Person B speaking (speaker change)
✗ NO GAP: "Coding journey begins" → "Discovering passion in coding" (coherent progression)
✗ NO GAP: "Team collaboration" → "Building strong team culture" (same theme)

`, entityName, contextDesc, momentsText.String())

	if userPrompt != "" {
		basePrompt += fmt.Sprintf("\nSpecial requirements: %s\n", userPrompt)
	}

	basePrompt += `
Respond with:
1. The optimal order as a comma-separated list of indices (e.g., "2,0,1,3")
2. Brief reasoning for this order
3. **CRITICAL**: Semantic gap indices in the NEW order where a context card should be inserted

For gaps, provide the index BEFORE the gap (e.g., "1,4" means insert context card after moment at position 1 and after position 4 in the NEW order).

Format:
ORDER: [indices]
REASONING: [explanation]
GAPS: [comma-separated indices where viewers would benefit from a context card, or "none" if story flows without any topic shifts]
`

	return basePrompt
}

// createSimpleOrderingPrompt creates simplified prompt for fallback AI calls
func (s *MomentOrderingService) createSimpleOrderingPrompt(moments []momentSummary) string {
	var momentsText strings.Builder
	for _, m := range moments {
		momentsText.WriteString(fmt.Sprintf("%d: %s\n", m.Index, truncateText(m.Summary, 100)))
	}

	return fmt.Sprintf(`
Reorder these video moments for best storytelling flow:

%s

Respond with just the optimal order as comma-separated indices (e.g., "2,0,1,3").
`, momentsText.String())
}

// parseAIOrderingResponse parses AI response to extract new moment order and semantic gaps
func (s *MomentOrderingService) parseAIOrderingResponse(aiResponse string, expectedCount int) ([]int, string, []int) {
	reasoning := ""
	orderLine := ""
	gapsLine := ""

	// Look for ORDER:, REASONING:, and GAPS: patterns
	lines := strings.Split(aiResponse, "\n")

	for _, line := range lines {
		upperLine := strings.ToUpper(line)
		if strings.Contains(upperLine, "ORDER:") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				orderLine = strings.TrimSpace(parts[1])
			}
		}
		if strings.Contains(upperLine, "REASONING:") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				reasoning = strings.TrimSpace(parts[1])
			}
		}
		if strings.Contains(upperLine, "GAPS:") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				gapsLine = strings.TrimSpace(parts[1])
			}
		}
	}

	// Fallback: look for comma-separated numbers for order
	if orderLine == "" {
		for _, line := range lines {
			if strings.Contains(line, ",") && containsDigit(line) {
				orderLine = line
				break
			}
		}
	}

	// If still no order line, use the first line
	if orderLine == "" && len(lines) > 0 {
		orderLine = lines[0]
	}

	// Extract order indices using regex
	re := regexp.MustCompile(`\d+`)
	numberStrs := re.FindAllString(orderLine, -1)

	indices := make([]int, 0, len(numberStrs))
	seen := make(map[int]bool)

	for _, numStr := range numberStrs {
		num, err := strconv.Atoi(numStr)
		if err != nil {
			continue
		}

		// Validate index is in range and not duplicate
		if num >= 0 && num < expectedCount && !seen[num] {
			indices = append(indices, num)
			seen[num] = true
		}
	}

	// Validate we got all indices
	if len(indices) != expectedCount {
		s.logger.Warn("AI ordering incomplete or invalid",
			zap.Int("expected", expectedCount),
			zap.Int("received", len(indices)))
		return nil, "", nil
	}

	if reasoning == "" {
		reasoning = "AI-optimized order for narrative flow and engagement."
	}

	// Parse semantic gaps
	gaps := make([]int, 0)
	if gapsLine != "" && strings.ToLower(gapsLine) != "none" {
		gapNumberStrs := re.FindAllString(gapsLine, -1)
		for _, numStr := range gapNumberStrs {
			num, err := strconv.Atoi(numStr)
			if err != nil {
				continue
			}
			// Gap indices should be in range of the NEW order (0 to expectedCount-2)
			// Gap at index i means gap between moment i and moment i+1
			if num >= 0 && num < expectedCount-1 {
				gaps = append(gaps, num)
			}
		}
		s.logger.Info("Semantic gaps detected", zap.Ints("gap_indices", gaps))
	}

	return indices, reasoning, gaps
}

// containsDigit checks if a string contains at least one digit
func containsDigit(s string) bool {
	for _, c := range s {
		if c >= '0' && c <= '9' {
			return true
		}
	}
	return false
}
