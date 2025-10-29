package ai

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/utils"
)

type FillerOccurrence struct {
	FillerWord    string  `json:"filler_word"`
	StartTime     float64 `json:"start_time"`
	EndTime       float64 `json:"end_time"`
	Type          string  `json:"type"`
	Confidence    float64 `json:"confidence"`
	Context       string  `json:"context"`
	Severity      string  `json:"severity"`
	Suggestion    string  `json:"suggestion,omitempty"`
	WordPosition  int     `json:"word_position"`
	SentenceIndex int     `json:"sentence_index"`
}

type FillerAnalysis struct {
	TotalFillers        int                `json:"total_fillers"`
	FillerRate          float64            `json:"filler_rate"` // fillers per minute
	MostCommonType      string             `json:"most_common_type"`
	SeverityBreakdown   map[string]int     `json:"severity_breakdown"`
	TypeBreakdown       map[string]int     `json:"type_breakdown"`
	Occurrences         []FillerOccurrence `json:"occurrences"`
	OverallScore        float64            `json:"overall_score"` // 0-100, higher is better
	ImprovementAreas    []string           `json:"improvement_areas"`
	PositiveAspects     []string           `json:"positive_aspects"`
	SpeakingPaceIssues  bool               `json:"speaking_pace_issues"`
	ConfidenceIndicator string             `json:"confidence_indicator"`
}

type FillerDetectionService struct {
	aiClient     AIClient
	cacheService cache.RedisCache
}

func NewFillerDetectionService(aiClient AIClient, cacheService cache.RedisCache) FillerDetectionService {
	return FillerDetectionService{
		aiClient:     aiClient,
		cacheService: cacheService,
	}
}

func (s FillerDetectionService) AnalyzeFillers(ctx context.Context, transcript string, segments []models.TranscriptionSegment, prompt string) (*FillerAnalysis, error) {
	// Check cache first
	cacheKey := fmt.Sprintf("filler_analysis:%x", md5.Sum([]byte(transcript)))
	var cached FillerAnalysis
	if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
		return &cached, nil
	}

	// Detect fillers using AI
	fillers, err := s.detectFillersWithAI(ctx, transcript, segments, prompt)
	if err != nil {
		return nil, fmt.Errorf("AI filler detection failed: %w", err)
	}

	// Build comprehensive analysis
	analysis := s.buildAnalysis(fillers, transcript, segments)

	// Cache for 1 hour
	s.cacheService.Set(ctx, cacheKey, analysis, time.Hour)

	return &analysis, nil
}

func (s FillerDetectionService) detectFillersWithAI(ctx context.Context, transcript string, segments []models.TranscriptionSegment, customPrompt string) ([]FillerOccurrence, error) {
	systemPrompt := `You are an expert speech analysis AI specializing in identifying filler words, hesitations, and speech patterns that detract from communication effectiveness. Your analysis should be precise, contextually aware, and provide actionable insights.`

	prompt := s.buildFillerDetectionPrompt(transcript, segments, customPrompt)

	response, err := s.aiClient.Complete(ctx, prompt, systemPrompt)
	if err != nil {
		return nil, fmt.Errorf("filler detection request failed: %w", err)
	}

	var fillers []FillerOccurrence
	cleanedResponse := utils.CleanAIJSONResponse(response)
	if err := json.Unmarshal([]byte(cleanedResponse), &fillers); err != nil {
		return nil, fmt.Errorf("failed to parse filler detection response: %w", err)
	}

	// Enhance with precise timestamps
	fillers = s.enhanceTimestamps(fillers, segments)

	// Sort by start time
	sort.Slice(fillers, func(i, j int) bool {
		return fillers[i].StartTime < fillers[j].StartTime
	})

	return fillers, nil
}

func (s FillerDetectionService) buildFillerDetectionPrompt(transcript string, segments []models.TranscriptionSegment, customPrompt string) string {
	segmentsJSON, _ := json.Marshal(segments)
	hasTimestamps := len(segments) > 0

	var customInstructions string
	if customPrompt != "" {
		customInstructions = fmt.Sprintf("\n\nAdditional Instructions:\n%s", customPrompt)
	}

	promptBase := fmt.Sprintf(`Analyze this speech transcript for filler words, hesitations, and ineffective speech patterns. Provide detailed analysis with precise identification and contextual understanding.%s

Transcript: %s`, customInstructions, transcript)

	if hasTimestamps {
		promptBase += fmt.Sprintf(`

Timestamped segments: %s

Use these segments to provide accurate timing information.`, string(segmentsJSON))
	}

	promptBase += `

Your task is to identify ALL words, sounds, phrases, or speech patterns that function as fillers - anything that:
- Doesn't add meaningful content to the message
- Indicates hesitation, uncertainty, or nervous habits
- Disrupts the natural flow of communication
- Could be removed without losing meaning
- Serves as a verbal placeholder while thinking
- Shows lack of confidence or preparation
- Creates redundancy or unnecessary repetition

Think broadly and analytically about what constitutes ineffective speech patterns. Don't limit yourself to common examples - identify ANY linguistic elements that detract from clear, confident communication.

Return a JSON array of filler occurrences:
{
  "filler_word": "exact text identified as filler",
  "start_time": 123.45, // precise timestamp if available
  "end_time": 125.20,   // precise timestamp if available
  "type": "your classification of this filler type", // create meaningful categories based on what you discover
  "confidence": 0.95,   // 0.0-1.0 confidence in detection
  "context": "surrounding 10-15 words for context",
  "severity": "low|medium|high", // impact on communication effectiveness
  "word_position": 42,  // position in transcript (word count)
  "sentence_index": 3   // which sentence this occurs in
}

Return the result as *only* a JSON array, no explanations or additional text.

ANALYSIS CRITERIA:
- Consider the PURPOSE of each word/phrase - does it add meaning or just fill space?
- Look for PATTERNS of hesitation, uncertainty, or nervous habits
- Distinguish between contextually appropriate language and excessive/unnecessary usage
- Identify words that could be removed without changing the core message
- Consider the IMPACT on professionalism and communication clarity
- Look for signs of preparation level and speaker confidence
- Assess flow disruption and comprehension barriers
- Be sensitive to context - technical discussions may naturally have more thinking pauses
- Consider cultural and individual speaking patterns vs. problematic fillers
- Focus on elements that would benefit from speech coaching%s

Create your own meaningful categories based on the patterns you discover. Don't force speech into predefined boxes - let the data guide your analysis.

SEVERITY LEVELS:
- HIGH: Significantly disrupts communication, frequent clustering, impedes comprehension
- MEDIUM: Noticeable pattern that reduces professionalism or clarity
- LOW: Occasional occurrence within normal speech patterns

Focus on actionable insights that would help improve speaking effectiveness. Be precise with timestamps and provide meaningful suggestions for improvement.

IMPORTANT: Think creatively and analytically. You may discover patterns unique to this speaker or industry-specific fillers not commonly recognized. Your goal is comprehensive analysis, not just detection of "typical" fillers.`

	// Add conditional guideline for custom instructions
	if customPrompt != "" {
		promptBase += "\n- Follow the additional instructions provided above"
	}

	return promptBase
}

func (s FillerDetectionService) enhanceTimestamps(fillers []FillerOccurrence, segments []models.TranscriptionSegment) []FillerOccurrence {
	if len(segments) == 0 {
		return fillers
	}

	// Build word-to-timestamp mapping
	wordMap := s.buildPreciseWordMap(segments)

	for i := range fillers {
		filler := &fillers[i]

		// Try to find more precise timestamp
		if timestamps, exists := wordMap[strings.ToLower(filler.FillerWord)]; exists {
			// Find closest match based on word position
			bestMatch := s.findBestTimestampMatch(filler, timestamps)
			if bestMatch != nil {
				filler.StartTime = bestMatch.StartTime
				filler.EndTime = bestMatch.EndTime
			}
		}
	}

	return fillers
}

type WordTimestamp struct {
	Word         string
	StartTime    float64
	EndTime      float64
	Position     int
	SegmentIndex int
}

func (s FillerDetectionService) buildPreciseWordMap(segments []models.TranscriptionSegment) map[string][]WordTimestamp {
	wordMap := make(map[string][]WordTimestamp)
	wordPosition := 0

	for segIndex, segment := range segments {
		words := strings.Fields(strings.ToLower(segment.Text))
		if len(words) == 0 {
			continue
		}

		duration := segment.EndTime - segment.StartTime
		wordDuration := duration / float64(len(words))

		for i, word := range words {
			// Clean word but preserve original for context
			cleanWord := s.cleanWord(word)
			if cleanWord == "" {
				wordPosition++
				continue
			}

			startTime := segment.StartTime + (float64(i) * wordDuration)
			endTime := startTime + wordDuration

			timestamp := WordTimestamp{
				Word:         cleanWord,
				StartTime:    startTime,
				EndTime:      endTime,
				Position:     wordPosition,
				SegmentIndex: segIndex,
			}

			wordMap[cleanWord] = append(wordMap[cleanWord], timestamp)
			wordPosition++
		}
	}

	return wordMap
}

func (s FillerDetectionService) findBestTimestampMatch(filler *FillerOccurrence, timestamps []WordTimestamp) *WordTimestamp {
	if len(timestamps) == 0 {
		return nil
	}

	// If we only have one match, use it
	if len(timestamps) == 1 {
		return &timestamps[0]
	}

	// Find closest match by word position
	bestMatch := &timestamps[0]
	smallestDiff := math.Abs(float64(timestamps[0].Position - filler.WordPosition))

	for i := 1; i < len(timestamps); i++ {
		diff := math.Abs(float64(timestamps[i].Position - filler.WordPosition))
		if diff < smallestDiff {
			smallestDiff = diff
			bestMatch = &timestamps[i]
		}
	}

	return bestMatch
}

func (s FillerDetectionService) cleanWord(word string) string {
	// Remove punctuation but preserve the core word
	result := strings.ToLower(word)
	result = strings.Trim(result, ".,!?;:\"'()[]{}")
	return result
}

func (s FillerDetectionService) buildAnalysis(fillers []FillerOccurrence, transcript string, segments []models.TranscriptionSegment) FillerAnalysis {
	totalWords := len(strings.Fields(transcript))
	duration := s.calculateDuration(segments)

	analysis := FillerAnalysis{
		TotalFillers:      len(fillers),
		SeverityBreakdown: make(map[string]int),
		TypeBreakdown:     make(map[string]int),
		Occurrences:       fillers,
		ImprovementAreas:  []string{},
		PositiveAspects:   []string{},
	}

	// Calculate filler rate (per minute)
	if duration > 0 {
		analysis.FillerRate = float64(len(fillers)) / (duration / 60.0)
	}

	// Analyze patterns
	mostCommonType := ""
	maxTypeCount := 0

	for _, filler := range fillers {
		analysis.SeverityBreakdown[filler.Severity]++
		analysis.TypeBreakdown[filler.Type]++

		if analysis.TypeBreakdown[filler.Type] > maxTypeCount {
			maxTypeCount = analysis.TypeBreakdown[filler.Type]
			mostCommonType = filler.Type
		}
	}

	analysis.MostCommonType = mostCommonType

	// Calculate overall score (0-100, higher is better)
	analysis.OverallScore = s.calculateOverallScore(len(fillers), totalWords, analysis.FillerRate)

	// Generate insights
	analysis.ImprovementAreas = s.generateImprovementAreas(analysis)
	analysis.PositiveAspects = s.generatePositiveAspects(analysis)
	analysis.SpeakingPaceIssues = s.detectPaceIssues(fillers)
	analysis.ConfidenceIndicator = s.assessConfidence(analysis)

	return analysis
}

func (s FillerDetectionService) calculateDuration(segments []models.TranscriptionSegment) float64 {
	if len(segments) == 0 {
		return 0
	}

	// Find the last end time
	maxEndTime := 0.0
	for _, segment := range segments {
		if segment.EndTime > maxEndTime {
			maxEndTime = segment.EndTime
		}
	}

	return maxEndTime
}

func (s FillerDetectionService) calculateOverallScore(fillerCount, totalWords int, fillerRate float64) float64 {
	if totalWords == 0 {
		return 100
	}

	// Base score calculation
	fillerPercentage := float64(fillerCount) / float64(totalWords) * 100

	// Score starts at 100 and decreases based on filler density
	score := 100.0 - (fillerPercentage * 3) // 3x weight on percentage

	// Additional penalty for high filler rate
	if fillerRate > 10 {
		score -= (fillerRate - 10) * 2
	}

	// Ensure score is between 0 and 100
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	return math.Round(score*100) / 100
}

func (s FillerDetectionService) generateImprovementAreas(analysis FillerAnalysis) []string {
	areas := []string{}

	if analysis.FillerRate > 15 {
		areas = append(areas, "Reduce overall filler frequency - consider practicing with conscious pausing")
	}

	if analysis.SeverityBreakdown["high"] > 3 {
		areas = append(areas, "Address high-severity fillers that significantly disrupt communication flow")
	}

	// Dynamically generate suggestions based on most common filler types
	if analysis.MostCommonType != "" && analysis.TypeBreakdown[analysis.MostCommonType] > 5 {
		areas = append(areas, fmt.Sprintf("Focus on reducing '%s' patterns - this is your most frequent filler type", analysis.MostCommonType))
	}

	// Look for confidence issues based on filler content
	confidenceFillers := 0
	for _, filler := range analysis.Occurrences {
		if strings.Contains(strings.ToLower(filler.FillerWord), "think") ||
			strings.Contains(strings.ToLower(filler.FillerWord), "maybe") ||
			strings.Contains(strings.ToLower(filler.FillerWord), "guess") ||
			strings.Contains(strings.ToLower(filler.FillerWord), "perhaps") {
			confidenceFillers++
		}
	}

	if confidenceFillers > 3 {
		areas = append(areas, "Build confidence by reducing uncertain language and qualifiers")
	}

	return areas
}

func (s FillerDetectionService) generatePositiveAspects(analysis FillerAnalysis) []string {
	aspects := []string{}

	if analysis.OverallScore > 80 {
		aspects = append(aspects, "Excellent overall speech clarity with minimal filler usage")
	}

	if analysis.FillerRate < 5 {
		aspects = append(aspects, "Good speaking pace with appropriate pausing")
	}

	if analysis.SeverityBreakdown["low"] > analysis.SeverityBreakdown["high"] {
		aspects = append(aspects, "Most fillers are low-impact and don't significantly disrupt communication")
	}

	if len(analysis.Occurrences) == 0 {
		aspects = append(aspects, "Exceptional - no significant filler words detected")
	}

	return aspects
}

func (s FillerDetectionService) detectPaceIssues(fillers []FillerOccurrence) bool {
	// Check for clustering of fillers (indicates pace issues)
	if len(fillers) < 3 {
		return false
	}

	clusters := 0
	for i := 0; i < len(fillers)-2; i++ {
		if fillers[i+1].StartTime-fillers[i].EndTime < 3.0 &&
			fillers[i+2].StartTime-fillers[i+1].EndTime < 3.0 {
			clusters++
		}
	}

	return clusters > 2
}

func (s FillerDetectionService) assessConfidence(analysis FillerAnalysis) string {
	uncertaintyIndicators := 0
	hesitationIndicators := 0

	for _, filler := range analysis.Occurrences {
		fillerLower := strings.ToLower(filler.FillerWord)

		// Count uncertainty words
		if strings.Contains(fillerLower, "think") ||
			strings.Contains(fillerLower, "maybe") ||
			strings.Contains(fillerLower, "guess") ||
			strings.Contains(fillerLower, "perhaps") ||
			strings.Contains(fillerLower, "probably") {
			uncertaintyIndicators++
		}

		// Count hesitation sounds
		if strings.Contains(fillerLower, "um") ||
			strings.Contains(fillerLower, "uh") ||
			strings.Contains(fillerLower, "er") ||
			strings.Contains(fillerLower, "ah") {
			hesitationIndicators++
		}
	}

	totalWeakness := uncertaintyIndicators + hesitationIndicators

	if analysis.OverallScore > 85 && totalWeakness < 3 {
		return "High - confident and clear communication style"
	} else if analysis.OverallScore > 65 && totalWeakness < 8 {
		return "Moderate - some hesitation patterns present"
	} else {
		return "Low - significant hesitation and uncertainty indicators"
	}
}
