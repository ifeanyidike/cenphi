// internal/services/twilio_service.go
package services

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
	"github.com/twilio/twilio-go"
	twilio_api "github.com/twilio/twilio-go/rest/api/v2010"
)

// TwilioVoiceService handles international voice calls using Twilio
type TwilioVoiceService struct {
	client          *twilio.RestClient
	logger          *zap.Logger
	testimonialRepo repositories.TestimonialRepository
	jobRepo         repositories.JobRepository
	queueService    queue.Service
	db              *sql.DB
	fromNumber      string
}

// NewTwilioVoiceService creates a new Twilio voice service instance
func NewTwilioVoiceService(
	logger *zap.Logger,
	testimonialRepo repositories.TestimonialRepository,
	jobRepo repositories.JobRepository,
	queueService queue.Service,
	db *sql.DB,
) *TwilioVoiceService {
	accountSid := os.Getenv("TWILIO_ACCOUNT_SID")
	authToken := os.Getenv("TWILIO_AUTH_TOKEN")
	fromNumber := os.Getenv("TWILIO_PHONE_NUMBER")

	if accountSid == "" || authToken == "" || fromNumber == "" {
		logger.Warn("Twilio credentials not configured, international calling will not work",
			zap.Bool("has_account_sid", accountSid != ""),
			zap.Bool("has_auth_token", authToken != ""),
			zap.Bool("has_phone_number", fromNumber != ""))
		return &TwilioVoiceService{
			client:          nil,
			logger:          logger,
			testimonialRepo: testimonialRepo,
			jobRepo:         jobRepo,
			queueService:    queueService,
			db:              db,
			fromNumber:      fromNumber,
		}
	}

	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: accountSid,
		Password: authToken,
	})

	return &TwilioVoiceService{
		client:          client,
		logger:          logger,
		testimonialRepo: testimonialRepo,
		jobRepo:         jobRepo,
		queueService:    queueService,
		db:              db,
		fromNumber:      fromNumber,
	}
}

// isInternationalNumber checks if a phone number is outside the US
func (ts *TwilioVoiceService) isInternationalNumber(phone string) bool {
	// Remove all non-digit characters except +
	re := regexp.MustCompile(`[^\d+]`)
	cleaned := re.ReplaceAllString(phone, "")

	// If it starts with +1, it's US/Canada
	if strings.HasPrefix(cleaned, "+1") {
		return false
	}

	// If it's just 10 digits without country code, assume US
	if len(cleaned) == 10 {
		return false
	}

	// If it starts with + and not +1, it's international
	if strings.HasPrefix(cleaned, "+") && !strings.HasPrefix(cleaned, "+1") {
		return true
	}

	// If it has more than 10 digits and doesn't start with 1, it's international
	if len(cleaned) > 10 && !strings.HasPrefix(cleaned, "1") {
		return true
	}

	return false
}

// validateInternationalPhoneNumber validates and formats an international phone number
func (ts *TwilioVoiceService) validateInternationalPhoneNumber(phone string) (string, error) {
	// Remove all non-digit characters except +
	re := regexp.MustCompile(`[^\d+]`)
	cleaned := re.ReplaceAllString(phone, "")

	// Check if it starts with +
	if !strings.HasPrefix(cleaned, "+") {
		return "", fmt.Errorf("international phone number must include country code (start with +)")
	}

	// Validate E.164 format (+ followed by 7-15 digits)
	e164Regex := regexp.MustCompile(`^\+[1-9]\d{6,14}$`)
	if !e164Regex.MatchString(cleaned) {
		return "", fmt.Errorf("invalid international phone number format, must be E.164 format")
	}

	return cleaned, nil
}

// InitiateInternationalCall creates a Twilio call for international numbers
func (ts *TwilioVoiceService) InitiateInternationalCall(ctx context.Context, req VoiceCallRequest) (*string, error) {
	if ts.client == nil {
		return nil, fmt.Errorf("twilio client not initialized - check credentials")
	}

	// Validate phone number
	validatedPhone, err := ts.validateInternationalPhoneNumber(req.CustomerPhone)
	if err != nil {
		return nil, fmt.Errorf("invalid international phone number: %w", err)
	}

	// Create TwiML URL for the call
	twimlUrl := ts.generateTwiMLUrl(req)

	// Create the call using Twilio
	params := &twilio_api.CreateCallParams{}
	params.SetTo(validatedPhone)
	params.SetFrom(ts.fromNumber)
	params.SetUrl(twimlUrl)
	params.SetMethod("POST")
	params.SetRecord(true)
	params.SetRecordingStatusCallback(ts.getRecordingWebhookUrl())
	params.SetStatusCallback(ts.getCallStatusWebhookUrl(req.TestimonialID))
	params.SetStatusCallbackEvent([]string{"completed", "failed"})

	call, err := ts.client.Api.CreateCall(params)
	if err != nil {
		ts.logger.Error("Failed to create Twilio call",
			zap.String("phone", validatedPhone),
			zap.String("testimonial_id", req.TestimonialID.String()),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create Twilio call: %w", err)
	}

	callSid := *call.Sid

	ts.logger.Info("International Twilio call initiated successfully",
		zap.String("call_sid", callSid),
		zap.String("testimonial_id", req.TestimonialID.String()),
		zap.String("customer_phone", validatedPhone),
	)

	return &callSid, nil
}

// generateTwiMLUrl creates a TwiML URL for the call flow
func (ts *TwilioVoiceService) generateTwiMLUrl(req VoiceCallRequest) string {
	baseUrl := os.Getenv("BASE_URL")
	if baseUrl == "" {
		baseUrl = "http://localhost:8081"
	}

	return fmt.Sprintf("%s/api/twilio/twiml?testimonial_id=%s&customer_name=%s",
		baseUrl, req.TestimonialID.String(), req.CustomerName)
}

// getCallStatusWebhookUrl returns the webhook URL for call status updates
func (ts *TwilioVoiceService) getCallStatusWebhookUrl(testimonialId uuid.UUID) string {
	baseUrl := os.Getenv("BASE_URL")
	if baseUrl == "" {
		baseUrl = "http://localhost:8081"
	}

	return fmt.Sprintf("%s/api/twilio/webhook/call-status?testimonial_id=%s",
		baseUrl, testimonialId.String())
}

// getRecordingWebhookUrl returns the webhook URL for recording updates
func (ts *TwilioVoiceService) getRecordingWebhookUrl() string {
	baseUrl := os.Getenv("BASE_URL")
	if baseUrl == "" {
		baseUrl = "http://localhost:8081"
	}

	return fmt.Sprintf("%s/api/twilio/webhook/recording", baseUrl)
}

// HandleTwilioCallStatusWebhook processes Twilio call status webhooks
func (ts *TwilioVoiceService) HandleTwilioCallStatusWebhook(ctx context.Context, callSid string, callStatus string, testimonialIdStr string, recordingUrl string) error {
	if callStatus != "completed" {
		ts.logger.Info("Ignoring non-completed call webhook",
			zap.String("call_sid", callSid),
			zap.String("status", callStatus))
		return nil
	}

	// Parse testimonial ID
	testimonialId, err := uuid.Parse(testimonialIdStr)
	if err != nil {
		return fmt.Errorf("invalid testimonial ID: %w", err)
	}

	// Fetch testimonial
	testimonial, err := ts.testimonialRepo.FetchByID(ctx, testimonialId, ts.db)
	if err != nil {
		return fmt.Errorf("failed to fetch testimonial: %w", err)
	}

	// Update testimonial with recording URL
	if recordingUrl != "" {
		testimonial.MediaURL = &recordingUrl
	}

	// Update processing status
	testimonial.ProcessingStatus = "pending_transcription"

	// Add call metadata
	if testimonial.Metadata == nil {
		testimonial.Metadata = make(models.JSONMap)
	}
	testimonial.Metadata["twilio_call_sid"] = callSid
	testimonial.Metadata["call_status"] = callStatus
	testimonial.Metadata["call_provider"] = "twilio"

	// Update testimonial in database
	if err := ts.testimonialRepo.Update(ctx, testimonial, testimonialId, ts.db); err != nil {
		return fmt.Errorf("failed to update testimonial: %w", err)
	}

	// Queue transcription job if we have recording URL
	if recordingUrl != "" {
		if err := ts.queueTranscriptionJob(ctx, testimonial); err != nil {
			ts.logger.Warn("Failed to queue transcription job", zap.Error(err))
		}
	}

	ts.logger.Info("Twilio call completed and testimonial updated",
		zap.String("call_sid", callSid),
		zap.String("testimonial_id", testimonialIdStr),
		zap.Bool("has_recording", recordingUrl != ""))

	return nil
}

// queueTranscriptionJob queues a transcription job for Twilio recordings
func (ts *TwilioVoiceService) queueTranscriptionJob(ctx context.Context, testimonial *models.Testimonial) error {
	if testimonial.MediaURL == nil || *testimonial.MediaURL == "" {
		return fmt.Errorf("no media URL available for transcription")
	}

	job := &models.Job{
		ID:            uuid.New(),
		TestimonialID: &testimonial.ID,
		WorkspaceID:   &testimonial.WorkspaceID,
		JobType:       "transcription",
		Status:        "pending",
		Priority:      1,
		MaxRetries:    3,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Create job in database
	if err := ts.jobRepo.Create(ctx, job, ts.db); err != nil {
		return fmt.Errorf("failed to create transcription job: %w", err)
	}

	// Queue the job for processing
	queueMessage := queue.Message{
		ID: job.ID.String(),
		Payload: map[string]interface{}{
			"testimonial_id": testimonial.ID.String(),
			"media_url":      *testimonial.MediaURL,
			"job_id":         job.ID.String(),
			"provider":       "twilio",
		},
	}

	if _, err := ts.queueService.Publish(ctx, "transcription", queueMessage); err != nil {
		return fmt.Errorf("failed to queue transcription job: %w", err)
	}

	ts.logger.Info("Queued transcription job for Twilio recording",
		zap.String("job_id", job.ID.String()),
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("media_url", *testimonial.MediaURL))

	return nil
}

// ShouldUseTwilio determines if Twilio should be used for a given phone number
func (ts *TwilioVoiceService) ShouldUseTwilio(phone string) bool {
	// Check if international calling is enabled
	useInternational := os.Getenv("VOICE_USE_TWILIO_FOR_INTERNATIONAL")
	if useInternational != "true" {
		return false
	}

	// Check if it's an international number
	isInternational := ts.isInternationalNumber(phone)

	// If it's a trial account, warn about limitations but still allow the attempt
	if isInternational && os.Getenv("TWILIO_TRIAL_ACCOUNT") == "true" {
		ts.logger.Warn("Using Twilio trial account for international call - number must be verified",
			zap.String("phone", phone))
	}

	return isInternational
}