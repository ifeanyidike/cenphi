// internal/controllers/twilio_controller.go
package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/services"
	"go.uber.org/zap"
)

// TwilioController handles Twilio webhooks and TwiML generation
type TwilioController struct {
	twilioService *services.TwilioVoiceService
	logger        *zap.Logger
}

// NewTwilioController creates a new Twilio controller
func NewTwilioController(twilioService *services.TwilioVoiceService, logger *zap.Logger) *TwilioController {
	return &TwilioController{
		twilioService: twilioService,
		logger:        logger,
	}
}

// GenerateTwiML generates TwiML for voice testimonial collection
func (tc *TwilioController) GenerateTwiML(w http.ResponseWriter, r *http.Request) {
	testimonialID := r.URL.Query().Get("testimonial_id")
	customerName := r.URL.Query().Get("customer_name")

	if testimonialID == "" {
		tc.logger.Error("Missing testimonial_id in TwiML request")
		http.Error(w, "Missing testimonial_id", http.StatusBadRequest)
		return
	}

	if customerName == "" {
		customerName = "valued customer"
	}

	// Generate TwiML for testimonial collection
	twiml := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">
        Hi %s! This is an AI assistant calling about collecting a brief testimonial for your experience with our service.
        This should only take about 5 minutes. Are you ready to share your thoughts?
    </Say>
    <Pause length="2"/>
    <Say voice="alice">
        Please tell us about your experience. What challenges were you facing before using our solution?
        How has our product or service helped you? What specific results or benefits have you seen?
    </Say>
    <Pause length="1"/>
    <Say voice="alice">
        When you're finished sharing, please hang up and we'll process your testimonial. Thank you for your time!
    </Say>
    <Record
        timeout="300"
        maxLength="600"
        playBeep="true"
        recordingStatusCallback="/api/twilio/webhook/recording?testimonial_id=%s"
        recordingStatusCallbackMethod="POST"
    />
    <Say voice="alice">Thank you for sharing your testimonial. Have a great day!</Say>
</Response>`, customerName, testimonialID)

	w.Header().Set("Content-Type", "application/xml")
	w.Write([]byte(twiml))

	tc.logger.Info("Generated TwiML for testimonial collection",
		zap.String("testimonial_id", testimonialID),
		zap.String("customer_name", customerName))
}

// HandleCallStatusWebhook handles Twilio call status webhooks
func (tc *TwilioController) HandleCallStatusWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse form data from Twilio webhook
	err := r.ParseForm()
	if err != nil {
		tc.logger.Error("Failed to parse form data", zap.Error(err))
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	callSid := r.FormValue("CallSid")
	callStatus := r.FormValue("CallStatus")
	testimonialIdStr := r.URL.Query().Get("testimonial_id")

	tc.logger.Info("Received Twilio call status webhook",
		zap.String("call_sid", callSid),
		zap.String("call_status", callStatus),
		zap.String("testimonial_id", testimonialIdStr))

	if callSid == "" || testimonialIdStr == "" {
		tc.logger.Error("Missing required fields in webhook",
			zap.String("call_sid", callSid),
			zap.String("testimonial_id", testimonialIdStr))
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Process the webhook
	err = tc.twilioService.HandleTwilioCallStatusWebhook(r.Context(), callSid, callStatus, testimonialIdStr, "")
	if err != nil {
		tc.logger.Error("Failed to process call status webhook", zap.Error(err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// HandleRecordingWebhook handles Twilio recording webhooks
func (tc *TwilioController) HandleRecordingWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse form data from Twilio webhook
	err := r.ParseForm()
	if err != nil {
		tc.logger.Error("Failed to parse form data", zap.Error(err))
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	callSid := r.FormValue("CallSid")
	recordingUrl := r.FormValue("RecordingUrl")
	recordingStatus := r.FormValue("RecordingStatus")
	testimonialIdStr := r.URL.Query().Get("testimonial_id")

	tc.logger.Info("Received Twilio recording webhook",
		zap.String("call_sid", callSid),
		zap.String("recording_url", recordingUrl),
		zap.String("recording_status", recordingStatus),
		zap.String("testimonial_id", testimonialIdStr))

	if callSid == "" || testimonialIdStr == "" {
		tc.logger.Error("Missing required fields in recording webhook",
			zap.String("call_sid", callSid),
			zap.String("testimonial_id", testimonialIdStr))
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Only process completed recordings
	if recordingStatus != "completed" {
		tc.logger.Info("Ignoring non-completed recording",
			zap.String("status", recordingStatus))
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
		return
	}

	// Process the recording webhook with call completion
	err = tc.twilioService.HandleTwilioCallStatusWebhook(r.Context(), callSid, "completed", testimonialIdStr, recordingUrl)
	if err != nil {
		tc.logger.Error("Failed to process recording webhook", zap.Error(err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// TestTwilioIntegration provides a test endpoint for Twilio integration
func (tc *TwilioController) TestTwilioIntegration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Phone string `json:"phone"`
		Name  string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Phone == "" {
		http.Error(w, "Phone number required", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		req.Name = "Test User"
	}

	// Create a test voice call request
	testRequest := services.VoiceCallRequest{
		TestimonialID:     uuid.New(),
		CustomerName:      req.Name,
		CustomerEmail:     "test@example.com",
		CustomerPhone:     req.Phone,
		Company:           "Test Company",
		PreferredCallTime: "now",
		Timezone:          "UTC",
		AdditionalNotes:   "Test call from Twilio integration",
	}

	// Test the call initiation
	callID, err := tc.twilioService.InitiateInternationalCall(r.Context(), testRequest)
	if err != nil {
		tc.logger.Error("Failed to initiate test call", zap.Error(err))

		response := map[string]interface{}{
			"success": false,
			"error":   err.Error(),
			"message": "Test call failed",
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	response := map[string]interface{}{
		"success":         true,
		"call_sid":        *callID,
		"testimonial_id":  testRequest.TestimonialID.String(),
		"message":         "Test call initiated successfully",
		"phone":          req.Phone,
		"trial_warning":   "If using trial account, ensure phone number is verified",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	tc.logger.Info("Test Twilio call initiated",
		zap.String("call_sid", *callID),
		zap.String("phone", req.Phone))
}

// RegisterRoutes registers Twilio webhook routes
func (tc *TwilioController) RegisterRoutes(r chi.Router) {
	r.Route("/twilio", func(r chi.Router) {
		r.Get("/twiml", tc.GenerateTwiML)
		r.Post("/webhook/call-status", tc.HandleCallStatusWebhook)
		r.Post("/webhook/recording", tc.HandleRecordingWebhook)
		r.Post("/test", tc.TestTwilioIntegration)
	})
}