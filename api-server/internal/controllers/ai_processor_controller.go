// internal/controllers/ai_test_controller.go
package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

// AIProcessorController handles AI service testing endpoints
type AIProcessorController struct {
	ai.AIServiceManager
	serviceLineageManager *services.ServiceLineageManager
	queueService          queue.Service
	sseManager            *sse.SSEManager
	logger                *zap.Logger
}

// AsyncJobResponse represents the response for asynchronous job requests
type AsyncJobResponse struct {
	JobID   string `json:"job_id"`
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

// NewAIProcessorController creates a new AI test controller with SSE support
func NewAIProcessorController(
	aiService ai.AIServiceManager,
	queueService queue.Service,
	logger *zap.Logger,
	cacheService cache.RedisCache,
	sseManager *sse.SSEManager,
) *AIProcessorController {
	serviceLineageManager := services.NewServiceLineageManager(aiService.ArtifactsRepo, logger)
	controller := &AIProcessorController{
		AIServiceManager:      aiService,
		queueService:          queueService,
		sseManager:            sseManager,
		logger:                logger,
		serviceLineageManager: serviceLineageManager,
	}
	return controller
}

func ifaceSliceToStrings(in interface{}) ([]string, error) {
	switch v := in.(type) {
	case []string:
		return v, nil
	case []interface{}:
		out := make([]string, 0, len(v))
		for i, item := range v {
			s, ok := item.(string)
			if !ok {
				return nil, fmt.Errorf("element %d is not a string", i)
			}
			out = append(out, s)
		}
		return out, nil
	default:
		return nil, fmt.Errorf("unsupported type %T for ids", in)
	}
}

func ifaceToString(in interface{}) (string, error) {
	switch v := in.(type) {
	case string:
		return v, nil
	case interface{}:
		s, ok := v.(string)
		if !ok {
			return "", fmt.Errorf("element is not a string")
		}
		return s, nil
	default:
		return "", fmt.Errorf("unsupported type %T for ids", in)
	}
}

// ============================================================================
// SSE IMPLEMENTATION
// ============================================================================

// StreamJobStatus handles SSE connections for real-time job updates
func (c *AIProcessorController) StreamJobStatus(w http.ResponseWriter, r *http.Request) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Cache-Control")

	if err := c.sseManager.StreamJobStatus(r.Context(), w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

}

// ============================================================================
// STANDARD AI SERVICES (Go-based, immediate response)
// ============================================================================

// TranscribeAudio transcribes audio to text
func (c *AIProcessorController) TranscribeAudio(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MediaURL string `json:"media_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Error decoding transcription request", zap.Error(err))
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.MediaURL == "" {
		http.Error(w, "media_url is required", http.StatusBadRequest)
		return
	}

	result, err := c.AudioTranscriptionService.TranscribeAudio(req.MediaURL)
	if err != nil {
		c.logger.Error("Audio transcription failed", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// TranslateText translates text between languages
func (c *AIProcessorController) TranslateText(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID string                            `json:"workspace_id"`
		Text        string                            `json:"text"`
		SourceLang  string                            `json:"source_lang"`
		TargetLang  string                            `json:"target_lang"`
		Prompt      string                            `json:"prompt"`
		Source      models.CreateArtifactSourceParams `json:"source"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Error decoding translation request", zap.Error(err))
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TargetLang == "" {
		http.Error(w, "target_lang are required", http.StatusBadRequest)
		return
	}

	if req.SourceLang == "" {
		req.SourceLang = "auto"
	}

	if req.Source.Type == "" || req.Source.Data == nil {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}
	switch req.Source.Type {
	case "testimonial":
		id, err := ifaceToString(req.Source.Data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		input, err := c.TestimonialRepo.GetContentDataByID(r.Context(), id, c.DB)
		if err != nil {
			http.Error(w, "failed to fetch testimonials", http.StatusInternalServerError)
			return
		}
		req.Text = input.Text
	case "artifact":
		id, err := ifaceToString(req.Source.Data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		input, err := c.ArtifactsRepo.GetContentDataByID(r.Context(), id, c.DB)
		if err != nil {
			http.Error(w, "failed to fetch testimonials artifacts", http.StatusInternalServerError)
			return
		}
		req.Text = input.Text
	}

	if req.Text == "" {
		http.Error(w, "text cannot be retried from testimonial", http.StatusBadRequest)
		return
	}

	c.streamResponseWithArtifact(w, r, "translation", req.WorkspaceID, req.Source, func(ctx context.Context) (<-chan ai.StreamChunk, error) {
		return c.TranslationService.TranslateTextStream(r.Context(), req.Text, req.SourceLang, req.TargetLang, req.Prompt)
	})
}

// AnalyzeSentiment analyzes sentiment of text
func (c *AIProcessorController) AnalyzeSentiment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID   string               `json:"workspace_id"`
		TestimonialID string               `json:"testimonial_id"`
		Text          string               `json:"text"`
		BrandContext  *models.BrandContext `json:"brand_context"`
		Prompt        string               `json:"prompt"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		http.Error(w, "invalid testimonial ID", http.StatusBadRequest)
		return
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		http.Error(w, "invalid workspace ID", http.StatusBadRequest)
		return
	}

	result, err := c.SentimentService.AnalyzeSentiment(r.Context(), req.Text, req.BrandContext, req.Prompt)
	if err != nil {
		http.Error(w, "sentiment analysis failed", http.StatusBadRequest)
		return
	}

	artifact_id, err := c.ArtifactsRepo.CreateArtifactWithLineage(r.Context(), "sentiment_analysis", workspaceID, &testimonialID, models.JSONMap{
		"sentiment_score":          result.SentimentScore,
		"label":                    result.Label,
		"emotions":                 result.Emotions,
		"business_recommendations": result.BusinessRecommendations,
	}, models.CreateArtifactSourceParams{Type: "no_source"}, nil, c.DB)

	if err != nil {
		c.logger.Error("Sentiment analysis failed", zap.String("artifact_id", artifact_id), zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// ExtractHighlights extracts key highlights from text
func (c *AIProcessorController) ExtractHighlights(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID   string                        `json:"workspace_id"`
		TestimonialID string                        `json:"testimonial_id"`
		Text          string                        `json:"text"`
		Segments      []models.TranscriptionSegment `json:"segments,omitempty"`
		Prompt        string                        `json:"prompt"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Text == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		http.Error(w, "invalid testimonial ID", http.StatusBadRequest)
		return
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		http.Error(w, "invalid workspace ID", http.StatusBadRequest)
		return
	}

	highlights, err := c.HighlightService.ExtractHighlights(r.Context(), req.Text, req.Segments, req.Prompt)
	if err != nil {
		c.logger.Error("Highlight extraction failed", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	artifact_id, err := c.ArtifactsRepo.CreateArtifactWithLineage(r.Context(), "highlight_extraction", workspaceID, &testimonialID, models.JSONMap{
		"highlights": highlights,
	}, models.CreateArtifactSourceParams{Type: models.NoTypeSource}, nil, c.DB)

	if err != nil {
		c.logger.Error("highlight extraction failed", zap.String("artifact_id", artifact_id), zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(highlights)
}

func (c AIProcessorController) PolishText(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID          string                            `json:"workspace_id"`
		Text                 string                            `json:"text"`
		BrandContext         *models.BrandContext              `json:"brand_context"`
		PreserveAuthenticity bool                              `json:"preserve_authenticity"`
		TargetStyle          string                            `json:"target_style,omitempty"`
		Prompt               string                            `json:"prompt"`
		Source               models.CreateArtifactSourceParams `json:"source"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.BrandContext == nil && req.WorkspaceID == "" {
		c.logger.Error("brand context or the workspace should be provided...skipping")
	}

	if req.Source.Type == "" || req.Source.Data == nil {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}

	if req.BrandContext == nil && req.WorkspaceID != "" {
		workspaceID, err := uuid.Parse(req.WorkspaceID)
		if err == nil {
			if workspace, err := c.WorkspaceRepo.GetByID(r.Context(), workspaceID, c.DB); err != nil {

				if err := json.Unmarshal(workspace.BrandContext, req.BrandContext); err != nil {
					c.logger.Error("failed to unmarshall brand context...skipping")

				}
			}
		}

	}

	if req.Source.Type == "" || req.Source.Data == nil {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}
	switch req.Source.Type {
	case "testimonial":
		id, err := ifaceToString(req.Source.Data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		input, err := c.TestimonialRepo.GetContentDataByID(r.Context(), id, c.DB)
		if err != nil {
			http.Error(w, "failed to fetch testimonials", http.StatusInternalServerError)
			return
		}
		req.Text = input.Text
	case "artifact":
		id, err := ifaceToString(req.Source.Data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		input, err := c.ArtifactsRepo.GetContentDataByID(r.Context(), id, c.DB)
		if err != nil {
			http.Error(w, "failed to fetch testimonials artifacts", http.StatusInternalServerError)
			return
		}
		req.Text = input.Text
	}

	if req.Text == "" {
		http.Error(w, "text cannot be retried from testimonial", http.StatusBadRequest)
		return
	}

	fmt.Println("input text ", req.Text)
	fmt.Println("input style ", req.TargetStyle)
	fmt.Println("input preserve authenticity ", req.PreserveAuthenticity)
	fmt.Println("input prompt ", req.Prompt)

	c.streamResponseWithArtifact(w, r, "text_polishing", req.WorkspaceID, req.Source, func(ctx context.Context) (<-chan ai.StreamChunk, error) {
		return c.PolishService.PolishTextStream(r.Context(), req.Text, req.BrandContext, req.PreserveAuthenticity, req.TargetStyle, req.Prompt)
	})

}

// GenerateContent generates content based on testimonials
func (c AIProcessorController) GenerateContent(w http.ResponseWriter, r *http.Request) {
	var req ai.ContentRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.BrandContext == nil && req.WorkspaceID == "" {
		c.logger.Error("brand context or the workspace should be provided...skipping")
	}

	if req.Source.Type == "" || req.Source.Data == nil {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}

	if req.BrandContext == nil && req.WorkspaceID != "" {
		workspaceID, err := uuid.Parse(req.WorkspaceID)
		if err == nil {
			if workspace, err := c.WorkspaceRepo.GetByID(r.Context(), workspaceID, c.DB); err != nil {

				if err := json.Unmarshal(workspace.BrandContext, req.BrandContext); err != nil {
					c.logger.Error("failed to unmarshall brand context...skipping")

				}
			}
		}
	}

	fmt.Println("req. source", req.Source)

	switch req.Source.Type {
	case "testimonial":
		ids, err := ifaceSliceToStrings(req.Source.Data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		input, err := c.TestimonialRepo.GetContentsByIDs(r.Context(), ids, c.DB)
		if err != nil {
			c.logger.Error(fmt.Sprintf("error when fetching testimonials: %s", err))
			http.Error(w, "failed to fetch testimonials", http.StatusInternalServerError)
			return
		}
		req.Testimonials = input
	case "artifact":
		ids, err := ifaceSliceToStrings(req.Source.Data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		input, err := c.ArtifactsRepo.GetContentsByIDs(r.Context(), ids, c.DB)
		if err != nil {
			http.Error(w, "failed to fetch testimonials artifacts", http.StatusInternalServerError)
			return
		}
		req.Testimonials = input
	}

	fmt.Println("testimonial input", len(req.Testimonials))
	if req.Testimonials == nil {
		http.Error(w, "invalid content data", http.StatusBadRequest)
		return
	}
	if req.ContentType == "" {
		http.Error(w, "content_type is required", http.StatusBadRequest)
		return
	}

	c.streamResponseWithArtifact(w, r, "content_generation", req.WorkspaceID, req.Source, func(ctx context.Context) (<-chan ai.StreamChunk, error) {
		return c.ContentGenerationService.GenerateContentStream(r.Context(), &req)
	})
}

// EnhanceMedia enhances video
func (c *AIProcessorController) EnhanceMedia(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.EnhanceRequest
		Source models.CreateArtifactSourceParams `json:"source"`
		ID     string                            `json:"id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Source.Type == "" || req.Source.Data == nil {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}
	// Set defaults
	if req.Quality == "" {
		req.Quality = "high"
	}

	testimonialID, _ := uuid.Parse(req.TestimonialId)
	workspaceID, _ := uuid.Parse(req.WorkspaceID)

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "enhancement", queue.Message{
		Type:    "enhancement",
		Payload: &req,
		ID:      req.ID,
	})

	jID, _ := uuid.Parse(jobID)
	enhancementJob := &models.Job{
		ID:            jID,
		JobType:       "enhance",
		TestimonialID: &testimonialID,
		WorkspaceID:   &workspaceID,
		Payload: models.JSONMap{
			"workspace_id":       req.WorkspaceID,
			"testimonial_id":     req.TestimonialId,
			"media_url":          req.MediaUrl,
			"custom_enhancement": req.CustomEnhancements,
			"quality":            req.Quality,
		},
		ScheduledAt: &time.Time{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	*enhancementJob.ScheduledAt = time.Now()

	c.AIServiceManager.CreateJob(r.Context(), enhancementJob)

	if err != nil {
		c.logger.Error("Failed to queue media enhancement job", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := AsyncJobResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Media enhancement request has been queued for processing.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(response)
}

// GenerateNarration generates voice narration (GPU-intensive)
func (c *AIProcessorController) GenerateNarration(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.NarrationRequest
		Source models.CreateArtifactSourceParams `json:"source"`
		ID     string                            `json:"id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Source.Type == "" || req.Source.Data == nil {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}

	// if req.Text == "" {
	// 	http.Error(w, "text is required", http.StatusBadRequest)
	// 	return
	// }

	// Set defaults
	if req.Language == "" {
		req.Language = "en"
	}

	testimonialID, _ := uuid.Parse(req.TestimonialId)
	workspaceID, _ := uuid.Parse(req.WorkspaceID)

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "narration", queue.Message{
		Type:    "narration",
		Payload: &req,
		ID:      req.ID,
	})

	jID, _ := uuid.Parse(jobID)
	narrationJob := &models.Job{
		ID:            jID,
		JobType:       "narration",
		TestimonialID: &testimonialID,
		WorkspaceID:   &workspaceID,
		Status:        "pending",
		Priority:      1,
		Payload: models.JSONMap{
			"workspace_id":     req.WorkspaceID,
			"testimonial_id":   req.TestimonialId,
			"text":             req.Text,
			"language":         req.Language,
			"voice_id":         req.VoiceId,
			"gender":           req.Gender,
			"style":            req.Style,
			"prompt":           req.Prompt,
			"background_music": req.BackgroundMusic,
			"music_volume":     req.MusicVolume,
		},
		MaxRetries:  3,
		ScheduledAt: &time.Time{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	*narrationJob.ScheduledAt = time.Now()

	c.AIServiceManager.CreateJob(r.Context(), narrationJob)

	if err != nil {
		c.logger.Error("Failed to queue narration job", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := AsyncJobResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Voice narration request has been queued for processing.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(response)
}

// GenerateSmartClips creates optimized video clips (GPU-intensive)
func (c *AIProcessorController) GenerateSmartClips(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID   string `json:"workspace_id"`
		TestimonialID string `json:"testimonial_id"`
		pb.ClippingRequest
		Source             models.CreateArtifactSourceParams `json:"source"`
		IncludeLogo        bool                              `json:"include_logo"`
		IncludeWatermark   bool                              `json:"include_watermark"`
		AddBackgroundMusic bool                              `json:"add_background_music"`
		RemoveNoise        bool                              `json:"remove_noise"`
		ID                 string                            `json:"id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Source.Type == "" || req.Source.Data == nil {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}

	testimonialID, _ := uuid.Parse(req.TestimonialID)
	workspaceID, _ := uuid.Parse(req.WorkspaceID)

	clippingJob := &models.Job{
		ID:            uuid.New(),
		JobType:       "clipping",
		TestimonialID: &testimonialID,
		WorkspaceID:   &workspaceID,
		Status:        "pending",
		Priority:      1,
		Payload: models.JSONMap{
			"workspace_id":      req.WorkspaceID,
			"testimonial_id":    req.TestimonialID,
			"media_url":         req.MediaUrl,
			"highlight_moments": req.HighlightMoments,
			"background_music":  req.BackgroundMusic,
			"branding":          req.Branding,
			"music_volume":      req.MusicVolume,
		},
		MaxRetries:  3,
		ScheduledAt: &time.Time{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	*clippingJob.ScheduledAt = time.Now()

	c.AIServiceManager.CreateJob(r.Context(), clippingJob)

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "clipping", queue.Message{
		Type:    "clipping",
		Payload: &req,
		ID:      req.ID,
	})

	if err != nil {
		c.logger.Error("Failed to queue smart clipping job", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := AsyncJobResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Smart video clipping request has been queued for processing.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(response)
}

// OptimizeForPlatform optimizes content for social media platforms (GPU-intensive)
func (c *AIProcessorController) OptimizeForPlatform(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		IsTextOnly  bool   `json:"is_text_only"`
		Prompt      string `json:"prompt"`
		pb.OptimizeRequest
		Source models.CreateArtifactSourceParams `json:"source"`
		ID     string                            `json:"id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	// fmt.Println("req source", req.Source, req.Source.Type)

	if !req.IsTextOnly && (req.Source.Type == "" || req.Source.Data == nil) {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}

	if req.TargetPlatform == "" {
		http.Error(w, "target_platform is required", http.StatusBadRequest)
		return
	}

	// if (req.IsTextOnly && req.Transcript == "") || req.MediaUrl == "" {
	// 	http.Error(w, "invalid parameters", http.StatusBadRequest)
	// 	return
	// }

	// Set defaults
	if req.OptimizationQuality == "" {
		req.OptimizationQuality = "high"
	}
	workspaceID, _ := uuid.Parse(req.WorkspaceID)
	testimonialID, _ := uuid.Parse(req.TestimonialId)

	if req.IsTextOnly {
		content := req.Source.Data.(string)
		result, err := c.PlatformOptimizerService.OptimizeForPlatform(r.Context(), req.WorkspaceID, content, req.BrandContext, req.TargetPlatform, req.Prompt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		artifact_id, err := c.ArtifactsRepo.CreateArtifactWithLineage(r.Context(), "text_platform_optimization", workspaceID, &testimonialID, models.JSONMap{
			"optimized_text": result,
		}, models.CreateArtifactSourceParams{Type: models.TestimonialTypeSource, Data: req.TestimonialId}, nil, c.DB)

		if err != nil {
			c.logger.Error("text platform optimization failed", zap.String("artifact_id", artifact_id), zap.Error(err))
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
		// json.NewEncoder(w).Encode([]byte("Bypass"))

		return
	}

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "platform_optimizer", queue.Message{
		Type:    "platform_optimizer",
		Payload: &req,
		ID:      req.ID,
	})

	optimizationJob := &models.Job{
		ID:            uuid.MustParse(jobID),
		JobType:       "optimization",
		TestimonialID: &testimonialID,
		WorkspaceID:   &workspaceID,
		Status:        "pending",
		Payload: models.JSONMap{
			"workspace_id":         req.WorkspaceID,
			"testimonial_id":       req.TestimonialId,
			"media_url":            req.MediaUrl,
			"brand_context":        req.BrandContext,
			"target_platform":      req.TargetPlatform,
			"prompt":               req.Prompt,
			"optimization_quality": req.OptimizationQuality,
		},
		ScheduledAt: &time.Time{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	*optimizationJob.ScheduledAt = time.Now()

	c.AIServiceManager.CreateJob(r.Context(), optimizationJob)

	if err != nil {
		c.logger.Error("Failed to queue platform optimization job", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := AsyncJobResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Platform optimization request has been queued for processing.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(response)
}

// GenerateStoryVideo creates story videos from testimonials (GPU-intensive)
func (c *AIProcessorController) GenerateStoryVideo(w http.ResponseWriter, r *http.Request) {
	log.Println("received request for story video")

	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.StoryModeRequest
		IncludeLogo      bool                              `json:"include_logo"`
		IncludeWatermark bool                              `json:"include_watermark"`
		Source           models.CreateArtifactSourceParams `json:"source"`
		ID               string                            `json:"id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	fmt.Println("source", req.Source)
	if req.Source.Type == "" || (req.Source.Type != "best_story_moments" && req.Source.Data == nil) {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}

	fmt.Printf("source information %#v", req.Source)

	// Set defaults
	if req.OutputFormat == "" {
		req.OutputFormat = "mp4"
	}
	fmt.Printf("testimonial segments: %d\n %v\n", len(req.TestimonialSegments), req.TestimonialSegments)

	workspaceID, _ := uuid.Parse(req.WorkspaceID)

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "story_video", queue.Message{
		Type:    "story_video",
		Payload: &req,
		ID:      req.ID,
	})

	storyJob := &models.Job{
		ID:            uuid.MustParse(jobID),
		JobType:       "story_video",
		TestimonialID: nil,
		WorkspaceID:   &workspaceID,
		Status:        "pending",
		Priority:      1,
		Payload: models.JSONMap{
			"workspace_id":         req.WorkspaceID,
			"testimonial_segments": req.TestimonialSegments,
			"brand_context":        req.BrandContext,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"output_format":        req.OutputFormat,
			"prompt":               req.Prompt,
		},
		MaxRetries:  3,
		ScheduledAt: &time.Time{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	*storyJob.ScheduledAt = time.Now()

	c.AIServiceManager.CreateJob(r.Context(), storyJob)

	if err != nil {
		c.logger.Error("Failed to queue story video generation job", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := AsyncJobResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Story video generation request has been queued for processing.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(response)
}

// RemoveNoise removes noise from a video testimonial
func (c *AIProcessorController) RemoveNoise(w http.ResponseWriter, r *http.Request) {
	log.Println("received request for noise removal")

	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.NoiseReductionRequest
		Source models.CreateArtifactSourceParams `json:"source"`
		ID     string                            `json:"id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Source.Type == "" || req.Source.Data == nil {
		http.Error(w, "invalid source data", http.StatusBadRequest)
		return
	}

	workspaceID, _ := uuid.Parse(req.WorkspaceID)

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "remove_noise", queue.Message{
		Type:    "remove_noise",
		Payload: &req,
		ID:      req.ID,
	})

	storyJob := &models.Job{
		ID:            uuid.MustParse(jobID),
		JobType:       "noise_removal",
		TestimonialID: nil,
		WorkspaceID:   &workspaceID,
		Status:        "pending",
		Payload: models.JSONMap{
			"workspace_id": req.WorkspaceID,
			"noise_level":  req.Level,
		},
		ScheduledAt: &time.Time{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	*storyJob.ScheduledAt = time.Now()

	c.AIServiceManager.CreateJob(r.Context(), storyJob)

	if err != nil {
		c.logger.Error("Failed to queue noise removal job", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := AsyncJobResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Noise removal request has been queued for processing.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(response)
}

func (c *AIProcessorController) SaveArtifact(w http.ResponseWriter, r *http.Request) {
	log.Println("saving artifact")

	var req struct {
		ProcessingType string         `json:"processing_type,omitempty"`
		TextContent    string         `json:"text_content,omitempty"`
		Data           models.JSONMap `json:"data,omitempty"`
		AssetUrl       string         `json:"asset_url,omitempty"`
		ContentType    string         `json:"content_type,omitempty"`
		WorkspaceID    string         `json:"workspace_id"`
		TestimonialID  string         `json:"testimonial_id,omitempty"`
		IsStreamed     bool           `json:"is_streamed,omitempty"`
		IsUserSaved    bool           `json:"is_user_saved,omitempty"`
		ResultCategory string         `json:"result_category,omitempty"`
		Platform       string         `json:"platform,omitempty"`
		ID             string         `json:"id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Println("request", req)

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid workspace id %s", err), http.StatusBadRequest)
	}

	if req.ID == "" {
		id := uuid.New()

		newArtifact := models.TestimonialArtifact{
			ID:             id,
			WorkspaceID:    workspaceID,
			ProcessingType: req.ProcessingType,
			TextContent:    &req.TextContent,
			ContentType:    req.ContentType,
			Data:           req.Data,
			AssetURL:       &req.AssetUrl,
			ResultCategory: req.ResultCategory,
			Platform:       &req.Platform,
			IsUserSaved:    req.IsUserSaved,
			IsStreamed:     req.IsStreamed,
		}

		if req.TestimonialID != "" {
			if testimonialID, err := uuid.Parse(req.TestimonialID); err == nil && testimonialID != uuid.Nil {
				newArtifact.TestimonialID = &testimonialID
			}
		}

		if err := c.ArtifactsRepo.Create(r.Context(), &newArtifact, c.DB); err != nil {
			http.Error(w, fmt.Sprintf("failed to create artifact %s", err), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
	} else {
		id, err := uuid.Parse(req.ID)
		if err != nil {
			http.Error(w, fmt.Sprintf("invalid artifact ID %s", err), http.StatusBadRequest)
			return
		}
		updates := models.JSONMap{}
		if req.TestimonialID != "" {
			updates["testimonial_id"] = req.TestimonialID
		}
		if req.WorkspaceID != "" {
			updates["workspace_id"] = req.WorkspaceID
		}
		if req.ProcessingType != "" {
			updates["processing_type"] = req.ProcessingType
		}
		if req.TextContent != "" {
			updates["text_content"] = req.TextContent
		}
		if req.Data != nil {
			updates["data"] = req.Data
		}
		if req.AssetUrl != "" {
			updates["asset_url"] = req.AssetUrl
		}
		if req.Platform != "" {
			updates["platform"] = req.Platform
		}
		if req.ResultCategory != "" {
			updates["result_category"] = req.ResultCategory
		}
		if req.ContentType != "" {
			updates["content_type"] = req.ContentType
		}

		if err := c.ArtifactsRepo.UpdateAny(r.Context(), id, updates, c.DB); err != nil {
			http.Error(w, fmt.Sprintf("failed to update artifact %s", err), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
	}

}

// ============================================================================
// JOB MANAGEMENT ENDPOINTS
// ============================================================================

// GetJobStatus retrieves the status of a specific job
func (c *AIProcessorController) GetJobStatus(w http.ResponseWriter, r *http.Request) {
	jobID := chi.URLParam(r, "jobID")
	if jobID == "" {
		http.Error(w, "job_id is required", http.StatusBadRequest)
		return
	}

	response, err := c.queueService.GetJobStatus(r.Context(), jobID)
	if err != nil {
		if response.Message == "not_found" {
			http.Error(w, "Job not found", http.StatusNotFound)
			return
		}
		c.logger.Error("Failed to get job status", zap.Error(err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetBulkJobStatus retrieves the status of multiple jobs
func (c *AIProcessorController) GetBulkJobStatus(w http.ResponseWriter, r *http.Request) {
	var req struct {
		JobIDs []string `json:"job_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.JobIDs) == 0 {
		http.Error(w, "job_ids is required", http.StatusBadRequest)
		return
	}

	if len(req.JobIDs) > 50 {
		http.Error(w, "Maximum 50 job IDs allowed", http.StatusBadRequest)
		return
	}

	results := make(map[string]queue.JobResult)
	for _, jobID := range req.JobIDs {
		if jobID == "" {
			continue
		}

		response, err := c.queueService.GetJobStatus(r.Context(), jobID)
		if err != nil || response.Message == "not_found" {
			results[jobID] = queue.JobResult{
				ID:     jobID,
				Status: "not_found",
				Error:  "Job not found",
			}
			continue
		}
		results[jobID] = response
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// CancelJob cancels a running job
func (c *AIProcessorController) CancelJob(w http.ResponseWriter, r *http.Request) {
	jobID := chi.URLParam(r, "jobID")
	if jobID == "" {
		http.Error(w, "job_id is required", http.StatusBadRequest)
		return
	}

	// Update job status to cancelled
	// c.queueService.SetJobStatus(r.Context(), jobID, "cancelled", 0, nil)
	err := c.queueService.CancelJob(r.Context(), jobID)
	if err != nil {
		// Job not found or not running, just update status
		c.queueService.SetJobStatus(r.Context(), jobID, "cancelled", 0, nil)
	}

	response := queue.JobResult{
		ID:      jobID,
		Status:  "cancelled",
		Message: "Job has been cancelled successfully.",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ============================================================================
// UTILITY METHODS
// ============================================================================

// HandleStreamingOptions handles CORS preflight requests for SSE
func (c *AIProcessorController) HandleStreamingOptions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")
	w.Header().Set("Access-Control-Max-Age", "3600")
	w.WriteHeader(http.StatusOK)
}
func (c *AIProcessorController) streamResponse(w http.ResponseWriter, r *http.Request, streamFunc func(context.Context) (<-chan ai.StreamChunk, error)) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("X-Accel-Buffering", "no") // Disable Nginx buffering

	// Flush response immediately
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	// Start streaming
	chunks, err := streamFunc(r.Context())
	if err != nil {
		return
	}

	// Process streaming chunks
	for chunk := range chunks {
		if chunk.Error != nil {
			break
		}

		w.Write([]byte(chunk.Content))
		flusher.Flush()
		if chunk.IsComplete {
			break
		}

		// check if client is disconnected
		select {
		case <-r.Context().Done():
			c.logger.Info("Client disconnected from stream")
			return
		default:
		}
		flusher.Flush()
	}
}

// streamResponseWithArtifact streams response and saves the result as an artifact
func (c *AIProcessorController) streamResponseWithArtifact(
	w http.ResponseWriter,
	r *http.Request,
	processingType string,
	workspaceID string,
	sourceData models.CreateArtifactSourceParams,
	streamFunc func(context.Context) (<-chan ai.StreamChunk, error),
) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("X-Accel-Buffering", "no") // Disable Nginx buffering

	// Flush response immediately
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	// Start streaming
	chunks, err := streamFunc(r.Context())
	if err != nil {
		return
	}

	// Accumulate content for artifact creation
	var fullContent strings.Builder
	var isStreamCompleted bool

	// Process streaming chunks
	for chunk := range chunks {
		if chunk.Error != nil {
			c.logger.Error("Streaming error", zap.Error(chunk.Error))
			break
		}

		// Write to client
		w.Write([]byte(chunk.Content))
		flusher.Flush()

		// Accumulate content
		fullContent.WriteString(chunk.Content)

		if chunk.IsComplete {
			isStreamCompleted = true
			break
		}

		// check if client is disconnected
		select {
		case <-r.Context().Done():
			c.logger.Info("Client disconnected from stream")
			return
		default:
		}
		flusher.Flush()
	}

	// Save artifact after streaming completes successfully
	if isStreamCompleted && fullContent.Len() > 0 {
		go func() {
			if err := c.saveStreamingArtifact(context.Background(), processingType, workspaceID, sourceData, fullContent.String()); err != nil {
				c.logger.Error("Failed to save streaming artifact", zap.Error(err), zap.String("processing_type", processingType))
			}
		}()
	}
}

// saveStreamingArtifact saves streaming content as an artifact with proper testimonial tracking
func (c *AIProcessorController) saveStreamingArtifact(
	ctx context.Context,
	processingType string,
	workspaceIDStr string,
	sourceData models.CreateArtifactSourceParams,
	content string,
) error {
	// Parse workspace ID
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		return fmt.Errorf("invalid workspace ID: %w", err)
	}

	// Extract testimonial IDs from source data
	var testimonialIDs []uuid.UUID
	if sourceData.Type == "testimonial" {
		// Handle both single testimonial and multiple testimonials
		switch data := sourceData.Data.(type) {
		case string:
			// Single testimonial ID
			if testimonialID, err := uuid.Parse(data); err == nil {
				testimonialIDs = append(testimonialIDs, testimonialID)
			}
		case []interface{}:
			// Multiple testimonial IDs
			for _, item := range data {
				if testimonialIDStr, ok := item.(string); ok {
					if testimonialID, err := uuid.Parse(testimonialIDStr); err == nil {
						testimonialIDs = append(testimonialIDs, testimonialID)
					}
				}
			}
		case []string:
			// Multiple testimonial IDs as string slice
			for _, testimonialIDStr := range data {
				if testimonialID, err := uuid.Parse(testimonialIDStr); err == nil {
					testimonialIDs = append(testimonialIDs, testimonialID)
				}
			}
		}
	}

	// Create artifact data with testimonial_ids tracking
	artifactData := models.JSONMap{
		"testimonial_ids": testimonialIDs,
		"content":         content,
	}

	// For content generation, add content type
	if processingType == "content_generation" {
		artifactData["content_type"] = "generated_content"
	}

	// Create artifact with proper lineage tracking
	artifactID, err := c.ArtifactsRepo.CreateArtifactWithLineage(
		ctx,
		processingType,
		workspaceID,
		nil, // testimonialID is nil for multi-testimonial content
		artifactData,
		sourceData,
		testimonialIDs,
		c.DB,
	)

	if err != nil {
		return fmt.Errorf("failed to create artifact with lineage: %w", err)
	}

	c.logger.Info("Successfully saved streaming artifact",
		zap.String("processing_type", processingType),
		zap.Int("testimonial_count", len(testimonialIDs)),
		zap.String("workspace_id", workspaceIDStr),
		zap.String("artifact_id", artifactID))

	return nil
}

// GetServiceLineage returns the complete service lineage for a source
func (c *AIProcessorController) GetServiceLineage(w http.ResponseWriter, r *http.Request) {
	sourceType := chi.URLParam(r, "sourceType")
	sourceID := chi.URLParam(r, "sourceID")

	if sourceType == "" || sourceID == "" {
		http.Error(w, "sourceType and sourceID are required", http.StatusBadRequest)
		return
	}

	// Convert string to your enum type
	var sourceTypeEnum models.ArtifactSourceType
	switch sourceType {
	case "testimonial":
		sourceTypeEnum = models.TestimonialTypeSource
	case "artifact":
		sourceTypeEnum = models.ArtifactTypeSource
	case "clip":
		sourceTypeEnum = models.ClipTypeSource
	default:
		http.Error(w, "invalid source type", http.StatusBadRequest)
		return
	}

	// Validate sourceID format
	if sourceTypeEnum != models.ClipTypeSource {
		if _, err := uuid.Parse(sourceID); err != nil {
			http.Error(w, "invalid source ID format", http.StatusBadRequest)
			return
		}
	}

	lineage, err := c.serviceLineageManager.GetServiceLineage(r.Context(), sourceID, sourceTypeEnum, c.DB)
	if err != nil {
		c.logger.Error("Failed to get service lineage",
			zap.String("sourceType", sourceType),
			zap.String("sourceID", sourceID),
			zap.Error(err))
		// http.Error(w, "Failed to get service lineage", http.StatusInternalServerError)
		// return

		fallbackResponse := map[string]interface{}{
			"applied_services":   []string{},
			"available_services": []string{},
			"blocked_services":   []string{},
			"service_tree":       []interface{}{},
			"last_processed_at":  "",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(fallbackResponse)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lineage)
}

// CheckServiceApplied checks if a specific service has been applied
func (c *AIProcessorController) CheckServiceApplied(w http.ResponseWriter, r *http.Request) {
	sourceType := chi.URLParam(r, "sourceType")
	sourceID := chi.URLParam(r, "sourceID")
	serviceName := chi.URLParam(r, "serviceName")

	if sourceType == "" || sourceID == "" || serviceName == "" {
		http.Error(w, "all parameters are required", http.StatusBadRequest)
		return
	}

	var sourceTypeEnum models.ArtifactSourceType
	switch sourceType {
	case "testimonial":
		sourceTypeEnum = models.TestimonialTypeSource
	case "artifact":
		sourceTypeEnum = models.ArtifactTypeSource
	case "clip":
		sourceTypeEnum = models.ClipTypeSource
	default:
		http.Error(w, "invalid source type", http.StatusBadRequest)
		return
	}

	isApplied, err := c.serviceLineageManager.IsServiceAlreadyApplied(
		r.Context(), sourceID, sourceTypeEnum, serviceName, c.DB)
	if err != nil {
		// c.logger.Error("Failed to check service application",
		// 	zap.String("sourceType", sourceType),
		// 	zap.String("sourceID", sourceID),
		// 	zap.String("service", serviceName),
		// 	zap.Error(err))
		// http.Error(w, "Failed to check service application", http.StatusInternalServerError)
		// return
		c.logger.Error("Failed to check service application",
			zap.String("sourceType", sourceType),
			zap.String("sourceID", sourceID),
			zap.String("service", serviceName),
			zap.Error(err))

		// ✅ MODIFIED: Return false instead of HTTP error for better UX
		isApplied = false // Assume not applied if we can't check
	}

	response := map[string]interface{}{
		"service_applied": isApplied,
		"service_name":    serviceName,
		"source_id":       sourceID,
		"source_type":     sourceType,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetServiceTree returns hierarchical service tree
func (c *AIProcessorController) GetServiceTree(w http.ResponseWriter, r *http.Request) {
	sourceType := chi.URLParam(r, "sourceType")
	sourceID := chi.URLParam(r, "sourceID")

	var sourceTypeEnum models.ArtifactSourceType
	switch sourceType {
	case "testimonial":
		sourceTypeEnum = models.TestimonialTypeSource
	case "artifact":
		sourceTypeEnum = models.ArtifactTypeSource
	case "clip":
		sourceTypeEnum = models.ClipTypeSource
	default:
		http.Error(w, "invalid source type", http.StatusBadRequest)
		return
	}

	lineage, err := c.serviceLineageManager.GetServiceLineage(r.Context(), sourceID, sourceTypeEnum, c.DB)
	if err != nil {
		// http.Error(w, "Failed to get service tree", http.StatusInternalServerError)
		// return
		response := map[string]interface{}{
			"service_tree":     []interface{}{},
			"applied_services": []string{},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Return just the service tree part
	response := map[string]interface{}{
		"service_tree":     lineage.ServiceTree,
		"applied_services": lineage.AppliedServices,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetAvailableServices returns services that can be applied to a source
func (c *AIProcessorController) GetAvailableServices(w http.ResponseWriter, r *http.Request) {
	sourceType := chi.URLParam(r, "sourceType")
	sourceID := chi.URLParam(r, "sourceID")

	var sourceTypeEnum models.ArtifactSourceType
	switch sourceType {
	case "testimonial":
		sourceTypeEnum = models.TestimonialTypeSource
	case "artifact":
		sourceTypeEnum = models.ArtifactTypeSource
	case "clip":
		sourceTypeEnum = models.ClipTypeSource
	default:
		http.Error(w, "invalid source type", http.StatusBadRequest)
		return
	}

	lineage, err := c.serviceLineageManager.GetServiceLineage(r.Context(), sourceID, sourceTypeEnum, c.DB)
	if err != nil {
		http.Error(w, "Failed to get available services", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"available_services": lineage.AvailableServices,
		"blocked_services":   lineage.BlockedServices,
		"applied_services":   lineage.AppliedServices,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (c *AIProcessorController) GetOptimizedServiceLineage(w http.ResponseWriter, r *http.Request) {
	sourceType := chi.URLParam(r, "sourceType")
	sourceID := chi.URLParam(r, "sourceID")

	fmt.Printf("source type: %s. \t source id: %s \n", sourceType, sourceID)

	if sourceType == "" || sourceID == "" {
		http.Error(w, "sourceType and sourceID are required", http.StatusBadRequest)
		return
	}

	var sourceTypeEnum models.ArtifactSourceType
	switch sourceType {
	case "testimonial":
		sourceTypeEnum = models.TestimonialTypeSource
	case "artifact":
		sourceTypeEnum = models.ArtifactTypeSource
	case "clip":
		sourceTypeEnum = models.ClipTypeSource
	default:
		http.Error(w, "invalid source type", http.StatusBadRequest)
		return
	}

	lineage, err := c.serviceLineageManager.GetServiceLineage(r.Context(), sourceID, sourceTypeEnum, c.DB)
	fmt.Printf("source type: %#v \n", lineage)
	if err != nil {
		// Graceful fallback
		fallbackResponse := map[string]interface{}{
			"applied_services":   []string{},
			"available_services": []string{},
			"service_tree":       []interface{}{},
			"total_artifacts":    0,
			"error":              "Service lineage temporarily unavailable",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(fallbackResponse)
		return
	}

	// Transform to optimized format expected by frontend
	response := map[string]interface{}{
		"applied_services":   lineage.AppliedServices,
		"available_services": lineage.AvailableServices,
		"service_tree":       lineage.ServiceTree,
		"total_artifacts":    len(lineage.ServiceTree),
		"last_processed_at":  lineage.LastProcessedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ✅ ADDED: Cache invalidation endpoint
func (c *AIProcessorController) InvalidateServiceLineageCache(w http.ResponseWriter, r *http.Request) {
	sourceType := chi.URLParam(r, "sourceType")
	sourceID := chi.URLParam(r, "sourceID")

	var sourceTypeEnum models.ArtifactSourceType
	switch sourceType {
	case "testimonial":
		sourceTypeEnum = models.TestimonialTypeSource
	case "artifact":
		sourceTypeEnum = models.ArtifactTypeSource
	case "clip":
		sourceTypeEnum = models.ClipTypeSource
	default:
		http.Error(w, "invalid source type", http.StatusBadRequest)
		return
	}

	c.serviceLineageManager.InvalidateCache(sourceTypeEnum, sourceID)

	response := map[string]interface{}{
		"success": true,
		"message": "Cache invalidated successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// PreventDuplicateProcessing is middleware that prevents duplicate service applications
func (c *AIProcessorController) PreventDuplicateProcessing(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only apply to POST requests (processing requests)
		if r.Method != "POST" {
			next.ServeHTTP(w, r)
			return
		}

		// Determine service type from URL path
		serviceName := c.getServiceNameFromPath(r.URL.Path)
		if serviceName == "" {
			// If we can't determine service name, let it proceed
			next.ServeHTTP(w, r)
			return
		}

		// Read and parse request body
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		// Parse the body
		var requestBody map[string]any
		if err := json.Unmarshal(bodyBytes, &requestBody); err != nil {
			next.ServeHTTP(w, r)
			return
		}

		// Restore request body for next handler
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		// Extract source information - adapt to your request structure
		sourceInfo, exists := requestBody["source"].(map[string]interface{})
		if !exists {
			next.ServeHTTP(w, r)
			return
		}

		sourceTypeStr, exists := sourceInfo["type"].(string)
		if !exists {
			next.ServeHTTP(w, r)
			return
		}

		sourceData, exists := sourceInfo["data"]
		if !exists {
			next.ServeHTTP(w, r)
			return
		}

		var sourceTypeEnum models.ArtifactSourceType
		var sourceID string

		switch sourceTypeStr {
		case "testimonial":
			sourceTypeEnum = models.TestimonialTypeSource
			sourceID = sourceData.(string)
		case "artifact":
			sourceTypeEnum = models.ArtifactTypeSource
			sourceID = sourceData.(string)
		case "clip":
			sourceTypeEnum = models.ClipTypeSource
			// Handle clip data structure
			if clipData, ok := sourceData.(map[string]interface{}); ok {
				artifactID := clipData["artifact_id"].(string)
				clipID := clipData["clip_id"].(string)
				sourceID = fmt.Sprintf("%s:%s", artifactID, clipID)
			} else {
				next.ServeHTTP(w, r)
				return
			}
		default:
			next.ServeHTTP(w, r)
			return
		}

		// Check if service is already applied
		isApplied, err := c.serviceLineageManager.IsServiceAlreadyApplied(
			r.Context(), sourceID, sourceTypeEnum, serviceName, c.DB)
		if err != nil {
			c.logger.Error("Failed to check duplicate processing",
				zap.String("service", serviceName),
				zap.String("sourceID", sourceID),
				zap.Error(err))
			// Don't block on error
			next.ServeHTTP(w, r)
			return
		}

		if isApplied {
			// Service already applied - return conflict response
			response := map[string]any{
				"error": "service_already_applied",
				"message": fmt.Sprintf(
					"Service '%s' has already been applied to this source. Check the service tree for existing results.",
					serviceName,
				),
				"service":     serviceName,
				"source_type": sourceTypeStr,
				"source_id":   sourceID,
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(response)
			return
		}

		// Service not applied, proceed with processing
		next.ServeHTTP(w, r)
	})
}

// getServiceNameFromPath extracts service name from URL path
func (c *AIProcessorController) getServiceNameFromPath(path string) string {
	// Map your existing endpoints to service names
	serviceMap := map[string]string{
		"/api/ai/enhance-media":      "enhancement",
		"/api/ai/optimize-platform":  "platform_optimizer",
		"/api/ai/smart-clips":        "clipping",
		"/api/ai/generate-narration": "narration",
		"/api/ai/story-video":        "story_mode_generation",
		"/api/polish":                "text_polishing",
		"/api/translate":             "translation",
		"/api/generate-content":      "content_generation",
	}

	return serviceMap[path]
}

// GetArtifactsByWorkspace handles GET /api/ai/workspaces/{workspaceID}/artifacts
func (c *AIProcessorController) GetArtifactsByWorkspace(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	workspaceIDStr := chi.URLParam(r, "workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	processingTypes := r.URL.Query()["type"] // Allow multiple types: ?type=content_generation&type=story_mode_generation
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	if limitStr != "" {
		if parsedLimit := parseIntParam(limitStr, 50); parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	offset := 0 // default
	if offsetStr != "" {
		offset = parseIntParam(offsetStr, 0)
	}

	artifacts, err := c.ArtifactsRepo.GetByWorkspaceID(ctx, workspaceID, processingTypes, limit, offset, c.DB)
	if err != nil {
		c.logger.Error("Failed to get artifacts by workspace", zap.Error(err), zap.String("workspace_id", workspaceIDStr))
		http.Error(w, "Failed to retrieve artifacts", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"data":    artifacts,
		"count":   len(artifacts),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetContentGenerationArtifacts handles GET /api/ai/workspaces/{workspaceID}/content-generation
func (c *AIProcessorController) GetContentGenerationArtifacts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	workspaceIDStr := chi.URLParam(r, "workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	if limitStr != "" {
		if parsedLimit := parseIntParam(limitStr, 50); parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	offset := 0 // default
	if offsetStr != "" {
		offset = parseIntParam(offsetStr, 0)
	}

	artifacts, err := c.ArtifactsRepo.GetContentGenerationArtifacts(ctx, workspaceID, limit, offset, c.DB)
	if err != nil {
		c.logger.Error("Failed to get content generation artifacts", zap.Error(err), zap.String("workspace_id", workspaceIDStr))
		http.Error(w, "Failed to retrieve content generation artifacts", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"data":    artifacts,
		"count":   len(artifacts),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetStoryVideoArtifacts handles GET /api/ai/workspaces/{workspaceID}/story-videos
func (c *AIProcessorController) GetStoryVideoArtifacts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	workspaceIDStr := chi.URLParam(r, "workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		http.Error(w, "Invalid workspace ID", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	if limitStr != "" {
		if parsedLimit := parseIntParam(limitStr, 50); parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	offset := 0 // default
	if offsetStr != "" {
		offset = parseIntParam(offsetStr, 0)
	}

	artifacts, err := c.ArtifactsRepo.GetStoryVideoArtifacts(ctx, workspaceID, limit, offset, c.DB)
	if err != nil {
		c.logger.Error("Failed to get story video artifacts", zap.Error(err), zap.String("workspace_id", workspaceIDStr))
		http.Error(w, "Failed to retrieve story video artifacts", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"data":    artifacts,
		"count":   len(artifacts),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper function to parse integer parameters
func parseIntParam(param string, defaultValue int) int {
	if param == "" {
		return defaultValue
	}

	var value int
	if _, err := fmt.Sscanf(param, "%d", &value); err != nil {
		return defaultValue
	}

	return value
}

// SaveHighlightOrder saves the reordered highlights for a testimonial
func (c *AIProcessorController) SaveHighlightOrder(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID   string   `json:"workspace_id"`
		TestimonialID string   `json:"testimonial_id"`
		HighlightIDs  []string `json:"highlight_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.WorkspaceID == "" || req.TestimonialID == "" || len(req.HighlightIDs) == 0 {
		http.Error(w, "workspace_id, testimonial_id, and highlight_ids are required", http.StatusBadRequest)
		return
	}

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		http.Error(w, "invalid testimonial_id format", http.StatusBadRequest)
		return
	}

	// Update existing highlight artifacts to include the new order
	// Find existing highlight extraction artifact for this testimonial
	highlightArtifact, err := c.ArtifactsRepo.GetByTestimonialAndType(r.Context(), testimonialID, "highlight_extraction", c.DB)
	if err != nil {
		c.logger.Error("Failed to get highlight artifact", zap.Error(err))
		http.Error(w, "Failed to get highlight artifact", http.StatusInternalServerError)
		return
	}

	if highlightArtifact == nil {
		http.Error(w, "No highlight artifact found to update", http.StatusNotFound)
		return
	}

	// Add the custom order to the artifact data
	if highlightArtifact.Data == nil {
		highlightArtifact.Data = make(models.JSONMap)
	}
	highlightArtifact.Data["custom_order"] = req.HighlightIDs
	highlightArtifact.Data["ordered_at"] = time.Now()

	// Update the artifact in the database
	err = c.ArtifactsRepo.Update(r.Context(), highlightArtifact, c.DB)
	if err != nil {
		c.logger.Error("Failed to update highlight artifact", zap.String("artifact_id", highlightArtifact.ID.String()), zap.Error(err))
		http.Error(w, "Failed to update highlight order", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Highlight order saved successfully",
	})
}

// ExtractHighlightsByType extracts highlights of a specific type
func (c *AIProcessorController) ExtractHighlightsByType(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID   string                        `json:"workspace_id"`
		TestimonialID string                        `json:"testimonial_id"`
		Text          string                        `json:"text"`
		Segments      []models.TranscriptionSegment `json:"segments,omitempty"`
		Prompt        string                        `json:"prompt"`
		HighlightType string                        `json:"highlight_type"` // general, problem, solution, etc.
		MaxHighlights int                           `json:"max_highlights,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Text == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}

	if req.HighlightType == "" {
		req.HighlightType = "general"
	}

	if req.MaxHighlights == 0 {
		req.MaxHighlights = 5
	}

	testimonialID, err := uuid.Parse(req.TestimonialID)
	if err != nil {
		http.Error(w, "invalid testimonial ID format", http.StatusBadRequest)
		return
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		http.Error(w, "invalid workspace ID format", http.StatusBadRequest)
		return
	}

	// Create highlight request
	highlightRequest := ai.HighlightRequest{
		Text:          req.Text,
		Segments:      req.Segments,
		CustomPrompt:  req.Prompt,
		HighlightType: ai.HighlightType(req.HighlightType),
		MaxHighlights: req.MaxHighlights,
	}

	// Extract highlights by type
	highlights, err := c.HighlightService.ExtractHighlightsByType(r.Context(), highlightRequest)
	if err != nil {
		c.logger.Error("Highlight extraction by type failed", zap.Error(err), zap.String("type", req.HighlightType))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Save the highlights as an artifact
	artifactType := fmt.Sprintf("highlight_extraction_%s", req.HighlightType)
	_, err = c.ArtifactsRepo.CreateArtifactWithLineage(r.Context(), artifactType, workspaceID, &testimonialID, models.JSONMap{
		"highlights":     highlights,
		"highlight_type": req.HighlightType,
		"max_highlights": req.MaxHighlights,
	}, models.CreateArtifactSourceParams{Type: models.NoTypeSource}, nil, c.DB)

	if err != nil {
		c.logger.Error("highlight extraction artifact creation failed", zap.String("type", req.HighlightType), zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(highlights)
}

// func (c *AIProcessorController) NukeJobStatus(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()

// 	err := NukeAllJobStatus(ctx, c.sseManager.cacheService, c.logger)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(map[string]string{
// 		"message": "All job status keys deleted successfully - starting fresh!",
// 		"note":    "New jobs will automatically get TTL and clean up properly",
// 	})
// }
