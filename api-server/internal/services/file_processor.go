// internal/services/file_processor.go
package services

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/xuri/excelize/v2"
	"go.uber.org/zap"
)

type FileProcessor struct {
	logger *zap.Logger
}

func NewFileProcessor(logger *zap.Logger) *FileProcessor {
	return &FileProcessor{logger: logger}
}

// ProcessCSV processes a CSV file and returns testimonial data
func (fp *FileProcessor) ProcessCSV(ctx context.Context, file io.Reader) ([]models.TestimonialUpload, error) {
	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1 // Allow variable number of fields

	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV: %w", err)
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("CSV file is empty")
	}

	// Parse header row
	headers := records[0]
	headerMap := make(map[string]int)
	for i, header := range headers {
		headerMap[strings.ToLower(strings.TrimSpace(header))] = i
	}

	var testimonials []models.TestimonialUpload

	for i, record := range records[1:] { // Skip header row
		testimonial, err := fp.parseCSVRecord(record, headerMap, i+2) // +2 for header skip and 1-based indexing
		if err != nil {
			fp.logger.Warn("Failed to parse CSV record",
				zap.Int("row", i+2),
				zap.Error(err))
			continue
		}
		testimonials = append(testimonials, testimonial)
	}

	return testimonials, nil
}

// ProcessXLS processes an Excel file and returns testimonial data
func (fp *FileProcessor) ProcessXLS(ctx context.Context, file io.Reader) ([]models.TestimonialUpload, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %w", err)
	}

	sheetName := f.GetSheetName(0) // Get first sheet
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to get rows: %w", err)
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("excel file is empty")
	}

	// Parse header row
	headers := rows[0]
	headerMap := make(map[string]int)
	for i, header := range headers {
		headerMap[strings.ToLower(strings.TrimSpace(header))] = i
	}

	var testimonials []models.TestimonialUpload

	for i, row := range rows[1:] { // Skip header row
		testimonial, err := fp.parseCSVRecord(row, headerMap, i+2)
		if err != nil {
			fp.logger.Warn("Failed to parse Excel record",
				zap.Int("row", i+2),
				zap.Error(err))
			continue
		}
		testimonials = append(testimonials, testimonial)
	}

	return testimonials, nil
}

func (fp *FileProcessor) parseCSVRecord(record []string, headerMap map[string]int, rowNum int) (models.TestimonialUpload, error) {
	getValue := func(key string) string {
		if idx, exists := headerMap[key]; exists && idx < len(record) {
			return strings.TrimSpace(record[idx])
		}
		return ""
	}

	// Required fields
	content := getValue("content")
	if content == "" {
		content = getValue("testimonial")
		if content == "" {
			content = getValue("review")
			if content == "" {
				return models.TestimonialUpload{}, fmt.Errorf("missing required content field")
			}
		}
	}

	authorName := getValue("author_name")
	if authorName == "" {
		authorName = getValue("name")
		if authorName == "" {
			authorName = getValue("customer_name")
		}
	}

	authorEmail := getValue("author_email")
	if authorEmail == "" {
		authorEmail = getValue("email")
	}

	// Optional fields
	authorCompany := getValue("author_company")
	if authorCompany == "" {
		authorCompany = getValue("company")
	}

	authorTitle := getValue("author_title")
	if authorTitle == "" {
		authorTitle = getValue("title")
		if authorTitle == "" {
			authorTitle = getValue("position")
		}
	}

	// Parse rating
	var rating *int
	ratingStr := getValue("rating")
	if ratingStr != "" {
		if r, err := strconv.Atoi(ratingStr); err == nil && r >= 1 && r <= 5 {
			rating = &r
		}
	}

	// Parse tags
	var tags []string
	tagsStr := getValue("tags")
	if tagsStr != "" {
		for _, tag := range strings.Split(tagsStr, ",") {
			if trimmed := strings.TrimSpace(tag); trimmed != "" {
				tags = append(tags, trimmed)
			}
		}
	}

	return models.TestimonialUpload{
		AuthorName:       authorName,
		AuthorEmail:      authorEmail,
		AuthorCompany:    authorCompany,
		AuthorTitle:      authorTitle,
		Content:          content,
		Rating:           rating,
		CollectionMethod: "csv_import",
		Tags:             tags,
	}, nil
}
