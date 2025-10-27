package services

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

// AnalyticsService handles analytics computations
type AnalyticsService struct {
	logger          *zap.Logger
	testimonialRepo repositories.TestimonialRepository
	analyticsRepo   repositories.AnalyticsRepository
	db              *sql.DB
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService(
	logger *zap.Logger,
	testimonialRepo repositories.TestimonialRepository,
	analyticsRepo repositories.AnalyticsRepository,
	db *sql.DB,
) *AnalyticsService {
	return &AnalyticsService{
		logger:          logger,
		testimonialRepo: testimonialRepo,
		analyticsRepo:   analyticsRepo,
		db:              db,
	}
}

// GetSentimentTimeline generates sentiment timeline data
func (s *AnalyticsService) GetSentimentTimeline(ctx context.Context, workspaceID uuid.UUID, dateFrom, dateTo *time.Time, granularity string) (*models.SentimentTimelineData, error) {
	// Set default date range if not provided
	if dateFrom == nil {
		thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
		dateFrom = &thirtyDaysAgo
	}
	if dateTo == nil {
		now := time.Now()
		dateTo = &now
	}

	// Fetch testimonials for the date range
	filter := models.TestimonialFilter{
		CreatedAfter:  dateFrom,
		CreatedBefore: dateTo,
	}

	testimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, filter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch testimonials: %w", err)
	}

	if len(testimonials) == 0 {
		return &models.SentimentTimelineData{
			Dates:     []string{},
			Sentiment: models.SentimentBreakdown{Positive: []int{}, Neutral: []int{}, Negative: []int{}},
			NPSScore:  []float64{},
			Trend:     "stable",
			TrendPct:  0,
		}, nil
	}

	// Group testimonials by time bucket based on granularity
	buckets := s.groupByTimeBucket(testimonials, *dateFrom, *dateTo, granularity)

	var dates []string
	var positive, neutral, negative []int
	var npsScores []float64

	// Calculate sentiment breakdown per bucket
	for _, bucket := range buckets {
		dates = append(dates, bucket.Date)

		pos, neu, neg := s.categorizeSentimentBreakdown(bucket.Testimonials)
		positive = append(positive, pos)
		neutral = append(neutral, neu)
		negative = append(negative, neg)

		nps := s.calculateNPS(bucket.Testimonials)
		npsScores = append(npsScores, nps)
	}

	// Calculate trend
	trend, trendPct := s.calculateTrend(positive, negative)

	return &models.SentimentTimelineData{
		Dates: dates,
		Sentiment: models.SentimentBreakdown{
			Positive: positive,
			Neutral:  neutral,
			Negative: negative,
		},
		NPSScore: npsScores,
		Trend:    trend,
		TrendPct: trendPct,
	}, nil
}

// TimeBucket represents a time bucket with testimonials
type TimeBucket struct {
	Date         string
	Testimonials []models.Testimonial
}

// groupByTimeBucket groups testimonials by time granularity
func (s *AnalyticsService) groupByTimeBucket(testimonials []models.Testimonial, from, to time.Time, granularity string) []TimeBucket {
	bucketMap := make(map[string][]models.Testimonial)

	for _, t := range testimonials {
		var bucketKey string
		switch granularity {
		case "day":
			bucketKey = t.CreatedAt.Format("2006-01-02")
		case "week":
			year, week := t.CreatedAt.ISOWeek()
			bucketKey = fmt.Sprintf("%d-W%02d", year, week)
		case "month":
			bucketKey = t.CreatedAt.Format("2006-01")
		default:
			bucketKey = t.CreatedAt.Format("2006-01-02")
		}

		bucketMap[bucketKey] = append(bucketMap[bucketKey], t)
	}

	// Sort buckets by date
	var buckets []TimeBucket
	for date, testimonials := range bucketMap {
		buckets = append(buckets, TimeBucket{Date: date, Testimonials: testimonials})
	}

	sort.Slice(buckets, func(i, j int) bool {
		return buckets[i].Date < buckets[j].Date
	})

	return buckets
}

// categorizeSentimentBreakdown categorizes testimonials by sentiment
func (s *AnalyticsService) categorizeSentimentBreakdown(testimonials []models.Testimonial) (positive, neutral, negative int) {
	for _, t := range testimonials {
		score := t.SentimentScore
		if score >= 0.6 {
			positive++
		} else if score >= 0.4 {
			neutral++
		} else {
			negative++
		}
	}
	return
}

// calculateNPS calculates Net Promoter Score
func (s *AnalyticsService) calculateNPS(testimonials []models.Testimonial) float64 {
	if len(testimonials) == 0 {
		return 0
	}

	var promoters, detractors int

	for _, t := range testimonials {
		if t.Rating == nil {
			continue
		}

		rating := *t.Rating
		if rating >= 4 {
			promoters++
		} else if rating <= 2 {
			detractors++
		}
	}

	total := len(testimonials)
	if total == 0 {
		return 0
	}

	nps := ((float64(promoters) - float64(detractors)) / float64(total)) * 100
	return math.Round(nps*100) / 100
}

// calculateTrend analyzes sentiment trend
func (s *AnalyticsService) calculateTrend(positive, negative []int) (string, float64) {
	if len(positive) < 2 {
		return "stable", 0
	}

	// Compare first half vs second half
	mid := len(positive) / 2
	firstHalfPos := s.sum(positive[:mid])
	secondHalfPos := s.sum(positive[mid:])
	firstHalfNeg := s.sum(negative[:mid])
	secondHalfNeg := s.sum(negative[mid:])

	firstTotal := firstHalfPos + firstHalfNeg
	secondTotal := secondHalfPos + secondHalfNeg

	if firstTotal == 0 || secondTotal == 0 {
		return "stable", 0
	}

	firstPct := float64(firstHalfPos) / float64(firstTotal) * 100
	secondPct := float64(secondHalfPos) / float64(secondTotal) * 100

	diff := secondPct - firstPct

	if diff > 5 {
		return "improving", math.Round(diff*100) / 100
	} else if diff < -5 {
		return "declining", math.Round(diff*100) / 100
	}

	return "stable", 0
}

func (s *AnalyticsService) sum(arr []int) int {
	total := 0
	for _, v := range arr {
		total += v
	}
	return total
}

// GetSentimentTimelineWithFilters generates sentiment timeline data with additional filters
func (s *AnalyticsService) GetSentimentTimelineWithFilters(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter, granularity string) (*models.SentimentTimelineData, error) {
	// Set default date range if not provided
	if filter.CreatedAfter == nil {
		thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
		filter.CreatedAfter = &thirtyDaysAgo
	}
	if filter.CreatedBefore == nil {
		now := time.Now()
		filter.CreatedBefore = &now
	}

	// Fetch testimonials with all filters applied
	testimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, filter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch testimonials: %w", err)
	}

	if len(testimonials) == 0 {
		return &models.SentimentTimelineData{
			Dates:     []string{},
			Sentiment: models.SentimentBreakdown{Positive: []int{}, Neutral: []int{}, Negative: []int{}},
			NPSScore:  []float64{},
			Trend:     "stable",
			TrendPct:  0,
		}, nil
	}

	// Group testimonials by time bucket based on granularity
	buckets := s.groupByTimeBucket(testimonials, *filter.CreatedAfter, *filter.CreatedBefore, granularity)

	var dates []string
	var positive, neutral, negative []int
	var npsScores []float64

	// Calculate sentiment breakdown per bucket
	for _, bucket := range buckets {
		dates = append(dates, bucket.Date)

		pos, neu, neg := s.categorizeSentimentBreakdown(bucket.Testimonials)
		positive = append(positive, pos)
		neutral = append(neutral, neu)
		negative = append(negative, neg)

		nps := s.calculateNPS(bucket.Testimonials)
		npsScores = append(npsScores, nps)
	}

	// Calculate trend
	trend, trendPct := s.calculateTrend(positive, negative)

	return &models.SentimentTimelineData{
		Dates: dates,
		Sentiment: models.SentimentBreakdown{
			Positive: positive,
			Neutral:  neutral,
			Negative: negative,
		},
		NPSScore: npsScores,
		Trend:    trend,
		TrendPct: trendPct,
	}, nil
}

// GetComparativeAnalysis compares two time periods
func (s *AnalyticsService) GetComparativeAnalysis(ctx context.Context, workspaceID uuid.UUID, primaryFrom, primaryTo, comparisonFrom, comparisonTo time.Time) (*models.ComparativeAnalysisResult, error) {
	// Fetch testimonials for both periods
	primaryFilter := models.TestimonialFilter{
		CreatedAfter:  &primaryFrom,
		CreatedBefore: &primaryTo,
	}
	primaryTestimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, primaryFilter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch primary period testimonials: %w", err)
	}

	comparisonFilter := models.TestimonialFilter{
		CreatedAfter:  &comparisonFrom,
		CreatedBefore: &comparisonTo,
	}
	comparisonTestimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, comparisonFilter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch comparison period testimonials: %w", err)
	}

	// Calculate sentiment stats for both periods
	primarySentiment := s.calculateSentimentStats(primaryTestimonials)
	comparisonSentiment := s.calculateSentimentStats(comparisonTestimonials)

	// Calculate sentiment change
	sentimentChange := fmt.Sprintf("%.1f%% positive, %.1f%% negative",
		primarySentiment.Positive-comparisonSentiment.Positive,
		primarySentiment.Negative-comparisonSentiment.Negative)

	// Calculate volume metrics
	primaryVolume := len(primaryTestimonials)
	comparisonVolume := len(comparisonTestimonials)
	volumeChangePct := 0.0
	if comparisonVolume > 0 {
		volumeChangePct = ((float64(primaryVolume) - float64(comparisonVolume)) / float64(comparisonVolume)) * 100
	}

	volumeChange := fmt.Sprintf("%+.1f%% testimonials", volumeChangePct)

	// Calculate NPS for both periods
	primaryNPS := s.calculateNPS(primaryTestimonials)
	comparisonNPS := s.calculateNPS(comparisonTestimonials)
	npsChange := fmt.Sprintf("%+.1f points", primaryNPS-comparisonNPS)

	// Extract themes
	primaryThemes := s.extractTopThemes(primaryTestimonials, 10)
	comparisonThemes := s.extractTopThemes(comparisonTestimonials, 10)

	newThemes := s.findNewThemes(primaryThemes, comparisonThemes)
	decliningThemes := s.findNewThemes(comparisonThemes, primaryThemes)

	// Generate insights
	insights := s.generateComparativeInsights(primarySentiment, comparisonSentiment, primaryVolume, comparisonVolume, primaryNPS, comparisonNPS)

	return &models.ComparativeAnalysisResult{
		Comparison: models.ComparativeMetrics{
			Sentiment: models.ComparativeSentiment{
				Primary:    primarySentiment,
				Comparison: comparisonSentiment,
				Change:     sentimentChange,
			},
			Volume: models.ComparativeVolume{
				Primary:    primaryVolume,
				Comparison: comparisonVolume,
				Change:     volumeChange,
				ChangePct:  volumeChangePct,
			},
			TopThemes: models.ComparativeThemes{
				NewThemes:       newThemes,
				DecliningThemes: decliningThemes,
			},
			NPS: models.ComparativeNPS{
				Primary:    primaryNPS,
				Comparison: comparisonNPS,
				Change:     npsChange,
			},
		},
		Insights: insights,
	}, nil
}

// GetComparativeAnalysisWithFilters compares two time periods with additional filters
func (s *AnalyticsService) GetComparativeAnalysisWithFilters(ctx context.Context, workspaceID uuid.UUID, primaryFrom, primaryTo, comparisonFrom, comparisonTo time.Time, baseFilter models.TestimonialFilter) (*models.ComparativeAnalysisResult, error) {
	// Fetch testimonials for both periods with filters
	primaryFilter := baseFilter
	primaryFilter.CreatedAfter = &primaryFrom
	primaryFilter.CreatedBefore = &primaryTo

	primaryTestimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, primaryFilter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch primary period testimonials: %w", err)
	}

	comparisonFilter := baseFilter
	comparisonFilter.CreatedAfter = &comparisonFrom
	comparisonFilter.CreatedBefore = &comparisonTo

	comparisonTestimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, comparisonFilter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch comparison period testimonials: %w", err)
	}

	// Calculate sentiment stats for both periods
	primarySentiment := s.calculateSentimentStats(primaryTestimonials)
	comparisonSentiment := s.calculateSentimentStats(comparisonTestimonials)

	// Calculate sentiment change
	sentimentChange := fmt.Sprintf("%.1f%% positive, %.1f%% negative",
		primarySentiment.Positive-comparisonSentiment.Positive,
		primarySentiment.Negative-comparisonSentiment.Negative)

	// Calculate volume metrics
	primaryVolume := len(primaryTestimonials)
	comparisonVolume := len(comparisonTestimonials)
	volumeChangePct := 0.0
	if comparisonVolume > 0 {
		volumeChangePct = ((float64(primaryVolume) - float64(comparisonVolume)) / float64(comparisonVolume)) * 100
	}

	volumeChange := fmt.Sprintf("%+.1f%% testimonials", volumeChangePct)

	// Calculate NPS for both periods
	primaryNPS := s.calculateNPS(primaryTestimonials)
	comparisonNPS := s.calculateNPS(comparisonTestimonials)
	npsChange := fmt.Sprintf("%+.1f points", primaryNPS-comparisonNPS)

	// Extract themes
	primaryThemes := s.extractTopThemes(primaryTestimonials, 10)
	comparisonThemes := s.extractTopThemes(comparisonTestimonials, 10)

	newThemes := s.findNewThemes(primaryThemes, comparisonThemes)
	decliningThemes := s.findNewThemes(comparisonThemes, primaryThemes)

	// Generate insights
	insights := s.generateComparativeInsights(primarySentiment, comparisonSentiment, primaryVolume, comparisonVolume, primaryNPS, comparisonNPS)

	return &models.ComparativeAnalysisResult{
		Comparison: models.ComparativeMetrics{
			Sentiment: models.ComparativeSentiment{
				Primary:    primarySentiment,
				Comparison: comparisonSentiment,
				Change:     sentimentChange,
			},
			Volume: models.ComparativeVolume{
				Primary:    primaryVolume,
				Comparison: comparisonVolume,
				Change:     volumeChange,
				ChangePct:  volumeChangePct,
			},
			TopThemes: models.ComparativeThemes{
				NewThemes:       newThemes,
				DecliningThemes: decliningThemes,
			},
			NPS: models.ComparativeNPS{
				Primary:    primaryNPS,
				Comparison: comparisonNPS,
				Change:     npsChange,
			},
		},
		Insights: insights,
	}, nil
}

// calculateSentimentStats calculates sentiment statistics
func (s *AnalyticsService) calculateSentimentStats(testimonials []models.Testimonial) models.SentimentStats {
	if len(testimonials) == 0 {
		return models.SentimentStats{Positive: 0, Neutral: 0, Negative: 0}
	}

	pos, neu, neg := s.categorizeSentimentBreakdown(testimonials)
	total := float64(len(testimonials))

	return models.SentimentStats{
		Positive: (float64(pos) / total) * 100,
		Neutral:  (float64(neu) / total) * 100,
		Negative: (float64(neg) / total) * 100,
	}
}

// extractTopThemes extracts most common words/phrases from testimonials
func (s *AnalyticsService) extractTopThemes(testimonials []models.Testimonial, limit int) []string {
	wordFreq := make(map[string]int)

	for _, t := range testimonials {
		if t.Content == nil {
			continue
		}

		words := strings.Fields(strings.ToLower(*t.Content))
		for _, word := range words {
			// Filter out common stop words and short words
			if len(word) < 4 || s.isStopWord(word) {
				continue
			}
			wordFreq[word]++
		}
	}

	// Sort by frequency
	type wordCount struct {
		word  string
		count int
	}

	var wordCounts []wordCount
	for word, count := range wordFreq {
		wordCounts = append(wordCounts, wordCount{word, count})
	}

	sort.Slice(wordCounts, func(i, j int) bool {
		return wordCounts[i].count > wordCounts[j].count
	})

	var themes []string
	for i := 0; i < len(wordCounts) && i < limit; i++ {
		themes = append(themes, wordCounts[i].word)
	}

	return themes
}

// findNewThemes finds themes in set A that are not in set B
func (s *AnalyticsService) findNewThemes(setA, setB []string) []string {
	setBMap := make(map[string]bool)
	for _, theme := range setB {
		setBMap[theme] = true
	}

	var newThemes []string
	for _, theme := range setA {
		if !setBMap[theme] {
			newThemes = append(newThemes, theme)
		}
	}

	// Limit to top 5
	if len(newThemes) > 5 {
		return newThemes[:5]
	}
	return newThemes
}

// generateComparativeInsights generates insights from comparative analysis
func (s *AnalyticsService) generateComparativeInsights(primarySentiment, comparisonSentiment models.SentimentStats, primaryVolume, comparisonVolume int, primaryNPS, comparisonNPS float64) []string {
	var insights []string

	// Sentiment insight
	sentimentDiff := primarySentiment.Positive - comparisonSentiment.Positive
	if sentimentDiff > 5 {
		insights = append(insights, fmt.Sprintf("Sentiment improved by %.1f%% in the selected period", sentimentDiff))
	} else if sentimentDiff < -5 {
		insights = append(insights, fmt.Sprintf("Sentiment declined by %.1f%% in the selected period", math.Abs(sentimentDiff)))
	}

	// Volume insight
	if comparisonVolume > 0 {
		volumeChangePct := ((float64(primaryVolume) - float64(comparisonVolume)) / float64(comparisonVolume)) * 100
		if volumeChangePct > 20 {
			insights = append(insights, fmt.Sprintf("Testimonial volume increased by %.1f%%, indicating growing engagement", volumeChangePct))
		} else if volumeChangePct < -20 {
			insights = append(insights, fmt.Sprintf("Testimonial volume decreased by %.1f%%, may need attention", math.Abs(volumeChangePct)))
		}
	}

	// NPS insight
	npsDiff := primaryNPS - comparisonNPS
	if npsDiff > 10 {
		insights = append(insights, fmt.Sprintf("NPS increased by %.1f points, showing improved customer satisfaction", npsDiff))
	} else if npsDiff < -10 {
		insights = append(insights, fmt.Sprintf("NPS decreased by %.1f points, may indicate customer concerns", math.Abs(npsDiff)))
	}

	if len(insights) == 0 {
		insights = append(insights, "Metrics are relatively stable across both periods")
	}

	return insights
}

// isStopWord checks if a word is a common stop word
func (s *AnalyticsService) isStopWord(word string) bool {
	stopWords := map[string]bool{
		"the": true, "and": true, "for": true, "with": true, "this": true,
		"that": true, "have": true, "from": true, "they": true, "which": true,
		"their": true, "what": true, "about": true, "would": true, "there": true,
		"been": true, "were": true, "when": true, "where": true, "these": true,
	}
	return stopWords[word]
}

// GetWordCloudData generates word cloud data
func (s *AnalyticsService) GetWordCloudData(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter) (*models.WordCloudData, error) {
	testimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, filter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch testimonials: %w", err)
	}

	wordFreq := make(map[string]int)
	wordSentiment := make(map[string][]float32)

	for _, t := range testimonials {
		if t.Content == nil {
			continue
		}

		words := strings.Fields(strings.ToLower(*t.Content))
		for _, word := range words {
			if len(word) < 4 || s.isStopWord(word) {
				continue
			}
			wordFreq[word]++
			wordSentiment[word] = append(wordSentiment[word], t.SentimentScore)
		}
	}

	var words []models.WordCloudItem
	for word, count := range wordFreq {
		if count < 2 { // Filter words that appear less than 2 times
			continue
		}

		// Calculate average sentiment for this word
		avgSentiment := s.averageSentiment(wordSentiment[word])
		sentiment := "neutral"
		if avgSentiment >= 0.6 {
			sentiment = "positive"
		} else if avgSentiment < 0.4 {
			sentiment = "negative"
		}

		words = append(words, models.WordCloudItem{
			Text:      word,
			Value:     count,
			Sentiment: sentiment,
		})
	}

	// Sort by frequency and limit to top 50
	sort.Slice(words, func(i, j int) bool {
		return words[i].Value > words[j].Value
	})

	if len(words) > 50 {
		words = words[:50]
	}

	return &models.WordCloudData{Words: words}, nil
}

func (s *AnalyticsService) averageSentiment(scores []float32) float64 {
	if len(scores) == 0 {
		return 0.5
	}

	var sum float32
	for _, score := range scores {
		sum += score
	}
	return float64(sum / float32(len(scores)))
}

// GetFeatureHeatmap generates feature mention frequency data
func (s *AnalyticsService) GetFeatureHeatmap(ctx context.Context, workspaceID uuid.UUID, filter models.TestimonialFilter) (*models.FeatureHeatmapData, error) {
	testimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, filter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch testimonials: %w", err)
	}

	// Common product features to look for
	features := []string{"dashboard", "api", "reports", "support", "pricing", "interface", "performance", "integration", "security", "mobile"}

	featureCounts := make(map[string]int)
	featureSentiments := make(map[string][]float32)

	for _, t := range testimonials {
		if t.Content == nil {
			continue
		}

		contentLower := strings.ToLower(*t.Content)
		for _, feature := range features {
			if strings.Contains(contentLower, feature) {
				featureCounts[feature]++
				featureSentiments[feature] = append(featureSentiments[feature], t.SentimentScore)
			}
		}
	}

	var resultFeatures []string
	var mentions []int
	var sentiments []string

	for _, feature := range features {
		count := featureCounts[feature]
		if count == 0 {
			continue
		}

		avgSentiment := s.averageSentiment(featureSentiments[feature])
		sentiment := "neutral"
		if avgSentiment >= 0.6 {
			sentiment = "positive"
		} else if avgSentiment < 0.4 {
			sentiment = "negative"
		}

		resultFeatures = append(resultFeatures, feature)
		mentions = append(mentions, count)
		sentiments = append(sentiments, sentiment)
	}

	return &models.FeatureHeatmapData{
		Features:  resultFeatures,
		Mentions:  mentions,
		Sentiment: sentiments,
	}, nil
}

// GetSegmentAnalysis analyzes testimonials for a specific segment
func (s *AnalyticsService) GetSegmentAnalysis(ctx context.Context, segmentID uuid.UUID) (*models.SingleSegmentAnalysis, error) {
	// Get segment definition
	segment, err := s.analyticsRepo.GetSegmentDefinition(ctx, segmentID, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get segment definition: %w", err)
	}

	// Build filter from segment criteria
	filter := s.buildFilterFromCriteria(segment.Criteria)

	// Fetch testimonials matching the segment
	testimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, segment.WorkspaceID, filter, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch segment testimonials: %w", err)
	}

	// Calculate metrics
	sentimentStats := s.calculateSentimentStats(testimonials)
	nps := s.calculateNPS(testimonials)
	themes := s.extractTopThemes(testimonials, 10)

	// Update cached metrics in segment
	segment.CachedTestimonialCount = len(testimonials)
	avgSentiment := float32(sentimentStats.Positive)
	segment.CachedAvgSentiment = &avgSentiment
	segment.CachedTopThemes = models.JSONB{"themes": themes}
	now := time.Now()
	segment.CacheUpdatedAt = &now

	if err := s.analyticsRepo.UpdateSegmentDefinition(ctx, segment, s.db); err != nil {
		s.logger.Warn("Failed to update segment cache", zap.Error(err))
	}

	return &models.SingleSegmentAnalysis{
		SegmentID:        segment.ID,
		SegmentName:      segment.Name,
		TestimonialCount: len(testimonials),
		SentimentStats:   sentimentStats,
		NPSScore:         nps,
		TopThemes:        themes,
	}, nil
}

// CompareSegments compares metrics between two segments
func (s *AnalyticsService) CompareSegments(ctx context.Context, segmentID1, segmentID2 uuid.UUID) (*models.SegmentComparisonResult, error) {
	// Analyze both segments
	segment1Analysis, err := s.GetSegmentAnalysis(ctx, segmentID1)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze segment 1: %w", err)
	}

	segment2Analysis, err := s.GetSegmentAnalysis(ctx, segmentID2)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze segment 2: %w", err)
	}

	// Calculate differences
	sentimentDiff := segment1Analysis.SentimentStats.Positive - segment2Analysis.SentimentStats.Positive
	npsDiff := segment1Analysis.NPSScore - segment2Analysis.NPSScore

	// Generate insights
	insights := []string{}
	if sentimentDiff > 10 {
		insights = append(insights, fmt.Sprintf("%s has %.1f%% higher positive sentiment than %s",
			segment1Analysis.SegmentName, sentimentDiff, segment2Analysis.SegmentName))
	} else if sentimentDiff < -10 {
		insights = append(insights, fmt.Sprintf("%s has %.1f%% lower positive sentiment than %s",
			segment1Analysis.SegmentName, math.Abs(sentimentDiff), segment2Analysis.SegmentName))
	}

	if npsDiff > 20 {
		insights = append(insights, fmt.Sprintf("%s has significantly higher NPS (%.1f points)",
			segment1Analysis.SegmentName, npsDiff))
	} else if npsDiff < -20 {
		insights = append(insights, fmt.Sprintf("%s has significantly lower NPS (%.1f points)",
			segment1Analysis.SegmentName, math.Abs(npsDiff)))
	}

	return &models.SegmentComparisonResult{
		Segment1: segment1Analysis,
		Segment2: segment2Analysis,
		Insights: insights,
	}, nil
}

// CreateSegmentDefinition creates a new segment definition
func (s *AnalyticsService) CreateSegmentDefinition(ctx context.Context, segment *models.SegmentDefinition) error {
	if err := s.analyticsRepo.CreateSegmentDefinition(ctx, segment, s.db); err != nil {
		return fmt.Errorf("failed to create segment definition: %w", err)
	}

	s.logger.Info("Created segment definition",
		zap.String("segment_id", segment.ID.String()),
		zap.String("segment_name", segment.Name))

	return nil
}

// ListSegments lists all segments for a workspace
func (s *AnalyticsService) ListSegments(ctx context.Context, workspaceID uuid.UUID, includeInactive bool) ([]*models.SegmentDefinition, error) {
	segments, err := s.analyticsRepo.ListSegmentDefinitions(ctx, workspaceID, includeInactive, s.db)
	if err != nil {
		return nil, fmt.Errorf("failed to list segments: %w", err)
	}

	return segments, nil
}

// CreateSystemSegments creates predefined system segments for a workspace
func (s *AnalyticsService) CreateSystemSegments(ctx context.Context, workspaceID uuid.UUID) error {
	promotersDesc := "Highly satisfied customers (Rating >= 4)"
	promotersColor := "#10b981"
	detractorsDesc := "Dissatisfied customers (Rating <= 2)"
	detractorsColor := "#ef4444"
	recentDesc := "Testimonials from the last 30 days"
	recentColor := "#3b82f6"
	positiveDesc := "Testimonials with positive sentiment"
	positiveColor := "#22c55e"

	systemSegments := []models.SegmentDefinition{
		{
			WorkspaceID:     workspaceID,
			Name:            "Promoters",
			Description:     &promotersDesc,
			Color:           &promotersColor,
			Criteria:        models.JSONB{"rating": map[string]interface{}{"min": 4, "max": 5}},
			SegmentType:     "nps",
			IsSystemDefined: true,
			IsActive:        true,
		},
		{
			WorkspaceID:     workspaceID,
			Name:            "Detractors",
			Description:     &detractorsDesc,
			Color:           &detractorsColor,
			Criteria:        models.JSONB{"rating": map[string]interface{}{"min": 1, "max": 2}},
			SegmentType:     "nps",
			IsSystemDefined: true,
			IsActive:        true,
		},
		{
			WorkspaceID:     workspaceID,
			Name:            "Recent Testimonials",
			Description:     &recentDesc,
			Color:           &recentColor,
			Criteria:        models.JSONB{"date_range": "last_30_days"},
			SegmentType:     "temporal",
			IsSystemDefined: true,
			IsActive:        true,
		},
		{
			WorkspaceID:     workspaceID,
			Name:            "Positive Sentiment",
			Description:     &positiveDesc,
			Color:           &positiveColor,
			Criteria:        models.JSONB{"sentiment": "positive"},
			SegmentType:     "sentiment",
			IsSystemDefined: true,
			IsActive:        true,
		},
	}

	for _, segment := range systemSegments {
		if err := s.CreateSegmentDefinition(ctx, &segment); err != nil {
			s.logger.Warn("Failed to create system segment",
				zap.String("segment_name", segment.Name),
				zap.Error(err))
		}
	}

	s.logger.Info("Created system segments for workspace", zap.String("workspace_id", workspaceID.String()))
	return nil
}

// buildFilterFromCriteria converts segment criteria to testimonial filter
func (s *AnalyticsService) buildFilterFromCriteria(criteria models.JSONB) models.TestimonialFilter {
	filter := models.TestimonialFilter{}

	if rating, ok := criteria["rating"].(map[string]interface{}); ok {
		if min, ok := rating["min"].(float64); ok {
			minInt := int(min)
			filter.MinRating = &minInt
		}
		// Note: MaxRating filter is not available in TestimonialFilter
		// For now, we only use MinRating and will filter max in memory if needed
	}

	// Note: Sentiment filters are not available in TestimonialFilter
	// Sentiment filtering will be done in memory after fetching

	if dateRange, ok := criteria["date_range"].(string); ok {
		now := time.Now()
		switch dateRange {
		case "last_7_days":
			from := now.AddDate(0, 0, -7)
			filter.CreatedAfter = &from
		case "last_30_days":
			from := now.AddDate(0, 0, -30)
			filter.CreatedAfter = &from
		case "last_90_days":
			from := now.AddDate(0, 0, -90)
			filter.CreatedAfter = &from
		}
	}

	return filter
}
