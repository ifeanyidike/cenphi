// internal/controllers/testimonial_collection_controller.go
package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/queue"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type AudioQualityRequest struct {
	MediaURL string `json:"media_url" validate:"required"`
}

type AudioQualityResponse struct {
	Score          float64  `json:"score"`
	HasSpeech      bool     `json:"has_speech"`
	NoiseLevel     string   `json:"noise_level"`
	Confidence     float64  `json:"confidence"`
	SpeechRatio    float64  `json:"speech_ratio"`
	Recommendation string   `json:"recommendation"`
	ShouldReject   bool     `json:"should_reject"`
	Issues         []string `json:"issues"`
}

type TestimonialCollectionController struct {
	service                   services.TestimonialCollectionService
	driveService              services.DriveService
	audioTranscriptionService ai.AudioTranscriptionService
	queueService              queue.Service
	logger                    *zap.Logger
}

func NewTestimonialCollectionController(service services.TestimonialCollectionService, driveService services.DriveService, audioTranscriptionService ai.AudioTranscriptionService, queueService queue.Service, logger *zap.Logger) *TestimonialCollectionController {
	return &TestimonialCollectionController{
		service:                   service,
		driveService:              driveService,
		audioTranscriptionService: audioTranscriptionService,
		queueService:              queueService,
		logger:                    logger,
	}
}

func (tcc *TestimonialCollectionController) CollectFromWidget(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	contentType := r.Header.Get("Content-Type")

	// Check if this is a multipart form (video submission)
	if strings.Contains(contentType, "multipart/form-data") {
		tcc.handleVideoSubmission(w, r, workspaceID, "widget")
		return
	}

	// Handle text submission (JSON)
	var data models.TestimonialUpload
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}

	data.WorkspaceID = workspaceID
	data.CollectionMethod = "widget"

	testimonial, err := tcc.service.CollectTextTestimonial(r.Context(), data)
	if err != nil {
		tcc.logger.Error("Failed to collect text testimonial from widget", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message":        "Testimonial submitted successfully",
		"testimonial_id": testimonial.ID.String(),
		"status":         testimonial.Status,
		"type":           testimonial.Type,
	})
}

func (tcc *TestimonialCollectionController) CollectFromForm(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	contentType := r.Header.Get("Content-Type")

	// Check if this is a multipart form (video submission)
	if strings.Contains(contentType, "multipart/form-data") {
		tcc.handleVideoSubmission(w, r, workspaceID, "form")
		return
	}

	// Handle text submission (JSON)
	var data models.TestimonialUpload
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}

	data.WorkspaceID = workspaceID
	data.CollectionMethod = "form"

	testimonial, err := tcc.service.CollectTextTestimonial(r.Context(), data)
	if err != nil {
		tcc.logger.Error("Failed to collect text testimonial from form", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message":        "Testimonial submitted successfully",
		"testimonial_id": testimonial.ID.String(),
		"status":         testimonial.Status,
		"type":           testimonial.Type,
	})
}

func (tcc *TestimonialCollectionController) processVideoUpload(w http.ResponseWriter, r *http.Request, workspaceID uuid.UUID, collectionMethod string) {
	// Parse multipart form
	if err := r.ParseMultipartForm(500 << 20); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Unable to parse form: "+err.Error())
		return
	}

	// Get video file
	file, header, err := r.FormFile("video")
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "No video file provided: "+err.Error())
		return
	}
	defer file.Close()

	// UNIFIED: Validation logic for all uploads
	validationResult, validationErr := tcc.service.ValidateVideoFile(r.Context(), file, header)
	if validationErr != nil {
		tcc.logger.Error("Video validation system error",
			zap.String("filename", header.Filename),
			zap.Error(validationErr))
		utils.RespondWithError(w, http.StatusInternalServerError, "Unable to validate video")
		return
	}

	if !validationResult.IsValid {
		tcc.logger.Info("Video validation failed",
			zap.String("filename", header.Filename),
			zap.String("reason", validationResult.ErrorMessage))

		utils.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
			"message":          "Upload completed but validation failed",
			"voice_detected":   validationResult.Quality.HasSpeech,
			"can_transcribe":   false,
			"quality_score":    validationResult.Quality.Score,
			"quality_feedback": validationResult.ErrorMessage,
			"testimonial_id":   "",
		})
		return
	}
	file.Seek(0, 0)

	// Parse author data
	authorData := models.TestimonialUpload{
		WorkspaceID:      workspaceID,
		AuthorName:       r.FormValue("author_name"),
		AuthorEmail:      r.FormValue("author_email"),
		AuthorCompany:    r.FormValue("author_company"),
		AuthorTitle:      r.FormValue("author_title"),
		CollectionMethod: collectionMethod,
	}

	// Validate required fields for certain collection methods
	if (collectionMethod == "widget" || collectionMethod == "form") && authorData.AuthorName == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Author name is required")
		return
	}

	// Parse optional fields
	if ratingStr := r.FormValue("rating"); ratingStr != "" {
		if rating, err := strconv.Atoi(ratingStr); err == nil && rating >= 1 && rating <= 5 {
			authorData.Rating = &rating
		}
	}

	if tagsStr := r.FormValue("tags"); tagsStr != "" {
		for tag := range strings.SplitSeq(tagsStr, ",") {
			if trimmed := strings.TrimSpace(tag); trimmed != "" {
				authorData.Tags = append(authorData.Tags, trimmed)
			}
		}
	}

	// Determine video method
	videoMethod := r.FormValue("video_method")
	if videoMethod == "" {
		if strings.Contains(header.Filename, "recording_") {
			videoMethod = "recorded"
		} else {
			videoMethod = "uploaded"
		}
	}

	// Process video
	var result *services.VideoUploadResult
	requireValidation := r.FormValue("require_voice_validation") == "true"

	if videoMethod == "recorded" && requireValidation {
		result, err = tcc.service.ProcessRecordedVideo(r.Context(), authorData, file, header)
	} else {
		result, err = tcc.service.ProcessUploadedVideo(r.Context(), authorData, file, header)
	}

	if err != nil {
		tcc.logger.Error("Failed to process video testimonial", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	testimonial := result.Testimonial

	// UNIFIED: Consistent response structure
	response := map[string]interface{}{
		"message":        "Video testimonial submitted successfully!",
		"testimonial_id": testimonial.ID.String(),
		"status":         testimonial.Status,
		"type":           testimonial.Type,
		"media_url":      testimonial.MediaURL,
		"processing":     testimonial.ProcessingStatus,
		"collection":     collectionMethod,
		"video_method":   videoMethod,
		"voice_detected": true,
		"can_transcribe": true,
	}

	utils.RespondWithJSON(w, http.StatusCreated, response)
}

func (tcc *TestimonialCollectionController) handleVideoSubmission(w http.ResponseWriter, r *http.Request, workspaceID uuid.UUID, collectionMethod string) {
	tcc.processVideoUpload(w, r, workspaceID, collectionMethod)
}

func (tcc *TestimonialCollectionController) UploadVideo(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	tcc.processVideoUpload(w, r, workspaceID, "dashboard_import")
}

// CSV upload endpoint
func (tcc *TestimonialCollectionController) UploadCSV(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (max 10MB for CSV)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get workspace ID
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get uploaded file
	file, header, err := r.FormFile("csv")
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".csv") {
		utils.RespondWithError(w, http.StatusBadRequest, "File must be a CSV")
		return
	}

	result, err := tcc.service.ProcessCSVUpload(r.Context(), workspaceID, file)
	if err != nil {
		tcc.logger.Error("Failed to process CSV upload", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]any{
		"message": "CSV processed successfully",
		"result":  result,
	})
}

// Excel upload endpoint
func (tcc *TestimonialCollectionController) UploadXLS(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (max 10MB for Excel)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get workspace ID
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get uploaded file
	file, header, err := r.FormFile("excel")
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer file.Close()

	// Validate file type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".xls" && ext != ".xlsx" {
		utils.RespondWithError(w, http.StatusBadRequest, "File must be an Excel file (.xls or .xlsx)")
		return
	}

	result, err := tcc.service.ProcessXLSUpload(r.Context(), workspaceID, file)
	if err != nil {
		tcc.logger.Error("Failed to process Excel upload", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]any{
		"message": "Excel file processed successfully",
		"result":  result,
	})
}

// Google Drive import endpoint
func (tcc *TestimonialCollectionController) ImportFromGoogleDrive(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FileIDs []string `json:"file_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if len(req.FileIDs) == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "No file IDs provided")
		return
	}

	// Get workspace ID
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// account, err := tcc.driveService.GetUserAccount(r.Context(), workspaceID, userID)
	// if err != nil {
	// 	utils.RespondWithError(w, http.StatusUnauthorized, "Google Drive not connected")
	// 	return
	// }

	// REFRESH TOKEN IF NEEDED
	token, err := tcc.driveService.RefreshTokenIfNeeded(r.Context(), workspaceID)
	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "Failed to refresh Google token")
		return
	}

	result, err := tcc.service.ProcessGoogleDriveImportWithAuth(r.Context(), workspaceID, req.FileIDs, token)
	if err != nil {
		tcc.logger.Error("Failed to import from Google Drive", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]any{
		"message": "Google Drive import completed",
		"result":  result,
	})
}

// Send testimonial request email
func (tcc *TestimonialCollectionController) SendTestimonialRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ContactEmail string `json:"contact_email"`
		ContactName  string `json:"contact_name"`
		Message      string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.ContactEmail == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "contact email is required")
		return
	}

	// Get workspace ID
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	err = tcc.service.SendTestimonialRequest(r.Context(), workspaceID, req.ContactEmail, req.ContactName, req.Message)
	if err != nil {
		tcc.logger.Error("Failed to send testimonial request", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Testimonial request sent successfully",
		"contact_email": req.ContactEmail,
		"sent_at":       time.Now(),
	})
}

// Schedule Voice Testimonial Call
func (tcc *TestimonialCollectionController) ScheduleVoiceTestimonial(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	var req services.VoiceTestimonialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}

	// Validate request
	if req.CustomerName == "" || req.CustomerEmail == "" || req.CustomerPhone == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	// Create voice testimonial using the service
	testimonial, err := tcc.service.ScheduleVoiceTestimonial(r.Context(), workspaceID, req)
	if err != nil {
		tcc.logger.Error("Failed to schedule voice testimonial", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"success":           true,
		"testimonialId":     testimonial.ID.String(),
		"callScheduled":     true,
		"estimatedCallTime": "Within 2 hours",
		"message":           "Voice testimonial call scheduled successfully",
	})
}

// InstantVoiceTestimonial creates and immediately calls for a voice testimonial
func (tcc *TestimonialCollectionController) InstantVoiceTestimonial(w http.ResponseWriter, r *http.Request) {
	// Get workspace ID from URL
	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspaceID"))
	if err != nil {
		tcc.logger.Error("Invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	// Parse request body
	var req services.VoiceTestimonialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		tcc.logger.Error("Failed to parse request body", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Validate required fields
	if req.CustomerName == "" || req.CustomerEmail == "" || req.CustomerPhone == "" {
		tcc.logger.Error("Missing required fields for instant voice testimonial")
		utils.RespondWithError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	// Create instant voice testimonial using the service
	testimonial, err := tcc.service.InstantVoiceTestimonial(r.Context(), workspaceID, req)
	if err != nil {
		tcc.logger.Error("Failed to create instant voice testimonial", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"success":           true,
		"testimonialId":     testimonial.ID.String(),
		"callInitiated":     true,
		"estimatedCallTime": "Within 2 minutes",
		"message":           "Voice testimonial call initiated successfully",
	})
}

// VapiWebhook handles webhooks from Vapi.ai when voice calls complete
func (tcc *TestimonialCollectionController) VapiWebhook(w http.ResponseWriter, r *http.Request) {
	// Parse webhook payload
	var webhookData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&webhookData); err != nil {
		tcc.logger.Error("Failed to parse Vapi webhook payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	tcc.logger.Info("Received Vapi webhook",
		zap.Any("webhook_data", webhookData),
		zap.String("user_agent", r.Header.Get("User-Agent")),
		zap.String("content_type", r.Header.Get("Content-Type")))

	// Process the webhook using the testimonial collection service
	if err := tcc.service.HandleVapiWebhook(r.Context(), webhookData); err != nil {
		tcc.logger.Error("Failed to process Vapi webhook",
			zap.Error(err),
			zap.Any("webhook_data", webhookData))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to process webhook")
		return
	}

	// Respond success to Vapi
	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Webhook processed successfully",
	})
}

// QueueVideoUpload handles queued video uploads
func (tcc *TestimonialCollectionController) QueueVideoUpload(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		tcc.logger.Error("Invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	// Parse multipart form
	err = r.ParseMultipartForm(100 << 20) // 100MB max
	if err != nil {
		tcc.logger.Error("Failed to parse multipart form", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	// Get uploaded file
	file, header, err := r.FormFile("video")
	if err != nil {
		tcc.logger.Error("Failed to get uploaded file", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "No video file provided")
		return
	}
	defer file.Close()

	// Validate file size (max 250MB)
	maxSize := int64(250 << 20) // 250MB
	if header.Size > maxSize {
		tcc.logger.Error("File too large", zap.Int64("size", header.Size), zap.Int64("max", maxSize))
		utils.RespondWithError(w, http.StatusBadRequest, "File too large (max 250MB)")
		return
	}

	// Validate file type
	allowedExts := map[string]bool{
		".mp4":  true,
		".mov":  true,
		".avi":  true,
		".webm": true,
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExts[ext] {
		tcc.logger.Error("Invalid file type", zap.String("extension", ext))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid file type. Allowed: mp4, mov, avi, webm")
		return
	}

	// Generate temp file path for validation
	tempDir := "/tmp/uploads"
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		tcc.logger.Error("Failed to create temp directory", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Upload setup failed")
		return
	}

	tempPath := filepath.Join(tempDir, fmt.Sprintf("%s%s", uuid.New().String(), ext))

	// Save file to temp location
	tempFile, err := os.Create(tempPath)
	if err != nil {
		tcc.logger.Error("Failed to create temp file", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Upload setup failed")
		return
	}
	defer tempFile.Close()

	// Copy uploaded file to temp location
	if _, err := io.Copy(tempFile, file); err != nil {
		os.Remove(tempPath) // Cleanup on error
		tcc.logger.Error("Failed to save uploaded file", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Upload failed")
		return
	}

	// Close and reopen file for validation
	tempFile.Close()

	// Validate video has audio/voice before queuing
	validationFile, err := os.Open(tempPath)
	if err != nil {
		os.Remove(tempPath)
		tcc.logger.Error("Failed to open file for validation", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Validation setup failed")
		return
	}
	defer validationFile.Close()

	// Perform audio validation
	validationResult, validationErr := tcc.service.ValidateVideoFile(r.Context(), validationFile, header)
	if validationErr != nil {
		os.Remove(tempPath)
		tcc.logger.Error("Video validation system error",
			zap.String("filename", header.Filename),
			zap.Error(validationErr))

		// Return user-friendly error message
		utils.RespondWithJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"error":   validationErr.Error(),
			"message": "We couldn't validate your video. " + validationErr.Error(),
		})
		return
	}

	if !validationResult.IsValid {
		os.Remove(tempPath)
		tcc.logger.Info("Video validation failed - no voice detected",
			zap.String("filename", header.Filename),
			zap.String("reason", validationResult.ErrorMessage))

		utils.RespondWithJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success":          false,
			"error":            "Video validation failed",
			"message":          validationResult.ErrorMessage, // User-friendly message
			"voice_detected":   validationResult.Quality.HasSpeech,
			"can_transcribe":   false,
			"quality_score":    validationResult.Quality.Score,
			"quality_feedback": validationResult.ErrorMessage,
		})
		return
	}

	// Reopen file for processing
	file.Seek(0, 0)
	processFile, err := os.Open(tempPath)
	if err != nil {
		os.Remove(tempPath)
		tcc.logger.Error("Failed to reopen file for processing", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to process video")
		return
	}
	defer processFile.Close()
	defer os.Remove(tempPath) // Clean up temp file after processing

	// Parse author data
	authorData := models.TestimonialUpload{
		WorkspaceID:      workspaceID,
		AuthorName:       r.FormValue("author_name"),
		AuthorEmail:      r.FormValue("author_email"),
		AuthorCompany:    r.FormValue("author_company"),
		AuthorTitle:      r.FormValue("author_title"),
		CollectionMethod: r.FormValue("collection_method"),
	}

	if authorData.CollectionMethod == "" {
		authorData.CollectionMethod = "form"
	}

	// Parse rating
	if ratingStr := r.FormValue("rating"); ratingStr != "" {
		if rating, err := strconv.Atoi(ratingStr); err == nil && rating >= 1 && rating <= 5 {
			authorData.Rating = &rating
		}
	}

	// Parse tags
	if tagsStr := r.FormValue("tags"); tagsStr != "" {
		for _, tag := range strings.Split(tagsStr, ",") {
			if trimmed := strings.TrimSpace(tag); trimmed != "" {
				authorData.Tags = append(authorData.Tags, trimmed)
			}
		}
	}

	// Process video synchronously
	result, err := tcc.service.ProcessUploadedVideo(r.Context(), authorData, processFile, header)
	if err != nil {
		tcc.logger.Error("Failed to process queued video", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	testimonial := result.Testimonial
	sessionID := result.SessionID

	tcc.logger.Info("Video testimonial processed successfully",
		zap.String("testimonial_id", testimonial.ID.String()),
		zap.String("workspace_id", workspaceID.String()),
		zap.String("session_id", sessionID.String()),
		zap.String("filename", header.Filename))

	// Return testimonial ID and compression session ID immediately
	utils.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"success":               true,
		"message":               "Video testimonial submitted successfully!",
		"testimonial_id":        testimonial.ID.String(),
		"compression_session_id": sessionID.String(), // For SSE upload/compression tracking
		"status":                testimonial.Status,
		"type":                  testimonial.Type,
		"media_url":             testimonial.MediaURL,
		"processing":            testimonial.ProcessingStatus,
		"collection":            authorData.CollectionMethod,
		"voice_detected":        true,
		"can_transcribe":        true,
	})
}

// GetUploadURL generates a presigned URL for direct upload to OCI (bypasses Cloud Run 32MB limit)
func (tcc *TestimonialCollectionController) GetUploadURL(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		tcc.logger.Error("Invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	var req struct {
		Filename    string `json:"filename"`
		ContentType string `json:"content_type"`
		FileSize    int64  `json:"file_size"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		tcc.logger.Error("Invalid request format", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request format")
		return
	}

	// Validate file size (max 250MB as per frontend maxFileSize)
	const maxFileSize = 250 * 1024 * 1024 // 250MB
	if req.FileSize > maxFileSize {
		tcc.logger.Error("File too large", zap.Int64("size", req.FileSize), zap.Int64("max", maxFileSize))
		utils.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("File too large. Maximum size: %dMB", maxFileSize/(1024*1024)))
		return
	}

	// Generate unique object path (use videos/ to match folder pattern from regular uploads)
	uploadID := uuid.New().String()
	objectPath := fmt.Sprintf("videos/%s/%s/%s", workspaceID.String(), uploadID, req.Filename)

	// Generate presigned URL (15 minutes expiry) via service
	uploadURL, err := tcc.service.GenerateUploadPresignedURL(r.Context(), objectPath, 15*time.Minute)
	if err != nil {
		tcc.logger.Error("Failed to generate upload URL",
			zap.String("workspace_id", workspaceID.String()),
			zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to generate upload URL. Please try again.")
		return
	}

	tcc.logger.Info("Upload URL generated",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("upload_id", uploadID),
		zap.Int64("file_size", req.FileSize))

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"upload_url":  uploadURL,
		"object_path": objectPath,
		"upload_id":   uploadID,
	})
}

// ConfirmUpload processes a video that was uploaded directly to OCI
func (tcc *TestimonialCollectionController) ConfirmUpload(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		tcc.logger.Error("Invalid workspace ID", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	var req struct {
		ObjectPath       string `json:"object_path"`
		UploadID         string `json:"upload_id"`
		AuthorName       string `json:"author_name"`
		AuthorEmail      string `json:"author_email"`
		CollectionMethod string `json:"collection_method"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		tcc.logger.Error("Invalid request format", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request format")
		return
	}

	// Validate required fields
	if req.ObjectPath == "" || req.UploadID == "" {
		tcc.logger.Error("Missing required fields", zap.String("object_path", req.ObjectPath), zap.String("upload_id", req.UploadID))
		utils.RespondWithError(w, http.StatusBadRequest, "Missing required fields: object_path and upload_id")
		return
	}

	// Set defaults for author info if not provided
	if req.AuthorName == "" {
		req.AuthorName = "Anonymous"
	}
	if req.CollectionMethod == "" {
		req.CollectionMethod = "form"
	}

	tcc.logger.Info("Processing direct upload - immediate response mode",
		zap.String("workspace_id", workspaceID.String()),
		zap.String("upload_id", req.UploadID),
		zap.String("object_path", req.ObjectPath))

	// CRITICAL FIX: Process upload immediately and return success
	// All validation, compression, and AI processing happens in background
	// This ensures user gets immediate feedback that upload is complete
	result, err := tcc.service.ProcessDirectUpload(r.Context(), workspaceID, req.ObjectPath, req.AuthorName, req.AuthorEmail, req.CollectionMethod)
	if err != nil {
		tcc.logger.Error("Failed to process direct upload",
			zap.String("upload_id", req.UploadID),
			zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to process upload. Please try again.")
		return
	}

	tcc.logger.Info("Upload confirmed - processing in background",
		zap.String("upload_id", req.UploadID),
		zap.String("testimonial_id", result.TestimonialID))

	// CRITICAL: Don't return compression_session_id for presigned uploads
	// Background processing (compression, AI) happens asynchronously
	// Frontend should treat this as immediate success
	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":        true,
		"testimonial_id": result.TestimonialID,
		"status":         "uploaded",
		"message":        "Upload successful! Video is being processed in the background.",
	})
}
