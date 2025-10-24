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
	err := cdc.chatService.ValidateWorkspaceAccess(r.Context())
	if err != nil {
		cdc.logger.Error("Workspace access validation failed",
			zap.Error(err),
			zap.String("workspace_id", req.WorkspaceID.String()))
		http.Error(w, "Workspace not found or access denied", http.StatusForbidden)
		return
	}

	cdc.logger.Info("Processing chat with data request",
		zap.String("workspace_id", req.WorkspaceID.String()),
		zap.String("message_preview", truncateString(req.Message, 100)))

	// Stream the chat response
	err = cdc.chatService.StreamChatResponse(r.Context(), req, w)
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
	err = cdc.chatService.ValidateWorkspaceAccess(r.Context())
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

// RegisterRoutes registers chat with data routes
func (cdc *ChatWithDataController) RegisterRoutes(r chi.Router) {
	r.Route("/ai", func(r chi.Router) {
		r.Post("/chat-with-data", cdc.StreamChatResponse)
		r.Get("/testimonial-stats/{workspaceId}", cdc.GetTestimonialStats)
	})
}

// Helper function to truncate strings for logging
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
