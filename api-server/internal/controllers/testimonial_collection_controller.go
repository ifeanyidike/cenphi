// internal/controllers/testimonial_collection_controller.go
package controllers

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/models"
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
	logger                    *zap.Logger
}

func NewTestimonialCollectionController(service services.TestimonialCollectionService, driveService services.DriveService, audioTranscriptionService ai.AudioTranscriptionService, logger *zap.Logger) *TestimonialCollectionController {
	return &TestimonialCollectionController{
		service:                   service,
		driveService:              driveService,
		audioTranscriptionService: audioTranscriptionService,
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
		tcc.handleVideoSubmission(w, r, workspaceID, "webform")
		return
	}

	// Handle text submission (JSON)
	var data models.TestimonialUpload
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}

	data.WorkspaceID = workspaceID
	data.CollectionMethod = "webform"

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
	if (collectionMethod == "widget" || collectionMethod == "webform") && authorData.AuthorName == "" {
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
	var testimonial *models.Testimonial
	requireValidation := r.FormValue("require_voice_validation") == "true"

	if videoMethod == "recorded" && requireValidation {
		testimonial, err = tcc.service.ProcessRecordedVideo(r.Context(), authorData, file, header)
	} else {
		testimonial, err = tcc.service.ProcessUploadedVideo(r.Context(), authorData, file, header)
	}

	if err != nil {
		tcc.logger.Error("Failed to process video testimonial", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

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

	// userID, err := getUserIDFromContext(r) // your existing auth
	userID, err := uuid.Parse("6fe5d4ae-3627-4103-af42-39fb40cc0a12")

	if err != nil {
		utils.RespondWithError(w, http.StatusUnauthorized, "User ID does not exist")
		return
	}
	// account, err := tcc.driveService.GetUserAccount(r.Context(), workspaceID, userID)
	// if err != nil {
	// 	utils.RespondWithError(w, http.StatusUnauthorized, "Google Drive not connected")
	// 	return
	// }

	// REFRESH TOKEN IF NEEDED
	token, err := tcc.driveService.RefreshTokenIfNeeded(r.Context(), workspaceID, userID)
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
