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

type TestimonialController struct {
	service services.TestimonialService
	logger  *zap.Logger
}

func NewTestimonialController(
	service services.TestimonialService,
	logger *zap.Logger,
) TestimonialController {
	return TestimonialController{
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

func (c TestimonialController) GetTestimonial(w http.ResponseWriter, r *http.Request) {
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

func (c TestimonialController) GetTestimonials(w http.ResponseWriter, r *http.Request) {
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

func (c TestimonialController) UpdateTestimonial(w http.ResponseWriter, r *http.Request) {
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

func (c TestimonialController) DeleteTestimonial(w http.ResponseWriter, r *http.Request) {
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

func (c TestimonialController) SearchTestimonials(w http.ResponseWriter, r *http.Request) {
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

// Bulk Operations
// func (c TestimonialController) BulkProcessTestimonials(w http.ResponseWriter, r *http.Request) {
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

func (c TestimonialController) BulkDeleteTestimonials(w http.ResponseWriter, r *http.Request) {
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

// Helper Methods
func (c TestimonialController) parseTestimonialFilter(r *http.Request) models.TestimonialFilter {
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

func (c TestimonialController) convertCreateRequestToModel(req CreateTestimonialRequest) (*models.Testimonial, error) {
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

func (c TestimonialController) updateTestimonialFromRequest(testimonial *models.Testimonial, req UpdateTestimonialRequest) {
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
