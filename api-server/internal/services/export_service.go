package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/xuri/excelize/v2"
	"go.uber.org/zap"
)

type ExportService struct {
	logger               *zap.Logger
	analyticsService     *AnalyticsService
	testimonialRepo      repositories.TestimonialRepository
	artifactsRepo        *repositories.TestimonialArtifactRepository
}

func NewExportService(
	logger *zap.Logger,
	analyticsService *AnalyticsService,
	testimonialRepo repositories.TestimonialRepository,
	artifactsRepo *repositories.TestimonialArtifactRepository,
) *ExportService {
	return &ExportService{
		logger:           logger,
		analyticsService: analyticsService,
		testimonialRepo:  testimonialRepo,
		artifactsRepo:    artifactsRepo,
	}
}

// ExportAnalyticsToExcel exports analytics data to Excel format
func (s *ExportService) ExportAnalyticsToExcel(
	ctx context.Context,
	workspaceID uuid.UUID,
	filters models.TestimonialFilter,
) (*excelize.File, error) {
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			s.logger.Error("Failed to close Excel file", zap.Error(err))
		}
	}()

	// Create sheets
	if err := s.createOverviewSheet(ctx, f, workspaceID, filters); err != nil {
		return nil, fmt.Errorf("failed to create overview sheet: %w", err)
	}

	if err := s.createSentimentSheet(ctx, f, workspaceID, filters); err != nil {
		return nil, fmt.Errorf("failed to create sentiment sheet: %w", err)
	}

	if err := s.createThemesSheet(ctx, f, workspaceID, filters); err != nil {
		return nil, fmt.Errorf("failed to create themes sheet: %w", err)
	}

	if err := s.createTestimonialsSheet(ctx, f, workspaceID, filters); err != nil {
		return nil, fmt.Errorf("failed to create testimonials sheet: %w", err)
	}

	// Delete default Sheet1
	if err := f.DeleteSheet("Sheet1"); err != nil {
		s.logger.Warn("Failed to delete default sheet", zap.Error(err))
	}

	return f, nil
}

// createOverviewSheet creates the overview summary sheet
func (s *ExportService) createOverviewSheet(
	ctx context.Context,
	f *excelize.File,
	workspaceID uuid.UUID,
	filters models.TestimonialFilter,
) error {
	sheetName := "Overview"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return err
	}
	f.SetActiveSheet(index)

	// Header style
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 12, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"1F2937"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	// Set headers
	headers := []string{"Metric", "Value"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// Get testimonials for metrics calculation
	testimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, filters, s.analyticsService.db)
	if err != nil {
		return err
	}

	filteredTestimonials := testimonials

	// Calculate metrics
	totalCount := len(filteredTestimonials)
	videoCount := 0
	textCount := 0
	totalSentiment := 0.0
	positiveCount := 0
	neutralCount := 0
	negativeCount := 0

	for _, t := range filteredTestimonials {
		if t.Type == "video" {
			videoCount++
		} else {
			textCount++
		}

		totalSentiment += float64(t.SentimentScore)
		if t.SentimentScore >= 0.6 {
			positiveCount++
		} else if t.SentimentScore >= 0.4 {
			neutralCount++
		} else {
			negativeCount++
		}
	}

	avgSentiment := 0.0
	if totalCount > 0 {
		avgSentiment = totalSentiment / float64(totalCount)
	}

	// Write metrics
	metrics := [][]interface{}{
		{"Total Testimonials", totalCount},
		{"Video Testimonials", videoCount},
		{"Text Testimonials", textCount},
		{"Average Sentiment", fmt.Sprintf("%.1f%%", avgSentiment)},
		{"Positive Sentiment", positiveCount},
		{"Neutral Sentiment", neutralCount},
		{"Negative Sentiment", negativeCount},
		{"Export Date", time.Now().Format("2006-01-02 15:04:05")},
	}

	for i, metric := range metrics {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), metric[0])
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), metric[1])
	}

	// Set column widths
	f.SetColWidth(sheetName, "A", "A", 25)
	f.SetColWidth(sheetName, "B", "B", 20)

	return nil
}

// createSentimentSheet creates the sentiment analysis sheet
func (s *ExportService) createSentimentSheet(
	ctx context.Context,
	f *excelize.File,
	workspaceID uuid.UUID,
	filters models.TestimonialFilter,
) error {
	sheetName := "Sentiment Analysis"
	_, err := f.NewSheet(sheetName)
	if err != nil {
		return err
	}

	// Header style
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"1F2937"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	// Set headers
	headers := []string{"Date", "Positive %", "Neutral %", "Negative %", "Total Count"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// Get sentiment timeline data
	from := filters.CreatedAfter
	to := filters.CreatedBefore
	timeline, err := s.analyticsService.GetSentimentTimeline(ctx, workspaceID, from, to, "day")
	if err != nil {
		s.logger.Warn("Failed to get sentiment timeline for export", zap.Error(err))
		return nil
	}

	// Write timeline data
	if timeline != nil && timeline.Dates != nil && len(timeline.Dates) > 0 {
		for i := range timeline.Dates {
			row := i + 2
			positive := 0
			neutral := 0
			negative := 0

			if timeline.Sentiment.Positive != nil && i < len(timeline.Sentiment.Positive) {
				positive = timeline.Sentiment.Positive[i]
			}
			if timeline.Sentiment.Neutral != nil && i < len(timeline.Sentiment.Neutral) {
				neutral = timeline.Sentiment.Neutral[i]
			}
			if timeline.Sentiment.Negative != nil && i < len(timeline.Sentiment.Negative) {
				negative = timeline.Sentiment.Negative[i]
			}

			total := positive + neutral + negative
			positivePct := 0.0
			neutralPct := 0.0
			negativePct := 0.0

			if total > 0 {
				positivePct = float64(positive) / float64(total) * 100
				neutralPct = float64(neutral) / float64(total) * 100
				negativePct = float64(negative) / float64(total) * 100
			}

			f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), timeline.Dates[i])
			f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), fmt.Sprintf("%.1f", positivePct))
			f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), fmt.Sprintf("%.1f", neutralPct))
			f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), fmt.Sprintf("%.1f", negativePct))
			f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), total)
		}
	}

	// Set column widths
	f.SetColWidth(sheetName, "A", "E", 15)

	return nil
}

// createThemesSheet creates the themes/features sheet
func (s *ExportService) createThemesSheet(
	ctx context.Context,
	f *excelize.File,
	workspaceID uuid.UUID,
	filters models.TestimonialFilter,
) error {
	sheetName := "Themes & Features"
	_, err := f.NewSheet(sheetName)
	if err != nil {
		return err
	}

	// Header style
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"1F2937"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	// Set headers
	headers := []string{"Theme/Feature", "Mentions", "Sentiment"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// Get feature heatmap data
	heatmap, err := s.analyticsService.GetFeatureHeatmap(ctx, workspaceID, filters)
	if err != nil {
		s.logger.Warn("Failed to get feature heatmap for export", zap.Error(err))
		return nil
	}

	// Write feature data
	if heatmap != nil && heatmap.Features != nil && len(heatmap.Features) > 0 {
		for i := range heatmap.Features {
			row := i + 2
			mentions := 0
			sentiment := "N/A"

			if heatmap.Mentions != nil && i < len(heatmap.Mentions) {
				mentions = heatmap.Mentions[i]
			}
			if heatmap.Sentiment != nil && i < len(heatmap.Sentiment) {
				sentiment = heatmap.Sentiment[i]
			}

			f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), heatmap.Features[i])
			f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), mentions)
			f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), sentiment)
		}
	}

	// Set column widths
	f.SetColWidth(sheetName, "A", "A", 30)
	f.SetColWidth(sheetName, "B", "C", 15)

	return nil
}

// createTestimonialsSheet creates the detailed testimonials sheet
func (s *ExportService) createTestimonialsSheet(
	ctx context.Context,
	f *excelize.File,
	workspaceID uuid.UUID,
	filters models.TestimonialFilter,
) error {
	sheetName := "Testimonials"
	_, err := f.NewSheet(sheetName)
	if err != nil {
		return err
	}

	// Header style
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"1F2937"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	// Set headers
	headers := []string{
		"ID", "Type", "Created Date", "Author Name", "Author Title",
		"Author Company", "Rating", "Sentiment Score", "Content Preview",
	}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
		f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}

	// Get testimonials
	testimonials, err := s.testimonialRepo.FetchByWorkspaceID(ctx, workspaceID, filters, s.analyticsService.db)
	if err != nil {
		return err
	}

	// Write testimonial data
	for i, t := range testimonials {
		row := i + 2

		authorName := ""
		authorTitle := ""
		authorCompany := ""
		if t.AuthorName != nil {
			authorName = *t.AuthorName
		}
		if t.AuthorTitle != nil {
			authorTitle = *t.AuthorTitle
		}
		if t.AuthorCompany != nil {
			authorCompany = *t.AuthorCompany
		}

		rating := ""
		if t.Rating != nil {
			rating = fmt.Sprintf("%d/5", *t.Rating)
		}

		sentiment := ""
		if t.SentimentScore > 0 {
			sentiment = fmt.Sprintf("%.1f%%", t.SentimentScore*100)
		}

		contentPreview := ""
		if t.Content != nil && len(*t.Content) > 0 {
			if len(*t.Content) > 100 {
				contentPreview = (*t.Content)[:100] + "..."
			} else {
				contentPreview = *t.Content
			}
		}

		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), t.ID.String())
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), t.Type)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), t.CreatedAt.Format("2006-01-02"))
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), authorName)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), authorTitle)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), authorCompany)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), rating)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), sentiment)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), contentPreview)
	}

	// Set column widths
	f.SetColWidth(sheetName, "A", "A", 40)
	f.SetColWidth(sheetName, "B", "B", 10)
	f.SetColWidth(sheetName, "C", "C", 15)
	f.SetColWidth(sheetName, "D", "F", 20)
	f.SetColWidth(sheetName, "G", "H", 15)
	f.SetColWidth(sheetName, "I", "I", 50)

	return nil
}
