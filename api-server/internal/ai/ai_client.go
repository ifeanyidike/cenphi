package ai

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"go.uber.org/zap"
)

type AIClient struct {
	openAIKey  string
	claudeKey  string
	httpClient *http.Client
}

type ResponsesAPIResponse struct {
	ID      string       `json:"id"`
	Object  string       `json:"object"`
	Created int64        `json:"created"`
	Model   string       `json:"model"`
	Output  []OutputItem `json:"output"`
	Usage   *Usage       `json:"usage,omitempty"`
}

type OutputItem struct {
	ID      string        `json:"id"`
	Type    string        `json:"type"` // e.g., "message"
	Role    string        `json:"role"` // e.g., "assistant"
	Content []ContentItem `json:"content"`
}

type ContentItem struct {
	Type string `json:"type"` // e.g., "output_text", "tool_result", etc.
	Text string `json:"text,omitempty"`
	// there can be other keys (e.g., "title", "url", structured fields);
	// use `map[string]json.RawMessage` if you need full flexibility.
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens,omitempty"`
	CompletionTokens int `json:"completion_tokens,omitempty"`
	TotalTokens      int `json:"total_tokens,omitempty"`
}

type ResponsesRequest struct {
	Model string      `json:"model"`
	Input interface{} `json:"input"` // can be string or []map[string]string
}

type AIServiceManager struct {
	BrandContextService       BrandContextService
	AudioTranscriptionService AudioTranscriptionService
	ContentGenerationService  ContentGenerationService
	HighlightService          HighlightService
	PolishService             PolishService
	PlatformOptimizerService  PlatformOptimizerService
	FillerDetectionService    FillerDetectionService
	TranslationService        TranslationService
	SentimentService          SentimentService
	AIClient                  AIClient
	DB                        *sql.DB
	TestimonialRepo           repositories.TestimonialRepository
	ArtifactsRepo             repositories.TestimonialArtifactRepository
	WorkspaceRepo             repositories.WorkspaceRepository
	JobRepo                   repositories.JobRepository
	logger                    *zap.Logger
}

func NewAIServiceManager(cfg config.Config, cacheService cache.RedisCache, aiClient AIClient, audioExtractor storage.AudioExtractor,
	artifactsRepo repositories.TestimonialArtifactRepository, workspaceRepo repositories.WorkspaceRepository, testimonialRepo repositories.TestimonialRepository,
	jobRepo repositories.JobRepository, db *sql.DB, logger *zap.Logger) AIServiceManager {
	brandContextService := NewBrandContextService(cacheService, cfg)
	audioTranscriptionService := NewAudioTranscriptionService(cfg.AI.AssemblyAIKey, cacheService, audioExtractor, logger)
	translationService := NewTranslationService(aiClient, cacheService)
	sentimentService := NewSentimentService(aiClient, cacheService)
	highlightService := NewHighlightService(aiClient, cacheService, db, testimonialRepo)
	fillerService := NewFillerDetectionService(aiClient, cacheService)
	polishService := NewPolishService(aiClient, cacheService)
	contentService := NewContentGenerationService(aiClient, cacheService)
	platformService := NewPlatformOptimizerService(aiClient, cacheService, db, workspaceRepo)

	return AIServiceManager{
		BrandContextService:       brandContextService,
		AudioTranscriptionService: audioTranscriptionService,
		ContentGenerationService:  contentService,
		HighlightService:          highlightService,
		PolishService:             polishService,
		PlatformOptimizerService:  platformService,
		FillerDetectionService:    fillerService,
		TranslationService:        translationService,
		SentimentService:          sentimentService,
		AIClient:                  aiClient,
		DB:                        db,
		TestimonialRepo:           testimonialRepo,
		ArtifactsRepo:             artifactsRepo,
		WorkspaceRepo:             workspaceRepo,
		JobRepo:                   jobRepo,
		logger:                    logger,
	}
}

func NewClient(cfg config.AIService) AIClient {
	return AIClient{
		openAIKey:  cfg.OpenAIKey,
		claudeKey:  cfg.ClaudeKey,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

// func (s AIClient) makeOpenAICall(ctx context.Context, prompt, systemPrompt string, isStream bool) (*http.Response, error) {
// 	input := []map[string]string{
// 		{"role": "system", "content": systemPrompt},
// 		{"role": "user", "content": prompt},
// 	}

// 	payload := OpenAIRequest{
// 		Model: "gpt-5-nano",
// 		// Messages:    messages,
// 		Input:       input,
// 		MaxTokens:   2000,
// 		Temperature: 0.7,
// 		Stream:      isStream,
// 	}

// 	jsonPayload, err := json.Marshal(payload)
// 	if err != nil {
// 		fmt.Printf("an error occurred when marshalling open ai json %s", err)
// 		return nil, fmt.Errorf("error marshalling json: %s", err)
// 	}

// 	// req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonPayload))
// 	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/responses", bytes.NewBuffer(jsonPayload))
// 	if err != nil {
// 		return nil, err
// 	}

// 	req.Header.Set("Authorization", "Bearer "+s.openAIKey)
// 	req.Header.Set("Content-Type", "application/json")

// 	resp, err := s.httpClient.Do(req)
// 	if err != nil {
// 		return nil, err
// 	}
// 	return resp, nil
// }

// add these imports near top if not already present:
//   "bytes"
//   "context"
//   "encoding/json"
//   "fmt"
//   "net/http"

func (s AIClient) makeOpenAICallV2(ctx context.Context, prompt, systemPrompt string, isStream bool) (*http.Response, error) {
	// build "input" as role/content array the Responses API accepts
	input := []map[string]string{
		{"role": "system", "content": systemPrompt},
		{"role": "user", "content": prompt},
	}

	payload := ResponsesRequest{
		Model: "gpt-4.1-nano",
		Input: input, // Responses API accepts string or role/content array
	}

	// include "stream": true in the JSON body when caller requested streaming.
	// Some servers also rely on the Accept header for SSE responses.
	if isStream {
		// create a small wrapper type so we include the stream field in the marshalled JSON
		type streamingPayload struct {
			ResponsesRequest
			Stream bool `json:"stream,omitempty"`
		}
		sp := streamingPayload{ResponsesRequest: payload, Stream: true}
		b, err := json.Marshal(sp)
		if err != nil {
			return nil, fmt.Errorf("error marshalling streaming payload: %w", err)
		}
		req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/responses", bytes.NewBuffer(b))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+s.openAIKey)
		req.Header.Set("Content-Type", "application/json")
		// helpful for SSE consumers — optional but often used
		req.Header.Set("Accept", "text/event-stream")
		return s.httpClient.Do(req)
	}

	// non-streaming path
	b, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error marshalling payload: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/responses", bytes.NewBuffer(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.openAIKey)
	req.Header.Set("Content-Type", "application/json")
	// Accept default JSON response
	req.Header.Set("Accept", "application/json")

	return s.httpClient.Do(req)
}

func extractTextFromResponsesBytes(body []byte) (string, error) {
	var r ResponsesAPIResponse
	if err := json.Unmarshal(body, &r); err != nil {
		return "", err
	}
	var b strings.Builder
	for _, out := range r.Output {
		for _, c := range out.Content {
			// prefer output_text items
			if c.Type == "output_text" && c.Text != "" {
				if b.Len() > 0 {
					b.WriteString("\n")
				}
				b.WriteString(c.Text)
			}
		}
	}
	// if nothing found above, fallback to trying to flatten any text fields
	if b.Len() == 0 {
		// generic traversal fallback (cheap)
		var generic map[string]interface{}
		if err := json.Unmarshal(body, &generic); err == nil {
			if out, ok := generic["output"].([]interface{}); ok {
				for _, o := range out {
					if om, ok := o.(map[string]interface{}); ok {
						if content, ok := om["content"].([]interface{}); ok {
							for _, ci := range content {
								if cim, ok := ci.(map[string]interface{}); ok {
									if t, ok := cim["text"].(string); ok && t != "" {
										if b.Len() > 0 {
											b.WriteString("\n")
										}
										b.WriteString(t)
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return b.String(), nil
}

func (s AIClient) makeClaudeCall(ctx context.Context, prompt, systemPrompt string, isStream bool) (*http.Response, error) {
	payload := map[string]any{
		"model":      "claude-3-5-sonnet-20241022",
		"max_tokens": 8000, // Increased from 4000 to handle longer content optimization responses
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"stream": isStream,
	}

	// Add system prompt if provided
	if systemPrompt != "" {
		payload["system"] = systemPrompt
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", s.claudeKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (s AIServiceManager) CreateJob(ctx context.Context, job *models.Job) error {

	if err := s.JobRepo.Create(ctx, job, s.DB); err != nil {
		return fmt.Errorf("failed to save job to database: %w", err)
	}

	s.logger.Debug("Job created and published successfully",
		zap.String("job_id", job.ID.String()),
		zap.String("queue_job_id", job.ID.String()),
		zap.String("job_type", job.JobType))
	return nil
}
