package ai

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
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
	MaxHighlights int                           `json:"max_highlights,omitempty"` // Optional, 0 means extract all valuable highlights
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
	EngagementScore    float64  `json:"engagement_score"`
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

	systemPrompt := `You are an expert video content strategist and testimonial analyst with deep expertise in B2B and B2C marketing. Your specialty is extracting HIGH-VALUE standalone video clips from customer testimonials that perfectly communicate without any surrounding context.

# ROLE
You are a professional video story curator tasked with identifying ALL business-critical, standalone highlight clips that accomplish maximum impact and clarity.

# TASK
Extract ALL COMPLETE, SELF-CONTAINED highlights meeting ALL the criteria below. Quality over quantity — extract every valuable moment, but only if it meets all quality standards.

# CRITICAL DURATION GUIDANCE
- TARGET: 8-20 seconds (SWEET SPOT for social media and marketing)
- WORD COUNT: Aim for 40-80 words (typical speech is ~150 words/minute = 2.5 words/second)
- MINIMUM: Never go below 8 seconds (too short to convey complete value)
- MAXIMUM: Never exceed 25 seconds (attention span limit for social media)
- QUALITY CHECK: If your highlight feels incomplete under 20s, you picked the wrong segment — find a more concise moment

# DURATION CALCULATION STRATEGY
1. Count words in your selected text
2. Estimate duration: word_count / 2.5 = seconds
3. If >60 words (>24s), trim to most impactful sentence cluster
4. If <40 words (<16s), check if it's truly complete — if not, find better moment
5. AVOID spanning multiple distant transcript segments (creates timing issues)

# COMMON CORE PRINCIPLES for EVERY HIGHLIGHT
- Complete narrative arc: clear context (who, what), core insight, and concluding resolution.
- Zero external context: no unexplained pronouns or references.
- Natural sentence boundaries: start and end at fully formed sentences.
- Duration: STRICTLY 8-20 seconds. Discard clips under 8s or above 25s.
- Use verbatim transcript text: no paraphrasing, no text edits.
- Viewer clarity test: if shown to someone with zero previous context, the clip must be fully understandable with evident message and significance.
- Single contiguous segment: Prefer highlights from a single transcript segment or closely adjacent segments (avoid large time gaps)

# BUSINESS VALUE PRIORITIES (ranked)
1. Quantified measurable results WITH context (numbers, baselines, timeframes).
2. Complete recommendations WITH reasons.
3. Problem-solution narratives WITH clear outcomes.
4. Credibility and authority WITH relevant background.
5. Authentic emotional expressions WITH contextual setup.
6. Competitive differentiation based on explicit comparisons.

# VALIDATION CHECKLIST (APPLY BEFORE OUTPUT)
- Duration is within 8–20 seconds (word count / 2.5 should be in 8-20 range).
- Word count is 40-80 words (optimal for duration targeting).
- Clip has no mid-sentence starts or ends.
- No dangling conjunctions ("and", "but", "so") at start or end.
- All pronouns or references are clearly explained.
- Text matches exactly what appears in the transcript.
- No overlapping or duplicated time ranges.
- Clip fully stands alone with clear message and narrative arc.
- Output clips are ordered chronologically.
- Highlight uses contiguous text from transcript (no large gaps).

IMPORTANT: For every highlight object include numeric values for
"importance_score", "emotional_intensity", "shareability", "engagement_score" as decimals between 0.0 and 1.0.
If you cannot estimate a number, choose a conservative default 0.5 rather than omitting the field.
Also ensure start_time and end_time align with the transcript segment boundaries. If a single highlight spans parts of multiple segments, choose start_time at the first segment's start and end_time at the last segment's end.

# OUTPUT FORMAT (STRICTLY FOLLOW)
Return ONLY a JSON array of highlight objects with this EXACT schema:

[
  {
    "text": "Exact transcript segment text here",
    "theme": "Primary theme/subject of the highlight",
    "start_time": float,
    "end_time": float,
    "importance_score": float (0 to 1),
    "highlight_type": "the highlight category",
    "suggested_title": "Concise, compelling title",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "emotional_intensity": float (0 to 1),
    "shareability": float (0 to 1),
    "engagement_score": float (0 to 1)
  }
]

# EXAMPLES

VALID EXAMPLE (Good Duration - 13.5s, ~54 words):
{
  "text": "After implementing the new system, our error rate dropped from 15 percent to under 1 percent, saving 20 hours weekly. The team was skeptical at first, but within two weeks, everyone was onboard because the results were undeniable.",
  "start_time": 45.0,
  "end_time": 58.5,
  "importance_score": 0.9,
  "highlight_type": "results",
  "suggested_title": "Dramatic Error Rate Reduction",
  "keywords": ["error reduction", "efficiency", "automation"],
  "emotional_intensity": 0.7,
  "shareability": 0.8,
  "engagement_score": 0.85
}

INVALID EXAMPLE (Too Long - would be ~40s):
{
  "text": "We had all these problems... and then we tried various solutions... eventually we found this product... it took a while to implement... but after several months of testing and refinement, we finally saw some improvements in our workflow and our team started to adopt it more regularly.",
  "reason": "Way too long (>100 words), rambling, lacks focus. Split into 2-3 concise highlights instead."
}

INVALID EXAMPLE (Too Short - would be ~4s):
{
  "text": "It was great.",
  "reason": "Too short, lacks context and completeness."
}

INVALID EXAMPLE (Mid-sentence start):
{
  "text": "because we needed a better tool for managing our customer data",
  "reason": "Starts mid-sentence with 'because', lacks subject/context."
}

# THINK-THEN-GENERATE INSTRUCTIONS
1. Carefully analyze the testimonial content and all transcript segments.
2. Identify candidate highlights meeting all core principles and priorities.
3. For each candidate: COUNT WORDS and ESTIMATE DURATION (words / 2.5)
4. Adjust selection to hit 40-80 word range (8-20 seconds)
5. Validate each candidate against the checklist above.
6. Only output fully compliant highlights in JSON format.
7. Do NOT include explanations, commentary, or partial clips outside the array.

# SAFETY NOTE
Do not output any speculative, biased, or unrelated information. Stay factual and business-relevant.

Extract well-crafted, meaningful standalone clips that maximize persuasion and clarity for marketing and sales use.
`

	maxHighlights := 0 // 0 means extract all valuable highlights
	prompt := s.buildHighlightPrompt(textOrTranscript, segments, customPrompt, "general", maxHighlights)

	response, err := s.aiClient.Complete(ctx, prompt, systemPrompt)
	if err != nil {
		return nil, fmt.Errorf("highlight extraction failed: %w", err)
	}

	// Clean AI response to remove markdown code blocks if present
	cleanedResponse := utils.CleanAIJSONResponse(response)

	// Parse AI response into highlights without words
	var highlightsResponse []HighlightWithWords
	if err := json.Unmarshal([]byte(cleanedResponse), &highlightsResponse); err != nil {
		return nil, fmt.Errorf("failed to parse highlights response: %w", err)
	}

	// Convert to pb.HighlightMoment WITH word-level timing, then filter
	// CRITICAL: We must add words FIRST, then filter, because word timing may differ from LLM timing

	// First, create temp highlights from LLM response
	tempHighlights := make([]*pb.HighlightMoment, 0, len(highlightsResponse))
	for _, h := range highlightsResponse {
		tempHighlights = append(tempHighlights, &pb.HighlightMoment{
			Id:                 uuid.NewString(),
			Text:               h.Text,
			Theme:              h.Theme,
			StartTime:          h.StartTime,
			EndTime:            h.EndTime,
			ImportanceScore:    h.ImportanceScore,
			HighlightType:      "general",
			SuggestedTitle:     h.SuggestedTitle,
			Keywords:           h.Keywords,
			EmotionalIntensity: h.EmotionalIntensity,
			Shareability:       h.Shareability,
			EngagementScore:    h.EngagementScore,
		})
	}

	// Add words to get FINAL accurate timing and text
	highlightsWithWords := s.addWordsToHighlights(tempHighlights, segments)

	// Apply quality filters and scoring on FINAL highlights (after word adjustment)
	pbHighlights := s.filterAndScoreHighlights(highlightsWithWords)

	// Cache the filtered highlights
	s.cacheService.Set(ctx, cacheKey, pbHighlights, 2*time.Hour)

	return pbHighlights, nil
}

// calculateBusinessValueScoreFromHighlight calculates score from pb.HighlightMoment
// IMPORTANT: Expects duration in MILLISECONDS
func (s HighlightService) calculateBusinessValueScoreFromHighlight(h *pb.HighlightMoment) float64 {
	durationMs := h.EndTime - h.StartTime
	duration := durationMs / 1000.0 // Convert to seconds for scoring

	// Weighted composite score emphasizing business value and completeness
	const (
		importanceWeight      = 0.25
		engagementWeight      = 0.20
		shareabilityWeight    = 0.15
		emotionalWeight       = 0.10
		keywordWeight         = 0.10
		durationOptimalWeight = 0.05
		completenessWeight    = 0.15
	)

	// Base scores
	importanceScore := h.ImportanceScore
	engagementScore := h.EngagementScore
	shareabilityScore := h.Shareability
	emotionalScore := h.EmotionalIntensity

	// Keyword quality score
	keywordScore := s.calculateKeywordValueScore(h.Keywords, h.Text)

	// Duration optimization - favor concise, punchy clips
	var durationScore float64
	if duration >= 8.0 && duration <= 20.0 {
		durationScore = 1.0 // Optimal - punchy and complete
	} else if duration >= 5.0 && duration < 8.0 {
		durationScore = 0.8 // Slightly short but acceptable
	} else if duration > 20.0 && duration <= 30.0 {
		durationScore = 0.7 // Getting long, needs exceptional value
	} else if duration > 30.0 && duration <= 35.0 {
		durationScore = 0.5 // Too long, only if absolutely necessary
	} else {
		durationScore = 0.3 // Far from optimal range
	}

	// Completeness score
	completenessScore := s.calculateCompletenessScore(h.Text, duration)

	// Calculate weighted composite
	compositeScore := (importanceScore * importanceWeight) +
		(engagementScore * engagementWeight) +
		(shareabilityScore * shareabilityWeight) +
		(emotionalScore * emotionalWeight) +
		(keywordScore * keywordWeight) +
		(durationScore * durationOptimalWeight) +
		(completenessScore * completenessWeight)

	if compositeScore > 1.0 {
		compositeScore = 1.0
	}
	if compositeScore < 0.0 {
		compositeScore = 0.0
	}

	return compositeScore
}

// defaultHighlightFields fills sensible defaults when the LLM did not provide numeric fields.
func (s HighlightService) defaultHighlightFields(h *HighlightWithWords) {
	// If model didn't provide importance/engagement, use conservative mid-values
	if h.ImportanceScore <= 0.0 {
		h.ImportanceScore = 0.45 // helps survive initial threshold; tune as needed
	}
	if h.EngagementScore <= 0.0 {
		h.EngagementScore = 0.4
	}
	if h.Shareability <= 0.0 {
		h.Shareability = 0.35
	}
	if h.EmotionalIntensity <= 0.0 {
		h.EmotionalIntensity = 0.25
	}
	// Ensure suggested title present
	if strings.TrimSpace(h.SuggestedTitle) == "" {
		// Derive a short title from first 6–8 words
		words := strings.Fields(h.Text)
		limit := 6
		if len(words) < limit {
			limit = len(words)
		}
		h.SuggestedTitle = strings.Join(words[:limit], " ")
	}
}

// filterAndScoreHighlights uses a graduated tiered approach to preserve valuable highlights
// while filtering out truly problematic ones.
// IMPORTANT: All durations are in MILLISECONDS
func (s *HighlightService) filterAndScoreHighlights(
	highlights []*pb.HighlightMoment,
) []*pb.HighlightMoment {

	filtered := make([]*pb.HighlightMoment, 0, len(highlights))

	for _, h := range highlights {
		if h == nil {
			continue
		}

		durMs := h.EndTime - h.StartTime // Duration in milliseconds
		txt := strings.TrimSpace(h.Text)
		durSec := durMs / 1000.0 // Convert to seconds for scoring functions

		// TIER 1: Premium highlights (8-20s, high quality) - Keep unconditionally
		if durMs >= 8000.0 && durMs <= 20000.0 && h.ImportanceScore >= 0.5 && h.EngagementScore >= 0.4 {
			filtered = append(filtered, h)
			continue
		}

		// TIER 2: Good highlights (5-25s, decent quality) - Keep with validation
		if durMs >= 5000.0 && durMs <= 25000.0 {
			comp := s.calculateCompletenessScore(txt, durSec)
			kw := s.calculateKeywordValueScore(h.Keywords, txt)
			val := s.calculateBusinessValueScoreFromHighlight(h)

			// Keep if any of these conditions are met:
			// - High completeness (well-formed narrative)
			// - Good keyword value (contains business terms)
			// - Decent business value score
			// - In sweet spot duration with moderate scores
			if comp >= 0.55 || kw >= 0.4 || val >= 0.45 ||
				(durMs >= 8000.0 && durMs <= 20000.0 && comp >= 0.45) {
				// Ensure minimum text length for substance
				if len(txt) >= 30 {
					filtered = append(filtered, h)
					continue
				}
			}
		}

		// TIER 3: Borderline highlights - Reject unless exceptional
		// These need BOTH good completeness AND good keywords/value
		if durMs >= 5000.0 && durMs <= 30000.0 {
			comp := s.calculateCompletenessScore(txt, durSec)
			kw := s.calculateKeywordValueScore(h.Keywords, txt)

			if comp >= 0.6 && kw >= 0.45 && len(txt) >= 40 {
				filtered = append(filtered, h)
				continue
			}
		}

		// TIER 4: Reject - Duration too far outside acceptable range OR
		// quality too low across all metrics
		// Highlights that reach here are filtered out
	}

	// Remove duplicates and overlaps from the filtered list
	return s.removeDuplicatesAndOverlaps(filtered)
}

// removeDuplicatesAndOverlaps ensures no duplicate or overlapping highlights
func (s *HighlightService) removeDuplicatesAndOverlaps(
	highlights []*pb.HighlightMoment,
) []*pb.HighlightMoment {

	if len(highlights) == 0 {
		return highlights
	}

	sort.SliceStable(highlights, func(i, j int) bool {
		return highlights[i].StartTime < highlights[j].StartTime
	})

	deduped := make([]*pb.HighlightMoment, 0, len(highlights))

	for _, cur := range highlights {
		if cur == nil {
			continue
		}
		overlapFound := false

		for i, exist := range deduped {
			overlap := s.calculateOverlap(
				exist.StartTime, exist.EndTime, cur.StartTime, cur.EndTime,
			)

			// Merge only when they overlap ≥50% of shorter segment
			shorter := math.Min(exist.EndTime-exist.StartTime, cur.EndTime-cur.StartTime)
			if overlap/shorter >= 0.5 {
				overlapFound = true
				// Replace weaker importance
				if cur.ImportanceScore > exist.ImportanceScore {
					deduped[i] = cur
				}
				break
			}
		}

		if !overlapFound {
			deduped = append(deduped, cur)
		}
	}

	return deduped
}

// calculateOverlap returns the overlap duration between two time ranges
func (s HighlightService) calculateOverlap(start1, end1, start2, end2 float64) float64 {
	// No overlap if one range ends before the other starts
	if end1 <= start2 || end2 <= start1 {
		return 0.0
	}

	// Calculate overlap
	overlapStart := start1
	if start2 > start1 {
		overlapStart = start2
	}

	overlapEnd := end1
	if end2 < end1 {
		overlapEnd = end2
	}

	return overlapEnd - overlapStart
}

// calculateCompletenessScore validates that a highlight contains a complete thought
func (s HighlightService) calculateCompletenessScore(text string, duration float64) float64 {
	trimmedText := strings.TrimSpace(text)
	if len(trimmedText) == 0 {
		return 0.0
	}

	// Guard against invalid duration
	if duration <= 0 {
		return 0.0
	}

	score := 1.0

	// 1. STRICTER: Check for sentence completeness (ends with proper punctuation)
	lastChar := trimmedText[len(trimmedText)-1]
	if lastChar != '.' && lastChar != '!' && lastChar != '?' {
		score -= 0.4 // INCREASED penalty for incomplete sentence
	}

	// 2. STRICTER: Check for sentence fragments (starts with lowercase or connecting words)
	words := strings.Fields(trimmedText)
	if len(words) == 0 {
		return 0.0 // Safety check - should not happen but prevents panic
	}

	firstWord := strings.ToLower(words[0])
	// EXPANDED fragment indicators
	fragmentIndicators := []string{
		"and", "but", "or", "so", "because", "since", "while", "when", "if", "though", "although",
		"then", "also", "however", "moreover", "furthermore", "therefore", "thus", "hence",
	}
	for _, indicator := range fragmentIndicators {
		if firstWord == indicator {
			score -= 0.3 // INCREASED penalty for starting mid-thought
			break
		}
	}

	// 3. Check text-to-duration ratio (ensures substance, not just filler)
	wordCount := len(words)
	wordsPerSecond := float64(wordCount) / duration
	if wordsPerSecond < 1.5 {
		score -= 0.3 // INCREASED penalty - too slow/sparse likely means missing content
	} else if wordsPerSecond > 4.5 {
		score -= 0.2 // INCREASED penalty - too fast might be incomplete or rushed
	}

	// 4. STRICTER: Word count requirements for standalone clips
	if wordCount < 15 {
		score -= 0.4 // MUCH stricter - too short to be complete standalone thought
	} else if wordCount < 20 {
		score -= 0.2 // Borderline short for standalone quality
	} else if wordCount < 25 {
		score -= 0.1 // Slightly short but acceptable
	}

	// 5. Check for narrative indicators (context words suggest complete story)
	narrativeIndicators := map[string]bool{
		"we": true, "our": true, "i": true, "my": true, "me": true, // Personal context
		"was": true, "were": true, "had": true, "been": true, "did": true, // Past context (setup)
		"now": true, "today": true, "currently": true, "since": true, // Current state (resolution)
		"from": true, "to": true, "after": true, "before": true, "when": true, // Transformation indicators
	}

	narrativeCount := 0

	// Split by word boundaries (spaces and punctuation) for accurate matching
	for _, word := range words {
		// Remove common punctuation from word for matching
		cleanWord := strings.ToLower(strings.Trim(word, ".,!?;:\"'"))
		if narrativeIndicators[cleanWord] {
			narrativeCount++
		}
	}

	if narrativeCount >= 3 {
		score += 0.15 // INCREASED bonus for strong narrative structure
	}

	// 6. NEW: Penalize ellipsis or trailing incomplete indicators
	if strings.Contains(trimmedText, "...") || strings.Contains(trimmedText, "…") {
		score -= 0.3 // Strong penalty for explicit incompleteness
	}

	// 7. NEW: Check for complete sentence structure indicators
	textLower := strings.ToLower(trimmedText)
	hasSubject := strings.Contains(textLower, " i ") || strings.Contains(textLower, " we ") ||
		strings.Contains(textLower, " they ") || strings.Contains(textLower, " it ") ||
		strings.Contains(textLower, " he ") || strings.Contains(textLower, " she ")

	hasVerb := strings.Contains(textLower, " was ") || strings.Contains(textLower, " were ") ||
		strings.Contains(textLower, " have ") || strings.Contains(textLower, " had ") ||
		strings.Contains(textLower, " can ") || strings.Contains(textLower, " did ") ||
		strings.Contains(textLower, " will ") || strings.Contains(textLower, " would ")

	if hasSubject && hasVerb {
		score += 0.1 // Bonus for having subject + verb structure
	}

	// Ensure score is between 0 and 1
	if score > 1.0 {
		score = 1.0
	}
	if score < 0.0 {
		score = 0.0
	}

	return score
}

// calculateKeywordValueScore assigns value based on presence of high-ROI keywords
func (s HighlightService) calculateKeywordValueScore(keywords []string, text string) float64 {
	// High-value keyword categories with weights
	highValueKeywords := map[string]float64{
		// Quantifiable results (highest value)
		"roi": 1.0, "revenue": 1.0, "profit": 1.0, "savings": 1.0, "growth": 0.9,
		"increase": 0.9, "decrease": 0.9, "reduce": 0.9, "improve": 0.8,
		"%": 1.0, "$": 1.0, "percent": 1.0, "dollar": 1.0,

		// Time and efficiency
		"faster": 0.8, "quicker": 0.8, "time": 0.7, "efficiency": 0.8, "productivity": 0.8,
		"automated": 0.8, "streamline": 0.8,

		// Recommendations and endorsements
		"recommend": 1.0, "definitely": 0.9, "absolutely": 0.9, "best": 0.9,
		"game-changer": 1.0, "game changer": 1.0, "transformative": 0.9,

		// Problem-solution indicators
		"problem": 0.7, "challenge": 0.7, "solution": 0.8, "solved": 0.8,
		"before": 0.7, "after": 0.7, "struggled": 0.7, "now": 0.6,

		// Competitive differentiation
		"only": 0.8, "competitor": 0.8, "alternative": 0.7, "compared": 0.7,
		"better": 0.8, "superior": 0.8, "exceeded": 0.9,
	}

	var totalValue float64
	var matchCount int

	// Check keywords
	textLower := strings.ToLower(text)
	for _, keyword := range keywords {
		keywordLower := strings.ToLower(keyword)
		if value, found := highValueKeywords[keywordLower]; found {
			totalValue += value
			matchCount++
		}
	}

	// Also scan text for high-value terms not in keywords
	for term, value := range highValueKeywords {
		if strings.Contains(textLower, term) {
			totalValue += value * 0.5 // Half weight for non-keyword matches
		}
	}

	// Normalize score
	if matchCount > 0 {
		return totalValue / float64(matchCount+5) // Normalize to 0-1 range
	}

	return 0.3 // Base score if no high-value keywords found
}

func (s HighlightService) ExtractHighlightsByType(ctx context.Context, request HighlightRequest) ([]*pb.HighlightMoment, error) {

	// Get testimonial content
	testimonial, err := s.testimonialRepo.FetchByID(ctx, request.TestimonialID, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get testimonial: %s", err)
	}

	if testimonial.Content == nil || *testimonial.Content == "" {
		return nil, fmt.Errorf("testimonial has no content for highlight extraction")
	}

	// Convert transcript segments for highlight service
	request.Segments = *testimonial.TranscriptSegments
	request.Text = *testimonial.Content

	// MaxHighlights: 0 means extract all valuable highlights (don't set a limit)
	// Only set a specific number if user explicitly provided one
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

	// Clean AI response to remove markdown code blocks if present
	cleanedResponse := utils.CleanAIJSONResponse(response)

	var highlightsResponse []HighlightWithWords
	if err := json.Unmarshal([]byte(cleanedResponse), &highlightsResponse); err != nil {
		return nil, fmt.Errorf("failed to parse highlights response: %w", err)
	}

	// Log LLM extraction results (LLM returns seconds)
	fmt.Printf("🤖 LLM extracted %d highlights (type: %s)\n", len(highlightsResponse), request.HighlightType)
	for i, h := range highlightsResponse {
		dur := h.EndTime - h.StartTime // This is in seconds from LLM
		wordCount := len(strings.Fields(h.Text))
		fmt.Printf("   [%d] Duration: %.1fs, Words: %d, Importance: %.2f, Text preview: %.60s...\n",
			i+1, dur, wordCount, h.ImportanceScore, h.Text)
	}

	// Convert to pb.HighlightMoment WITH word-level timing, then filter - same as ExtractHighlights
	// CRITICAL: Add words FIRST, then filter on FINAL timing

	// First, create temp highlights from LLM response
	// CRITICAL: Convert LLM timestamps from seconds to milliseconds to match Word timestamps
	tempHighlights := make([]*pb.HighlightMoment, 0, len(highlightsResponse))
	for _, h := range highlightsResponse {
		tempHighlights = append(tempHighlights, &pb.HighlightMoment{
			Id:                 uuid.NewString(),
			Text:               h.Text,
			Theme:              h.Theme,
			StartTime:          h.StartTime * 1000.0, // Convert seconds to milliseconds
			EndTime:            h.EndTime * 1000.0,   // Convert seconds to milliseconds
			ImportanceScore:    h.ImportanceScore,
			HighlightType:      string(request.HighlightType),
			SuggestedTitle:     h.SuggestedTitle,
			Keywords:           h.Keywords,
			EmotionalIntensity: h.EmotionalIntensity,
			Shareability:       h.Shareability,
			EngagementScore:    h.EngagementScore,
		})
	}

	// Add words to get FINAL accurate timing and text
	fmt.Printf("🔧 Applying word-level timing adjustment to %d highlights...\n", len(tempHighlights))
	highlightsWithWords := s.addWordsToHighlights(tempHighlights, request.Segments)

	// Log duration changes after word alignment (convert milliseconds to seconds for display)
	fmt.Printf("📏 After word-level timing adjustment:\n")
	for i, h := range highlightsWithWords {
		durMs := h.EndTime - h.StartTime                                         // In milliseconds
		originalDurMs := tempHighlights[i].EndTime - tempHighlights[i].StartTime // In milliseconds
		changeMs := durMs - originalDurMs

		// Convert to seconds for display
		dur := durMs / 1000.0
		originalDur := originalDurMs / 1000.0
		change := changeMs / 1000.0

		status := "✓"
		if dur < 5.0 {
			status = "⚠️ TOO SHORT"
		} else if dur > 25.0 {
			status = "⚠️ TOO LONG"
		} else if dur < 8.0 || dur > 20.0 {
			status = "⚡ BORDERLINE"
		}
		fmt.Printf("   [%d] LLM: %.1fs → Actual: %.1fs (change: %+.1fs) %s\n",
			i+1, originalDur, dur, change, status)
	}

	// Apply quality filters and scoring on FINAL highlights (after word adjustment)
	fmt.Printf("🔍 Applying graduated filtering to %d highlights...\n", len(highlightsWithWords))
	pbHighlights := s.filterAndScoreHighlights(highlightsWithWords)

	fmt.Printf("✅ Final result: %d/%d highlights passed filtering (%.1f%% retention)\n",
		len(pbHighlights), len(highlightsResponse),
		float64(len(pbHighlights))/float64(len(highlightsResponse))*100.0)

	s.cacheService.Set(ctx, cacheKey, pbHighlights, 2*time.Hour)
	return pbHighlights, nil
}

// stripWordsFromSegments creates a copy of segments without the Words field to save tokens
// CRITICAL: Converts timestamps from milliseconds to seconds for LLM
func (s HighlightService) stripWordsFromSegments(segments []models.TranscriptionSegment) []TranscriptionSegmentStripped {
	strippedSegments := make([]TranscriptionSegmentStripped, len(segments))
	for i, segment := range segments {
		strippedSegments[i] = TranscriptionSegmentStripped{
			Text:      segment.Text,
			StartTime: segment.StartTime / 1000.0, // Convert milliseconds to seconds
			EndTime:   segment.EndTime / 1000.0,   // Convert milliseconds to seconds
			Speaker:   segment.Speaker,
		}
	}
	return strippedSegments
}

// addWordsToHighlights attaches transcript words to highlights and intelligently adjusts boundaries.
func (s *HighlightService) addWordsToHighlights(
	highlights []*pb.HighlightMoment,
	originalSegments []models.TranscriptionSegment,
) []*pb.HighlightMoment {

	// Flatten all word data for lookup.
	var allWords []models.Word
	for _, seg := range originalSegments {
		allWords = append(allWords, seg.Words...)
	}

	// Process highlights safely using pointers.
	result := make([]*pb.HighlightMoment, 0, len(highlights))
	for _, h := range highlights {
		if h == nil {
			continue
		}

		// Clone fields manually (not by copy)
		nh := &pb.HighlightMoment{
			Id:                 h.Id,
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
			EngagementScore:    h.EngagementScore,
		}

		if h.StartTime > 0 && h.EndTime > h.StartTime {
			words := s.findWordsInTimeRange(h.StartTime, h.EndTime, allWords)
			if len(words) == 0 {
				// Try small tolerance windows (+/- 0.5s, 1.0s)
				tolerances := []float64{0.5, 1.0, 2.0}
				for _, tol := range tolerances {
					words = s.findWordsInTimeRange(h.StartTime-tol, h.EndTime+tol, allWords)
					if len(words) > 0 {
						break
					}
				}
			}

			if len(words) == 0 && strings.TrimSpace(h.Text) != "" {
				words = s.findWordsByTextSnippet(h.Text, allWords)
			}

			if len(words) > 0 {
				nh.Text = s.reconstructTextFromWords(words)
				nh.StartTime = words[0].Start
				nh.EndTime = words[len(words)-1].End
				nh.Words = s.convertWordsToProto(words)

				// CRITICAL: Apply smart boundary adjustment if duration is problematic
				durationMs := nh.EndTime - nh.StartTime // In milliseconds
				if durationMs < 8000.0 || durationMs > 25000.0 {
					adjusted := s.smartAdjustHighlightBoundaries(nh, allWords)
					if adjusted != nil {
						nh = adjusted
					}
				}
			}
		}

		result = append(result, nh)
	}

	return result
}

// smartAdjustHighlightBoundaries intelligently adjusts highlight boundaries to hit target duration
// while preserving narrative completeness and sentence boundaries.
// IMPORTANT: Expects durations in MILLISECONDS
func (s *HighlightService) smartAdjustHighlightBoundaries(
	h *pb.HighlightMoment,
	allWords []models.Word,
) *pb.HighlightMoment {

	durationMs := h.EndTime - h.StartTime

	// Perfect duration - no adjustment needed (8-20s)
	if durationMs >= 8000.0 && durationMs <= 20000.0 {
		return h
	}

	// Too long - trim to sentence boundaries (20-35s)
	if durationMs > 20000.0 && durationMs <= 35000.0 {
		adjusted := s.trimToSentenceBoundaries(h, allWords, 20000.0, 25000.0)
		if adjusted != nil {
			return adjusted
		}
	}

	// Too short - expand to include context (3-8s)
	if durationMs < 8000.0 && durationMs > 3000.0 {
		adjusted := s.expandToCompleteSentences(h, allWords, 8000.0, 20000.0)
		if adjusted != nil {
			return adjusted
		}
	}

	// If we can't fix it, return original
	return h
}

// trimToSentenceBoundaries trims a highlight to fit within target duration while preserving sentence boundaries
func (s *HighlightService) trimToSentenceBoundaries(
	h *pb.HighlightMoment,
	allWords []models.Word,
	minTarget float64,
	maxTarget float64,
) *pb.HighlightMoment {

	if len(h.Words) == 0 {
		return nil
	}

	// Find sentence boundaries (periods, exclamation marks, question marks)
	sentenceBoundaries := []int{0} // Start with first word
	for i, word := range h.Words {
		text := strings.TrimSpace(word.Text)
		if len(text) > 0 {
			lastChar := text[len(text)-1]
			if lastChar == '.' || lastChar == '!' || lastChar == '?' {
				sentenceBoundaries = append(sentenceBoundaries, i+1)
			}
		}
	}

	// If no sentence boundaries found, can't safely trim
	if len(sentenceBoundaries) < 2 {
		return nil
	}

	// Try different sentence combinations to find best fit
	bestFit := (*pb.HighlightMoment)(nil)
	bestScore := 0.0

	for i := 0; i < len(sentenceBoundaries)-1; i++ {
		for j := i + 1; j < len(sentenceBoundaries); j++ {
			startIdx := sentenceBoundaries[i]
			endIdx := sentenceBoundaries[j]

			if endIdx > len(h.Words) {
				endIdx = len(h.Words)
			}

			wordSlice := h.Words[startIdx:endIdx]
			if len(wordSlice) == 0 {
				continue
			}

			duration := wordSlice[len(wordSlice)-1].End - wordSlice[0].Start

			// Check if this duration fits our target (duration is in milliseconds)
			if duration >= minTarget && duration <= maxTarget {
				// Score based on how close to optimal (14s) and completeness
				durationSec := duration / 1000.0 // Convert to seconds for scoring
				completeness := s.calculateCompletenessScore(s.reconstructTextFromProtoWords(wordSlice), durationSec)
				optimalityScore := 1.0 - math.Abs(durationSec-14.0)/14.0 // Closer to 14s = better
				score := (completeness * 0.7) + (optimalityScore * 0.3)

				if score > bestScore {
					bestScore = score
					bestFit = &pb.HighlightMoment{
						Id:                 h.Id,
						Text:               s.reconstructTextFromProtoWords(wordSlice),
						Theme:              h.Theme,
						StartTime:          wordSlice[0].Start,
						EndTime:            wordSlice[len(wordSlice)-1].End,
						ImportanceScore:    h.ImportanceScore,
						HighlightType:      h.HighlightType,
						SuggestedTitle:     h.SuggestedTitle,
						Keywords:           h.Keywords,
						EmotionalIntensity: h.EmotionalIntensity,
						Shareability:       h.Shareability,
						EngagementScore:    h.EngagementScore,
						Words:              wordSlice,
					}
				}
			}
		}
	}

	return bestFit
}

// expandToCompleteSentences expands a short highlight to include surrounding sentences
func (s *HighlightService) expandToCompleteSentences(
	h *pb.HighlightMoment,
	allWords []models.Word,
	minTarget float64,
	maxTarget float64,
) *pb.HighlightMoment {

	if len(h.Words) == 0 {
		return nil
	}

	// Find the position of our highlight words in the full word list
	startIdx := -1
	for i, word := range allWords {
		if word.Start == h.Words[0].Start && word.Text == h.Words[0].Text {
			startIdx = i
			break
		}
	}

	if startIdx == -1 {
		return nil
	}

	endIdx := startIdx + len(h.Words)
	if endIdx > len(allWords) {
		endIdx = len(allWords)
	}

	// Expand backward to find sentence start
	expandedStart := startIdx
	for i := startIdx - 1; i >= 0; i-- {
		word := allWords[i]
		text := strings.TrimSpace(word.Text)

		// Check if previous word ends a sentence
		if len(text) > 0 {
			lastChar := text[len(text)-1]
			if lastChar == '.' || lastChar == '!' || lastChar == '?' {
				// Found sentence boundary
				break
			}
		}

		expandedStart = i

		// Check if we've exceeded max duration
		if allWords[endIdx-1].End-allWords[expandedStart].Start > maxTarget {
			expandedStart = i + 1
			break
		}
	}

	// Expand forward to find sentence end
	expandedEnd := endIdx
	for i := endIdx; i < len(allWords); i++ {
		word := allWords[i]
		text := strings.TrimSpace(word.Text)

		expandedEnd = i + 1

		// Check if we've exceeded max duration
		if allWords[expandedEnd-1].End-allWords[expandedStart].Start > maxTarget {
			expandedEnd = i
			break
		}

		// Check if this word ends a sentence
		if len(text) > 0 {
			lastChar := text[len(text)-1]
			if lastChar == '.' || lastChar == '!' || lastChar == '?' {
				// Check if duration is now acceptable
				duration := allWords[expandedEnd-1].End - allWords[expandedStart].Start
				if duration >= minTarget {
					break
				}
			}
		}
	}

	// Build expanded highlight
	expandedWords := allWords[expandedStart:expandedEnd]
	if len(expandedWords) == 0 {
		return nil
	}

	duration := expandedWords[len(expandedWords)-1].End - expandedWords[0].Start

	// Only return if duration is acceptable
	if duration >= minTarget && duration <= maxTarget {
		return &pb.HighlightMoment{
			Id:                 h.Id,
			Text:               s.reconstructTextFromWords(convertProtoWordsToModels(expandedWords)),
			Theme:              h.Theme,
			StartTime:          expandedWords[0].Start,
			EndTime:            expandedWords[len(expandedWords)-1].End,
			ImportanceScore:    h.ImportanceScore,
			HighlightType:      h.HighlightType,
			SuggestedTitle:     h.SuggestedTitle,
			Keywords:           h.Keywords,
			EmotionalIntensity: h.EmotionalIntensity,
			Shareability:       h.Shareability,
			EngagementScore:    h.EngagementScore,
			Words:              s.convertWordsToProto(convertProtoWordsToModels(expandedWords)),
		}
	}

	return nil
}

// reconstructTextFromProtoWords reconstructs text from proto Word slice
func (s *HighlightService) reconstructTextFromProtoWords(words []*pb.Word) string {
	if len(words) == 0 {
		return ""
	}

	var textBuilder strings.Builder
	for i, word := range words {
		if i > 0 {
			if !isPunctuation(word.Text) {
				textBuilder.WriteString(" ")
			}
		}
		textBuilder.WriteString(word.Text)
	}

	return textBuilder.String()
}

// convertProtoWordsToModels converts pb.Word slice to models.Word slice
func convertProtoWordsToModels(protoWords []models.Word) []models.Word {
	// This function receives models.Word already, so just return it
	return protoWords
}

// findWordsByTextSnippet finds a contiguous run of words whose combined text best matches the snippet
func (s HighlightService) findWordsByTextSnippet(snippet string, allWords []models.Word) []models.Word {
	snippetClean := strings.ToLower(strings.TrimSpace(snippet))
	if snippetClean == "" {
		return nil
	}
	// naive approach: join sliding windows of N words and check substring inclusion
	// limit window length to 40 words to keep compute small
	maxWindow := 40
	n := len(allWords)
	for w := 5; w <= maxWindow && w <= n; w++ {
		for i := 0; i+w <= n; i++ {
			window := allWords[i : i+w]
			var b strings.Builder
			for j, wd := range window {
				if j > 0 && !isPunctuation(wd.Text) {
					b.WriteByte(' ')
				}
				b.WriteString(strings.ToLower(wd.Text))
			}
			if strings.Contains(b.String(), snippetClean) || strings.Contains(snippetClean, b.String()) {
				// found good match
				return window
			}
		}
	}
	return nil
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
	commonRequirements := `
ROLE: Expert Video Story Curator and Testimonial Analyst.
TASK: Extract ALL standalone high-value micro-story highlights from the transcript that fully satisfy all COMMON CORE PRINCIPLES below. Extract every valuable moment that meets quality standards.

# CRITICAL DURATION GUIDANCE
- TARGET: 8-20 seconds (SWEET SPOT for social media and marketing)
- WORD COUNT: Aim for 40-80 words (typical speech is ~150 words/minute = 2.5 words/second)
- CALCULATION: Count words in your text, divide by 2.5 to estimate seconds
- MINIMUM: Never go below 8 seconds (too short for complete value)
- MAXIMUM: Never exceed 25 seconds (social media attention limit)
- STRATEGY: If >60 words, trim to most impactful sentences. If <40 words, find a richer moment.

COMMON CORE PRINCIPLES:
1. Self-contained micro-story with a clear narrative arc (beginning, middle, end).
2. Zero external context: no unexplained pronouns, references, or assumptions.
3. Natural sentence boundaries: start/end at complete sentences, never mid-sentence.
4. Duration: STRICTLY 8-20 seconds. Target 40-80 words. Discard if outside this range.
5. Use verbatim transcript text; do not paraphrase or alter.
6. Viewer clarity test: the clip is fully understandable without prior knowledge or additional context.
7. Contiguous text: Prefer single segment or closely adjacent segments (avoid large time gaps).

VALIDATION: Exclude any highlight that fails any rule above.

IMPORTANT: For every highlight object include numeric values for
"importance_score", "emotional_intensity", "shareability", "engagement_score" as decimals between 0.0 and 1.0.
If you cannot estimate a number, choose a conservative default 0.5 rather than omitting the field.
Also ensure start_time and end_time align with the transcript segment boundaries. If a single highlight spans parts of multiple segments, choose start_time at the first segment's start and end_time at the last segment's end.

THINK-THEN-GENERATE:
1. Analyze transcript holistically.
2. Select strongest candidate highlights according to business value and completeness.
3. For each candidate: COUNT WORDS and verify 40-80 word range (8-20 seconds).
4. Validate each highlight against all principles.
5. Output only valid highlights in strictly formatted JSON.

STRICT OUTPUT FORMAT:
Return JSON array ordered chronologically, each object with the exact schema:
{
  "text": "...",
  "theme": "...",
  "start_time": 0.0,
  "end_time": 0.0,
  "importance_score": 0.0,
  "highlight_type": "%s",
  "suggested_title": "...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "emotional_intensity": 0.0,
  "shareability": 0.0,
  "engagement_score": 0.0
}

SAFETY: Do not generate any speculative, biased, or unrelated under any circumstances.

EXAMPLES:
VALID (Good Duration - 12s, ~48 words):
{
  "text": "After implementing the system, our error rate dropped from 15 percent to under 1 percent, saving 20 hours per week. The team was skeptical at first, but within two weeks everyone was onboard.",
  "start_time": 34.0,
  "end_time": 46.0
}
INVALID (Too Short):
{
  "text": "It was amazing.",
  "reason": "Too short (<8s), lacks context and completeness."
}
INVALID (Too Long - would be ~35s):
{
  "text": "We had many problems and tried different solutions over several months before finally discovering this tool which gradually helped improve things...",
  "reason": "Too long (>80 words), rambling. Split into focused highlights."
}
`

	var typeSpecific string
	switch highlightType {
	case HighlightTypeProblem:
		typeSpecific = `
FOCUS: Detailed, relatable problem/challenge moments that prospects identify with.
PRIORITY: Quantified impacts, failed attempts before your solution, urgency, and industry-specific challenges.`
	case HighlightTypeSolution:
		typeSpecific = `
FOCUS: Decision-making process, unique value propositions, trust signals, and early wins.
PRIORITY: Why they picked your solution over others, smooth implementation, and confidence building.`
	case HighlightTypeResults:
		typeSpecific = `
FOCUS: Clear, quantified business outcomes with context.
PRIORITY: ROI, strategic impact, time-to-value, multiple benefit stacks, and long-term success.`
	case HighlightTypeMetrics:
		typeSpecific = `
FOCUS: Hard numbers CFOs demand—ROI, performance metrics, efficiency gains.
REQUIREMENT: Always provide full context around the numbers (baseline, timeframe, impact).`
	case HighlightTypeRecommendation:
		typeSpecific = `
FOCUS: Direct, passionate endorsements with reasoning.
PRIORITY: Competitive comparisons and detailed loyalty motivations.`
	case HighlightTypeBeforeAfter:
		typeSpecific = `
FOCUS: Dramatic before/after transformation stories with quantifiable contrast.
REQUIREMENT: Include both BEFORE and AFTER states for completeness.`
	case HighlightTypeEmotional:
		typeSpecific = `
FOCUS: Genuine emotional reactions with clear contextual triggers.
PRIORITY: Relief, pride, gratitude, advocacy rooted in their story journey.`
	default:
		typeSpecific = `
FOCUS: Highest ROI clips with strong business impact, clear narrative, and emotional authenticity.`
	}

	outputRequirement := `
# OUTPUT
The output must be a single JSON array containing highlight objects with all schema fields present and in exact order. If no qualifying highlights are found, return only []. No fields may be omitted, null, or reordered. Default numeric values to 0.5 if uncertain.
Set reasoning_effort = medium for this multi-step task: use moderate depth for analysis and validation.
Request changes (optional)
`

	return commonRequirements + typeSpecific + outputRequirement
}

func (s HighlightService) buildHighlightPrompt(text string, segments []models.TranscriptionSegment, customPrompt string, highlightType string, maxHighlights int) string {
	strippedSegments := s.stripWordsFromSegments(segments)
	segmentsJSON, _ := json.Marshal(strippedSegments)
	customInstr := ""
	if customPrompt != "" {
		customInstr = fmt.Sprintf("\n\nAdditional Analyst Instructions:\n%s", customPrompt)
	}

	// Build task description based on maxHighlights
	taskDescription := ""
	if maxHighlights > 0 {
		taskDescription = fmt.Sprintf("Identify exactly %d business-critical, standalone testimonial highlights within the transcript below.", maxHighlights)
	} else {
		taskDescription = "Identify ALL business-critical, standalone testimonial highlights within the transcript below. Extract every valuable moment that meets all quality criteria."
	}

	prompt := fmt.Sprintf(`
ROLE: Professional video content editor and storytelling analyst.
TASK: %s

COMMON CORE PRINCIPLES:
- Highlights must be complete micro-stories with clear start, middle, and end.
- No external context required — all pronouns and references must be explained.
- Stick exactly to transcript text; NO paraphrasing or text edits.
- Duration must be between 8 and 20 seconds; discard below 8s or above 25s unless completeness demands.
- Highlights must start/end on full sentences.
- No overlapping or duplicated time ranges; arrange results chronologically.
- Output must be a valid JSON array matching this schema exactly:

[
  {
    "text": "...",
    "theme": "...",
    "start_time": 0.0,
    "end_time": 0.0,
    "importance_score": 0.0,
    "highlight_type": "%s",
    "suggested_title": "...",
    "keywords": ["...", "...", "..."],
    "emotional_intensity": 0.0,
    "shareability": 0.0,
    "engagement_score": 0.0
  }
]

TRANSCRIPT:
%s

TRANSCRIPT SEGMENTS WITH TIMING:
%s

CRITICAL: Use start_time/end_time ONLY from these segments. Text must EXACTLY MATCH segments.

VALIDATE each highlight thoroughly on:
1. Duration
2. Narrative completeness
3. Standalone clarity
4. Sentence boundaries
5. Absence of unknown references
6. Timing alignment
7. Non-overlapping uniqueness

%s

FINAL STEP: Output only highlights passing ALL checks as JSON. No explanation text outside JSON.

`, taskDescription, highlightType, text, string(segmentsJSON), customInstr)

	return prompt
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
