package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type AIPostController struct {
	aiClient        ai.AIClient
	testimonialRepo repositories.TestimonialRepository
	logger          *zap.Logger
	db              repositories.DB
}

func NewAIPostController(
	aiClient ai.AIClient,
	testimonialRepo repositories.TestimonialRepository,
	logger *zap.Logger,
	db repositories.DB,
) *AIPostController {
	return &AIPostController{
		aiClient:        aiClient,
		testimonialRepo: testimonialRepo,
		logger:          logger,
		db:              db,
	}
}

// GeneratePostsForTestimonial generates post suggestions for all platforms
// POST /testimonials/{id}/ai/generate-posts
func (c *AIPostController) GeneratePostsForTestimonial(w http.ResponseWriter, r *http.Request) {
	testimonialID := chi.URLParam(r, "id")
	if testimonialID == "" {
		http.Error(w, "testimonial ID required", http.StatusBadRequest)
		return
	}

	id, err := uuid.Parse(testimonialID)
	if err != nil {
		http.Error(w, "invalid testimonial ID", http.StatusBadRequest)
		return
	}

	// Get testimonial
	testimonial, err := c.testimonialRepo.FetchByID(r.Context(), id, c.db)
	if err != nil {
		c.logger.Error("Failed to get testimonial",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID))
		http.Error(w, "testimonial not found", http.StatusNotFound)
		return
	}

	// Generate suggestions
	suggestions, err := c.aiClient.GeneratePostSuggestions(r.Context(), testimonial)
	if err != nil {
		c.logger.Error("Failed to generate post suggestions",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID))
		http.Error(w, "failed to generate posts: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"testimonial_id": testimonialID,
		"suggestions":    suggestions,
	})
}

// GeneratePostForPlatform generates a post suggestion for a specific platform
// POST /testimonials/{id}/ai/generate-posts/{platform}
func (c *AIPostController) GeneratePostForPlatform(w http.ResponseWriter, r *http.Request) {
	testimonialID := chi.URLParam(r, "id")
	platform := chi.URLParam(r, "platform")

	if testimonialID == "" || platform == "" {
		http.Error(w, "testimonial ID and platform required", http.StatusBadRequest)
		return
	}

	id, err := uuid.Parse(testimonialID)
	if err != nil {
		http.Error(w, "invalid testimonial ID", http.StatusBadRequest)
		return
	}

	// Validate platform
	validPlatforms := map[string]bool{
		"linkedin":  true,
		"twitter":   true,
		"facebook":  true,
		"instagram": true,
	}
	if !validPlatforms[platform] {
		http.Error(w, "invalid platform", http.StatusBadRequest)
		return
	}

	// Get testimonial
	testimonial, err := c.testimonialRepo.FetchByID(r.Context(), id, c.db)
	if err != nil {
		c.logger.Error("Failed to get testimonial",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID))
		http.Error(w, "testimonial not found", http.StatusNotFound)
		return
	}

	// Generate suggestion
	suggestion, err := c.aiClient.GeneratePostForPlatform(r.Context(), platform, testimonial)
	if err != nil {
		c.logger.Error("Failed to generate post for platform",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID),
			zap.String("platform", platform))
		http.Error(w, "failed to generate post: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"testimonial_id": testimonialID,
		"platform":       platform,
		"suggestion":     suggestion,
	})
}

// GeneratePostVariations generates multiple variations for A/B testing
// POST /testimonials/{id}/ai/generate-variations/{platform}?count=3
func (c *AIPostController) GeneratePostVariations(w http.ResponseWriter, r *http.Request) {
	testimonialID := chi.URLParam(r, "id")
	platform := chi.URLParam(r, "platform")

	if testimonialID == "" || platform == "" {
		http.Error(w, "testimonial ID and platform required", http.StatusBadRequest)
		return
	}

	id, err := uuid.Parse(testimonialID)
	if err != nil {
		http.Error(w, "invalid testimonial ID", http.StatusBadRequest)
		return
	}

	// Get count from query params (default 3)
	countStr := r.URL.Query().Get("count")
	count := 3
	if countStr != "" {
		if c, err := strconv.Atoi(countStr); err == nil && c > 0 && c <= 5 {
			count = c
		}
	}

	// Validate platform
	validPlatforms := map[string]bool{
		"linkedin":  true,
		"twitter":   true,
		"facebook":  true,
		"instagram": true,
	}
	if !validPlatforms[platform] {
		http.Error(w, "invalid platform", http.StatusBadRequest)
		return
	}

	// Get testimonial
	testimonial, err := c.testimonialRepo.FetchByID(r.Context(), id, c.db)
	if err != nil {
		c.logger.Error("Failed to get testimonial",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID))
		http.Error(w, "testimonial not found", http.StatusNotFound)
		return
	}

	// Generate variations
	variations, err := c.aiClient.GeneratePostVariations(r.Context(), platform, testimonial, count)
	if err != nil {
		c.logger.Error("Failed to generate post variations",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID),
			zap.String("platform", platform),
			zap.Int("count", count))
		http.Error(w, "failed to generate variations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"testimonial_id": testimonialID,
		"platform":       platform,
		"count":          len(variations),
		"variations":     variations,
	})
}

// StreamLinkedInPost streams the generation of a LinkedIn post in real-time
// POST /testimonials/{id}/ai/stream-linkedin-post
func (c *AIPostController) StreamLinkedInPost(w http.ResponseWriter, r *http.Request) {
	testimonialID := chi.URLParam(r, "id")
	if testimonialID == "" {
		http.Error(w, "testimonial ID required", http.StatusBadRequest)
		return
	}

	id, err := uuid.Parse(testimonialID)
	if err != nil {
		http.Error(w, "invalid testimonial ID", http.StatusBadRequest)
		return
	}

	// Get testimonial
	testimonial, err := c.testimonialRepo.FetchByID(r.Context(), id, c.db)
	if err != nil {
		c.logger.Error("Failed to get testimonial",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID))
		http.Error(w, "testimonial not found", http.StatusNotFound)
		return
	}

	// Set up SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Flush headers immediately
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}

	// Stream the LinkedIn post generation
	err = c.aiClient.StreamLinkedInPost(r.Context(), testimonial, func(chunk string) error {
		// Send SSE event
		_, writeErr := fmt.Fprintf(w, "data: %s\n\n", chunk)
		if writeErr != nil {
			return writeErr
		}

		// Flush after each chunk
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}

		return nil
	})

	if err != nil {
		c.logger.Error("Failed to stream LinkedIn post",
			zap.Error(err),
			zap.String("testimonial_id", testimonialID))
		// Send error event
		fmt.Fprintf(w, "event: error\ndata: %s\n\n", err.Error())
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
		return
	}

	// Send completion event
	fmt.Fprintf(w, "event: done\ndata: {\"status\":\"completed\"}\n\n")
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}
