// internal/controllers/ai_test_controller.go
package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/pb"
	"go.uber.org/zap"
)

// AITestController handles AI service testing endpoints
type AITestController struct {
	ai.AIServiceManager
	queueService queue.Service
	logger       *zap.Logger
}

// NewAITestController creates a new AI test controller with SSE support
func NewAITestController(
	aiService ai.AIServiceManager,
	queueService queue.Service,
	logger *zap.Logger,
	cacheService cache.RedisCache,
) *AITestController {
	// ctx, cancel := context.WithCancel(context.Background())

	// sseManager := &SSEManager{
	// 	clients:      make(map[string]chan queue.JobResult),
	// 	logger:       logger,
	// 	cacheService: cacheService,
	// 	ctx:          ctx,
	// 	cancel:       cancel,
	// }

	controller := &AITestController{
		AIServiceManager: aiService,
		queueService:     queueService,
		// sseManager:       sseManager,
		logger: logger,
	}

	// Start the SSE notification system
	// go controller.startSSENotificationSystem()

	return controller
}

// ExtractBrandContext extracts brand context from a website URL
func (c *AITestController) ExtractBrandContext(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WebsiteURL string `json:"website_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.WebsiteURL == "" {
		http.Error(w, "website_url is required", http.StatusBadRequest)
		return
	}

	c.logger.Info("Brand context extraction request", zap.String("url", req.WebsiteURL))

	uuid := uuid.New()

	brandContext, err := c.BrandContextService.ExtractBrandContext(r.Context(), req.WebsiteURL, uuid)
	if err != nil {
		c.logger.Error("Brand context extraction failed", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(brandContext)
}

// TranscribeAudio transcribes audio to text
func (c *AITestController) TranscribeAudio(w http.ResponseWriter, r *http.Request) {
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
func (c *AITestController) TranslateText(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Text       string `json:"text"`
		SourceLang string `json:"source_lang"`
		TargetLang string `json:"target_lang"`
		Prompt     string `json:"prompt"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Error decoding translation request", zap.Error(err))
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Text == "" || req.TargetLang == "" {
		http.Error(w, "text and target_lang are required", http.StatusBadRequest)
		return
	}

	if req.SourceLang == "" {
		req.SourceLang = "auto"
	}

	// result, err := c.TranslationService.TranslateText(r.Context(), req.Text, req.SourceLang, req.TargetLang, req.Prompt)
	// if err != nil {
	// 	c.logger.Error("Translation failed", zap.Error(err))
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// w.Header().Set("Content-Type", "application/json")
	// json.NewEncoder(w).Encode(result)

	c.streamResponse(w, r, func(ctx context.Context) (<-chan ai.StreamChunk, error) {
		return c.TranslationService.TranslateTextStream(r.Context(), req.Text, req.SourceLang, req.TargetLang, req.Prompt)
	})
}

// AnalyzeSentiment analyzes sentiment of text
func (c *AITestController) AnalyzeSentiment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Texts        []string             `json:"texts"`
		BrandContext *models.BrandContext `json:"brand_context"`
		Prompt       string               `json:"prompt"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Texts) == 0 {
		http.Error(w, "texts array cannot be empty", http.StatusBadRequest)
		return
	}

	results, err := c.SentimentService.AnalyzeSentiments(r.Context(), req.Texts, req.BrandContext, req.Prompt)
	if err != nil {
		c.logger.Error("Sentiment analysis failed", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// ExtractHighlights extracts key highlights from text
func (c *AITestController) ExtractHighlights(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TestimonialID string `json:"testimonial_id"`
		WorkspaceID   string `json:"workspace_id"`
		// Text          string                        `json:"text"`
		// Segments      []models.TranscriptionSegment `json:"segments,omitempty"`
		Prompt        string `json:"prompt"`
		HighlightType string `json:"highlight_type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// if req.Text == "" {
	// 	http.Error(w, "text is required", http.StatusBadRequest)
	// 	return
	// }
	testimonialID, _ := uuid.Parse(req.TestimonialID)

	highlightRequest := ai.HighlightRequest{
		// Text:          req.Text,
		// Segments:      req.Segments,
		TestimonialID: testimonialID,
		HighlightType: ai.HighlightType(req.HighlightType),
		CustomPrompt:  req.Prompt,
	}

	highlights, err := c.HighlightService.ExtractHighlightsByType(r.Context(), highlightRequest)
	if err != nil {
		c.logger.Error("Highlight extraction failed", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(highlights)
}

func (c AITestController) DetectFillers(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Transcript string                        `json:"transcript"`
		Segments   []models.TranscriptionSegment `json:"segments,omitempty"`
		Prompt     string                        `json:"prompt"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Transcript == "" {
		http.Error(w, "transcript is required", http.StatusBadRequest)
		return
	}

	fillers, err := c.FillerDetectionService.AnalyzeFillers(r.Context(), req.Transcript, req.Segments, req.Prompt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fillers)
}

func (c AITestController) PolishText(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Text                 string               `json:"text"`
		BrandContext         *models.BrandContext `json:"brand_context"`
		PreserveAuthenticity bool                 `json:"preserve_authenticity"`
		TargetStyle          string               `json:"target_style,omitempty"`
		Prompt               string               `json:"prompt"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Text == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}

	// result, err := c.PolishService.PolishText(r.Context(), req.Text, req.BrandContext, req.PreserveAuthenticity, req.TargetStyle, req.Prompt)
	// if err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// w.Header().Set("Content-Type", "application/json")
	// json.NewEncoder(w).Encode(result)

	c.streamResponse(w, r, func(ctx context.Context) (<-chan ai.StreamChunk, error) {
		return c.PolishService.PolishTextStream(r.Context(), req.Text, req.BrandContext, req.PreserveAuthenticity, req.TargetStyle, req.Prompt)
	})

}

// GenerateContent generates content based on testimonials
func (c AITestController) GenerateContent(w http.ResponseWriter, r *http.Request) {
	var req ai.ContentRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Testimonials) == 0 {
		http.Error(w, "testimonials array cannot be empty", http.StatusBadRequest)
		return
	}

	if req.ContentType == "" {
		http.Error(w, "content_type is required", http.StatusBadRequest)
		return
	}

	// result, err := c.ContentGenerationService.GenerateContent(r.Context(), &req)
	// if err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// w.Header().Set("Content-Type", "application/json")
	// json.NewEncoder(w).Encode(result)

	c.streamResponse(w, r, func(ctx context.Context) (<-chan ai.StreamChunk, error) {
		return c.ContentGenerationService.GenerateContentStream(r.Context(), &req)
	})
}

// ============================================================================
// GPU-INTENSIVE AI SERVICES (gRPC-based, queued jobs)
// ============================================================================

// AnalyzeEmotion analyzes emotions in video content (GPU-intensive)
func (c *AITestController) AnalyzeEmotion(w http.ResponseWriter, r *http.Request) {
	var req struct {
		// MediaURL       string   `json:"media_url"`
		// TargetEmotions []string `json:"target_emotions,omitempty"`
		// AnalysisDepth  string   `json:"analysis_depth,omitempty"`
		WorkspaceID string `json:"workspace_id"`
		pb.EmotionRequest
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// if req.MediaURL == "" {
	// 	http.Error(w, "media_url is required", http.StatusBadRequest)
	// 	return
	// }

	// Set defaults
	if req.AnalysisDepth == "" {
		req.AnalysisDepth = "standard"
	}
	// if len(req.TargetEmotions) == 0 {
	// 	req.TargetEmotions = []string{"happiness", "satisfaction", "trust"}
	// }

	// Create protobuf request
	// pbReq := &pb.EmotionRequest{
	// 	MediaUrl:       req.MediaURL,
	// 	TargetEmotions: req.TargetEmotions,
	// 	AnalysisDepth:  req.AnalysisDepth,
	// }

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "emotion", queue.Message{
		Type:    "emotion",
		Payload: &req,
	})

	if err != nil {
		c.logger.Error("Failed to queue emotion analysis job", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := AsyncJobResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Emotion analysis request has been queued for processing.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(response)
}

// EnhanceMedia enhances video/audio quality (GPU-intensive)
func (c *AITestController) EnhanceMedia(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.EnhanceRequest
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// if req.MediaURL == "" {
	// 	http.Error(w, "media_url is required", http.StatusBadRequest)
	// 	return
	// }

	// Set defaults
	if req.Quality == "" {
		req.Quality = "high"
	}

	// Create protobuf request
	// pbReq := &pb.EnhanceRequest{
	// 	MediaUrl:           req.MediaURL,
	// 	Quality:            req.Quality,
	// 	UploadToCloud:      req.UploadToCloud,
	// 	CustomEnhancements: req.CustomEnhancements,
	// }

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "enhancement", queue.Message{
		Type:    "enhancement",
		Payload: &req,
	})

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
func (c *AITestController) GenerateNarration(w http.ResponseWriter, r *http.Request) {
	// var req struct {
	// 	Text            string `json:"text"`
	// 	Language        string `json:"language"`
	// 	VoiceID         string `json:"voice_id"`
	// 	Gender          string `json:"gender"`
	// 	Style           string `json:"style"`
	// 	Prompt          string `json:"prompt"`
	// 	BackgroundMusic string `json:"background_music"`
	// 	MusicVolume     string `json:"music_volume"`
	// }

	var req struct {
		WorkspaceID string `json:"workspace_id"`
		pb.NarrationRequest
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Text == "" && req.TestimonialId == "" {
		http.Error(w, "text or the testimonial ID is required", http.StatusBadRequest)
		return
	}

	// Set defaults
	if req.Language == "" {
		req.Language = "en"
	}
	// if req.VoiceID == "" {
	// 	req.VoiceID = "21m00Tcm4TlvDq8ikWAM" // Default ElevenLabs voice
	// }

	// Create protobuf request

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "narration", queue.Message{
		Type:    "narration",
		Payload: &req,
	})

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
func (c *AITestController) GenerateSmartClips(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID string `json:"workspace_id"`

		pb.ClippingRequest
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// if req.MediaUrl == "" {
	// 	http.Error(w, "media_url and transcript are required", http.StatusBadRequest)
	// 	return
	// }

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "clipping", queue.Message{
		Type:    "clipping",
		Payload: &req,
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
func (c *AITestController) OptimizeForPlatform(w http.ResponseWriter, r *http.Request) {
	var req struct {
		WorkspaceID string `json:"workspace_id"`
		IsTextOnly  bool   `json:"is_text_only"`
		Prompt      string `json:"prompt"`
		pb.OptimizeRequest
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TargetPlatform == "" {
		http.Error(w, "target_platform is required", http.StatusBadRequest)
		return
	}

	if (req.IsTextOnly && req.Transcript == "") || req.TestimonialId == "" {
		http.Error(w, "invalid parameters", http.StatusBadRequest)
		return
	}

	// Set defaults
	if req.OptimizationQuality == "" {
		req.OptimizationQuality = "high"
	}

	if req.IsTextOnly {
		result, err := c.PlatformOptimizerService.OptimizeForPlatform(r.Context(), req.WorkspaceID, req.Transcript, req.BrandContext, req.TargetPlatform, req.Prompt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// workspaceID, _ := uuid.Parse(req.WorkspaceID)
		// testimonialID, _ := uuid.Parse(req.TestimonialId)

		// c.SaveResponseToArtifacts(r.Context(), "textonly-platform-optimization", workspaceID, &testimonialID, map[string]any{
		// 	"optimized_text": result,
		// })

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
		// json.NewEncoder(w).Encode([]byte("Bypass"))

		return
	}

	// pbReq := pb.OptimizeRequest{
	// 	MediaUrl:          req.MediaUrl,
	// 	TargetPlatform:    req.TargetPlatform,
	// 	BrandContext:      req.BrandContext,
	// 	EnableTransitions: true,
	// 	AddBranding:       true,
	// 	MusicVolume:       "low",
	// }
	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "platform_optimizer", queue.Message{
		Type:    "platform_optimizer",
		Payload: &req,
	})

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

// SelectThumbnail selects optimal thumbnails (GPU-intensive)
func (c *AITestController) SelectThumbnail(w http.ResponseWriter, r *http.Request) {
	var req struct {
		// MediaURL      string `json:"media_url"`
		// MaxThumbnails int32  `json:"max_thumbnails"`
		WorkspaceID string `json:"workspace_id"`
		pb.ThumbnailRequest
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// if req.MediaURL == "" {
	// 	http.Error(w, "media_url is required", http.StatusBadRequest)
	// 	return
	// }

	// Set defaults
	if req.MaxThumbnails == 0 {
		req.MaxThumbnails = 5
	}

	// Create protobuf request
	// pbReq := &pb.ThumbnailRequest{
	// 	MediaUrl:      req.MediaURL,
	// 	MaxThumbnails: req.MaxThumbnails,
	// }

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "thumbnail", queue.Message{
		Type:    "thumbnail",
		Payload: &req,
	})

	if err != nil {
		c.logger.Error("Failed to queue thumbnail selection job", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := AsyncJobResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Thumbnail selection request has been queued for processing.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(response)
}

// GenerateStoryVideo creates story videos from testimonials (GPU-intensive)
func (c *AITestController) GenerateStoryVideo(w http.ResponseWriter, r *http.Request) {
	log.Println("received request for story video")
	// var req struct {
	// 	TestimonialSegments []map[string]any `json:"testimonial_segments"`
	// 	BrandContext        map[string]any   `json:"brand_context"`
	// 	OutputFormat        string           `json:"output_format"`
	// 	BackgroundMusic     string           `json:"background_music"`
	// 	MusicVolume         string           `json:"music_volume"`
	// 	Prompt              string           `json:"prompt"`
	// }

	var req struct {
		WorkspaceID string `json:"workspace_id"`

		pb.StoryModeRequest
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// if len(req.TestimonialSegments) == 0 || req.BrandContext == nil {
	// 	http.Error(w, "testimonial_segments and brand_context are required", http.StatusBadRequest)
	// 	return
	// }

	// Set defaults
	if req.OutputFormat == "" {
		req.OutputFormat = "mp4"
	}

	fmt.Printf("testimonial segments: %d\n", len(req.TestimonialSegments))

	// Create protobuf request (simplified for this example)
	// pbReq := &pb.StoryModeRequest{
	// 	OutputFormat:    req.OutputFormat,
	// 	BackgroundMusic: req.BackgroundMusic,
	// 	MusicVolume:     req.MusicVolume,
	// 	Prompt:          req.Prompt,
	// 	// Note: You'll need to properly convert testimonial_segments and brand_context
	// 	// to protobuf format based on your actual proto definitions
	// }

	// Queue the job
	jobID, err := c.queueService.Publish(r.Context(), "story_video", queue.Message{
		Type:    "story_video",
		Payload: &req,
	})

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

// ============================================================================
// JOB MANAGEMENT ENDPOINTS
// ============================================================================

// GetJobStatus retrieves the status of a specific job
func (c *AITestController) GetJobStatus(w http.ResponseWriter, r *http.Request) {
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
func (c *AITestController) GetBulkJobStatus(w http.ResponseWriter, r *http.Request) {
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
func (c *AITestController) CancelJob(w http.ResponseWriter, r *http.Request) {
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

// func (c *AIProcessorController) tryDirectCancel(jobID string) {
// 	// If you have access to the worker instance, try direct cancellation
// 	// This is optional and depends on your architecture
// 	if c.aiWorker != nil {
// 		c.aiWorker.mu.RLock()
// 		if cancelFunc, exists := c.aiWorker.activeCancelFunctions[jobID]; exists {
// 			cancelFunc()
// 			c.logger.Info("Direct job cancellation executed", zap.String("job_id", jobID))
// 		}
// 		c.aiWorker.mu.RUnlock()
// 	}
// }

// HandleStreamingOptions handles CORS preflight requests for SSE
func (c *AITestController) HandleStreamingOptions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")
	w.Header().Set("Access-Control-Max-Age", "3600")
	w.WriteHeader(http.StatusOK)
}

// Cleanup resources when the controller is destroyed
// func (c *AITestController) Cleanup() {
// 	if c.sseManager != nil {
// 		c.sseManager.cancel()
// 	}
// }

func (c *AITestController) streamResponse(w http.ResponseWriter, r *http.Request, streamFunc func(context.Context) (<-chan ai.StreamChunk, error)) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Header", "Cache-Control")

	// Flush response immediately
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	// Start streaming
	chunks, err := streamFunc(r.Context())
	if err != nil {
		// c.WriteSSE(w, "error", map[string]any{
		// 	"error": err.Error(),
		// })
		// flusher.Flush()
		return
	}

	// // Send initial connection event
	// c.WriteSSE(w, "connected", map[string]any{
	// 	"message": "Stream started",
	// })
	// flusher.Flush()

	// Process streaming chunks
	for chunk := range chunks {
		if chunk.Error != nil {
			// c.WriteSSE(w, "error", map[string]any{
			// 	"error": chunk.Error.Error(),
			// })
			// flusher.Flush()
			break
		}

		// eventType := "data"
		// if chunk.IsComplete {
		// 	eventType = "complete"
		// }

		w.Write([]byte(chunk.Content))

		// c.WriteSSE(w, eventType, map[string]any{
		// 	"content":     chunk.Content,
		// 	"is_partial":  chunk.IsPartial,
		// 	"is_complete": chunk.IsComplete,
		// 	"timestamp":   time.Now().UnixNano() / int64(time.Millisecond),
		// })

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

		// // Send final event
		// c.WriteSSE(w, "end", map[string]any{
		// 	"message": "Stream completed",
		// })
		flusher.Flush()
	}
}

// func (c *AITestController) WriteSSE(w http.ResponseWriter, event string, data any) {
// 	jsonData, _ := json.Marshal(data)
// 	w.Write([]byte(fmt.Sprintf("event: %s\n", event)))
// 	w.Write([]byte(fmt.Sprintf("data: %s\n\n", string(jsonData))))
// }
