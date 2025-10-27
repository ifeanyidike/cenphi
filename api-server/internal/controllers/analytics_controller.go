package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type AnalyticsController struct {
	logger           *zap.Logger
	analyticsService *services.AnalyticsService
	chatService      *services.ChatWithDataService
	exportService    *services.ExportService
}

func NewAnalyticsController(
	logger *zap.Logger,
	analyticsService *services.AnalyticsService,
	chatService *services.ChatWithDataService,
	exportService *services.ExportService,
) *AnalyticsController {
	return &AnalyticsController{
		logger:           logger,
		analyticsService: analyticsService,
		chatService:      chatService,
		exportService:    exportService,
	}
}

// GetSentimentTimeline handles sentiment timeline requests
func (c *AnalyticsController) GetSentimentTimeline(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Parse query parameters
	workspaceIDStr := r.URL.Query().Get("workspace_id")
	if workspaceIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace_id")
		return
	}

	granularity := r.URL.Query().Get("granularity")
	if granularity == "" {
		granularity = "day"
	}

	// Build filter from query parameters (includes dates and all other filters)
	filter := c.buildFilterFromQuery(r)

	// Get sentiment timeline with filters
	timeline, err := c.analyticsService.GetSentimentTimelineWithFilters(ctx, workspaceID, filter, granularity)
	if err != nil {
		c.logger.Error("Failed to get sentiment timeline", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to generate sentiment timeline")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, timeline)
}

// ComparePeriodsRequest represents the request body for period comparison
type ComparePeriodsRequest struct {
	WorkspaceID       string    `json:"workspace_id"`
	PrimaryFrom       time.Time `json:"primary_from"`
	PrimaryTo         time.Time `json:"primary_to"`
	ComparisonFrom    time.Time `json:"comparison_from"`
	ComparisonTo      time.Time `json:"comparison_to"`
	MinRating         *int      `json:"min_rating,omitempty"`
	MaxRating         *int      `json:"max_rating,omitempty"`
	Types             []string  `json:"types,omitempty"`
	Sentiments        []string  `json:"sentiments,omitempty"`
	CollectionMethods []string  `json:"collection_methods,omitempty"`
	Companies         []string  `json:"companies,omitempty"`
	Tags              []string  `json:"tags,omitempty"`
}

// ComparePeriods handles comparative analysis requests
func (c *AnalyticsController) ComparePeriods(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Parse request body
	var req ComparePeriodsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace_id")
		return
	}

	// Build filter from request
	filter := models.TestimonialFilter{
		MinRating:         req.MinRating,
		MaxRating:         req.MaxRating,
		Types:             req.Types,
		Sentiments:        req.Sentiments,
		CollectionMethods: req.CollectionMethods,
		Companies:         req.Companies,
		Tags:              req.Tags,
	}

	// Get comparative analysis with filters
	result, err := c.analyticsService.GetComparativeAnalysisWithFilters(ctx, workspaceID, req.PrimaryFrom, req.PrimaryTo, req.ComparisonFrom, req.ComparisonTo, filter)
	if err != nil {
		c.logger.Error("Failed to get comparative analysis", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to generate comparative analysis")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, result)
}

// GetWordCloud handles word cloud data requests
func (c *AnalyticsController) GetWordCloud(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	workspaceIDStr := r.URL.Query().Get("workspace_id")
	if workspaceIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace_id")
		return
	}

	// Build filter from query parameters
	filter := c.buildFilterFromQuery(r)

	// Get word cloud data
	wordCloud, err := c.analyticsService.GetWordCloudData(ctx, workspaceID, filter)
	if err != nil {
		c.logger.Error("Failed to get word cloud data", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to generate word cloud")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, wordCloud)
}

// GetFeatureHeatmap handles feature heatmap requests
func (c *AnalyticsController) GetFeatureHeatmap(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	workspaceIDStr := r.URL.Query().Get("workspace_id")
	if workspaceIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace_id")
		return
	}

	// Build filter from query parameters
	filter := c.buildFilterFromQuery(r)

	// Get feature heatmap
	heatmap, err := c.analyticsService.GetFeatureHeatmap(ctx, workspaceID, filter)
	if err != nil {
		c.logger.Error("Failed to get feature heatmap", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to generate feature heatmap")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, heatmap)
}

// buildFilterFromQuery builds a TestimonialFilter from query parameters
func (c *AnalyticsController) buildFilterFromQuery(r *http.Request) models.TestimonialFilter {
	filter := models.TestimonialFilter{}
	query := r.URL.Query()

	// Parse date range
	if fromStr := query.Get("from"); fromStr != "" {
		from, err := time.Parse(time.RFC3339, fromStr)
		if err == nil {
			filter.CreatedAfter = &from
		}
	}

	if toStr := query.Get("to"); toStr != "" {
		to, err := time.Parse(time.RFC3339, toStr)
		if err == nil {
			filter.CreatedBefore = &to
		}
	}

	// Parse rating filter
	if minRatingStr := query.Get("min_rating"); minRatingStr != "" {
		var minRating int
		if _, err := fmt.Sscanf(minRatingStr, "%d", &minRating); err == nil {
			filter.MinRating = &minRating
		}
	}

	if maxRatingStr := query.Get("max_rating"); maxRatingStr != "" {
		var maxRating int
		if _, err := fmt.Sscanf(maxRatingStr, "%d", &maxRating); err == nil {
			filter.MaxRating = &maxRating
		}
	}

	// Parse type filter (can have multiple values)
	if types := query["type"]; len(types) > 0 {
		filter.Types = types
	}

	// Parse sentiment filter (can have multiple values)
	if sentiments := query["sentiment"]; len(sentiments) > 0 {
		filter.Sentiments = sentiments
	}

	// Parse collection method filter (can have multiple values)
	if methods := query["collection_method"]; len(methods) > 0 {
		filter.CollectionMethods = methods
	}

	// Parse companies filter (can have multiple values)
	if companies := query["company"]; len(companies) > 0 {
		filter.Companies = companies
	}

	// Parse tags filter (can have multiple values)
	if tags := query["tag"]; len(tags) > 0 {
		filter.Tags = tags
	}

	return filter
}

// ListSegments handles listing segments for a workspace
func (c *AnalyticsController) ListSegments(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	workspaceIDStr := chi.URLParam(r, "workspaceId")
	if workspaceIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace_id")
		return
	}

	includeInactive := r.URL.Query().Get("include_inactive") == "true"

	// List segments
	segments, err := c.analyticsService.ListSegments(ctx, workspaceID, includeInactive)
	if err != nil {
		c.logger.Error("Failed to list segments", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to list segments")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"segments": segments,
		"count":    len(segments),
	})
}

// GetSegmentAnalysis handles segment analysis requests
func (c *AnalyticsController) GetSegmentAnalysis(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	segmentIDStr := chi.URLParam(r, "segmentId")
	if segmentIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "segment_id is required")
		return
	}

	segmentID, err := uuid.Parse(segmentIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid segment_id")
		return
	}

	// Get segment analysis
	analysis, err := c.analyticsService.GetSegmentAnalysis(ctx, segmentID)
	if err != nil {
		c.logger.Error("Failed to get segment analysis", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to analyze segment")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, analysis)
}

// CreateSegmentRequest represents the request body for creating a segment
type CreateSegmentRequest struct {
	WorkspaceID string       `json:"workspace_id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Color       string       `json:"color"`
	Criteria    models.JSONB `json:"criteria"`
	SegmentType string       `json:"segment_type"`
}

// CreateSegment handles segment creation requests
func (c *AnalyticsController) CreateSegment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	var req CreateSegmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace_id")
		return
	}

	segment := &models.SegmentDefinition{
		WorkspaceID:     workspaceID,
		Name:            req.Name,
		Description:     &req.Description,
		Color:           &req.Color,
		Criteria:        req.Criteria,
		SegmentType:     req.SegmentType,
		IsSystemDefined: false,
		IsActive:        true,
	}

	if err := c.analyticsService.CreateSegmentDefinition(ctx, segment); err != nil {
		c.logger.Error("Failed to create segment", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create segment")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, segment)
}

// CompareSegmentsRequest represents the request body for segment comparison
type CompareSegmentsRequest struct {
	SegmentID1 string `json:"segment_id_1"`
	SegmentID2 string `json:"segment_id_2"`
}

// CompareSegments handles segment comparison requests
func (c *AnalyticsController) CompareSegments(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	var req CompareSegmentsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	segmentID1, err := uuid.Parse(req.SegmentID1)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid segment_id_1")
		return
	}

	segmentID2, err := uuid.Parse(req.SegmentID2)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid segment_id_2")
		return
	}

	// Compare segments
	comparison, err := c.analyticsService.CompareSegments(ctx, segmentID1, segmentID2)
	if err != nil {
		c.logger.Error("Failed to compare segments", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to compare segments")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, comparison)
}

// ExportAnalytics handles analytics export requests
func (c *AnalyticsController) ExportAnalytics(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Validate workspace access
	if _, err := c.chatService.ValidateWorkspaceAccess(ctx); err != nil {
		c.logger.Error("Workspace access validation failed", zap.Error(err))
		utils.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	workspaceIDStr := r.URL.Query().Get("workspace_id")
	if workspaceIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid workspace_id")
		return
	}

	// Build filter from query parameters
	filter := c.buildFilterFromQuery(r)

	// Generate Excel file
	excelFile, err := c.exportService.ExportAnalyticsToExcel(ctx, workspaceID, filter)
	if err != nil {
		c.logger.Error("Failed to export analytics", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to export analytics")
		return
	}

	// Set response headers for file download
	filename := fmt.Sprintf("analytics_export_%s.xlsx", time.Now().Format("2006-01-02_15-04-05"))
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// Write Excel file to response
	if err := excelFile.Write(w); err != nil {
		c.logger.Error("Failed to write Excel file to response", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to write export file")
		return
	}
}
