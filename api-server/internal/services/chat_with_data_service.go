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
	analyticsRepo      repositories.AnalyticsRepository
	db                 *sql.DB
}

// NewChatWithDataService creates a new chat with data service
func NewChatWithDataService(
	logger *zap.Logger,
	vectorStoreService *vector_store.VectorStoreService,
	userRepo repositories.UserRepository,
	aiClient *ai.AIClient,
	analyticsRepo repositories.AnalyticsRepository,
	db *sql.DB,
) *ChatWithDataService {
	return &ChatWithDataService{
		logger:             logger,
		vectorStoreService: vectorStoreService,
		userRepo:           userRepo,
		aiClient:           aiClient,
		analyticsRepo:      analyticsRepo,
		db:                 db,
	}
}

// ChatRequest represents a chat message request
type ChatRequest struct {
	Message     string     `json:"message" validate:"required,min=1,max=2000"`
	WorkspaceID uuid.UUID  `json:"workspace_id" validate:"required"`
	SessionID   *uuid.UUID `json:"session_id,omitempty"`
	DateFrom    *time.Time `json:"date_from,omitempty"`
	DateTo      *time.Time `json:"date_to,omitempty"`
}

// StreamChatResponse streams chat responses for a user query about testimonials
func (cds *ChatWithDataService) StreamChatResponse(ctx context.Context, req ChatRequest, writer http.ResponseWriter, userID uuid.UUID) error {
	if cds.aiClient == nil {
		return fmt.Errorf("AI client not configured")
	}

	// Get or create conversation session
	var session *models.ConversationSession
	var err error

	if req.SessionID != nil {
		session, err = cds.analyticsRepo.GetConversationSession(ctx, *req.SessionID, cds.db)
		if err != nil {
			cds.logger.Warn("Failed to retrieve session, creating new one", zap.Error(err))
			session = nil
		}
	}

	// Create new session if not found or not provided
	if session == nil {
		titleStr := truncateString(req.Message, 50)
		session = &models.ConversationSession{
			WorkspaceID:      req.WorkspaceID,
			UserID:           userID,
			Title:            &titleStr,
			Messages:         models.JSONBMessages{},
			ActiveFilters:    models.JSONB{},
			ReferencedEntity: models.JSONB{},
			IsActive:         true,
		}

		if err := cds.analyticsRepo.CreateConversationSession(ctx, session, cds.db); err != nil {
			cds.logger.Error("Failed to create conversation session", zap.Error(err))
			// Continue without session - degraded mode
			session = nil
		} else {
			cds.logger.Info("Created new conversation session", zap.String("session_id", session.ID.String()))
		}
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
	if filter.CreatedAfter != nil || filter.CreatedBefore != nil {
		testimonialContent, err = cds.vectorStoreService.GetWorkspaceTestimonialContentWithFilter(ctx, req.WorkspaceID, filter)
	} else {
		testimonialContent, err = cds.vectorStoreService.GetWorkspaceTestimonialContent(ctx, req.WorkspaceID)
	}
	if err != nil {
		return fmt.Errorf("failed to retrieve testimonial content: %w", err)
	}

	// Build conversation context from previous messages
	var conversationContext string
	if session != nil && len(session.Messages) > 0 {
		conversationContext = "\n\n--- Previous conversation context ---\n"
		// Include last 5 messages for context
		startIdx := 0
		if len(session.Messages) > 10 {
			startIdx = len(session.Messages) - 10
		}
		for _, msg := range session.Messages[startIdx:] {
			conversationContext += fmt.Sprintf("%s: %s\n", msg.Role, msg.Content)
		}
		conversationContext += "--- End of context ---\n\n"
	}

	// Prepare the system prompt
	systemPrompt := `You are an AI insights assistant. Your job is to help businesses gain valuable insights from their customer testimonials.

Analyze the provided testimonials and answer queries by identifying trends, emotions, sentiments, or recurring themes. If useful, summarize key findings or patterns.

Use markdown formatting for better readability. If tabular data is needed, use markdown tables (NOT HTML). Be concise, accurate, and insightful.

The testimonials you'll be analyzing are provided in the user message. Focus on extracting meaningful business insights and actionable recommendations.

IMPORTANT: Only answer based on the testimonial data provided. If you cannot find relevant information in the testimonials, say so clearly.

If there is conversation context from previous messages, use it to provide more contextual and coherent responses.`

	// Prepare the user prompt
	userPrompt := fmt.Sprintf("%sHere are the testimonials to analyze:\n\n%s\n\nUser Question: %s", conversationContext, testimonialContent, req.Message)

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

	// Accumulate the full AI response for session storage
	var fullAIResponse strings.Builder

	// Stream the response chunks to the client
	for chunk := range streamChan {
		if chunk.Error != nil {
			cds.logger.Error("Stream error", zap.Error(chunk.Error))
			// Send error to client
			errorData := map[string]interface{}{
				"error":      chunk.Error.Error(),
				"done":       true,
				"timestamp":  time.Now().Unix(),
				"session_id": session.ID.String(),
			}
			jsonResponse, _ := json.Marshal(errorData)
			fmt.Fprintf(writer, "data: %s\n\n", jsonResponse)
			if flusher, ok := writer.(http.Flusher); ok {
				flusher.Flush()
			}
			return chunk.Error
		}

		if chunk.IsComplete {
			// Store messages to session before completion
			if session != nil {
				// Add user message
				session.Messages = append(session.Messages, models.ConversationMessage{
					Role:      "user",
					Content:   req.Message,
					Timestamp: time.Now(),
				})

				// Add AI response
				session.Messages = append(session.Messages, models.ConversationMessage{
					Role:      "assistant",
					Content:   fullAIResponse.String(),
					Timestamp: time.Now(),
				})

				// Update session in database
				if err := cds.analyticsRepo.UpdateConversationSession(ctx, session, cds.db); err != nil {
					cds.logger.Error("Failed to update conversation session", zap.Error(err))
				} else {
					cds.logger.Debug("Updated conversation session with new messages",
						zap.String("session_id", session.ID.String()),
						zap.Int("message_count", len(session.Messages)))
				}
			}

			// Send completion signal with session ID
			responseData := map[string]interface{}{
				"done":       true,
				"timestamp":  time.Now().Unix(),
				"session_id": session.ID.String(),
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
			// Accumulate the content for session storage
			fullAIResponse.WriteString(chunk.Content)

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

	cds.logger.Info("Chat response streamed successfully",
		zap.String("session_id", session.ID.String()))
	return nil
}

// ValidateWorkspaceAccess validates that the user has access to the workspace
func (cds *ChatWithDataService) ValidateWorkspaceAccess(ctx context.Context) (uuid.UUID, error) {
	uid, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return uuid.Nil, fmt.Errorf("user is not authorized to access resource: %w", err)
	}

	workspace, err := cds.userRepo.GetWorkspaceAndUserIDByUID(ctx, uid, cds.db)
	if err != nil {
		return uuid.Nil, fmt.Errorf("workspace not found or not accessible: %w", err)
	}

	cds.logger.Debug("Workspace access validated",
		zap.String("workspace_id", workspace.ID.String()),
		zap.String("workspace_name", workspace.Name))

	return workspace.UserID, nil
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

// GetConversationHistory retrieves active conversation sessions for a user
func (cds *ChatWithDataService) GetConversationHistory(ctx context.Context, workspaceID, userID uuid.UUID, limit int) ([]*models.ConversationSession, error) {
	sessions, err := cds.analyticsRepo.GetActiveSessionsForUser(ctx, workspaceID, userID, limit, cds.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversation history: %w", err)
	}

	return sessions, nil
}

// GetConversationSession retrieves a specific conversation session
func (cds *ChatWithDataService) GetConversationSession(ctx context.Context, sessionID uuid.UUID) (*models.ConversationSession, error) {
	session, err := cds.analyticsRepo.GetConversationSession(ctx, sessionID, cds.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversation session: %w", err)
	}

	return session, nil
}

// DeactivateConversationSession marks a session as inactive (end conversation)
func (cds *ChatWithDataService) DeactivateConversationSession(ctx context.Context, sessionID uuid.UUID) error {
	err := cds.analyticsRepo.DeactivateConversationSession(ctx, sessionID, cds.db)
	if err != nil {
		return fmt.Errorf("failed to deactivate conversation session: %w", err)
	}

	cds.logger.Info("Deactivated conversation session", zap.String("session_id", sessionID.String()))
	return nil
}

// truncateString truncates a string to a maximum length
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	if maxLen <= 3 {
		return s[:maxLen]
	}
	return s[:maxLen-3] + "..."
}

// GenerateFollowUpSuggestions generates contextual follow-up questions based on conversation
func (cds *ChatWithDataService) GenerateFollowUpSuggestions(ctx context.Context, sessionID uuid.UUID) ([]string, error) {
	// Get the session
	session, err := cds.analyticsRepo.GetConversationSession(ctx, sessionID, cds.db)
	if err != nil {
		return nil, fmt.Errorf("failed to get session for follow-ups: %w", err)
	}

	// If no messages, return default suggestions
	if len(session.Messages) == 0 {
		return []string{
			"What do customers love most about our service?",
			"Summarize all feedback related to pricing",
			"List common pain points mentioned",
			"What are the top 3 recurring themes?",
			"Show sentiment analysis of recent testimonials",
		}, nil
	}

	// Get the last few messages for context
	contextMessages := []string{}
	startIdx := 0
	if len(session.Messages) > 4 {
		startIdx = len(session.Messages) - 4
	}
	for _, msg := range session.Messages[startIdx:] {
		contextMessages = append(contextMessages, fmt.Sprintf("%s: %s", msg.Role, truncateString(msg.Content, 200)))
	}

	// Use AI to generate contextual follow-up questions
	systemPrompt := `You are an AI assistant that generates relevant follow-up questions based on a conversation about customer testimonials.

Given the conversation context, generate 3-5 specific, actionable follow-up questions that would help the user gain deeper insights from their testimonial data.

Return ONLY a JSON array of strings (the questions), nothing else. Example format:
["What trends...", "How does...", "Can you analyze..."]`

	userPrompt := fmt.Sprintf("Conversation context:\n%s\n\nGenerate 3-5 contextual follow-up questions:", strings.Join(contextMessages, "\n"))

	if cds.aiClient == nil {
		// Fallback to generic suggestions if AI client not available
		return []string{
			"Can you elaborate on the last point?",
			"What other patterns do you see in the data?",
			"How does this compare to our overall trends?",
		}, nil
	}

	// Get AI response (non-streaming)
	streamChan, err := cds.aiClient.Stream(ctx, userPrompt, systemPrompt)
	if err != nil {
		cds.logger.Error("Failed to generate follow-up suggestions", zap.Error(err))
		// Return generic suggestions on error
		return []string{
			"Can you provide more details about that?",
			"What other insights can you share?",
			"How does this trend compare over time?",
		}, nil
	}

	// Accumulate the response
	var responseBuilder strings.Builder
	for chunk := range streamChan {
		if chunk.Error != nil {
			cds.logger.Error("Error in follow-up generation", zap.Error(chunk.Error))
			break
		}
		if chunk.Content != "" {
			responseBuilder.WriteString(chunk.Content)
		}
	}

	// Parse the JSON array from response
	var suggestions []string
	responseText := strings.TrimSpace(responseBuilder.String())

	// Try to extract JSON array from response
	startIdx = strings.Index(responseText, "[")
	endIdx := strings.LastIndex(responseText, "]")
	if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
		jsonPart := responseText[startIdx : endIdx+1]
		if err := json.Unmarshal([]byte(jsonPart), &suggestions); err != nil {
			cds.logger.Error("Failed to parse follow-up suggestions JSON", zap.Error(err))
			// Return generic suggestions on parse error
			return []string{
				"Can you provide more context about that finding?",
				"What are the implications of this insight?",
				"How can we act on this feedback?",
			}, nil
		}
	}

	// Limit to 5 suggestions
	if len(suggestions) > 5 {
		suggestions = suggestions[:5]
	}

	return suggestions, nil
}
