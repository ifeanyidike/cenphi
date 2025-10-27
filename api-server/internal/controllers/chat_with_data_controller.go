// internal/controllers/chat_with_data_controller.go
package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/services"
	"go.uber.org/zap"
)

// ChatWithDataController handles chat-with-data API endpoints
type ChatWithDataController struct {
	chatService *services.ChatWithDataService
	validator   *validator.Validate
	logger      *zap.Logger
}

// NewChatWithDataController creates a new chat with data controller
func NewChatWithDataController(
	chatService *services.ChatWithDataService,
	logger *zap.Logger,
) *ChatWithDataController {
	return &ChatWithDataController{
		chatService: chatService,
		validator:   validator.New(),
		logger:      logger,
	}
}

// StreamChatResponse handles streaming chat responses
func (cdc *ChatWithDataController) StreamChatResponse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var req services.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		cdc.logger.Error("Failed to decode request", zap.Error(err))
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate request
	if err := cdc.validator.Struct(req); err != nil {
		cdc.logger.Error("Request validation failed", zap.Error(err))
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	// Validate workspace access
	userID, err := cdc.chatService.ValidateWorkspaceAccess(r.Context())
	if err != nil {
		cdc.logger.Error("Workspace access validation failed",
			zap.Error(err),
			zap.String("workspace_id", req.WorkspaceID.String()))
		http.Error(w, "Workspace not found or access denied", http.StatusForbidden)
		return
	}

	cdc.logger.Info("Processing chat with data request",
		zap.String("workspace_id", req.WorkspaceID.String()),
		zap.String("user_id", userID.String()),
		zap.String("message_preview", truncateString(req.Message, 100)))

	// Stream the chat response
	err = cdc.chatService.StreamChatResponse(r.Context(), req, w, userID)
	if err != nil {
		cdc.logger.Error("Failed to stream chat response", zap.Error(err))
		// At this point, we may have already started streaming, so we can't return HTTP error
		// The frontend should handle connection errors appropriately
		return
	}

	cdc.logger.Info("Chat response completed successfully",
		zap.String("workspace_id", req.WorkspaceID.String()))
}

// GetTestimonialStats provides basic stats about testimonials for the workspace
func (cdc *ChatWithDataController) GetTestimonialStats(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceId")
	if workspaceIDStr == "" {
		http.Error(w, "Missing workspace ID", http.StatusBadRequest)
		return
	}

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	// Validate workspace access
	_, err = cdc.chatService.ValidateWorkspaceAccess(r.Context())
	if err != nil {
		http.Error(w, "Workspace not found or access denied", http.StatusForbidden)
		return
	}

	// For now, return basic stats
	// In a full implementation, you'd query the database for actual stats
	stats := map[string]interface{}{
		"workspace_id": workspaceID.String(),
		"chat_enabled": true,
		"message":      "Chat with your testimonials to discover insights!",
		"example_queries": []string{
			"What do customers love most about our service?",
			"Summarize all feedback related to pricing",
			"List common pain points mentioned",
			"What are the top 3 recurring themes?",
			"Show sentiment analysis of recent testimonials",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)

	cdc.logger.Info("Testimonial stats retrieved",
		zap.String("workspace_id", workspaceID.String()))
}

// GetConversationHistory retrieves active conversation sessions for a user
func (cdc *ChatWithDataController) GetConversationHistory(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceId")
	if workspaceIDStr == "" {
		http.Error(w, "Missing workspace ID", http.StatusBadRequest)
		return
	}

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	userID, err := cdc.chatService.ValidateWorkspaceAccess(r.Context())
	// Validate workspace access
	if err != nil {
		http.Error(w, "Workspace not found or access denied", http.StatusForbidden)
		return
	}

	// Get conversation history
	limit := 10 // Default limit
	sessions, err := cdc.chatService.GetConversationHistory(r.Context(), workspaceID, userID, limit)
	if err != nil {
		cdc.logger.Error("Failed to get conversation history", zap.Error(err))
		http.Error(w, "Failed to retrieve conversation history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"sessions": sessions,
		"count":    len(sessions),
	})
}

// GetConversationSession retrieves a specific conversation session
func (cdc *ChatWithDataController) GetConversationSession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionId")
	if sessionIDStr == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	// Validate workspace access
	if _, err := cdc.chatService.ValidateWorkspaceAccess(r.Context()); err != nil {
		http.Error(w, "Workspace not found or access denied", http.StatusForbidden)
		return
	}

	// Get the session
	session, err := cdc.chatService.GetConversationSession(r.Context(), sessionID)
	if err != nil {
		cdc.logger.Error("Failed to get conversation session", zap.Error(err))
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(session)
}

// DeactivateConversationSession ends a conversation session
func (cdc *ChatWithDataController) DeactivateConversationSession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionId")
	if sessionIDStr == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	// Validate workspace access
	if _, err := cdc.chatService.ValidateWorkspaceAccess(r.Context()); err != nil {
		http.Error(w, "Workspace not found or access denied", http.StatusForbidden)
		return
	}

	// Deactivate the session
	if err := cdc.chatService.DeactivateConversationSession(r.Context(), sessionID); err != nil {
		cdc.logger.Error("Failed to deactivate session", zap.Error(err))
		http.Error(w, "Failed to end conversation", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Conversation ended successfully",
	})
}

// GenerateFollowUpSuggestions generates contextual follow-up questions
func (cdc *ChatWithDataController) GenerateFollowUpSuggestions(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionId")
	if sessionIDStr == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	// Validate workspace access
	if _, err := cdc.chatService.ValidateWorkspaceAccess(r.Context()); err != nil {
		http.Error(w, "Workspace not found or access denied", http.StatusForbidden)
		return
	}

	// Generate follow-up suggestions
	suggestions, err := cdc.chatService.GenerateFollowUpSuggestions(r.Context(), sessionID)
	if err != nil {
		cdc.logger.Error("Failed to generate follow-up suggestions", zap.Error(err))
		http.Error(w, "Failed to generate suggestions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"suggestions": suggestions,
	})
}

// Helper function to truncate strings for logging
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
