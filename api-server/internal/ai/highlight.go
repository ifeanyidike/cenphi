package ai

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/pb"
)

type HighlightType string

const (
	HighlightTypeGeneral        HighlightType = "general"        // Most engaging overall moments
	HighlightTypeProblem        HighlightType = "problem"        // Customer describing pain points/challenges
	HighlightTypeSolution       HighlightType = "solution"       // How they found/chose your solution
	HighlightTypeResults        HighlightType = "results"        // Specific outcomes they achieved
	HighlightTypeMetrics        HighlightType = "metrics"        // Numbers, percentages, ROI mentions
	HighlightTypeRecommendation HighlightType = "recommendation" // Direct endorsements/recommendations
	HighlightTypeBeforeAfter    HighlightType = "before_after"   // Transformation/comparison stories
	HighlightTypeEmotional      HighlightType = "emotional"      // Genuine excitement, relief, satisfaction
)

type HighlightRequest struct {
	TestimonialID uuid.UUID                     `json:"testimonial_id"`
	Text          string                        `json:"text"`
	Segments      []models.TranscriptionSegment `json:"segments"`
	MaxHighlights int                           `json:"max_highlights,omitempty"` // Optional, defaults to 5
	HighlightType HighlightType                 `json:"highlight_type,omitempty"` // Optional, defaults to general
	CustomPrompt  string                        `json:"custom_prompt,omitempty"`  // Optional
}

// TranscriptionSegmentStripped is used for AI processing to save tokens
type TranscriptionSegmentStripped struct {
	Text      string  `json:"text"`
	StartTime float64 `json:"start_time"`
	EndTime   float64 `json:"end_time"`
	Speaker   string  `json:"speaker,omitempty"`
	// Words field intentionally omitted to save tokens
}

// HighlightWithWords represents a highlight with its associated words
type HighlightWithWords struct {
	Text      string        `json:"text"`
	Theme     string        `json:"theme"`
	StartTime float64       `json:"start_time,omitempty"`
	EndTime   float64       `json:"end_time,omitempty"`
	Words     []models.Word `json:"words,omitempty"`

	ImportanceScore    float64  `json:"importance_score"`
	HighlightType      string   `json:"highlight_type"`
	SuggestedTitle     string   `json:"suggested_title"`
	Keywords           []string `json:"keywords"`
	EmotionalIntensity float64  `json:"emotional_intensity"`
	Shareability       float64  `json:"shareability"`
}

type HighlightService struct {
	aiClient        AIClient
	cacheService    cache.RedisCache
	db              *sql.DB
	testimonialRepo repositories.TestimonialRepository
}

func NewHighlightService(aiClient AIClient, cacheService cache.RedisCache, db *sql.DB, testimonialRepo repositories.TestimonialRepository) HighlightService {
	return HighlightService{
		aiClient:        aiClient,
		cacheService:    cacheService,
		db:              db,
		testimonialRepo: testimonialRepo,
	}
}

func (s HighlightService) ExtractHighlights(ctx context.Context, textOrTranscript string, segments []models.TranscriptionSegment, customPrompt string) ([]*pb.HighlightMoment, error) {
	cacheKey := fmt.Sprintf("highlights:%x", md5.Sum([]byte(textOrTranscript+customPrompt)))

	// Check if we have cached highlights without words
	var cachedHighlights []*pb.HighlightMoment
	if err := s.cacheService.Get(ctx, cacheKey, &cachedHighlights); err == nil {
		return s.addWordsToHighlights(cachedHighlights, segments), nil
	}

	systemPrompt := `You are an expert video editor and content strategist specializing in extracting the most compelling moments from customer testimonial videos for creating engaging clips, story modes, and social media content.
Your task is to identify the most emotionally impactful and business-relevant passages that work perfectly as standalone video clips.`

	maxHighlights := 5
	prompt := s.buildHighlightPrompt(textOrTranscript, segments, customPrompt, "general", maxHighlights)

	response, err := s.aiClient.Complete(ctx, prompt, systemPrompt)
	if err != nil {
		return nil, fmt.Errorf("highlight extraction failed: %w", err)
	}

	// Parse AI response into highlights without words
	var highlightsResponse []HighlightWithWords
	if err := json.Unmarshal([]byte(response), &highlightsResponse); err != nil {
		return nil, fmt.Errorf("failed to parse highlights response: %w", err)
	}

	// Convert to pb.HighlightMoment for caching (without words to save space)
	pbHighlights := make([]*pb.HighlightMoment, len(highlightsResponse))
	for i, h := range highlightsResponse {
		pbHighlights[i] = &pb.HighlightMoment{
			Text:               h.Text,
			Theme:              h.Theme,
			StartTime:          h.StartTime,
			EndTime:            h.EndTime,
			ImportanceScore:    h.ImportanceScore,
			HighlightType:      h.HighlightType,
			SuggestedTitle:     h.SuggestedTitle,
			Keywords:           h.Keywords,
			EmotionalIntensity: h.EmotionalIntensity,
			Shareability:       h.Shareability,
		}
	}

	// Cache the highlights without words
	s.cacheService.Set(ctx, cacheKey, pbHighlights, 2*time.Hour)

	highlightsWithWords := s.addWordsToHighlights(pbHighlights, segments)

	return highlightsWithWords, nil
}

func (s HighlightService) ExtractHighlightsByType(ctx context.Context, request HighlightRequest) ([]*pb.HighlightMoment, error) {

	// Get testimonial content
	testimonial, err := s.testimonialRepo.FetchByID(ctx, request.TestimonialID, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get testimonial")
	}

	if testimonial.Content == nil || *testimonial.Content == "" {
		return nil, fmt.Errorf("testimonial has no content for highlight extraction")
	}

	// Convert transcript segments for highlight service
	request.Segments = *testimonial.TranscriptSegments
	request.Text = *testimonial.Content

	// Set defaults
	if request.MaxHighlights == 0 {
		request.MaxHighlights = 5
	}
	if request.HighlightType == "" {
		request.HighlightType = HighlightTypeGeneral
	}

	// Enhanced caching with type
	cacheKey := fmt.Sprintf("highlights:%s:%x", request.HighlightType, md5.Sum([]byte(request.Text+request.CustomPrompt)))
	var cached []*pb.HighlightMoment
	if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
		return s.addWordsToHighlights(cached, request.Segments), nil
	}
	// Type-specific system prompt
	systemPrompt := s.getTypeSpecificSystemPrompt(request.HighlightType)

	// Enhanced prompt
	prompt := s.buildHighlightPrompt(request.Text, request.Segments, request.CustomPrompt, string(request.HighlightType), request.MaxHighlights)

	response, err := s.aiClient.Complete(ctx, prompt, systemPrompt)
	if err != nil {
		return nil, fmt.Errorf("highlight extraction failed: %w", err)
	}

	var highlightsResponse []HighlightWithWords
	if err := json.Unmarshal([]byte(response), &highlightsResponse); err != nil {
		return nil, fmt.Errorf("failed to parse highlights response: %w", err)
	}

	// Convert to pb.HighlightMoment
	pbHighlights := make([]*pb.HighlightMoment, len(highlightsResponse))
	for i, h := range highlightsResponse {
		pbHighlights[i] = &pb.HighlightMoment{
			Text:               h.Text,
			Theme:              h.Theme,
			StartTime:          h.StartTime,
			EndTime:            h.EndTime,
			ImportanceScore:    h.ImportanceScore,
			HighlightType:      h.HighlightType,
			SuggestedTitle:     h.SuggestedTitle,
			Keywords:           h.Keywords,
			EmotionalIntensity: h.EmotionalIntensity,
			Shareability:       h.Shareability,
		}
	}

	s.cacheService.Set(ctx, cacheKey, pbHighlights, 2*time.Hour)
	return s.addWordsToHighlights(pbHighlights, request.Segments), nil
}

// stripWordsFromSegments creates a copy of segments without the Words field to save tokens
func (s HighlightService) stripWordsFromSegments(segments []models.TranscriptionSegment) []TranscriptionSegmentStripped {
	strippedSegments := make([]TranscriptionSegmentStripped, len(segments))
	for i, segment := range segments {
		strippedSegments[i] = TranscriptionSegmentStripped{
			Text:      segment.Text,
			StartTime: segment.StartTime,
			EndTime:   segment.EndTime,
			Speaker:   segment.Speaker,
		}
	}
	return strippedSegments
}

// addWordsToHighlights matches words to highlights based on timing and adds them back
func (s HighlightService) addWordsToHighlights(highlights []*pb.HighlightMoment, originalSegments []models.TranscriptionSegment) []*pb.HighlightMoment {
	// Create a flat list of all words from all segments for easier searching
	var allWords []models.Word
	for _, segment := range originalSegments {
		allWords = append(allWords, segment.Words...)
	}

	// Create new highlights with words added and text fixed
	result := make([]*pb.HighlightMoment, len(highlights))
	for i, highlight := range highlights {
		newHighlight := &pb.HighlightMoment{
			Text:               highlight.Text,
			Theme:              highlight.Theme,
			StartTime:          highlight.StartTime,
			EndTime:            highlight.EndTime,
			ImportanceScore:    highlight.ImportanceScore,
			HighlightType:      highlight.HighlightType,
			SuggestedTitle:     highlight.SuggestedTitle,
			Keywords:           highlight.Keywords,
			EmotionalIntensity: highlight.EmotionalIntensity,
			Shareability:       highlight.Shareability,
		}

		// Add words if timing information is available
		if highlight.StartTime >= 0 && highlight.EndTime > highlight.StartTime {
			matchingWords := s.findWordsInTimeRange(highlight.StartTime, highlight.EndTime, allWords)

			if len(matchingWords) > 0 {
				// ALWAYS use the actual text from words - this ensures consistency
				newHighlight.Text = s.reconstructTextFromWords(matchingWords)
				newHighlight.StartTime = matchingWords[0].Start
				newHighlight.EndTime = matchingWords[len(matchingWords)-1].End
				newHighlight.Words = s.convertWordsToProto(matchingWords)
			}
		}

		result[i] = newHighlight
	}

	return result
}

// convertWordsToProto converts models.Word to pb.Word
func (s HighlightService) convertWordsToProto(words []models.Word) []*pb.Word {
	protoWords := make([]*pb.Word, len(words))
	for i, word := range words {
		protoWords[i] = &pb.Word{
			Text:       word.Text,
			Start:      word.Start,
			End:        word.End,
			Confidence: word.Confidence,
			Speaker:    word.Speaker,
		}
	}
	return protoWords
}

// findWordsInTimeRange finds all words that fall within the given time range
func (s HighlightService) findWordsInTimeRange(startTime, endTime float64, words []models.Word) []models.Word {
	var matchingWords []models.Word

	for _, word := range words {
		// Include words that overlap with the time range
		// Word overlaps if: word.Start < endTime AND word.End > startTime
		if word.Start < endTime && word.End > startTime {
			matchingWords = append(matchingWords, word)
		}
	}

	return matchingWords
}

// func (s HighlightService) buildHighlightPrompt(text string, segments []models.TranscriptionSegment, customPrompt string, highlightType string, maxHighlights int) string {
// 	strippedSegments := s.stripWordsFromSegments(segments)
// 	segmentsJSON, _ := json.Marshal(strippedSegments)
// 	hasTimestamps := len(segments) > 0

// 	var customInstructions string
// 	if customPrompt != "" {
// 		customInstructions = fmt.Sprintf("\n\nAdditional Instructions:\n%s", customPrompt)
// 	}

// 	promptBase := fmt.Sprintf(`Extract the most impactful and emotionally resonant highlights from this testimonial content. Focus on moments that would be most compelling for marketing and business purposes.%s

// Content: %s`, customInstructions, text)

// 	if hasTimestamps {
// 		promptBase += fmt.Sprintf(`

// Timestamped segments: %s

// For timestamped content, include start_time and end_time for each highlight.`, string(segmentsJSON))
// 	}

// 	promptBase += `

// Return a JSON array of highlights with this structure:
// {
//   "text": "exact text of the highlight",
//   "theme": "specific theme (e.g., 'problem_solved', 'outcome_achieved', 'emotional_impact', 'recommendation', 'comparison')",
//   "start_time": 123.45, // include only if timestamps available
//   "end_time": 129.80,   // include only if timestamps available
//   "impact": 0.85,       // 0.0-1.0 emotional/business impact score
//   "category": "pain_point|solution|outcome|emotion|credibility|recommendation"
// }

// Return the result as *only* a JSON object, no explanations or additional text.

// Extraction Criteria:
// - Identify moments of high emotional intensity
// - Highlight specific problems solved or outcomes achieved
// - Extract compelling before/after statements
// - Find authentic emotional expressions
// - Identify credibility indicators (specific metrics, timeframes, details)
// - Capture recommendations or endorsements
// - Focus on quotable, shareable content
// - Prioritize business value and marketing potential`

// 	// Add conditional guideline for custom instructions
// 	if customPrompt != "" {
// 		promptBase += "\n- Follow the additional instructions provided above"
// 	}

// 	promptBase += `

// Look for:
// - Quantifiable results and metrics
// - Emotional transformation moments
// - Specific problem descriptions
// - Clear value propositions
// - Authentic personal experiences
// - Strong recommendations or endorsements
// - Unique selling points or differentiators

// Return 3-8 highlights ranked by impact and marketing value.`

// 	return promptBase
// }

func (s HighlightService) reconstructTextFromWords(words []models.Word) string {
	if len(words) == 0 {
		return ""
	}

	var textBuilder strings.Builder
	for i, word := range words {
		if i > 0 {
			// Add space between words, but handle punctuation appropriately
			if !isPunctuation(word.Text) {
				textBuilder.WriteString(" ")
			}
		}
		textBuilder.WriteString(word.Text)
	}

	return textBuilder.String()
}

// Helper function to check if a text is punctuation
func isPunctuation(text string) bool {
	punctuation := []string{".", ",", "!", "?", ";", ":", "'", "\"", "-", "(", ")", "[", "]"}
	for _, p := range punctuation {
		if text == p {
			return true
		}
	}
	return false
}

func (s HighlightService) getTypeSpecificSystemPrompt(highlightType HighlightType) string {
	basePrompt := "You are an expert video editor and content strategist specializing in extracting the most compelling moments from customer testimonial videos for creating engaging clips, story modes, and social media content."

	switch highlightType {
	case HighlightTypeProblem:
		return basePrompt + `

PROBLEM/CHALLENGE MOMENTS EXPERTISE:
You excel at identifying moments where customers authentically describe their pain points, challenges, and frustrations before finding the solution. These moments are crucial for prospect education and problem awareness.

Focus on moments where customers talk about:
• Specific problems or challenges they were facing
• Pain points and frustrations with their previous situation  
• Failed attempts or struggles with other solutions
• Quantified impact of their problems (costs, time lost, missed opportunities)
• Urgent needs or critical situations that required solving
• Industry-specific challenges and obstacles
• Process inefficiencies or workflow problems
• Strategic challenges and business bottlenecks

Extract moments that make prospects think "That's exactly our problem too!"`

	case HighlightTypeSolution:
		return basePrompt + `

SOLUTION DISCOVERY MOMENTS EXPERTISE:
You specialize in identifying moments where customers describe how they found, evaluated, or chose your solution. These moments help prospects understand the decision-making process.

Focus on moments where customers explain:
• How they discovered or found your solution
• Why they chose you over competitors or alternatives
• Key features or capabilities that attracted them initially
• Decision-making process and evaluation criteria
• First impressions and initial experiences
• What convinced them to move forward with implementation
• Unique differentiators that stood out
• Trust factors and credibility indicators
• Onboarding or getting-started experiences

Extract moments that build confidence in the solution choice.`

	case HighlightTypeResults:
		return basePrompt + `

RESULTS AND OUTCOMES EXPERTISE:
You excel at extracting moments where customers describe specific results, achievements, and positive outcomes. These are the proof points that drive conversions.

Focus on moments where customers share:
• Specific results and achievements they've experienced
• Positive changes in their business or processes
• Goals that were met or exceeded
• Success stories and milestone achievements
• Improved performance or capabilities
• Time savings and efficiency gains
• Quality improvements and better outcomes
• Strategic advantages gained
• Customer satisfaction improvements
• Long-term sustained benefits

Extract moments that prove tangible value and ROI.`

	case HighlightTypeMetrics:
		return basePrompt + `

METRICS AND NUMBERS EXPERTISE:
You specialize in identifying moments where customers mention specific numbers, percentages, costs, or quantified improvements. These data points are crucial for business cases.

Focus on moments that include:
• Specific numerical improvements (percentages, dollar amounts, timeframes)
• ROI calculations and cost savings
• Revenue increases and profit improvements
• Time reductions and efficiency metrics
• Before/after statistical comparisons
• Performance benchmarks and KPI improvements
• User adoption rates and engagement metrics
• Productivity gains and output increases
• Error reductions and quality metrics
• Scale and volume improvements

Extract moments with hard numbers that CFOs and executives care about.`

	case HighlightTypeRecommendation:
		return basePrompt + `

RECOMMENDATION AND ENDORSEMENT EXPERTISE:
You excel at identifying powerful moments where customers directly recommend, endorse, or advocate for the solution. These are pure social proof gold.

Focus on moments where customers:
• Directly recommend the solution to others
• Express strong satisfaction and endorsement
• Compare favorably against competitors
• State they would choose again or continue using
• Advocate for the solution within their industry
• Provide strong testimonial statements
• Express loyalty and partnership value
• Share success with peers and colleagues
• Become reference customers or case studies
• Evangelize the solution publicly

Extract moments that convert skeptical prospects into believers.`

	case HighlightTypeBeforeAfter:
		return basePrompt + `

BEFORE/AFTER TRANSFORMATION EXPERTISE:
You specialize in extracting moments that show clear contrast between the customer's situation before and after using the solution.

Focus on moments that demonstrate:
• Clear before vs. after comparisons
• Transformation stories and journey narratives
• Process improvements and workflow changes
• Capability enhancements and new possibilities
• Cultural or organizational changes
• Strategic shifts enabled by the solution
• Evolution of their business or operations
• Journey milestones and breakthrough moments
• Turning points and pivotal changes
• Long-term transformation impact

Extract moments that tell a compelling transformation story.`

	case HighlightTypeEmotional:
		return basePrompt + `

EMOTIONAL MOMENTS EXPERTISE:
You excel at identifying genuine emotional expressions of satisfaction, excitement, relief, or gratitude from customers. These create the strongest human connections.

Focus on moments that showcase:
• Genuine excitement and enthusiasm about results
• Relief from solving major problems or pain points
• Surprise at exceeding expectations
• Gratitude for support and partnership
• Pride in achievements and accomplishments
• Confidence gained from the solution
• Authentic emotional reactions to positive outcomes
• Joy and satisfaction with the experience
• Trust and comfort with the relationship
• Passion and advocacy for the solution

Extract moments that create emotional resonance and trust.`

	default: // HighlightTypeGeneral
		return basePrompt + `

GENERAL HIGHLIGHT EXPERTISE:
You excel at identifying the most engaging, impactful, and shareable moments that showcase authentic customer experiences and drive overall business value.

Focus on moments that provide:
• High engagement potential across multiple platforms and audiences
• Strong emotional resonance combined with clear business value
• Authentic customer experiences with compelling storytelling elements
• Shareable moments with viral potential and broad appeal
• Professional credibility balanced with personal authenticity
• Clear value propositions with supporting evidence and examples
• Versatile content suitable for multiple marketing channels
• Balanced mix of rational and emotional appeal elements

Extract the most powerful moments regardless of category.`
	}
}

// Enhanced buildHighlightPrompt that uses all parameters effectively
func (s HighlightService) buildHighlightPrompt(text string, segments []models.TranscriptionSegment, customPrompt string, highlightType string, maxHighlights int) string {
	strippedSegments := s.stripWordsFromSegments(segments)
	segmentsJSON, _ := json.Marshal(strippedSegments)
	hasTimestamps := len(segments) > 0

	var customInstructions string
	if customPrompt != "" {
		customInstructions = fmt.Sprintf("\n\nADDITIONAL REQUIREMENTS:\n%s", customPrompt)
	}

	promptBase := fmt.Sprintf(`Extract the most impactful highlights from the following customer testimonial content.

CRITICAL TIMING AND TEXT REQUIREMENTS:
- Use EXACT start_time and end_time from the provided segments
- Use EXACT text from the segments - do not modify, paraphrase, or clean up the text
- Ensure your timing ranges correspond to actual segments in the transcript
- The text field must match exactly what appears in the segments for those times
- Each highlight must use complete words/sentences from the original segments%s

TESTIMONIAL CONTENT:
%s`, customInstructions, text)

	if hasTimestamps {
		promptBase += fmt.Sprintf(`

TRANSCRIPTION SEGMENTS WITH PRECISE TIMING:
%s

MANDATORY: Extract highlights using EXACT timing and text from these segments. Your start_time and end_time must correspond to actual segment boundaries, and your text must be exactly what appears in those segments.`, string(segmentsJSON))
	}

	promptBase += fmt.Sprintf(`

Extract exactly %d HIGH-VALUE segments with these requirements:

TIMING VALIDATION REQUIREMENTS:
- **USE EXACT SEGMENT TIMING** - start_time and end_time must match actual segment boundaries
- **NO TIME OVERLAPS** - Each highlight must have unique, non-overlapping time ranges
- **SEQUENTIAL ORDERING** - Arrange highlights chronologically
- **MINIMUM GAP** - Ensure at least 2-3 seconds between highlights

TEXT CONSISTENCY REQUIREMENTS:
- **EXACT TEXT EXTRACTION** - Use precisely the text that appears in the segments for your time range
- **NO PARAPHRASING** - Do not clean up, modify, or improve the original text
- **COMPLETE SENTENCES** - Ensure highlights contain complete thoughts from the segments
- **NATURAL BOUNDARIES** - End highlights at natural speech boundaries

Return a JSON array with this exact structure (ORDERED CHRONOLOGICALLY):
[
  {
    "text": "EXACT transcript text from the segments - no modifications",
    "theme": "Primary theme or topic of this highlight",
    "start_time": 0.0,
    "end_time": 0.0,
    "importance_score": 0.0,
    "highlight_type": "%s",
    "suggested_title": "Compelling title for video clip",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "emotional_intensity": 0.0,
    "shareability": 0.0
  }
]

FINAL VALIDATION:
- Verify each highlight's timing matches actual segments
- Confirm text is exactly what appears in those time ranges
- Ensure no overlapping time ranges
- Validate chronological ordering

Focus on extracting segments that provide immediate business value while maintaining perfect consistency between timing and text content.`, maxHighlights, highlightType)

	return promptBase
}

// Type-specific guidelines for different highlight types
func (s HighlightService) getTypeSpecificGuidelines(highlightType string) string {
	switch highlightType {
	case "problem":
		return `PROBLEM MOMENTS CRITERIA:
• Customer describing specific pain points or business challenges
• Mentions of inefficiencies, frustrations, or failed attempts
• Stories about what wasn't working in their previous situation
• Urgent needs or critical problems that required solving
• Quantified impact of problems (time lost, money wasted, missed opportunities)
• Industry-specific challenges and obstacles they faced
• Process bottlenecks or workflow issues they experienced
• Strategic challenges that were limiting growth
• Compliance or regulatory challenges they needed to address
• Competitive disadvantages they were experiencing

IDEAL MEANINGFUL MOMENTS (BALANCED APPROACH):

**Complete Stories (60-90 seconds):**
- "We were struggling with [specific problem] for months. We tried [attempts] but [what failed]. Then we found [solution] and within [timeframe], we [complete outcome]."

**Powerful Short Segments (15-45 seconds):**
- "This saved us $50,000 in the first month alone."
- "I would absolutely recommend this to anyone in our industry."
- "Our conversion rate went from 2% to 15% in just three months."
- "No other solution even came close to what they delivered."
- "It was honestly a game-changer for our entire operation."

**Metric Moments with Context (20-40 seconds):**
- "We went from processing 100 orders a day to over 500, and our error rate dropped to virtually zero."

**Emotional Reactions with Setup (25-50 seconds):**
- "When I saw the results for the first time, I couldn't believe it. We had been struggling with this for years."

SEGMENT STRUCTURE REQUIREMENTS:
- **For longer segments**: Must contain complete problem description with context and resolution
- **For shorter segments**: Must include enough context that viewers understand who is speaking and what they achieved
- **For metric segments**: Should include the baseline for comparison and timeframe for credibility
- **For emotional segments**: Need enough setup so viewers understand why the emotion is justified
- **For recommendation segments**: Should include context about the customer's credibility or situation`

	case "solution":
		return `SOLUTION DISCOVERY CRITERIA:
• How the customer found or discovered your solution
• Reasons why they chose you over competitors
• Key features or capabilities that attracted them initially
• Decision-making process and evaluation criteria
• First impressions and initial experiences with your solution
• What convinced them to move forward with implementation
• Unique differentiators that stood out from alternatives
• Trust factors and credibility indicators that influenced their choice
• Onboarding or getting-started experiences they had
• Early wins or quick victories they experienced

IDEAL MEANINGFUL MOMENTS:
- Complete decision stories: "We evaluated [competitors] and [process]. What convinced us was [detailed reasons]. The key differentiator was [specific factor] because [explanation]."
- Full evaluation process: "We needed [requirements] and tested [options]. They were the only ones who [unique capability]. The implementation was [experience] and [results]."
- Detailed reasoning: "Unlike other solutions that [limitations], this one [advantages]. We chose them because [complete reasoning] and [validation]."
- Comprehensive comparison: "We looked at [alternatives] but [issues with each]. The deciding factor was [detailed explanation] and [proof points]."
- Complete journey: "From our first conversation to implementation, [complete experience]. What stood out was [specifics] which [impact]."

SEGMENT STRUCTURE REQUIREMENTS:
- Must contain complete explanation of why they chose this solution
- Should include comparison context and decision criteria
- Must explain what made the difference in their evaluation process
- Needs specific examples of how the solution met their unique needs
- Should contain enough detail that prospects understand the value proposition`

	case "results":
		return `RESULTS AND OUTCOMES CRITERIA:
• Specific achievements and positive outcomes they experienced
• Goals that were met, exceeded, or surpassed
• Improvements in their business processes or operations
• Success stories and milestone achievements
• Enhanced capabilities or new possibilities enabled
• Quality improvements and better performance metrics
• Time savings and efficiency gains they realized
• Strategic advantages gained from the solution
• Customer satisfaction improvements they achieved
• Long-term sustained benefits and ongoing value

IDEAL MEANINGFUL MOMENTS:
- Complete success stories: "Since implementing [solution], we've achieved [specific results]. For example, [detailed case] which resulted in [outcomes]. Our team can now [new capabilities]."
- Detailed transformations: "The results have been incredible. We went from [baseline] to [current state]. This means [business impact] and [future possibilities]."
- Comprehensive outcomes: "We now achieve [specific goals] in [timeframe] instead of [old timeframe]. This has enabled us to [new opportunities] and [growth]."
- Full impact stories: "The improvement has been across [areas]. We've seen [specific changes] which has [cascading effects]. Our customers now [experience improvements]."
- Complete benefit explanation: "Beyond just [primary benefit], we've also gained [secondary benefits]. This has transformed [process/operations] and [strategic impact]."

SEGMENT STRUCTURE REQUIREMENTS:
- Must contain complete description of outcomes with specific examples
- Should include before/after context to show transformation magnitude
- Must explain the broader business impact beyond immediate results
- Needs concrete examples and specific achievements that are measurable
- Should contain enough detail that prospects can envision similar success`

	case "metrics":
		return `METRICS AND NUMBERS CRITERIA:
• Specific numerical improvements (percentages, dollar amounts, timeframes)
• ROI calculations, cost savings, or revenue increases
• Performance metrics and efficiency measurements
• Before/after statistical comparisons with exact figures
• Growth rates, conversion improvements, and optimization results
• User adoption rates and engagement statistics
• Productivity gains and output increases measured quantitatively
• Error reductions and quality metrics with specific numbers
• Time savings measured in hours, days, or weeks
• Scale improvements with volume or capacity numbers

IDEAL MOMENTS:
- "We saved $X per year..."
- "Efficiency improved by 40%..."
- "ROI was 300% in the first..."
- "We reduced processing time from X to Y..."
- "Our conversion rate went from X% to Y%..."`

	case "recommendation":
		return `RECOMMENDATION CRITERIA:
• Direct statements recommending your solution to others
• Strong endorsements and expressions of satisfaction
• Comparisons that favor your solution over alternatives
• Statements about choosing you again or continuing partnership
• Advocacy for your solution within their industry or network
• Testimonial statements and positive references they've provided
• Expressions of loyalty and long-term partnership value
• Public endorsements or case study participation
• Referrals they've made to other potential customers
• Speaking engagements or conference presentations about your solution

IDEAL MOMENTS:
- "I would absolutely recommend..."
- "We tell everyone about..."
- "If you're considering options..."
- "Don't hesitate to..."
- "They're the only ones who..."`

	case "before_after":
		return `BEFORE/AFTER TRANSFORMATION CRITERIA:
• Clear comparisons between their situation before and after
• Transformation stories showing journey from problem to success
• Process improvements and workflow changes they implemented
• Capability enhancements and new possibilities they gained
• Cultural or organizational changes that resulted
• Strategic shifts or new directions enabled by your solution
• Evolution of their business operations or customer experience
• Journey milestones and breakthrough moments they experienced
• Turning points and pivotal changes in their business
• Long-term transformation impact and sustained improvements

IDEAL MOMENTS:
- "Before, we used to... Now we..."
- "The transformation has been..."
- "We went from... to..."
- "It's night and day compared to..."
- "Our entire approach changed from..."`

	case "emotional":
		return `EMOTIONAL MOMENTS CRITERIA:
• Genuine expressions of excitement, satisfaction, or enthusiasm
• Relief expressed about solving major problems or challenges
• Surprise at exceeding expectations or unexpected benefits
• Gratitude for support, partnership, or exceptional service
• Pride in achievements and accomplishments they've made
• Confidence gained from using your solution successfully
• Authentic emotional reactions to positive outcomes or milestones
• Joy and satisfaction with the overall experience
• Trust and comfort expressed about the ongoing relationship
• Passion and advocacy when discussing the solution

IDEAL MOMENTS:
- Visible excitement when discussing results
- Emotional relief when describing problem resolution
- Genuine gratitude and appreciation
- Surprised delight at unexpected benefits
- Passionate advocacy and enthusiasm`

	default: // General
		return `GENERAL HIGHLIGHT CRITERIA:
• VALUABLE SEGMENTS that provide immediate impact - both complete stories and powerful moments
• Authentic customer experiences with SUBSTANTIAL CONTENT and specific details
• Clear value demonstration through comprehensive narratives OR impactful statements  
• Moments that work as standalone video clips with appropriate context for understanding
• Content that's quotable, memorable, and shareable - from detailed stories to punchy one-liners
• Strong combination of credibility and relatability with CONCRETE EXAMPLES
• Natural storytelling moments OR powerful individual insights that drive engagement
• Balanced mix of comprehensive explanations and impactful sound bites
• Professional credibility paired with authentic, detailed personal experiences
• Versatile content suitable for multiple marketing channels with IMMEDIATE IMPACT

MEANINGFUL SEGMENT REQUIREMENTS:
- Complete customer journeys with natural story progression (60-90 seconds)
- Powerful standalone statements with enough context to understand impact (15-45 seconds)
- Authentic emotional reactions with setup that justifies the emotion (25-50 seconds)
- Key metrics and outcomes with comparison baselines for credibility (20-40 seconds)
- Strong recommendations with customer credibility indicators (20-60 seconds)`
	}
}

// Convenience methods for easy access to specific highlight types
func (s HighlightService) ExtractProblemHighlights(ctx context.Context, maxHighlights int) ([]*pb.HighlightMoment, error) {
	request := HighlightRequest{
		MaxHighlights: maxHighlights,
		HighlightType: HighlightTypeProblem,
	}
	return s.ExtractHighlightsByType(ctx, request)
}

func (s HighlightService) ExtractSolutionHighlights(ctx context.Context, maxHighlights int) ([]*pb.HighlightMoment, error) {
	request := HighlightRequest{
		MaxHighlights: maxHighlights,
		HighlightType: HighlightTypeSolution,
	}
	return s.ExtractHighlightsByType(ctx, request)
}

func (s HighlightService) ExtractResultsHighlights(ctx context.Context, maxHighlights int) ([]*pb.HighlightMoment, error) {
	request := HighlightRequest{
		MaxHighlights: maxHighlights,
		HighlightType: HighlightTypeResults,
	}
	return s.ExtractHighlightsByType(ctx, request)
}

func (s HighlightService) ExtractMetricsHighlights(ctx context.Context, maxHighlights int) ([]*pb.HighlightMoment, error) {
	request := HighlightRequest{
		MaxHighlights: maxHighlights,
		HighlightType: HighlightTypeMetrics,
	}
	return s.ExtractHighlightsByType(ctx, request)
}

func (s HighlightService) ExtractRecommendationHighlights(ctx context.Context, maxHighlights int) ([]*pb.HighlightMoment, error) {
	request := HighlightRequest{
		MaxHighlights: maxHighlights,
		HighlightType: HighlightTypeRecommendation,
	}
	return s.ExtractHighlightsByType(ctx, request)
}

func (s HighlightService) ExtractEmotionalHighlights(ctx context.Context, maxHighlights int) ([]*pb.HighlightMoment, error) {
	request := HighlightRequest{
		MaxHighlights: maxHighlights,
		HighlightType: HighlightTypeEmotional,
	}
	return s.ExtractHighlightsByType(ctx, request)
}

func (s HighlightService) ExtractBeforeAfterHighlights(ctx context.Context, maxHighlights int) ([]*pb.HighlightMoment, error) {
	request := HighlightRequest{
		MaxHighlights: maxHighlights,
		HighlightType: HighlightTypeBeforeAfter,
	}
	return s.ExtractHighlightsByType(ctx, request)
}
