// internal/services/chat_with_data_service.go
package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/middleware"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/vector_store"
	"go.uber.org/zap"
)

// ChatWithDataService handles streaming chat interactions with testimonial data
type ChatWithDataService struct {
	logger             *zap.Logger
	vectorStoreService *vector_store.VectorStoreService
	userRepo           repositories.UserRepository
	aiClient           *ai.AIClient
	db                 *sql.DB
}

// NewChatWithDataService creates a new chat with data service
func NewChatWithDataService(
	logger *zap.Logger,
	vectorStoreService *vector_store.VectorStoreService,
	userRepo repositories.UserRepository,
	aiClient *ai.AIClient,
	db *sql.DB,
) *ChatWithDataService {
	return &ChatWithDataService{
		logger:             logger,
		vectorStoreService: vectorStoreService,
		userRepo:           userRepo,
		aiClient:           aiClient,
		db:                 db,
	}
}

// ChatRequest represents a chat message request
type ChatRequest struct {
	Message     string     `json:"message" validate:"required,min=1,max=2000"`
	WorkspaceID uuid.UUID  `json:"workspace_id" validate:"required"`
	DateFrom    *time.Time `json:"date_from,omitempty"`
	DateTo      *time.Time `json:"date_to,omitempty"`
}

// StreamChatResponse streams chat responses for a user query about testimonials
func (cds *ChatWithDataService) StreamChatResponse(ctx context.Context, req ChatRequest, writer http.ResponseWriter) error {
	if cds.aiClient == nil {
		return fmt.Errorf("AI client not configured")
	}

	// Prepare filter based on date range
	filter := models.TestimonialFilter{}

	// If no explicit date filters provided, try to parse from the message
	if req.DateFrom == nil && req.DateTo == nil {
		dateFrom, dateTo := cds.ParseNaturalLanguageDates(req.Message)
		if dateFrom != nil || dateTo != nil {
			filter.CreatedAfter = dateFrom
			filter.CreatedBefore = dateTo
		}
	} else {
		// Use explicit date filters
		if req.DateFrom != nil {
			filter.CreatedAfter = req.DateFrom
		}
		if req.DateTo != nil {
			filter.CreatedBefore = req.DateTo
		}
	}

	// Get testimonial content for the workspace with filtering
	var testimonialContent string
	var err error
	if filter.CreatedAfter != nil || filter.CreatedBefore != nil {
		testimonialContent, err = cds.vectorStoreService.GetWorkspaceTestimonialContentWithFilter(ctx, req.WorkspaceID, filter)
	} else {
		testimonialContent, err = cds.vectorStoreService.GetWorkspaceTestimonialContent(ctx, req.WorkspaceID)
	}
	if err != nil {
		return fmt.Errorf("failed to retrieve testimonial content: %w", err)
	}

	// Prepare the system prompt
	systemPrompt := `You are an AI insights assistant. Your job is to help businesses gain valuable insights from their customer testimonials.

Analyze the provided testimonials and answer queries by identifying trends, emotions, sentiments, or recurring themes. If useful, summarize key findings or patterns.

Use markdown formatting for better readability. If tabular data is needed, use markdown tables (NOT HTML). Be concise, accurate, and insightful.

The testimonials you'll be analyzing are provided in the user message. Focus on extracting meaningful business insights and actionable recommendations.

IMPORTANT: Only answer based on the testimonial data provided. If you cannot find relevant information in the testimonials, say so clearly.`

	// Prepare the user prompt
	userPrompt := fmt.Sprintf("Here are the testimonials to analyze:\n\n%s\n\nUser Question: %s", testimonialContent, req.Message)

	// Set up SSE headers
	writer.Header().Set("Content-Type", "text/event-stream")
	writer.Header().Set("Cache-Control", "no-cache")
	writer.Header().Set("Connection", "keep-alive")
	writer.Header().Set("Access-Control-Allow-Origin", "*")
	writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Use the AI client's Stream method
	streamChan, err := cds.aiClient.Stream(ctx, userPrompt, systemPrompt)
	if err != nil {
		return fmt.Errorf("failed to start streaming: %w", err)
	}

	// Stream the response chunks to the client
	for chunk := range streamChan {
		if chunk.Error != nil {
			cds.logger.Error("Stream error", zap.Error(chunk.Error))
			// Send error to client
			errorData := map[string]interface{}{
				"error":     chunk.Error.Error(),
				"done":      true,
				"timestamp": time.Now().Unix(),
			}
			jsonResponse, _ := json.Marshal(errorData)
			fmt.Fprintf(writer, "data: %s\n\n", jsonResponse)
			if flusher, ok := writer.(http.Flusher); ok {
				flusher.Flush()
			}
			return chunk.Error
		}

		if chunk.IsComplete {
			// Send completion signal
			responseData := map[string]interface{}{
				"done":      true,
				"timestamp": time.Now().Unix(),
			}
			jsonResponse, err := json.Marshal(responseData)
			if err != nil {
				cds.logger.Error("Failed to marshal completion response", zap.Error(err))
				continue
			}
			fmt.Fprintf(writer, "data: %s\n\n", jsonResponse)
			if flusher, ok := writer.(http.Flusher); ok {
				flusher.Flush()
			}
			break
		}

		if chunk.Content != "" {
			// Send content chunk
			responseData := map[string]interface{}{
				"content":   chunk.Content,
				"done":      false,
				"timestamp": time.Now().Unix(),
			}

			jsonResponse, err := json.Marshal(responseData)
			if err != nil {
				cds.logger.Error("Failed to marshal response", zap.Error(err))
				continue
			}

			fmt.Fprintf(writer, "data: %s\n\n", jsonResponse)

			// Flush immediately for streaming
			if flusher, ok := writer.(http.Flusher); ok {
				flusher.Flush()
			}
		}
	}

	cds.logger.Info("Chat response streamed successfully")
	return nil
}

// ValidateWorkspaceAccess validates that the user has access to the workspace
func (cds *ChatWithDataService) ValidateWorkspaceAccess(ctx context.Context) error {
	uid, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return fmt.Errorf("user is not authorized to access resource: %w", err)
	}

	workspace, err := cds.userRepo.GetWorkspaceByUID(ctx, uid, cds.db)
	if err != nil {
		return fmt.Errorf("workspace not found or not accessible: %w", err)
	}

	cds.logger.Debug("Workspace access validated",
		zap.String("workspace_id", workspace.ID.String()),
		zap.String("workspace_name", workspace.Name))

	return nil
}

// ParseNaturalLanguageDates attempts to extract date ranges from natural language
func (cds *ChatWithDataService) ParseNaturalLanguageDates(message string) (dateFrom *time.Time, dateTo *time.Time) {
	message = strings.ToLower(message)
	now := time.Now()

	// Handle common relative date expressions
	if strings.Contains(message, "last month") {
		start := time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, now.Location())
		end := start.AddDate(0, 1, -1).Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		return &start, &end
	}

	if strings.Contains(message, "this month") {
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		end := start.AddDate(0, 1, -1).Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		return &start, &end
	}

	if strings.Contains(message, "last week") {
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday = 7 in this calculation
		}
		start := now.AddDate(0, 0, -weekday-6).Truncate(24 * time.Hour)
		end := start.AddDate(0, 0, 6).Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		return &start, &end
	}

	if strings.Contains(message, "this week") {
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		start := now.AddDate(0, 0, 1-weekday).Truncate(24 * time.Hour)
		end := start.AddDate(0, 0, 6).Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		return &start, &end
	}

	if strings.Contains(message, "last 30 days") || strings.Contains(message, "past 30 days") {
		start := now.AddDate(0, 0, -30).Truncate(24 * time.Hour)
		end := now
		return &start, &end
	}

	if strings.Contains(message, "last 7 days") || strings.Contains(message, "past 7 days") {
		start := now.AddDate(0, 0, -7).Truncate(24 * time.Hour)
		end := now
		return &start, &end
	}

	if strings.Contains(message, "yesterday") {
		start := now.AddDate(0, 0, -1).Truncate(24 * time.Hour)
		end := start.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		return &start, &end
	}

	if strings.Contains(message, "today") {
		start := now.Truncate(24 * time.Hour)
		end := start.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		return &start, &end
	}

	return nil, nil
}
