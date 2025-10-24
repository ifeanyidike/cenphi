// internal/ai/rest_client.go

package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"github.com/ifeanyidike/cenphi/pb"
)

type RESTClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
	closed     bool
	mu         sync.RWMutex
	isRunPod   bool
}

type RunPodRequest struct {
	Input map[string]interface{} `json:"input"`
}

type RunPodResponse struct {
	ID            string                 `json:"id"`
	Status        string                 `json:"status"`
	Output        map[string]interface{} `json:"output,omitempty"`
	Error         string                 `json:"error,omitempty"`
	DelayTime     int                    `json:"delayTime,omitempty"`
	ExecutionTime int                    `json:"executionTime,omitempty"`
}

func NewRESTClient(cfg config.MediaIntelligenceConfig) (MediaIntelligence, error) {
	baseURL := cfg.Address
	apiKey := cfg.ApiKey

	if baseURL == "" {
		return nil, fmt.Errorf("GRPC_ADDRESS must be set to REST endpoint URL")
	}

	isRunPod := len(baseURL) > 0 && (strings.Contains(baseURL, "runpod.ai")) && apiKey != ""

	client := &RESTClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: cfg.RequestTimeout,
		},
		closed:   false,
		isRunPod: isRunPod,
	}

	if isRunPod {
		fmt.Printf("RunPod Client initialized for endpoint: %s\n", baseURL)
	} else {
		fmt.Printf("REST Client initialized for endpoint: %s\n", baseURL)
	}

	fmt.Printf("REST Client initialized for endpoint: %s\n", baseURL)
	return client, nil
}

func (c *RESTClient) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.closed = true
	return nil
}

func (c *RESTClient) makeRequest(ctx context.Context, endpoint string, request interface{}, response interface{}) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if c.closed {
		return fmt.Errorf("REST client is closed")
	}

	var requestBody []byte
	var err error
	var url string

	if c.isRunPod {
		// For RunPod, wrap the request in the expected format
		runPodReq := RunPodRequest{
			Input: request.(map[string]interface{}),
		}
		requestBody, err = json.Marshal(runPodReq)
		if err != nil {
			return fmt.Errorf("failed to marshal RunPod request: %w", err)
		}

		// RunPod uses /run or /runsync endpoints
		url = fmt.Sprintf("%s/run", c.baseURL)
	} else {
		// Regular REST API
		requestBody, err = json.Marshal(request)
		if err != nil {
			return fmt.Errorf("failed to marshal request: %w", err)
		}
		url = fmt.Sprintf("%s%s", c.baseURL, endpoint)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(requestBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	if c.isRunPod && c.apiKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	}

	// Make request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	// Check status code
	if resp.StatusCode >= 400 {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(responseBody))
	}

	if c.isRunPod {
		// Handle RunPod response format
		var runPodResp RunPodResponse
		if err := json.Unmarshal(responseBody, &runPodResp); err != nil {
			return fmt.Errorf("failed to unmarshal RunPod response: %w", err)
		}

		// Check for RunPod errors
		if runPodResp.Error != "" {
			return fmt.Errorf("RunPod error: %s", runPodResp.Error)
		}

		// Handle async responses
		if runPodResp.Status == "IN_QUEUE" || runPodResp.Status == "IN_PROGRESS" {
			return c.pollRunPodJob(ctx, runPodResp.ID, response)
		}

		// For completed jobs, extract the output
		if runPodResp.Status == "COMPLETED" && runPodResp.Output != nil {
			// Convert the output back to the expected format
			outputBytes, err := json.Marshal(runPodResp.Output)
			if err != nil {
				return fmt.Errorf("failed to marshal RunPod output: %w", err)
			}

			if err := json.Unmarshal(outputBytes, response); err != nil {
				return fmt.Errorf("failed to unmarshal RunPod output: %w", err)
			}
		} else if runPodResp.Status == "FAILED" {
			return fmt.Errorf("RunPod job failed")
		}
	} else {
		// Regular REST response
		if err := json.Unmarshal(responseBody, response); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}

func (c *RESTClient) pollRunPodJob(ctx context.Context, jobID string, response interface{}) error {
	statusURL := fmt.Sprintf("%s/status/%s", c.baseURL, jobID)

	ticker := time.NewTicker(2 * time.Second) // Poll every 2 seconds
	defer ticker.Stop()

	timeout := time.NewTimer(45 * time.Minute) // 5 minute timeout
	defer timeout.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-timeout.C:
			return fmt.Errorf("RunPod job timeout")
		case <-ticker.C:
			req, err := http.NewRequestWithContext(ctx, "GET", statusURL, nil)
			if err != nil {
				return fmt.Errorf("failed to create status request: %w", err)
			}

			if c.apiKey != "" {
				req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
			}

			resp, err := c.httpClient.Do(req)
			if err != nil {
				continue // Retry on network errors
			}

			body, err := io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				continue
			}

			var statusResp RunPodResponse
			if err := json.Unmarshal(body, &statusResp); err != nil {
				continue
			}

			switch statusResp.Status {
			case "COMPLETED":
				if statusResp.Output != nil {
					outputBytes, err := json.Marshal(statusResp.Output)
					if err != nil {
						return fmt.Errorf("failed to marshal RunPod output: %w", err)
					}

					if err := json.Unmarshal(outputBytes, response); err != nil {
						return fmt.Errorf("failed to unmarshal RunPod output: %w", err)
					}
				}
				return nil
			case "FAILED":
				return fmt.Errorf("RunPod job failed: %s", statusResp.Error)
			case "CANCELLED":
				return fmt.Errorf("RunPod job was cancelled")
			}
			// Continue polling for IN_QUEUE, IN_PROGRESS
		}
	}
}

func (c *RESTClient) AnalyzeEmotion(ctx context.Context, req *pb.EmotionRequest) (*pb.EmotionResponse, error) {
	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":            "analyze_emotion",
			"testimonial_id":  req.TestimonialId,
			"media_url":       req.MediaUrl,
			"target_emotions": req.TargetEmotions,
			"analysis_depth":  req.AnalysisDepth,
			"job_id":          req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_id":  req.TestimonialId,
			"media_url":       req.MediaUrl,
			"target_emotions": req.TargetEmotions,
			"analysis_depth":  req.AnalysisDepth,
			"job_id":          req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/emotion/analyze", restReq, &restResp); err != nil {
		return nil, err
	}

	// Convert back to protobuf response
	pbSegments := []*pb.EmotionSegment{}
	if segments, ok := restResp["segments"].([]interface{}); ok {
		for _, seg := range segments {
			if segMap, ok := seg.(map[string]interface{}); ok {
				pbSegments = append(pbSegments, &pb.EmotionSegment{
					StartTime:         getFloat64FromMap(segMap, "start_time"),
					EndTime:           getFloat64FromMap(segMap, "end_time"),
					DominantEmotion:   getStringFromMap(segMap, "dominant_emotion"),
					Confidence:        getFloat64FromMap(segMap, "confidence"),
					FacialExpression:  getStringFromMap(segMap, "facial_expression"),
					EmotionScores:     getMapFloat64FromMap(segMap, "emotion_scores"),
					AuthenticityScore: getFloat64FromMap(segMap, "authenticity_score"),
				})
			}
		}
	}

	return &pb.EmotionResponse{
		Segments:                  pbSegments,
		OverallConfidence:         getFloat64FromMap(restResp, "overall_confidence"),
		CustomerSatisfactionScore: getFloat64FromMap(restResp, "customer_satisfaction_score"),
		EmotionDistribution:       getMapFloat64FromMap(restResp, "emotion_distribution"),
		Error:                     getStringFromMap(restResp, "error"),
	}, nil
}

func (c *RESTClient) AdaptiveEnhanceMedia(ctx context.Context, req *pb.AdaptiveEnhanceRequest) (*pb.AdaptiveEnhanceResponse, error) {
	return nil, fmt.Errorf("AdaptiveEnhanceMedia not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) EnhanceMedia(ctx context.Context, req *pb.EnhanceRequest) (*pb.EnhanceResponse, error) {

	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":                "enhance_media",
			"testimonial_id":      req.TestimonialId,
			"media_url":           req.MediaUrl,
			"quality":             req.Quality,
			"upload_to_cloud":     req.UploadToCloud,
			"custom_enhancements": req.CustomEnhancements,
			"logo_url":            req.LogoUrl,
			"watermark_text":      req.WatermarkText,
			"watermark_position":  req.WatermarkPosition,
			"brand_color":         req.BrandColor,
			"add_branding":        req.AddBranding,
			"job_id":              req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_id":      req.TestimonialId,
			"media_url":           req.MediaUrl,
			"quality":             req.Quality,
			"upload_to_cloud":     req.UploadToCloud,
			"custom_enhancements": req.CustomEnhancements,
			"logo_url":            req.LogoUrl,
			"watermark_text":      req.WatermarkText,
			"watermark_position":  req.WatermarkPosition,
			"brand_color":         req.BrandColor,
			"add_branding":        req.AddBranding,
			"job_id":              req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/media/enhance", restReq, &restResp); err != nil {
		return nil, err
	}

	return &pb.EnhanceResponse{
		EnhancedUrl:         getStringFromMap(restResp, "enhanced_url"),
		AppliedEnhancements: getStringSliceFromMap(restResp, "applied_enhancements"),
		QualityScore:        getFloat64FromMap(restResp, "quality_score"),
		MediaType:           getStringFromMap(restResp, "media_type"),
		Error:               getStringFromMap(restResp, "error"),
	}, nil
}

func (c *RESTClient) BatchEnhanceMedia(ctx context.Context, req *pb.BatchEnhanceRequest) (*pb.BatchEnhanceResponse, error) {

	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":                "batch_enhance_media",
			"options":             pbToRESTMediaOpts(req.Options),
			"quality":             req.Quality,
			"upload_to_cloud":     req.UploadToCloud,
			"custom_enhancements": req.CustomEnhancements,
			"logo_url":            req.LogoUrl,
			"watermark_text":      req.WatermarkText,
			"watermark_position":  req.WatermarkPosition,
			"brand_color":         req.BrandColor,
			"add_branding":        req.AddBranding,
			"job_id":              req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"options":             pbToRESTMediaOpts(req.Options),
			"quality":             req.Quality,
			"upload_to_cloud":     req.UploadToCloud,
			"custom_enhancements": req.CustomEnhancements,
			"logo_url":            req.LogoUrl,
			"watermark_text":      req.WatermarkText,
			"watermark_position":  req.WatermarkPosition,
			"brand_color":         req.BrandColor,
			"add_branding":        req.AddBranding,
			"job_id":              req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/media/enhance/batch", restReq, &restResp); err != nil {
		return nil, err
	}

	// Convert response array
	responses := []*pb.BatchEnhanceResponseOpt{}
	if respArray, ok := restResp["response"].([]interface{}); ok {
		for _, resp := range respArray {
			if respMap, ok := resp.(map[string]interface{}); ok {
				responses = append(responses, &pb.BatchEnhanceResponseOpt{
					TestimonialId:       getStringFromMap(respMap, "testimonial_id"),
					EnhancedUrl:         getStringFromMap(respMap, "enhanced_url"),
					AppliedEnhancements: getStringSliceFromMap(respMap, "applied_enhancements"),
					Error:               getStringFromMap(respMap, "error"),
				})
			}
		}
	}

	return &pb.BatchEnhanceResponse{
		Response: responses,
	}, nil
}

// NARRATION SERVICE
func (c *RESTClient) GenerateNarration(ctx context.Context, req *pb.NarrationRequest) (*pb.NarrationResponse, error) {

	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":                 "generate_narration",
			"testimonial_id":       req.TestimonialId,
			"text":                 req.Text,
			"language":             req.Language,
			"voice_id":             req.VoiceId,
			"gender":               req.Gender,
			"style":                req.Style,
			"prompt":               req.Prompt,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"add_background_music": req.AddBackgroundMusic,
			"optimize_speech":      req.OptimizeSpeech,
			"job_id":               req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_id":       req.TestimonialId,
			"text":                 req.Text,
			"language":             req.Language,
			"voice_id":             req.VoiceId,
			"gender":               req.Gender,
			"style":                req.Style,
			"prompt":               req.Prompt,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"add_background_music": req.AddBackgroundMusic,
			"optimize_speech":      req.OptimizeSpeech,
			"job_id":               req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/narration/generate", restReq, &restResp); err != nil {
		return nil, err
	}

	return &pb.NarrationResponse{
		AudioUrl:      getStringFromMap(restResp, "audio_url"),
		Duration:      getFloat64FromMap(restResp, "duration"),
		VoiceProvider: getStringFromMap(restResp, "voice_provider"),
		QualityScore:  getFloat64FromMap(restResp, "quality_score"),
		ProcessedText: getStringFromMap(restResp, "processed_text"),
		Error:         getStringFromMap(restResp, "error"),
	}, nil
}

func (c *RESTClient) BatchGenerateNarration(ctx context.Context, req *pb.BatchNarrationRequest) (*pb.BatchNarrationResponse, error) {
	options := []map[string]interface{}{}
	for _, opt := range req.Options {
		options = append(options, map[string]interface{}{
			"testimonial_id": opt.TestimonialId,
			"text":           opt.Text,
		})
	}

	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":                 "batch_generate_narration",
			"options":              options,
			"language":             req.Language,
			"voice_id":             req.VoiceId,
			"gender":               req.Gender,
			"style":                req.Style,
			"prompt":               req.Prompt,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"add_background_music": req.AddBackgroundMusic,
			"optimize_speech":      req.OptimizeSpeech,
			"job_id":               req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"options":              options,
			"language":             req.Language,
			"voice_id":             req.VoiceId,
			"gender":               req.Gender,
			"style":                req.Style,
			"prompt":               req.Prompt,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"add_background_music": req.AddBackgroundMusic,
			"optimize_speech":      req.OptimizeSpeech,
			"job_id":               req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/narration/generate/batch", restReq, &restResp); err != nil {
		return nil, err
	}

	// Convert response array
	responses := []*pb.NarrationResponse{}
	if respArray, ok := restResp["response"].([]interface{}); ok {
		for _, resp := range respArray {
			if respMap, ok := resp.(map[string]interface{}); ok {
				responses = append(responses, &pb.NarrationResponse{
					AudioUrl:      getStringFromMap(respMap, "audio_url"),
					Duration:      getFloat64FromMap(respMap, "duration"),
					VoiceProvider: getStringFromMap(respMap, "voice_provider"),
					QualityScore:  getFloat64FromMap(respMap, "quality_score"),
					ProcessedText: getStringFromMap(respMap, "processed_text"),
					Error:         getStringFromMap(respMap, "error"),
				})
			}
		}
	}

	return &pb.BatchNarrationResponse{
		Response: responses,
	}, nil
}

// SMART CLIPPING SERVICE
func (c *RESTClient) GenerateClips(ctx context.Context, req *pb.ClippingRequest) (*pb.ClippingResponse, error) {
	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":              "generate_clips",
			"testimonial_id":    req.TestimonialId,
			"media_url":         req.MediaUrl,
			"highlight_moments": pbToRESTHighlightMoments(req.HighlightMoments),
			"branding":          pbToRESTBrandingOptions(req.Branding),
			"background_music":  req.BackgroundMusic,
			"music_volume":      req.MusicVolume,
			"job_id":            req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_id":    req.TestimonialId,
			"media_url":         req.MediaUrl,
			"highlight_moments": pbToRESTHighlightMoments(req.HighlightMoments),
			"branding":          pbToRESTBrandingOptions(req.Branding),
			"background_music":  req.BackgroundMusic,
			"music_volume":      req.MusicVolume,
			"job_id":            req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/clips/generate", restReq, &restResp); err != nil {
		return nil, err
	}

	// Convert clips
	pbClips := []*pb.Clip{}
	if clips, ok := restResp["clips"].([]interface{}); ok {
		for _, clip := range clips {
			if clipMap, ok := clip.(map[string]interface{}); ok {
				pbClips = append(pbClips, &pb.Clip{
					Url:              getStringFromMap(clipMap, "url"),
					StartTime:        getFloat64FromMap(clipMap, "start_time"),
					EndTime:          getFloat64FromMap(clipMap, "end_time"),
					Title:            getStringFromMap(clipMap, "title"),
					Theme:            getStringFromMap(clipMap, "theme"),
					EngagementScore:  getFloat64FromMap(clipMap, "engagement_score"),
					Duration:         getFloat64FromMap(clipMap, "duration"),
					SocialMediaReady: getMapBoolFromMap(clipMap, "social_media_ready"),
				})
			}
		}
	}

	return &pb.ClippingResponse{
		Clips:           pbClips,
		ClipsGenerated:  getInt32FromMap(restResp, "clips_generated"),
		AverageQuality:  getFloat64FromMap(restResp, "average_quality"),
		DetectionMethod: getStringFromMap(restResp, "detection_method"),
		Error:           getStringFromMap(restResp, "error"),
	}, nil
}

func (c *RESTClient) BatchGenerateClips(ctx context.Context, req *pb.BatchClippingRequest) (*pb.BatchClippingResponse, error) {
	options := []map[string]interface{}{}
	for _, opt := range req.Options {
		options = append(options, map[string]interface{}{
			"testimonial_id":    opt.TestimonialId,
			"media_url":         opt.MediaUrl,
			"highlight_moments": pbToRESTHighlightMoments(opt.HighlightMoments),
		})
	}

	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":             "batch_generate_clips",
			"options":          options,
			"branding":         pbToRESTBrandingOptions(req.Branding),
			"background_music": req.BackgroundMusic,
			"music_volume":     req.MusicVolume,
			"job_id":           req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"options":          options,
			"branding":         pbToRESTBrandingOptions(req.Branding),
			"background_music": req.BackgroundMusic,
			"music_volume":     req.MusicVolume,
			"job_id":           req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/clips/generate/batch", restReq, &restResp); err != nil {
		return nil, err
	}

	// Convert response array - implementation similar to single generate clips
	responses := []*pb.ClippingResponse{}

	return &pb.BatchClippingResponse{
		Response: responses,
	}, nil
}

// PLATFORM OPTIMIZER SERVICE
func (c *RESTClient) OptimizeMediaForPlatform(ctx context.Context, req *pb.OptimizeRequest) (*pb.OptimizeResponse, error) {
	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":                     "optimize_media_platform",
			"testimonial_id":           req.TestimonialId,
			"media_url":                req.MediaUrl,
			"target_platform":          req.TargetPlatform,
			"brand_context":            pbToRESTBrandContext(req.BrandContext),
			"transcript":               req.Transcript,
			"optimization_quality":     req.OptimizationQuality,
			"enable_transitions":       req.EnableTransitions,
			"add_branding":             req.AddBranding,
			"background_music":         req.BackgroundMusic,
			"music_volume":             req.MusicVolume,
			"enable_captions":          req.EnableCaptions,
			"enable_media_enhancement": req.EnableMediaEnhancement,
			"watermark_text":           req.WatermarkText,
			"logo_position":            req.LogoPosition,
			"watermark_position":       req.WatermarkPosition,
			"transcript_segments":      pbToRESTTranscriptSegments(req.TranscriptSegments),
			"add_background_music":     req.AddBackgroundMusic,
			"job_id":                   req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_id":           req.TestimonialId,
			"media_url":                req.MediaUrl,
			"target_platform":          req.TargetPlatform,
			"brand_context":            pbToRESTBrandContext(req.BrandContext),
			"transcript":               req.Transcript,
			"optimization_quality":     req.OptimizationQuality,
			"enable_transitions":       req.EnableTransitions,
			"add_branding":             req.AddBranding,
			"background_music":         req.BackgroundMusic,
			"music_volume":             req.MusicVolume,
			"enable_captions":          req.EnableCaptions,
			"enable_media_enhancement": req.EnableMediaEnhancement,
			"watermark_text":           req.WatermarkText,
			"logo_position":            req.LogoPosition,
			"watermark_position":       req.WatermarkPosition,
			"transcript_segments":      pbToRESTTranscriptSegments(req.TranscriptSegments),
			"add_background_music":     req.AddBackgroundMusic,
			"job_id":                   req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/optimize", restReq, &restResp); err != nil {
		return nil, err
	}

	return &pb.OptimizeResponse{
		OptimizedUrl:         getStringFromMap(restResp, "optimized_url"),
		AppliedOptimizations: getStringSliceFromMap(restResp, "applied_optimizations"),
		Platform:             getStringFromMap(restResp, "platform"),
		MediaType:            getStringFromMap(restResp, "media_type"),
		Success:              getBoolFromMap(restResp, "success"),
		Error:                getStringFromMap(restResp, "error"),
		TestimonialId:        getStringFromMap(restResp, "testimonial_id"),
	}, nil
}

func (c *RESTClient) BatchOptimizeMedia(ctx context.Context, req *pb.BatchOptimizeRequest) (*pb.BatchOptimizeResponse, error) {
	options := []map[string]interface{}{}
	for _, opt := range req.Options {
		options = append(options, map[string]interface{}{
			"testimonial_id":      opt.TestimonialId,
			"media_url":           opt.MediaUrl,
			"transcript_segments": pbToRESTTestimonialSegments(opt.TranscriptSegments),
		})
	}

	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":                     "batch_optimize_media_platform",
			"options":                  options,
			"target_platform":          req.TargetPlatform,
			"brand_context":            pbToRESTBrandContext(req.BrandContext),
			"transcript":               req.Transcript,
			"optimization_quality":     req.OptimizationQuality,
			"enable_transitions":       req.EnableTransitions,
			"add_branding":             req.AddBranding,
			"background_music":         req.BackgroundMusic,
			"music_volume":             req.MusicVolume,
			"enable_captions":          req.EnableCaptions,
			"enable_media_enhancement": req.EnableMediaEnhancement,
			"watermark_text":           req.WatermarkText,
			"logo_position":            req.LogoPosition,
			"watermark_position":       req.WatermarkPosition,
			"add_background_music":     req.AddBackgroundMusic,
			"job_id":                   req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"options":                  options,
			"target_platform":          req.TargetPlatform,
			"brand_context":            pbToRESTBrandContext(req.BrandContext),
			"transcript":               req.Transcript,
			"optimization_quality":     req.OptimizationQuality,
			"enable_transitions":       req.EnableTransitions,
			"add_branding":             req.AddBranding,
			"background_music":         req.BackgroundMusic,
			"music_volume":             req.MusicVolume,
			"enable_captions":          req.EnableCaptions,
			"enable_media_enhancement": req.EnableMediaEnhancement,
			"watermark_text":           req.WatermarkText,
			"logo_position":            req.LogoPosition,
			"watermark_position":       req.WatermarkPosition,
			"add_background_music":     req.AddBackgroundMusic,
			"job_id":                   req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/optimize/batch", restReq, &restResp); err != nil {
		return nil, err
	}

	// Convert response array
	responses := []*pb.OptimizeResponse{}
	if respArray, ok := restResp["responses"].([]interface{}); ok {
		for _, resp := range respArray {
			if respMap, ok := resp.(map[string]interface{}); ok {
				responses = append(responses, &pb.OptimizeResponse{
					OptimizedUrl:         getStringFromMap(respMap, "optimized_url"),
					AppliedOptimizations: getStringSliceFromMap(respMap, "applied_optimizations"),
					Platform:             getStringFromMap(respMap, "platform"),
					MediaType:            getStringFromMap(respMap, "media_type"),
					Success:              getBoolFromMap(respMap, "success"),
					Error:                getStringFromMap(respMap, "error"),
					TestimonialId:        getStringFromMap(respMap, "testimonial_id"),
				})
			}
		}
	}

	return &pb.BatchOptimizeResponse{
		Responses: responses,
	}, nil
}

// THUMBNAIL SERVICE
func (c *RESTClient) SelectThumbnail(ctx context.Context, req *pb.ThumbnailRequest) (*pb.ThumbnailResponse, error) {
	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":           "select_thumbnail",
			"testimonial_id": req.TestimonialId,
			"media_url":      req.MediaUrl,
			"max_thumbnails": req.MaxThumbnails,
			"job_id":         req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_id": req.TestimonialId,
			"media_url":      req.MediaUrl,
			"max_thumbnails": req.MaxThumbnails,
			"job_id":         req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/thumbnail/select", restReq, &restResp); err != nil {
		return nil, err
	}

	return &pb.ThumbnailResponse{
		ThumbnailUrls: getStringSliceFromMap(restResp, "thumbnail_urls"),
	}, nil
}

// STORY MODE SERVICE
func (c *RESTClient) GenerateStoryVideo(ctx context.Context, req *pb.StoryModeRequest) (*pb.StoryModeResponse, error) {
	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":                 "generate_story_video",
			"testimonial_segments": pbToRESTTestimonialSegments(req.TestimonialSegments),
			"brand_context":        pbToRESTBrandContext(req.BrandContext),
			"output_format":        req.OutputFormat,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"prompt":               req.Prompt,
			"intro_image_url":      req.IntroImageUrl,
			"outro_image_url":      req.OutroImageUrl,
			"company_name":         req.CompanyName,
			"add_background_music": req.AddBackgroundMusic,
			"job_id":               req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_segments": pbToRESTTestimonialSegments(req.TestimonialSegments),
			"brand_context":        pbToRESTBrandContext(req.BrandContext),
			"output_format":        req.OutputFormat,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"prompt":               req.Prompt,
			"intro_image_url":      req.IntroImageUrl,
			"outro_image_url":      req.OutroImageUrl,
			"company_name":         req.CompanyName,
			"add_background_music": req.AddBackgroundMusic,
			"job_id":               req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/story/generate", restReq, &restResp); err != nil {
		return nil, err
	}

	return &pb.StoryModeResponse{
		StoryVideoUrl: getStringFromMap(restResp, "story_video_url"),
	}, nil
}

func (c *RESTClient) BatchGenerateStoryVideos(ctx context.Context, req *pb.BatchStoryModeRequest) (*pb.BatchStoryModeResponse, error) {
	testimonialSegments := []map[string]interface{}{}
	for _, seg := range req.TestimonialSegments {
		testimonialSegments = append(testimonialSegments, map[string]interface{}{
			"opt": pbToRESTTestimonialSegments(seg.Opt),
		})
	}

	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":                 "batch_generate_story_video",
			"testimonial_segments": testimonialSegments,
			"brand_context":        pbToRESTBrandContext(req.BrandContext),
			"output_format":        req.OutputFormat,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"prompt":               req.Prompt,
			"intro_image_url":      req.IntroImageUrl,
			"outro_image_url":      req.OutroImageUrl,
			"company_name":         req.CompanyName,
			"add_background_music": req.AddBackgroundMusic,
			"job_id":               req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_segments": testimonialSegments,
			"brand_context":        pbToRESTBrandContext(req.BrandContext),
			"output_format":        req.OutputFormat,
			"background_music":     req.BackgroundMusic,
			"music_volume":         req.MusicVolume,
			"prompt":               req.Prompt,
			"intro_image_url":      req.IntroImageUrl,
			"outro_image_url":      req.OutroImageUrl,
			"company_name":         req.CompanyName,
			"add_background_music": req.AddBackgroundMusic,
			"job_id":               req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/story/generate/batch", restReq, &restResp); err != nil {
		return nil, err
	}

	return &pb.BatchStoryModeResponse{
		StoryVideoUrls: getStringSliceFromMap(restResp, "story_video_urls"),
	}, nil
}

// NOISE REDUCER SERVICE
func (c *RESTClient) NoiseRemoval(ctx context.Context, req *pb.NoiseReductionRequest) (*pb.NoiseReductionResponse, error) {
	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":           "reduce_noise",
			"testimonial_id": req.TestimonialId,
			"media_url":      req.MediaUrl,
			"level":          req.Level,
			"job_id":         req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_id": req.TestimonialId,
			"media_url":      req.MediaUrl,
			"level":          req.Level,
			"job_id":         req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/noise/reduce", restReq, &restResp); err != nil {
		return nil, err
	}

	return &pb.NoiseReductionResponse{
		TestimonialId:    getStringFromMap(restResp, "testimonial_id"),
		DenoisedMediaUrl: getStringFromMap(restResp, "denoised_media_url"),
		Error:            getStringFromMap(restResp, "error"),
	}, nil
}

func (c *RESTClient) BatchNoiseRemoval(ctx context.Context, req *pb.BatchNoiseReductionRequest) (*pb.BatchNoiseReductionResponse, error) {
	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":    "batch_reduce_noise",
			"options": pbToRESTMediaOpts(req.Options),
			"level":   req.Level,
			"job_id":  req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"options": pbToRESTMediaOpts(req.Options),
			"level":   req.Level,
			"job_id":  req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/noise/reduce/batch", restReq, &restResp); err != nil {
		return nil, err
	}

	// Convert response array
	responses := []*pb.NoiseReductionResponse{}
	if respArray, ok := restResp["response"].([]interface{}); ok {
		for _, resp := range respArray {
			if respMap, ok := resp.(map[string]interface{}); ok {
				responses = append(responses, &pb.NoiseReductionResponse{
					TestimonialId:    getStringFromMap(respMap, "testimonial_id"),
					DenoisedMediaUrl: getStringFromMap(respMap, "denoised_media_url"),
					Error:            getStringFromMap(respMap, "error"),
				})
			}
		}
	}

	return &pb.BatchNoiseReductionResponse{
		Response: responses,
	}, nil
}

// VIRAL ANALYSIS SERVICE
func (c *RESTClient) AnalyzeViralPotential(ctx context.Context, req *pb.ViralAnalysisRequest) (*pb.ViralAnalysisResponse, error) {
	var restReq map[string]interface{}

	if c.isRunPod {
		restReq = map[string]interface{}{
			"task":             "analyze_viral_potential",
			"testimonial_id":   req.TestimonialId,
			"media_url":        req.MediaUrl,
			"transcript":       req.Transcript,
			"brand_context":    pbToRESTBrandContext(req.BrandContext),
			"target_platforms": req.TargetPlatforms,
			"job_id":           req.JobId,
		}
	} else {
		restReq = map[string]interface{}{
			"testimonial_id":   req.TestimonialId,
			"media_url":        req.MediaUrl,
			"transcript":       req.Transcript,
			"brand_context":    pbToRESTBrandContext(req.BrandContext),
			"target_platforms": req.TargetPlatforms,
			"job_id":           req.JobId,
		}
	}

	var restResp map[string]interface{}
	if err := c.makeRequest(ctx, "/ai/viral/analyze", restReq, &restResp); err != nil {
		return nil, err
	}

	// Convert viral moments
	viralMoments := []*pb.ViralMoment{}
	if moments, ok := restResp["viral_moments"].([]interface{}); ok {
		for _, moment := range moments {
			if momentMap, ok := moment.(map[string]interface{}); ok {
				viralMoments = append(viralMoments, &pb.ViralMoment{
					StartTime:            getFloat64FromMap(momentMap, "start_time"),
					EndTime:              getFloat64FromMap(momentMap, "end_time"),
					ViralScore:           getFloat64FromMap(momentMap, "viral_score"),
					Reasons:              getStringSliceFromMap(momentMap, "reasons"),
					RecommendedPlatforms: getStringSliceFromMap(momentMap, "recommended_platforms"),
					ThumbnailTimestamp:   getFloat64FromMap(momentMap, "thumbnail_timestamp"),
					SuggestedCaption:     getStringFromMap(momentMap, "suggested_caption"),
					TrendingElements:     getStringSliceFromMap(momentMap, "trending_elements"),
				})
			}
		}
	}

	// Convert thumbnail options
	thumbnailOptions := []*pb.ThumbnailOption{}
	if thumbnails, ok := restResp["best_thumbnail_options"].([]interface{}); ok {
		for _, thumbnail := range thumbnails {
			if thumbMap, ok := thumbnail.(map[string]interface{}); ok {
				thumbnailOptions = append(thumbnailOptions, &pb.ThumbnailOption{
					Timestamp:       getFloat64FromMap(thumbMap, "timestamp"),
					ViralScore:      getFloat64FromMap(thumbMap, "viral_score"),
					RecommendedText: getStringFromMap(thumbMap, "recommended_text"),
					Platforms:       getStringSliceFromMap(thumbMap, "platforms"),
					Reason:          getStringFromMap(thumbMap, "reason"),
				})
			}
		}
	}

	return &pb.ViralAnalysisResponse{
		Success:                 getBoolFromMap(restResp, "success"),
		OverallViralScore:       getFloat64FromMap(restResp, "overall_viral_score"),
		ViralMoments:            viralMoments,
		BestThumbnailOptions:    thumbnailOptions,
		TrendingKeywords:        getStringSliceFromMap(restResp, "trending_keywords"),
		PlatformRecommendations: getMapFloat64FromMap(restResp, "platform_recommendations"),
		OptimizationSuggestions: getStringSliceFromMap(restResp, "optimization_suggestions"),
		Error:                   getStringFromMap(restResp, "error"),
		ProcessingTime:          getFloat64FromMap(restResp, "processing_time"),
		TestimonialId:           getStringFromMap(restResp, "testimonial_id"),
	}, nil
}

func getStringFromMap(m map[string]interface{}, key string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return ""
}

func getFloat64FromMap(m map[string]interface{}, key string) float64 {
	if val, ok := m[key].(float64); ok {
		return val
	}
	return 0.0
}

func getInt32FromMap(m map[string]interface{}, key string) int32 {
	if val, ok := m[key].(float64); ok {
		return int32(val)
	}
	return 0
}

func getBoolFromMap(m map[string]interface{}, key string) bool {
	if val, ok := m[key].(bool); ok {
		return val
	}
	return false
}

func getStringSliceFromMap(m map[string]interface{}, key string) []string {
	if val, ok := m[key].([]interface{}); ok {
		result := make([]string, len(val))
		for i, v := range val {
			if str, ok := v.(string); ok {
				result[i] = str
			}
		}
		return result
	}
	return []string{}
}

func getMapFloat64FromMap(m map[string]interface{}, key string) map[string]float64 {
	if val, ok := m[key].(map[string]interface{}); ok {
		result := make(map[string]float64)
		for k, v := range val {
			if f, ok := v.(float64); ok {
				result[k] = f
			}
		}
		return result
	}
	return map[string]float64{}
}

func getMapBoolFromMap(m map[string]interface{}, key string) map[string]bool {
	if val, ok := m[key].(map[string]interface{}); ok {
		result := make(map[string]bool)
		for k, v := range val {
			if b, ok := v.(bool); ok {
				result[k] = b
			}
		}
		return result
	}
	return map[string]bool{}
}

func pbToRESTBrandContext(pb *pb.BrandContext) *models.BrandContext {
	if pb == nil {
		return nil
	}
	colorSlice := pb.ColorSlice
	values := pb.Values
	keywords := pb.Keywords

	if pb.ColorSlice == nil {
		colorSlice = []string{}
	}
	if pb.Values == nil {
		values = []string{}
	}
	if pb.Keywords == nil {
		keywords = []string{}
	}

	return &models.BrandContext{
		AboutInfo:        pb.AboutInfo,
		Keywords:         keywords,
		Tone:             pb.Tone,
		BrandColors:      utils.ToJSONMapString(pb.BrandColors),
		ColorSlice:       colorSlice,
		BrandFonts:       utils.ToJSONMapString(pb.BrandFonts),
		LogoURL:          pb.LogoUrl,
		Values:           values,
		Tagline:          pb.Tagline,
		TargetAudience:   pb.TargetAudience,
		MissionStatement: pb.MissionStatement,
		BusinessModel:    pb.BusinessModel,
		CompanySize:      pb.CompanySize,
		ExtractedData:    utils.ToJSONMapString(pb.ExtractedData),
	}
}

func pbToRESTBrandingOptions(pb *pb.BrandingOptions) *models.BrandingOptions {
	if pb == nil {
		return nil
	}
	return &models.BrandingOptions{
		LogoURL:           pb.LogoUrl,
		BrandColor:        pb.BrandColor,
		WatermarkPosition: pb.WatermarkPosition,
	}
}

func pbToRESTHighlightMoments(pbMoments []*pb.HighlightMoment) []models.HighlightMoment {
	moments := make([]models.HighlightMoment, len(pbMoments))
	for i, pb := range pbMoments {
		words := make([]models.Word, len(pb.Words))
		for j, w := range pb.Words {
			words[j] = models.Word{
				Text:       w.Text,
				Start:      w.Start,
				End:        w.End,
				Confidence: w.Confidence,
				Speaker:    w.Speaker,
			}
		}

		moments[i] = models.HighlightMoment{
			StartTime:           pb.StartTime,
			EndTime:             pb.EndTime,
			Text:                pb.Text,
			Theme:               pb.Theme,
			Words:               words,
			SocialMediaOptimize: pb.SocialMediaOptimize,
			EnhanceClip:         pb.EnhanceClip,
			IncludeLogo:         pb.IncludeLogo,
			IncludeSubtitle:     pb.IncludeSubtitle,
			IncludeWatermark:    pb.IncludeWatermark,
			Quality:             pb.Quality,
			AddBackgroundMusic:  pb.AddBackgroundMusic,
			IncludeTheme:        pb.IncludeTheme,
			RemoveNoise:         pb.RemoveNoise,
			ImportanceScore:     pb.ImportanceScore,
			HighlightType:       pb.HighlightType,
			SuggestedTitle:      pb.SuggestedTitle,
			Keywords:            pb.Keywords,
			EmotionalIntensity:  pb.EmotionalIntensity,
			Shareability:        pb.Shareability,
		}
	}
	return moments
}

func pbToRESTTranscriptSegments(pbSegments []*pb.TranscriptSegment) []models.TranscriptSegment {
	segments := make([]models.TranscriptSegment, len(pbSegments))
	for i, pb := range pbSegments {
		words := make([]models.Word, len(pb.Words))
		for j, w := range pb.Words {
			words[j] = models.Word{
				Text:       w.Text,
				Start:      w.Start,
				End:        w.End,
				Confidence: w.Confidence,
				Speaker:    w.Speaker,
			}
		}

		segments[i] = models.TranscriptSegment{
			Text:      pb.Text,
			StartTime: pb.StartTime,
			EndTime:   pb.EndTime,
			Speaker:   pb.Speaker,
			Words:     words,
		}
	}
	return segments
}

func pbToRESTTestimonialSegments(pbSegments []*pb.TestimonialSegment) []models.TestimonialSegment {
	segments := make([]models.TestimonialSegment, len(pbSegments))
	for i, pb := range pbSegments {
		segments[i] = models.TestimonialSegment{
			TestimonialID: pb.TestimonialId,
			MediaURL:      pb.MediaUrl,
			Highlights:    pbToRESTHighlightMoments(pb.Highlights),
		}
	}
	return segments
}

func pbToRESTMediaOpts(pbOpts []*pb.MediaOpt) []models.MediaOpt {
	opts := make([]models.MediaOpt, len(pbOpts))
	for i, pb := range pbOpts {
		opts[i] = models.MediaOpt{
			TestimonialID: pb.TestimonialId,
			MediaURL:      pb.MediaUrl,
		}
	}
	return opts
}

// ==========================================
// PLATFORM RECOMMENDATION (IMPROVEMENT #2)
// ==========================================

func (c *RESTClient) RecommendPlatforms(ctx context.Context, req *pb.PlatformRecommendRequest) (*pb.PlatformRecommendResponse, error) {
	return nil, fmt.Errorf("RecommendPlatforms not yet implemented for REST client - use gRPC client")
}

// ==========================================
// STEP-BY-STEP PLATFORM OPTIMIZATION RPCs
// (Stubs for future RunPod/REST implementation)
// ==========================================

func (c *RESTClient) CropResize(ctx context.Context, req *pb.CropResizeRequest) (*pb.CropResizeResponse, error) {
	return nil, fmt.Errorf("CropResize not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) BurnCaptions(ctx context.Context, req *pb.BurnCaptionsRequest) (*pb.BurnCaptionsResponse, error) {
	return nil, fmt.Errorf("BurnCaptions not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) ApplyBranding(ctx context.Context, req *pb.ApplyBrandingRequest) (*pb.ApplyBrandingResponse, error) {
	return nil, fmt.Errorf("ApplyBranding not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) MixMusic(ctx context.Context, req *pb.MixMusicRequest) (*pb.MixMusicResponse, error) {
	return nil, fmt.Errorf("MixMusic not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) NormalizeAudio(ctx context.Context, req *pb.NormalizeAudioRequest) (*pb.NormalizeAudioResponse, error) {
	return nil, fmt.Errorf("NormalizeAudio not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) EnhanceVideo(ctx context.Context, req *pb.EnhanceVideoRequest) (*pb.EnhanceVideoResponse, error) {
	return nil, fmt.Errorf("EnhanceVideo not yet implemented for REST client - use gRPC client")
}

// ==========================================
// STEP-BY-STEP STORY VIDEO RPCs
// (Stubs for future RunPod/REST implementation)
// ==========================================

func (c *RESTClient) NormalizeVideoResolution(ctx context.Context, req *pb.NormalizeVideoRequest) (*pb.NormalizeVideoResponse, error) {
	return nil, fmt.Errorf("NormalizeVideoResolution not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) AssembleStoryVideo(ctx context.Context, req *pb.AssembleStoryRequest) (*pb.AssembleStoryResponse, error) {
	return nil, fmt.Errorf("AssembleStoryVideo not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) AddIntroOutro(ctx context.Context, req *pb.IntroOutroRequest) (*pb.IntroOutroResponse, error) {
	return nil, fmt.Errorf("AddIntroOutro not yet implemented for REST client - use gRPC client")
}

// ==========================================
// 3-STEP STORY VIDEO WORKFLOW RPCs
// (Stubs for future RunPod/REST implementation)
// ==========================================

func (c *RESTClient) CollectClips(ctx context.Context, req *pb.CollectClipsRequest) (*pb.CollectClipsResponse, error) {
	return nil, fmt.Errorf("CollectClips not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) AIOrdering(ctx context.Context, req *pb.AIOrderingRequest) (*pb.AIOrderingResponse, error) {
	return nil, fmt.Errorf("AIOrdering not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) AssembleDraft(ctx context.Context, req *pb.AssembleDraftRequest) (*pb.AssembleDraftResponse, error) {
	return nil, fmt.Errorf("AssembleDraft not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) CollectAndAssembleClips(ctx context.Context, req *pb.CollectAndAssembleClipsRequest) (*pb.AssembleDraftResponse, error) {
	return nil, fmt.Errorf("CollectAndAssembleClips not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) DetectHooks(ctx context.Context, req *pb.HookDetectionRequest) (*pb.HookDetectionResponse, error) {
	return nil, fmt.Errorf("DetectHooks not yet implemented for REST client - use gRPC client")
}

// ==========================================
// SESSION MANAGEMENT RPCs
// (Stubs for future RunPod/REST implementation)
// ==========================================

func (c *RESTClient) SaveProgress(ctx context.Context, req *pb.SaveProgressRequest) (*pb.SaveProgressResponse, error) {
	return nil, fmt.Errorf("SaveProgress not yet implemented for REST client - use gRPC client")
}

func (c *RESTClient) CleanupSession(ctx context.Context, req *pb.CleanupSessionRequest) (*pb.CleanupSessionResponse, error) {
	return nil, fmt.Errorf("CleanupSession not yet implemented for REST client - use gRPC client")
}

// CancelJob cancels a running job in the AI service
func (c *RESTClient) CancelJob(ctx context.Context, jobID string) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if c.closed {
		return fmt.Errorf("REST client is closed")
	}

	// Build cancel endpoint URL
	cancelURL := fmt.Sprintf("%s/ai/jobs/%s/cancel", c.baseURL, jobID)

	// Create POST request
	req, err := http.NewRequestWithContext(ctx, "POST", cancelURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create cancel request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	}

	// Execute request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send cancel request: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("cancel request failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}
