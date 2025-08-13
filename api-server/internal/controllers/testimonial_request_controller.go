// internal/controllers/mailing_controller.go
package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/mailing"
	"github.com/ifeanyidike/cenphi/internal/models"
	"go.uber.org/zap"
)

type TestimonialRequestController struct {
	service mailing.Service
	logger  *zap.Logger
}

func NewTestimonialRequestController(service mailing.Service, logger *zap.Logger) TestimonialRequestController {
	return TestimonialRequestController{
		service: service,
		logger:  logger,
	}
}

// SendSingleEmail sends a testimonial request to a single recipient
func (mc TestimonialRequestController) SendSingleEmail(w http.ResponseWriter, r *http.Request) {
	var req models.SendEmailRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		mc.respondError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	// Basic validation
	if req.WorkspaceID == "" || req.ContactEmail == "" || req.ContactName == "" || req.CompanyName == "" {
		mc.respondError(w, http.StatusBadRequest, "Missing required fields", nil)
		return
	}

	response, err := mc.service.SendTestimonialRequest(r.Context(), req)
	if err != nil {
		mc.logger.Error("Failed to send testimonial request", zap.Error(err))
		mc.respondError(w, http.StatusInternalServerError, "Failed to send email", err)
		return
	}

	mc.respondSuccess(w, http.StatusOK, "Email sent successfully", map[string]interface{}{
		"message_id": response.MessageID,
		"status":     response.Status,
		"sent_at":    response.SentAt,
		"provider":   response.Provider,
	})
}

// SendBulkEmails sends testimonial requests to multiple recipients
func (mc TestimonialRequestController) SendBulkEmails(w http.ResponseWriter, r *http.Request) {
	var req models.BulkEmailRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		mc.respondError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	// Basic validation
	if req.WorkspaceID == "" || len(req.Recipients) == 0 {
		mc.respondError(w, http.StatusBadRequest, "Missing required fields", nil)
		return
	}

	if len(req.Recipients) > 100 { // Limit bulk size
		mc.respondError(w, http.StatusBadRequest, "Too many recipients (max 100)", nil)
		return
	}

	responses, err := mc.service.SendBulkTestimonialRequests(r.Context(), req)
	if err != nil {
		mc.logger.Error("Failed to send bulk emails", zap.Error(err))
		// Still return partial success if some emails were sent
	}

	successCount := len(responses)
	totalCount := len(req.Recipients)

	mc.respondSuccess(w, http.StatusOK, "Bulk email processing completed", map[string]interface{}{
		"total_recipients": totalCount,
		"successful_sends": successCount,
		"failed_sends":     totalCount - successCount,
		"responses":        responses,
	})
}

// GetEmailRequests lists email requests for a workspace
func (mc TestimonialRequestController) GetEmailRequests(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "workspaceID")
	if workspaceID == "" {
		mc.respondError(w, http.StatusBadRequest, "Workspace ID is required", nil)
		return
	}

	// Parse pagination parameters
	limit := 50 // default
	offset := 0 // default

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	requests, err := mc.service.GetEmailRequests(r.Context(), workspaceID, limit, offset)
	if err != nil {
		mc.logger.Error("Failed to get email requests", zap.Error(err))
		mc.respondError(w, http.StatusInternalServerError, "Failed to retrieve email requests", err)
		return
	}

	mc.respondSuccess(w, http.StatusOK, "Email requests retrieved successfully", map[string]interface{}{
		"requests": requests,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetEmailRequest gets a specific email request
func (mc TestimonialRequestController) GetEmailRequest(w http.ResponseWriter, r *http.Request) {
	requestID := chi.URLParam(r, "requestID")
	if requestID == "" {
		mc.respondError(w, http.StatusBadRequest, "Request ID is required", nil)
		return
	}

	request, err := mc.service.GetEmailRequest(r.Context(), requestID)
	if err != nil {
		mc.logger.Error("Failed to get email request", zap.Error(err))
		mc.respondError(w, http.StatusNotFound, "Email request not found", err)
		return
	}

	mc.respondSuccess(w, http.StatusOK, "Email request retrieved successfully", request)
}

// TrackClick handles click tracking from email links
func (mc TestimonialRequestController) TrackClick(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		mc.respondError(w, http.StatusBadRequest, "Tracking token is required", nil)
		return
	}

	err := mc.service.TrackClick(r.Context(), token)
	if err != nil {
		mc.logger.Error("Failed to track click", zap.Error(err))
		// Don't fail the request - just log the error
	}

	// Redirect to the actual collection page or return success
	mc.respondSuccess(w, http.StatusOK, "Click tracked successfully", nil)
}

// TrackResponse handles response tracking when user submits testimonial
func (mc TestimonialRequestController) TrackResponse(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		mc.respondError(w, http.StatusBadRequest, "Tracking token is required", nil)
		return
	}

	err := mc.service.TrackResponse(r.Context(), token)
	if err != nil {
		mc.logger.Error("Failed to track response", zap.Error(err))
		// Don't fail the request - just log the error
	}

	mc.respondSuccess(w, http.StatusOK, "Response tracked successfully", nil)
}

// GetEmailLogs gets logs for a specific email request
func (mc TestimonialRequestController) GetEmailLogs(w http.ResponseWriter, r *http.Request) {
	requestID := chi.URLParam(r, "requestID")
	if requestID == "" {
		mc.respondError(w, http.StatusBadRequest, "Request ID is required", nil)
		return
	}

	logs, err := mc.service.GetEmailLogs(r.Context(), requestID)
	if err != nil {
		mc.logger.Error("Failed to get email logs", zap.Error(err))
		mc.respondError(w, http.StatusInternalServerError, "Failed to retrieve email logs", err)
		return
	}

	mc.respondSuccess(w, http.StatusOK, "Email logs retrieved successfully", logs)
}

// Helper methods
func (mc TestimonialRequestController) respondError(w http.ResponseWriter, statusCode int, message string, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := map[string]interface{}{
		"success": false,
		"message": message,
	}

	if err != nil && statusCode >= 500 {
		mc.logger.Error(message, zap.Error(err))
		// Don't expose internal errors to client
		response["error"] = "Internal server error"
	} else if err != nil {
		response["error"] = err.Error()
	}

	json.NewEncoder(w).Encode(response)
}

func (mc TestimonialRequestController) respondSuccess(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := map[string]interface{}{
		"success": true,
		"message": message,
	}

	if data != nil {
		response["data"] = data
	}

	json.NewEncoder(w).Encode(response)
}
