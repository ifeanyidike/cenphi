// internal/services/vapi_service.go
package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	api "github.com/VapiAI/server-sdk-go"
	vapiclient "github.com/VapiAI/server-sdk-go/client"
	"github.com/VapiAI/server-sdk-go/option"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

// VapiService handles voice AI call scheduling and management
type VapiService struct {
	client          *vapiclient.Client
	logger          *zap.Logger
	testimonialRepo repositories.TestimonialRepository
	jobRepo         repositories.JobRepository
	queueService    queue.Service
	db              *sql.DB
}

// NewVapiService creates a new Vapi service instance
func NewVapiService(
	logger *zap.Logger,
	testimonialRepo repositories.TestimonialRepository,
	jobRepo repositories.JobRepository,
	queueService queue.Service,
	db *sql.DB,
) *VapiService {
	apiToken := os.Getenv("VAPI_API_KEY")
	if apiToken == "" {
		logger.Warn("VAPI_API_KEY not set, voice AI features will not work")
		return &VapiService{
			client:          nil,
			logger:          logger,
			testimonialRepo: testimonialRepo,
			jobRepo:         jobRepo,
			queueService:    queueService,
			db:              db,
		}
	}

	client := vapiclient.NewClient(
		option.WithToken(apiToken),
	)

	return &VapiService{
		client:          client,
		logger:          logger,
		testimonialRepo: testimonialRepo,
		jobRepo:         jobRepo,
		queueService:    queueService,
		db:              db,
	}
}

// VoiceCallRequest represents the data needed to schedule a voice call
type VoiceCallRequest struct {
	TestimonialID     uuid.UUID
	CustomerName      string
	CustomerEmail     string
	CustomerPhone     string
	Company           string
	PreferredCallTime string
	Timezone          string
	AdditionalNotes   string
}

// validatePhoneNumber validates and formats a phone number to E.164 format
func (vs *VapiService) validatePhoneNumber(phone string) (string, error) {
	// Remove all non-digit characters except +
	re := regexp.MustCompile(`[^\d+]`)
	cleaned := re.ReplaceAllString(phone, "")

	// Check if it starts with +
	if !strings.HasPrefix(cleaned, "+") {
		// If it's a US number (10 digits), add +1
		if len(cleaned) == 10 {
			cleaned = "+1" + cleaned
		} else if len(cleaned) == 11 && strings.HasPrefix(cleaned, "1") {
			cleaned = "+" + cleaned
		} else {
			return "", fmt.Errorf("phone number must include country code or be a valid US number")
		}
	}

	// Validate E.164 format (+ followed by 7-15 digits)
	e164Regex := regexp.MustCompile(`^\+[1-9]\d{6,14}$`)
	if !e164Regex.MatchString(cleaned) {
		return "", fmt.Errorf("invalid phone number format, must be E.164 format (+1234567890)")
	}

	return cleaned, nil
}

// ScheduleVoiceCall schedules a voice testimonial call using Vapi.ai
func (vs *VapiService) ScheduleVoiceCall(ctx context.Context, req VoiceCallRequest) (*string, error) {
	if vs.client == nil {
		vs.logger.Error("Vapi client not initialized - VAPI_API_KEY not set")
		return nil, fmt.Errorf("vapi service not available")
	}

	// Validate and format phone number
	validatedPhone, err := vs.validatePhoneNumber(req.CustomerPhone)
	if err != nil {
		vs.logger.Error("Invalid phone number format",
			zap.String("phone", req.CustomerPhone),
			zap.Error(err))
		return nil, fmt.Errorf("invalid phone number: %w", err)
	}
	req.CustomerPhone = validatedPhone

	// Create a call assistant for testimonial collection
	assistantId := os.Getenv("VAPI_DEFAULT_ASSISTANT_ID")
	if assistantId == "" {
		// Create a default assistant for testimonial collection
		assistant, err := vs.createTestimonialAssistant(ctx, req)
		if err != nil {
			return nil, fmt.Errorf("failed to create assistant: %w", err)
		}
		assistantId = *assistant
	}

	// Create customer for the call
	customer := &api.CreateCustomerDto{
		Number: &req.CustomerPhone,
		Name:   &req.CustomerName,
	}

	// Get or create phone number ID - required for outbound calls
	phoneNumberId := os.Getenv("VAPI_PHONE_NUMBER_ID")
	if phoneNumberId == "" {
		vs.logger.Error("VAPI_PHONE_NUMBER_ID not configured - required for outbound calls")
		return nil, fmt.Errorf("VAPI_PHONE_NUMBER_ID environment variable not set - please configure a phone number in Vapi dashboard")
	}

	// Schedule the call (include testimonial ID in call name for webhook identification)
	phoneCall, err := vs.client.Calls.Create(ctx, &api.CreateCallDto{
		AssistantId:   &assistantId,
		Customer:      customer,
		Name:          &[]string{fmt.Sprintf("Call-%s", req.TestimonialID.String()[:8])}[0],
		PhoneNumberId: &phoneNumberId,
	})

	if err != nil {
		vs.logger.Error("Failed to schedule Vapi call", zap.Error(err))
		return nil, fmt.Errorf("failed to schedule call: %w", err)
	}

	// Extract the call from the response
	call := phoneCall.GetCall()
	if call == nil {
		return nil, fmt.Errorf("failed to get call from response")
	}

	vs.logger.Info("Voice call scheduled successfully",
		zap.String("call_id", call.Id),
		zap.String("testimonial_id", req.TestimonialID.String()),
		zap.String("customer_phone", req.CustomerPhone),
	)

	return &call.Id, nil
}

// createTestimonialAssistant creates a specialized assistant for testimonial collection
func (vs *VapiService) createTestimonialAssistant(ctx context.Context, req VoiceCallRequest) (*string, error) {
	if vs.client == nil {
		return nil, fmt.Errorf("vapi client not initialized")
	}

	// Create system prompt for testimonial collection
	systemPrompt := fmt.Sprintf(`You are a friendly AI assistant calling %s from %s to collect a testimonial about their experience with our product/service.

Your goal is to have a brief 3-5 minute conversation to gather their feedback.

Guidelines:
1. Start by introducing yourself and confirming you're speaking with %s
2. Explain that this will be a brief testimonial collection call (about 5 minutes)
3. Ask open-ended questions about their experience:
   - What challenges were they facing before using our solution?
   - How has our product/service helped them?
   - What specific results or benefits have they seen?
   - Would they recommend us to others and why?
4. Be conversational and natural - let them speak freely
5. If they mention specific metrics or numbers, ask for more details
6. Thank them for their time and let them know their testimonial will be valuable

Keep the conversation focused but natural. Don't rush them, but be mindful of the 5-minute target.

Additional context: %s`,
		req.CustomerName,
		req.Company,
		req.CustomerName,
		req.AdditionalNotes,
	)

	// Create OpenAI model with system message
	openAiModelType, _ := api.NewOpenAiModelModelFromString("gpt-4.1-nano")
	openAiModel := &api.OpenAiModel{
		Messages: []*api.OpenAiMessage{
			{
				Role:    "system",
				Content: &systemPrompt,
			},
		},
		Model:       openAiModelType,
		Temperature: api.Float64(0.7),
		MaxTokens:   api.Float64(500),
	}

	// Create model union type
	model := &api.CreateAssistantDtoModel{
		OpenAiModel: openAiModel,
	}

	// Create voice configuration (using a professional voice)
	voiceId := &api.ElevenLabsVoiceId{}
	voiceId.String = "21m00Tcm4TlvDq8ikWAM" // Professional female voice
	voice := &api.CreateAssistantDtoVoice{
		ElevenLabsVoice: &api.ElevenLabsVoice{
			VoiceId: voiceId,
		},
	}

	// Create first message
	firstMessage := fmt.Sprintf("Hi %s! This is an AI assistant calling about collecting a brief testimonial for your experience with our service. This should only take about 5 minutes. Is now a good time to chat?", req.CustomerName)

	// Create the assistant
	assistant, err := vs.client.Assistants.Create(ctx, &api.CreateAssistantDto{
		Name:                       &[]string{fmt.Sprintf("Testimonial Assistant for %s", req.CustomerName)}[0],
		Model:                      model,
		Voice:                      voice,
		FirstMessage:               &firstMessage,
		MaxDurationSeconds:         &[]float64{600}[0], // 10 minutes max
		SilenceTimeoutSeconds:      &[]float64{30}[0],  // 30 seconds silence timeout
		BackgroundDenoisingEnabled: &[]bool{true}[0],   // Enable noise filtering
	})

	if err != nil {
		vs.logger.Error("Failed to create testimonial assistant", zap.Error(err))
		return nil, fmt.Errorf("failed to create assistant: %w", err)
	}

	vs.logger.Info("Created testimonial assistant successfully",
		zap.String("assistant_id", assistant.Id),
		zap.String("customer_name", req.CustomerName),
	)

	return &assistant.Id, nil
}

// findTestimonialByShortId finds a testimonial ID by matching the first 8 characters
func (vs *VapiService) findTestimonialByShortId(ctx context.Context, shortId string) string {
	// Query database for testimonials where the ID starts with the short ID
	query := `SELECT id FROM testimonials WHERE id::text LIKE $1 ORDER BY created_at DESC LIMIT 1`
	var fullId string

	err := vs.db.QueryRowContext(ctx, query, shortId+"%").Scan(&fullId)
	if err != nil {
		vs.logger.Warn("Failed to find testimonial by short ID",
			zap.String("short_id", shortId),
			zap.Error(err))
		return ""
	}

	return fullId
}

// HandleCallWebhook processes webhooks from Vapi when calls complete
func (vs *VapiService) HandleCallWebhook(ctx context.Context, webhookData map[string]interface{}) error {
	vs.logger.Info("Processing Vapi webhook")

	// Extract call information from webhook - comprehensive field checking
	var callId string
	var status string

	vs.logger.Info("Processing Vapi webhook", zap.Any("webhook_keys", getMapKeys(webhookData)))

	// Check for direct fields first
	if id, ok := webhookData["callId"].(string); ok {
		callId = id
	} else if id, ok := webhookData["id"].(string); ok {
		callId = id
	}

	// Try nested call object (common in Vapi webhooks)
	if callId == "" {
		if callObj, ok := webhookData["call"].(map[string]interface{}); ok {
			vs.logger.Info("Found call object", zap.Any("call_keys", getMapKeys(callObj)))
			if id, ok := callObj["id"].(string); ok {
				callId = id
			}
			if st, ok := callObj["status"].(string); ok {
				status = st
			}
		}
	}

	// Try alternative field names
	if callId == "" {
		if id, ok := webhookData["call_id"].(string); ok {
			callId = id
		}
	}

	// Extract status if not already found
	if status == "" {
		if st, ok := webhookData["status"].(string); ok {
			status = st
		} else if st, ok := webhookData["callStatus"].(string); ok {
			status = st
		} else if st, ok := webhookData["call_status"].(string); ok {
			status = st
		}
	}

	// Log what we found for debugging
	vs.logger.Info("Extracted webhook data",
		zap.String("callId", callId),
		zap.String("status", status))

	if callId == "" {
		// Log the full webhook data for debugging
		vs.logger.Error("No callId found in webhook", zap.Any("webhook_data", webhookData))
		return fmt.Errorf("missing or invalid callId in webhook data")
	}

	if status == "" {
		vs.logger.Warn("No status found in webhook, defaulting to 'completed'", zap.String("callId", callId))
		status = "completed" // Default assumption for webhooks without explicit status
	}

	// Only process completed calls
	if status != "ended" && status != "completed" {
		vs.logger.Info("Ignoring webhook for non-completed call",
			zap.String("call_id", callId),
			zap.String("status", status))
		return nil
	}

	// Extract testimonial ID from call name or metadata
	var testimonialId string
	var transcript string
	var recordingUrl string

	// Try extracting from nested call object first
	if callObj, ok := webhookData["call"].(map[string]interface{}); ok {
		// Extract name from call object
		if name, ok := callObj["name"].(string); ok {
			// Extract ID from call name format: "Call-[uuid8chars]"
			if strings.HasPrefix(name, "Call-") {
				shortId := strings.TrimPrefix(name, "Call-")
				// We need to find the full testimonial ID from database using the short ID
				testimonialId = vs.findTestimonialByShortId(ctx, shortId)
			}
		}

		// Extract metadata from call object
		if testimonialId == "" {
			if metadata, ok := callObj["metadata"].(map[string]interface{}); ok {
				if id, exists := metadata["testimonial_id"].(string); exists {
					testimonialId = id
				}
			}
		}

		// Extract transcript and recording from call object
		if t, ok := callObj["transcript"].(string); ok {
			transcript = t
		}
		if r, ok := callObj["recording_url"].(string); ok {
			recordingUrl = r
		} else if r, ok := callObj["recordingUrl"].(string); ok {
			recordingUrl = r
		}
	}

	// Fallback to top-level fields
	if testimonialId == "" {
		if name, ok := webhookData["name"].(string); ok {
			// Extract ID from call name format: "Call-[uuid8chars]"
			if strings.HasPrefix(name, "Call-") {
				shortId := strings.TrimPrefix(name, "Call-")
				testimonialId = vs.findTestimonialByShortId(ctx, shortId)
			}
		}

		// Also try extracting from metadata if available in webhook
		if testimonialId == "" {
			if metadata, ok := webhookData["metadata"].(map[string]interface{}); ok {
				if id, exists := metadata["testimonial_id"].(string); exists {
					testimonialId = id
				}
			}
		}
	}

	if testimonialId == "" {
		vs.logger.Warn("No testimonial ID found in webhook data",
			zap.String("call_id", callId),
			zap.Any("webhook_data", webhookData))
		return fmt.Errorf("missing testimonial_id in webhook data (neither in call name nor metadata)")
	}

	// Extract from top-level if not found in call object
	if transcript == "" {
		transcript, _ = webhookData["transcript"].(string)
	}
	if recordingUrl == "" {
		if r, ok := webhookData["recordingUrl"].(string); ok {
			recordingUrl = r
		} else if r, ok := webhookData["recording_url"].(string); ok {
			recordingUrl = r
		}
	}

	vs.logger.Info("Extracted testimonial ID from webhook",
		zap.String("testimonial_id", testimonialId),
		zap.String("call_id", callId))

	// Extract call duration
	var duration float64
	if d, ok := webhookData["duration"].(float64); ok {
		duration = d
	}

	vs.logger.Info("Processing completed voice testimonial call",
		zap.String("call_id", callId),
		zap.String("testimonial_id", testimonialId),
		zap.Float64("duration", duration),
		zap.Bool("has_transcript", transcript != ""),
		zap.Bool("has_recording", recordingUrl != ""),
	)

	// Parse testimonial ID
	testimonialUUID, err := uuid.Parse(testimonialId)
	if err != nil {
		vs.logger.Error("Invalid testimonial ID format in webhook",
			zap.String("testimonial_id", testimonialId),
			zap.Error(err))
		return fmt.Errorf("invalid testimonial ID format: %w", err)
	}

	// Fetch the testimonial to update
	testimonial, err := vs.testimonialRepo.FetchByID(ctx, testimonialUUID, vs.db)
	if err != nil {
		vs.logger.Error("Failed to fetch testimonial for webhook processing",
			zap.String("testimonial_id", testimonialId),
			zap.String("call_id", callId),
			zap.Error(err))
		return fmt.Errorf("failed to fetch testimonial: %w", err)
	}

	// Update testimonial with audio URL and process transcript
	testimonial.MediaURL = &recordingUrl

	// Process transcript with AI to create structured testimonial
	if transcript != "" {
		formattedTestimonial, err := vs.processTranscriptWithAI(ctx, transcript, testimonial)
		if err != nil {
			vs.logger.Warn("Failed to process transcript with AI, using raw transcript", zap.Error(err))
			testimonial.Content = &transcript
		} else {
			testimonial.Content = &formattedTestimonial
		}
	}

	testimonial.ProcessingStatus = "completed"
	testimonial.UpdatedAt = time.Now()

	// Update the testimonial in database
	if err := vs.testimonialRepo.Update(ctx, testimonial, testimonialUUID, vs.db); err != nil {
		vs.logger.Error("Failed to update testimonial with voice call data",
			zap.Error(err),
			zap.String("testimonial_id", testimonialId))
		return fmt.Errorf("failed to update testimonial: %w", err)
	}

	// Queue transcription job if we have audio URL but no transcript
	// (Vapi usually provides transcript, but we can also process with our pipeline)
	if recordingUrl != "" && transcript == "" {
		if err := vs.queueTranscriptionJob(ctx, testimonial); err != nil {
			vs.logger.Warn("Failed to queue transcription job", zap.Error(err))
		}
	}

	// Queue sentiment analysis job
	if transcript != "" {
		if err := vs.queueSentimentAnalysisJob(ctx, testimonial, transcript); err != nil {
			vs.logger.Warn("Failed to queue sentiment analysis job", zap.Error(err))
		}
	}

	vs.logger.Info("Voice testimonial call processing completed",
		zap.String("testimonial_id", testimonialId),
		zap.String("call_id", callId),
		zap.Bool("has_audio_url", recordingUrl != ""),
		zap.Bool("has_transcript", transcript != ""),
	)

	return nil
}

// WebhookCallCompleted represents the structure of a Vapi call completion webhook
type WebhookCallCompleted struct {
	CallId       string                 `json:"callId"`
	Status       string                 `json:"status"`
	Transcript   string                 `json:"transcript"`
	RecordingUrl string                 `json:"recordingUrl"`
	Duration     float64                `json:"duration"`
	Metadata     map[string]interface{} `json:"metadata"`
	StartedAt    string                 `json:"startedAt"`
	EndedAt      string                 `json:"endedAt"`
}

// queueTranscriptionJob queues a transcription job for voice testimonial processing
func (vs *VapiService) queueTranscriptionJob(ctx context.Context, testimonial *models.Testimonial) error {
	if testimonial.MediaURL == nil || *testimonial.MediaURL == "" {
		return fmt.Errorf("no media URL available for transcription")
	}

	job := &models.Job{
		ID:            uuid.New(),
		TestimonialID: &testimonial.ID,
		WorkspaceID:   &testimonial.WorkspaceID,
		JobType:       "transcription",
		Status:        "pending",
		Priority:      1, // High priority for voice testimonials
		MaxRetries:    3,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Create job in database
	if err := vs.jobRepo.Create(ctx, job, vs.db); err != nil {
		return fmt.Errorf("failed to create transcription job: %w", err)
	}

	// Queue the job for processing
	queueMessage := queue.Message{
		ID: job.ID.String(),
		Payload: map[string]interface{}{
			"testimonial_id": testimonial.ID.String(),
			"media_url":      *testimonial.MediaURL,
			"job_id":         job.ID.String(),
		},
	}

	if _, err := vs.queueService.Publish(ctx, "transcription", queueMessage); err != nil {
		return fmt.Errorf("failed to queue transcription job: %w", err)
	}

	vs.logger.Info("Queued transcription job for voice testimonial",
		zap.String("job_id", job.ID.String()),
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("media_url", *testimonial.MediaURL))

	return nil
}

// queueSentimentAnalysisJob queues a sentiment analysis job for the transcript
func (vs *VapiService) queueSentimentAnalysisJob(ctx context.Context, testimonial *models.Testimonial, transcript string) error {
	job := &models.Job{
		ID:            uuid.New(),
		TestimonialID: &testimonial.ID,
		WorkspaceID:   &testimonial.WorkspaceID,
		JobType:       "sentiment_analysis",
		Status:        "pending",
		Priority:      2, // Standard priority
		MaxRetries:    3,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Create job in database
	if err := vs.jobRepo.Create(ctx, job, vs.db); err != nil {
		return fmt.Errorf("failed to create sentiment analysis job: %w", err)
	}

	// Queue the job for processing
	queueMessage := queue.Message{
		ID: job.ID.String(),
		Payload: map[string]interface{}{
			"workspace_id":   testimonial.WorkspaceID.String(),
			"testimonial_id": testimonial.ID.String(),
			"content":        transcript,
			"type":           "voice",
			"job_id":         job.ID.String(),
		},
	}

	if _, err := vs.queueService.Publish(ctx, "sentiment_analysis", queueMessage); err != nil {
		return fmt.Errorf("failed to queue sentiment analysis job: %w", err)
	}

	vs.logger.Info("Queued sentiment analysis job for voice testimonial",
		zap.String("job_id", job.ID.String()),
		zap.String("testimonial_id", testimonial.ID.String()))

	return nil
}

// processTranscriptWithAI processes the raw call transcript using AI to create a structured testimonial
func (vs *VapiService) processTranscriptWithAI(ctx context.Context, transcript string, testimonial *models.Testimonial) (string, error) {
	// For now, implement a simple AI processing using OpenAI directly
	// This can be enhanced later to use the full AI service architecture

	systemPrompt := fmt.Sprintf(`You are an expert at converting voice call transcripts into polished testimonials.

Your task is to analyze a conversation between an AI assistant and a customer (%s from %s) and extract a professional testimonial.

Guidelines:
1. Focus on the customer's responses, not the AI assistant's questions
2. Extract specific benefits, results, or positive experiences mentioned
3. Convert conversational language into professional testimonial format
4. Maintain the customer's authentic voice and sentiment
5. Remove filler words, repetitions, and irrelevant conversation
6. Structure as a coherent, flowing testimonial in first person
7. Include specific metrics, results, or outcomes if mentioned
8. Keep it concise but impactful (2-4 sentences ideal)

Format the output as a clean, professional testimonial that could be used for marketing purposes.`,
		*testimonial.AuthorName, *testimonial.AuthorCompany)

	userPrompt := fmt.Sprintf("Convert this voice call transcript into a professional testimonial:\n\n%s", transcript)

	// Make a direct call to OpenAI API
	openAIKey := os.Getenv("OPENAI_API_KEY")
	if openAIKey == "" {
		return "", fmt.Errorf("OpenAI API key not configured")
	}

	payload := map[string]interface{}{
		"model": "gpt-4.1-nano",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"max_tokens":  500,
		"temperature": 0.7,
	}

	jsonPayload, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", strings.NewReader(string(jsonPayload)))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+openAIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var openAIResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return "", err
	}

	if len(openAIResp.Choices) == 0 {
		return "", fmt.Errorf("no response from OpenAI")
	}

	processedTestimonial := strings.TrimSpace(openAIResp.Choices[0].Message.Content)

	vs.logger.Info("Successfully processed transcript with AI",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.Int("original_length", len(transcript)),
		zap.Int("processed_length", len(processedTestimonial)))

	return processedTestimonial, nil
}

// Helper function to get map keys for debugging
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
