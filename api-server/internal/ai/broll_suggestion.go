package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"

	"go.uber.org/zap"
)

// BrollSuggestionService handles AI-based B-roll clip suggestion
type BrollSuggestionService struct {
	aiClient      *AIClient
	pexelsAPIKey  string
	pixabayAPIKey string
	httpClient    *http.Client
	logger        *zap.Logger
}

// NewBrollSuggestionService creates a new broll suggestion service
func NewBrollSuggestionService(aiClient *AIClient, logger *zap.Logger) *BrollSuggestionService {
	return &BrollSuggestionService{
		aiClient:      aiClient,
		pexelsAPIKey:  os.Getenv("PEXELS_API_KEY"),
		pixabayAPIKey: os.Getenv("PIXABAY_API_KEY"),
		httpClient:    &http.Client{},
		logger:        logger,
	}
}

// SuggestBrollRequest represents the request structure
type SuggestBrollRequest struct {
	TranscriptText string  `json:"transcript_text"`
	VideoDuration  float64 `json:"video_duration"`
	MaxClips       int     `json:"max_clips"`
	Orientation    string  `json:"orientation"` // "landscape", "portrait", "square", or "all"
}

// SuggestBrollResponse represents the response structure
type SuggestBrollResponse struct {
	SuggestedClips   []BrollClipSuggestion `json:"suggested_clips"`
	SearchKeywords   []string              `json:"search_keywords"`
	Themes           []string              `json:"themes"`
	AIAnalysis       string                `json:"ai_analysis"`
	DurationBudget   float64               `json:"duration_budget"`    // Max total B-roll duration allowed
	TotalDuration    float64               `json:"total_duration"`     // Total duration of suggested clips
	BudgetPercentage float64               `json:"budget_percentage"`  // Percentage of video that B-roll can occupy
}

// BrollClipSuggestion represents a suggested B-roll clip
type BrollClipSuggestion struct {
	ID                    int     `json:"id"`
	URL                   string  `json:"url"`
	Name                  string  `json:"name"`
	Thumbnail             string  `json:"thumbnail"`
	Duration              float64 `json:"duration"`
	PexelsID              int     `json:"pexels_id"`
	SearchKeyword         string  `json:"search_keyword"`
	RelevanceExplanation  string  `json:"relevance_explanation"`
	RelevanceScore        float64 `json:"relevance_score"`
	MediaType             string  `json:"media_type"` // "video" or "image"
}

// AIAnalysisResult represents the AI's analysis of the transcript
type AIAnalysisResult struct {
	Themes         []string `json:"themes"`
	SearchKeywords []string `json:"search_keywords"`
	Tone           string   `json:"tone"`
	Industry       string   `json:"industry"`
}

// PexelsSearchResponse represents Pexels API response for videos
type PexelsSearchResponse struct {
	Videos []PexelsVideo `json:"videos"`
}

// PexelsPhotosResponse represents Pexels API response for photos
type PexelsPhotosResponse struct {
	Photos []PexelsPhoto `json:"photos"`
}

// PexelsPhoto represents a photo from Pexels
type PexelsPhoto struct {
	ID     int    `json:"id"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Src    struct {
		Original  string `json:"original"`
		Large2x   string `json:"large2x"`
		Large     string `json:"large"`
		Medium    string `json:"medium"`
		Small     string `json:"small"`
		Portrait  string `json:"portrait"`
		Landscape string `json:"landscape"`
		Tiny      string `json:"tiny"`
	} `json:"src"`
	Photographer string `json:"photographer"`
}

// PexelsVideo represents a video from Pexels
type PexelsVideo struct {
	ID         int    `json:"id"`
	Width      int    `json:"width"`
	Height     int    `json:"height"`
	Duration   int    `json:"duration"`
	Image      string `json:"image"` // Thumbnail
	VideoFiles []struct {
		ID      int    `json:"id"`
		Quality string `json:"quality"`
		Width   int    `json:"width"`
		Height  int    `json:"height"`
		Link    string `json:"link"`
	} `json:"video_files"`
	User struct {
		Name string `json:"name"`
	} `json:"user"`
}

// SuggestBroll analyzes transcript and suggests relevant B-roll clips
func (s *BrollSuggestionService) SuggestBroll(ctx context.Context, req SuggestBrollRequest) (*SuggestBrollResponse, error) {
	s.logger.Info("AI analyzing transcript for B-roll suggestions",
		zap.Int("transcript_length", len(req.TranscriptText)),
		zap.Float64("video_duration", req.VideoDuration))

	// Validate inputs
	if req.TranscriptText == "" {
		return nil, fmt.Errorf("transcript text is required")
	}
	if req.MaxClips == 0 {
		req.MaxClips = 5
	}
	if req.Orientation == "" {
		req.Orientation = "all"
	}

	// Step 1: Use AI to analyze transcript and extract themes/keywords
	aiAnalysis, err := s.analyzeTranscriptWithAI(ctx, req.TranscriptText)
	if err != nil {
		s.logger.Error("AI transcript analysis failed", zap.Error(err))
		return nil, fmt.Errorf("AI analysis failed: %w", err)
	}

	s.logger.Info("AI analysis complete",
		zap.Strings("themes", aiAnalysis.Themes),
		zap.Int("keywords", len(aiAnalysis.SearchKeywords)))

	// Step 2: Search stock footage (both videos and photos) for each keyword
	allClips := []BrollClipSuggestion{}

	for i, keyword := range aiAnalysis.SearchKeywords {
		if i >= req.MaxClips {
			break // Limit searches
		}

		// Search for videos (2 results per keyword)
		videoClips, err := s.searchPexels(keyword, req.Orientation, 2)
		if err != nil {
			s.logger.Warn("Pexels video search failed for keyword",
				zap.String("keyword", keyword),
				zap.Error(err))
		} else {
			// Add context to each video clip
			for _, clip := range videoClips {
				clip.SearchKeyword = keyword
				clip.RelevanceExplanation = s.generateRelevanceExplanation(keyword, aiAnalysis.Themes)
				allClips = append(allClips, clip)
			}
		}

		// Search for photos (2 results per keyword)
		photoClips, err := s.searchPexelsPhotos(keyword, req.Orientation, 2)
		if err != nil {
			s.logger.Warn("Pexels photo search failed for keyword",
				zap.String("keyword", keyword),
				zap.Error(err))
		} else {
			// Add context to each photo clip
			for _, clip := range photoClips {
				clip.SearchKeyword = keyword
				clip.RelevanceExplanation = s.generateRelevanceExplanation(keyword, aiAnalysis.Themes)
				allClips = append(allClips, clip)
			}
		}
	}

	// Step 3: Deduplicate and rank
	uniqueClips := s.deduplicateAndRank(allClips, req.MaxClips)

	// Step 4: Apply duration budget filtering (30% of video duration)
	budgetPercentage := 0.30
	durationBudget := req.VideoDuration * budgetPercentage
	filteredClips := s.filterByDurationBudget(uniqueClips, durationBudget)

	// Calculate total duration of suggested clips
	totalDuration := 0.0
	for _, clip := range filteredClips {
		totalDuration += clip.Duration
	}

	s.logger.Info("B-roll suggestion complete",
		zap.Int("total_clips_found", len(uniqueClips)),
		zap.Int("clips_after_budget_filter", len(filteredClips)),
		zap.Float64("duration_budget", durationBudget),
		zap.Float64("total_duration", totalDuration))

	return &SuggestBrollResponse{
		SuggestedClips:   filteredClips,
		SearchKeywords:   aiAnalysis.SearchKeywords,
		Themes:           aiAnalysis.Themes,
		AIAnalysis:       fmt.Sprintf("Tone: %s, Industry: %s", aiAnalysis.Tone, aiAnalysis.Industry),
		DurationBudget:   durationBudget,
		TotalDuration:    totalDuration,
		BudgetPercentage: budgetPercentage,
	}, nil
}

// analyzeTranscriptWithAI uses AI to extract themes and search keywords
func (s *BrollSuggestionService) analyzeTranscriptWithAI(ctx context.Context, transcript string) (*AIAnalysisResult, error) {
	// Truncate transcript if too long
	if len(transcript) > 3000 {
		transcript = transcript[:3000]
	}

	systemPrompt := "You are an expert video editor specializing in selecting relevant B-roll footage for videos. You analyze content and identify visual concepts that would enhance the viewing experience."

	prompt := fmt.Sprintf(`Analyze this video transcript and help find relevant B-roll footage.

Transcript:
"""
%s
"""

Extract:
1. **Main Themes** (2-4 broad topics discussed)
2. **Search Keywords** (5-7 specific visual concepts that would make good B-roll)
   - Focus on concrete, visual subjects (e.g., "office collaboration", "data visualization", "city skyline")
   - Avoid abstract concepts
   - Think about what stock footage would enhance this content
3. **Tone** (professional/casual/energetic/calm)
4. **Industry** (if identifiable: tech/healthcare/education/finance/etc.)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "themes": ["theme1", "theme2", "theme3"],
  "search_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tone": "professional",
  "industry": "technology"
}`, transcript)

	// Call AI
	response, err := s.aiClient.Complete(ctx, prompt, systemPrompt)
	if err != nil {
		return nil, fmt.Errorf("AI completion failed: %w", err)
	}

	s.logger.Debug("AI raw response", zap.String("response", response))

	// Parse JSON response
	analysis, err := s.parseAIAnalysis(response)
	if err != nil {
		s.logger.Warn("Failed to parse AI response, using fallback", zap.Error(err))
		return s.fallbackKeywordExtraction(transcript), nil
	}

	return analysis, nil
}

// parseAIAnalysis parses the AI response
func (s *BrollSuggestionService) parseAIAnalysis(response string) (*AIAnalysisResult, error) {
	// Clean response - remove markdown code blocks if present
	response = strings.TrimSpace(response)

	// Try to extract JSON from markdown code blocks
	jsonMatch := regexp.MustCompile("```(?:json)?\\s*({.*?})\\s*```").FindStringSubmatch(response)
	if len(jsonMatch) > 1 {
		response = jsonMatch[1]
	}

	// Try to find JSON object in response
	jsonMatch2 := regexp.MustCompile(`\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}`).FindStringSubmatch(response)
	if len(jsonMatch2) > 0 {
		response = jsonMatch2[0]
	}

	var analysis AIAnalysisResult
	if err := json.Unmarshal([]byte(response), &analysis); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	// Validate
	if len(analysis.Themes) == 0 || len(analysis.SearchKeywords) == 0 {
		return nil, fmt.Errorf("invalid analysis: missing themes or keywords")
	}

	return &analysis, nil
}

// fallbackKeywordExtraction provides simple keyword extraction if AI fails
func (s *BrollSuggestionService) fallbackKeywordExtraction(transcript string) *AIAnalysisResult {
	// Simple word frequency analysis
	stopwords := map[string]bool{
		"the": true, "a": true, "an": true, "and": true, "or": true,
		"but": true, "in": true, "on": true, "at": true, "to": true,
		"for": true, "of": true, "with": true, "by": true, "from": true,
	}

	words := regexp.MustCompile(`\b\w+\b`).FindAllString(strings.ToLower(transcript), -1)
	wordFreq := make(map[string]int)

	for _, word := range words {
		if len(word) > 4 && !stopwords[word] {
			wordFreq[word]++
		}
	}

	// Get top keywords
	type wordCount struct {
		word  string
		count int
	}
	counts := []wordCount{}
	for word, count := range wordFreq {
		counts = append(counts, wordCount{word, count})
	}

	// Simple sort by count
	for i := 0; i < len(counts)-1; i++ {
		for j := i + 1; j < len(counts); j++ {
			if counts[j].count > counts[i].count {
				counts[i], counts[j] = counts[j], counts[i]
			}
		}
	}

	keywords := []string{}
	for i := 0; i < len(counts) && i < 7; i++ {
		keywords = append(keywords, counts[i].word)
	}

	themes := keywords
	if len(themes) > 3 {
		themes = themes[:3]
	}

	return &AIAnalysisResult{
		Themes:         themes,
		SearchKeywords: keywords,
		Tone:           "professional",
		Industry:       "general",
	}
}

// searchPexels searches Pexels API for videos
func (s *BrollSuggestionService) searchPexels(keyword string, orientation string, maxResults int) ([]BrollClipSuggestion, error) {
	if s.pexelsAPIKey == "" {
		return nil, fmt.Errorf("Pexels API key not configured")
	}

	apiURL := fmt.Sprintf("https://api.pexels.com/videos/search?query=%s&per_page=%d",
		url.QueryEscape(keyword), maxResults)

	if orientation != "all" {
		apiURL += "&orientation=" + orientation
	}

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", s.pexelsAPIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Pexels API returned status %d", resp.StatusCode)
	}

	var searchResp PexelsSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, err
	}

	// Convert to BrollClipSuggestion
	clips := []BrollClipSuggestion{}
	for _, video := range searchResp.Videos {
		// Find best quality video file
		var bestURL string
		var bestQuality int

		for _, file := range video.VideoFiles {
			if file.Quality == "hd" || file.Width > bestQuality {
				bestURL = file.Link
				bestQuality = file.Width
			}
		}

		if bestURL == "" && len(video.VideoFiles) > 0 {
			bestURL = video.VideoFiles[0].Link
		}

		clip := BrollClipSuggestion{
			ID:             video.ID,
			PexelsID:       video.ID,
			URL:            bestURL,
			Name:           fmt.Sprintf("%s by %s", keyword, video.User.Name),
			Thumbnail:      video.Image,
			Duration:       float64(video.Duration),
			RelevanceScore: 0.8, // Base score
			MediaType:      "video",
		}

		clips = append(clips, clip)
	}

	return clips, nil
}

// searchPexelsPhotos searches Pexels API for photos
func (s *BrollSuggestionService) searchPexelsPhotos(keyword string, orientation string, maxResults int) ([]BrollClipSuggestion, error) {
	if s.pexelsAPIKey == "" {
		return nil, fmt.Errorf("Pexels API key not configured")
	}

	apiURL := fmt.Sprintf("https://api.pexels.com/v1/search?query=%s&per_page=%d",
		url.QueryEscape(keyword), maxResults)

	if orientation != "all" {
		apiURL += "&orientation=" + orientation
	}

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", s.pexelsAPIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Pexels API returned status %d", resp.StatusCode)
	}

	var searchResp PexelsPhotosResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, err
	}

	// Convert to BrollClipSuggestion
	clips := []BrollClipSuggestion{}
	for _, photo := range searchResp.Photos {
		// Select appropriate image size based on orientation
		var imageURL string
		switch orientation {
		case "portrait":
			imageURL = photo.Src.Portrait
		case "landscape":
			imageURL = photo.Src.Landscape
		case "square":
			imageURL = photo.Src.Medium
		default:
			imageURL = photo.Src.Large
		}

		clip := BrollClipSuggestion{
			ID:             photo.ID,
			PexelsID:       photo.ID,
			URL:            imageURL,
			Name:           fmt.Sprintf("%s by %s", keyword, photo.Photographer),
			Thumbnail:      photo.Src.Medium,
			Duration:       5.0, // Default 5 seconds for images
			RelevanceScore: 0.75, // Slightly lower base score than videos
			MediaType:      "image",
		}

		clips = append(clips, clip)
	}

	return clips, nil
}

// generateRelevanceExplanation creates explanation for why clip is relevant
func (s *BrollSuggestionService) generateRelevanceExplanation(keyword string, themes []string) string {
	// Check if keyword relates to any theme
	for _, theme := range themes {
		if strings.Contains(strings.ToLower(theme), strings.ToLower(keyword)) ||
			strings.Contains(strings.ToLower(keyword), strings.ToLower(theme)) {
			return fmt.Sprintf("Matches your discussion about %s", theme)
		}
	}
	return fmt.Sprintf("Visual representation of %s", keyword)
}

// deduplicateAndRank removes duplicates and ranks clips
func (s *BrollSuggestionService) deduplicateAndRank(clips []BrollClipSuggestion, maxClips int) []BrollClipSuggestion {
	seen := make(map[int]bool)
	unique := []BrollClipSuggestion{}

	for _, clip := range clips {
		if !seen[clip.PexelsID] {
			seen[clip.PexelsID] = true
			unique = append(unique, clip)
		}
	}

	// Sort by relevance score
	for i := 0; i < len(unique)-1; i++ {
		for j := i + 1; j < len(unique); j++ {
			if unique[j].RelevanceScore > unique[i].RelevanceScore {
				unique[i], unique[j] = unique[j], unique[i]
			}
		}
	}

	if len(unique) > maxClips {
		unique = unique[:maxClips]
	}

	return unique
}

// filterByDurationBudget filters clips to fit within duration budget
// Keeps highest relevance clips that fit within the budget
func (s *BrollSuggestionService) filterByDurationBudget(clips []BrollClipSuggestion, budget float64) []BrollClipSuggestion {
	if budget <= 0 {
		s.logger.Warn("Invalid duration budget", zap.Float64("budget", budget))
		return clips
	}

	filtered := []BrollClipSuggestion{}
	runningTotal := 0.0

	// Clips are already sorted by relevance from deduplicateAndRank
	for _, clip := range clips {
		// Try to fit this clip
		if runningTotal+clip.Duration <= budget {
			filtered = append(filtered, clip)
			runningTotal += clip.Duration
		} else {
			// Check if we can fit a shorter clip or if this is the last chance
			remaining := budget - runningTotal
			if remaining >= 2.0 { // Minimum 2 seconds for meaningful B-roll
				// Could modify clip duration here, but for now just skip
				s.logger.Debug("Skipping clip - would exceed budget",
					zap.String("clip", clip.Name),
					zap.Float64("clip_duration", clip.Duration),
					zap.Float64("remaining_budget", remaining))
				continue
			} else {
				// Not enough budget left for any more clips
				break
			}
		}
	}

	s.logger.Info("Duration budget filter applied",
		zap.Int("clips_before", len(clips)),
		zap.Int("clips_after", len(filtered)),
		zap.Float64("budget", budget),
		zap.Float64("total_duration", runningTotal),
		zap.Float64("budget_utilization_percent", (runningTotal/budget)*100))

	return filtered
}
