package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type TestimonialController interface {
	GetTestimonial(w http.ResponseWriter, r *http.Request)
	GetTestimonials(w http.ResponseWriter, r *http.Request)
	UpdateTestimonial(w http.ResponseWriter, r *http.Request)
	DeleteTestimonial(w http.ResponseWriter, r *http.Request)

	// Advanced operations
	SearchTestimonials(w http.ResponseWriter, r *http.Request)
	GetTestimonialStats(w http.ResponseWriter, r *http.Request)
	GetTestimonialsByStatus(w http.ResponseWriter, r *http.Request)
	GetTestimonialsByType(w http.ResponseWriter, r *http.Request)

	// Bulk operations
	// BulkProcessTestimonials(w http.ResponseWriter, r *http.Request)
	BulkUpdateStatus(w http.ResponseWriter, r *http.Request)
	BulkDeleteTestimonials(w http.ResponseWriter, r *http.Request)

	// Analytics
	GetStatusCounts(w http.ResponseWriter, r *http.Request)
	GetTopAuthors(w http.ResponseWriter, r *http.Request)
}

type testimonialController struct {
	service services.TestimonialService
	logger  *zap.Logger
}

func NewTestimonialController(
	service services.TestimonialService,
	logger *zap.Logger,
) TestimonialController {
	return &testimonialController{
		service: service,
		logger:  logger,
	}
}

// Request/Response Types
type CreateTestimonialRequest struct {
	WorkspaceID      string                 `json:"workspace_id" validate:"required"`
	AuthorName       *string                `json:"author_name"`
	AuthorEmail      *string                `json:"author_email"`
	AuthorCompany    *string                `json:"author_company"`
	AuthorTitle      *string                `json:"author_title"`
	Type             string                 `json:"type" validate:"required"`
	Format           string                 `json:"format"`
	Content          *string                `json:"content"`
	MediaURL         *string                `json:"media_url"`
	CollectionMethod string                 `json:"collection_method"`
	Rating           *int                   `json:"rating"`
	Tags             []string               `json:"tags"`
	Metadata         map[string]interface{} `json:"metadata"`
}

type UpdateTestimonialRequest struct {
	AuthorName    *string                `json:"author_name"`
	AuthorEmail   *string                `json:"author_email"`
	AuthorCompany *string                `json:"author_company"`
	AuthorTitle   *string                `json:"author_title"`
	Status        string                 `json:"status"`
	Content       *string                `json:"content"`
	Rating        *int                   `json:"rating"`
	Tags          []string               `json:"tags"`
	Metadata      map[string]interface{} `json:"metadata"`
}

func (c *testimonialController) GetTestimonial(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	testimonial, err := c.service.GetTestimonialByID(r.Context(), id)
	if err != nil {
		c.logger.Error("Failed to get testimonial", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"testimonial": testimonial, "message": "Testimonial retrieved successfully"})
}

func (c *testimonialController) GetTestimonials(w http.ResponseWriter, r *http.Request) {
	// workspaceID := r.Header.Get("X-Workspace-ID")
	// if workspaceID == "" {
	// 	utils.RespondWithError(w, http.StatusBadRequest, "Workspace ID required")
	// 	return
	// }

	// workspaceUUID, err := uuid.Parse(workspaceID)
	// if err != nil {
	// 	utils.RespondWithError(w, http.StatusBadRequest, err.Error())
	// 	return
	// }

	filter := c.parseTestimonialFilter(r)

	testimonials, err := c.service.GetTestimonialsByWorkspace(r.Context(), filter)
	if err != nil {
		c.logger.Error("Failed to get testimonials", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"testimonials": testimonials,
		"total":        len(testimonials),
		"filter":       filter,
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"response": response, "message": "Testimonial retrieved successfully"})
}

func (c *testimonialController) UpdateTestimonial(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	var req UpdateTestimonialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	testimonial, err := c.service.GetTestimonialByID(r.Context(), id)
	if err != nil {
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	c.updateTestimonialFromRequest(testimonial, req)

	err = c.service.UpdateTestimonial(r.Context(), testimonial)
	if err != nil {
		c.logger.Error("Failed to update testimonial", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"testimonial": testimonial, "message": "Testimonial updated successfully"})
}

func (c *testimonialController) DeleteTestimonial(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	err = c.service.DeleteTestimonial(r.Context(), id)
	if err != nil {
		c.logger.Error("Failed to delete testimonial", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, map[string]any{"message": "Testimonial deleted successfully"})
}

func (c *testimonialController) SearchTestimonials(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace_id", workspaceIDStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Search query required")
		return
	}

	filter := c.parseTestimonialFilter(r)

	testimonials, err := c.service.SearchTestimonials(r.Context(), workspaceID, query, filter)
	if err != nil {
		c.logger.Error("Failed to search testimonials", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"query":        query,
		"testimonials": testimonials,
		"total":        len(testimonials),
		"filter":       filter,
	}

	utils.RespondWithJSON(w, http.StatusOK, response)
}

func (c *testimonialController) GetTestimonialStats(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace_id", workspaceIDStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	stats, err := c.service.GetTestimonialStats(r.Context(), workspaceID)
	if err != nil {
		c.logger.Error("Failed to get testimonial stats", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, stats)
}

// Bulk Operations
// func (c *testimonialController) BulkProcessTestimonials(w http.ResponseWriter, r *http.Request) {
// 	var req struct {
// 		TestimonialIDs []string `json:"testimonial_ids" validate:"required"`
// 	}

// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body", err)
// 		return
// 	}

// 	if len(req.TestimonialIDs) == 0 {
// 		utils.RespondWithError(w, http.StatusBadRequest, "No testimonial IDs provided", nil)
// 		return
// 	}

// 	var testimonialIDs []uuid.UUID
// 	for _, idStr := range req.TestimonialIDs {
// 		id, err := uuid.Parse(idStr)
// 		if err != nil {
// 			utils.RespondWithError(w, http.StatusBadRequest, "Invalid testimonial ID: "+idStr, err)
// 			return
// 		}
// 		testimonialIDs = append(testimonialIDs, id)
// 	}

// 	err := c.service.BulkProcessTestimonials(r.Context(), testimonialIDs)
// 	if err != nil {
// 		c.logger.Error("Failed to bulk process testimonials", zap.Error(err))
// 		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to process testimonials", err)
// 		return
// 	}

// 	response := map[string]interface{}{
// 		"message": "Testimonials processing queued successfully",
// 		"count":   len(testimonialIDs),
// 	}

// 	c.respondSuccess(w, http.StatusOK, "Bulk processing initiated", response)
// }

func (c *testimonialController) BulkUpdateStatus(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TestimonialIDs []string `json:"testimonial_ids"`
		Status         string   `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if len(req.TestimonialIDs) == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "No testimonial IDs provided")
		return
	}

	var testimonialIDs []uuid.UUID
	for _, idStr := range req.TestimonialIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid testimonial ID: "+idStr)
			return
		}
		testimonialIDs = append(testimonialIDs, id)
	}

	err := c.service.BulkUpdateStatus(r.Context(), testimonialIDs, req.Status)
	if err != nil {
		c.logger.Error("Failed to bulk update testimonial status", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Testimonials updated successfully",
		"updated_count": len(testimonialIDs),
		"new_status":    req.Status,
	})
}

func (c *testimonialController) BulkDeleteTestimonials(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TestimonialIDs []string `json:"testimonial_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if len(req.TestimonialIDs) == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "No testimonial IDs provided")
		return
	}

	var testimonialIDs []uuid.UUID
	for _, idStr := range req.TestimonialIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "Invalid testimonial ID: "+idStr)
			return
		}
		testimonialIDs = append(testimonialIDs, id)
	}

	err := c.service.BulkDelete(r.Context(), testimonialIDs)
	if err != nil {
		c.logger.Error("Failed to bulk delete testimonials", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Testimonials deleted successfully",
		"deleted_count": len(testimonialIDs),
	})
}

// Analytics Methods
func (c *testimonialController) GetStatusCounts(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace_id", workspaceIDStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	counts, err := c.service.GetStatusCounts(r.Context(), workspaceID)
	if err != nil {
		c.logger.Error("Failed to get status counts", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, counts)
}

func (c *testimonialController) GetTopAuthors(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace_id", workspaceIDStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 10 // default
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	authors, err := c.service.GetTopAuthors(r.Context(), workspaceID, limit)
	if err != nil {
		c.logger.Error("Failed to get top authors", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, authors)
}

// Helper Methods
func (c *testimonialController) parseTestimonialFilter(r *http.Request) models.TestimonialFilter {
	filter := models.TestimonialFilter{}

	if status := r.URL.Query().Get("status"); status != "" {
		filter.Status = status
	}

	if testimonialType := r.URL.Query().Get("type"); testimonialType != "" {
		filter.Type = testimonialType
	}

	if minRatingStr := r.URL.Query().Get("min_rating"); minRatingStr != "" {
		if minRating, err := strconv.Atoi(minRatingStr); err == nil {
			filter.MinRating = &minRating
		}
	}

	if authorEmail := r.URL.Query().Get("author_email"); authorEmail != "" {
		filter.AuthorEmail = authorEmail
	}

	if tagsStr := r.URL.Query().Get("tags"); tagsStr != "" {
		filter.Tags = strings.Split(tagsStr, ",")
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			filter.Limit = limit
		}
	} else {
		filter.Limit = 50
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			filter.Offset = offset
		}
	}

	if sortBy := r.URL.Query().Get("sort_by"); sortBy != "" {
		filter.SortBy = sortBy
	}

	if sortOrder := r.URL.Query().Get("sort_order"); sortOrder != "" {
		filter.SortOrder = sortOrder
	}

	// Date filters
	if createdAfterStr := r.URL.Query().Get("created_after"); createdAfterStr != "" {
		if createdAfter, err := time.Parse(time.RFC3339, createdAfterStr); err == nil {
			filter.CreatedAfter = &createdAfter
		}
	}

	if createdBeforeStr := r.URL.Query().Get("created_before"); createdBeforeStr != "" {
		if createdBefore, err := time.Parse(time.RFC3339, createdBeforeStr); err == nil {
			filter.CreatedBefore = &createdBefore
		}
	}

	return filter
}

func (c *testimonialController) convertCreateRequestToModel(req CreateTestimonialRequest) (*models.Testimonial, error) {
	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return nil, fmt.Errorf("invalid workspace ID: %w", err)
	}

	testimonial := &models.Testimonial{
		ID:               uuid.New(),
		WorkspaceID:      workspaceID,
		AuthorName:       req.AuthorName,
		AuthorEmail:      req.AuthorEmail,
		AuthorCompany:    req.AuthorCompany,
		AuthorTitle:      req.AuthorTitle,
		Type:             req.Type,
		Format:           req.Format,
		Status:           "draft",
		Content:          req.Content,
		MediaURL:         req.MediaURL,
		CollectionMethod: req.CollectionMethod,
		Rating:           req.Rating,
		Tags:             req.Tags,
		ProcessingStatus: "pending",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if req.Metadata != nil {
		testimonial.Metadata = models.JSONMap(req.Metadata)
	}

	return testimonial, nil
}

func (c *testimonialController) updateTestimonialFromRequest(testimonial *models.Testimonial, req UpdateTestimonialRequest) {
	if req.AuthorName != nil {
		testimonial.AuthorName = req.AuthorName
	}
	if req.AuthorEmail != nil {
		testimonial.AuthorEmail = req.AuthorEmail
	}
	if req.AuthorCompany != nil {
		testimonial.AuthorCompany = req.AuthorCompany
	}
	if req.AuthorTitle != nil {
		testimonial.AuthorTitle = req.AuthorTitle
	}
	if req.Status != "" {
		testimonial.Status = req.Status
	}
	if req.Content != nil {
		testimonial.Content = req.Content
	}
	if req.Rating != nil {
		testimonial.Rating = req.Rating
	}
	if req.Tags != nil {
		testimonial.Tags = req.Tags
	}
	if req.Metadata != nil {
		testimonial.Metadata = models.JSONMap(req.Metadata)
	}
}

func (c *testimonialController) GetTestimonialsByStatus(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace_id", workspaceIDStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	status := chi.URLParam(r, "status")
	if status == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Status is required")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 50 // default
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	testimonials, err := c.service.GetTestimonialsByStatus(r.Context(), workspaceID, status, limit)
	if err != nil {
		c.logger.Error("Failed to get testimonials by status", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, testimonials)
}

func (c *testimonialController) GetTestimonialsByType(w http.ResponseWriter, r *http.Request) {
	workspaceIDStr := chi.URLParam(r, "workspaceID")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		c.logger.Error("invalid workspace ID", zap.String("workspace_id", workspaceIDStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace ID")
		return
	}

	testimonialType := chi.URLParam(r, "type")
	if testimonialType == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Type is required")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 50 // default
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	testimonials, err := c.service.GetTestimonialsByType(r.Context(), workspaceID, testimonialType, limit)
	if err != nil {
		c.logger.Error("Failed to get testimonials by type", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, testimonials)
}
