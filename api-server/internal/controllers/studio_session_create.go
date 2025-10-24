package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

// CreateSessionRequest defines the request payload for creating a processing session
type CreateSessionRequest struct {
	TestimonialID  *string                `json:"testimonial_id"` // Optional for multi-testimonial story mode
	WorkspaceID    string                 `json:"workspace_id"`
	PipelineType   string                 `json:"pipeline_type"` // platform_optimization, clipping, story_video
	SelectedStages []string               `json:"selected_stages"`
	AutoProceed    bool                   `json:"auto_proceed"` // If true, process all steps automatically
	Config         map[string]interface{} `json:"config"`       // Pipeline-specific config
}

// CreateSession creates a new processing session with SSE support
func (c StudioController) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.WorkspaceID == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	if req.PipelineType == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "pipeline_type is required")
		return
	}

	// Validate pipeline-specific requirements
	switch req.PipelineType {
	case "platform_optimization", "clipping", "custom_pipeline":
		// These pipelines require a testimonial ID
		if req.TestimonialID == nil || *req.TestimonialID == "" {
			utils.RespondWithError(w, http.StatusBadRequest,
				fmt.Sprintf("%s requires a testimonial_id", req.PipelineType))
			return
		}
	case "story_video":
		// Story video can work with or without testimonial ID (multi-testimonial mode)
		// No validation needed
	default:
		utils.RespondWithError(w, http.StatusBadRequest,
			fmt.Sprintf("invalid pipeline_type: %s", req.PipelineType))
		return
	}

	// Parse workspace ID
	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid workspace_id")
		return
	}

	// Parse testimonial ID if provided
	var testimonialID *uuid.UUID
	if req.TestimonialID != nil && *req.TestimonialID != "" {
		tid, err := uuid.Parse(*req.TestimonialID)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "invalid testimonial_id")
			return
		}
		testimonialID = &tid

		// Validate testimonial exists and has required data
		testimonial, err := c.testimonialRepo.FetchByID(r.Context(), tid, c.db)
		if err != nil {
			c.logger.Error("Testimonial not found",
				zap.String("testimonial_id", tid.String()),
				zap.Error(err))
			utils.RespondWithError(w, http.StatusNotFound, "testimonial not found")
			return
		}

		// Check if testimonial is video type (text testimonials can't be processed)
		if testimonial.Type != "video" {
			utils.RespondWithError(w, http.StatusBadRequest,
				"only video testimonials can be processed in AI studio")
			return
		}

		// Check if video URL exists
		if testimonial.MediaURL == nil || *testimonial.MediaURL == "" {
			utils.RespondWithError(w, http.StatusBadRequest,
				"testimonial has no video URL")
			return
		}

		// Pipeline-specific validation
		if req.PipelineType == "platform_optimization" {
			// Check if transcript exists for captions (if captions step is selected)
			if len(req.SelectedStages) > 0 {
				for _, stage := range req.SelectedStages {
					if stage == "burn_captions" {
						// Check if testimonial has transcript
						if testimonial.Content == nil || *testimonial.Content == "" {
							c.logger.Warn("Testimonial missing transcript for captions",
								zap.String("testimonial_id", tid.String()))
							// Don't block - step will handle this gracefully
						}
					}
				}
			}
		}
	}

	// Create the session using the injected orchestrator (which has handlers registered)
	session, err := c.stepOrchestrator.CreateSession(
		r.Context(),
		testimonialID,
		workspaceID,
		req.PipelineType,
		req.SelectedStages,
		req.AutoProceed,
		req.Config, // BUGFIX #12: Pass user config to orchestrator
	)

	if err != nil {
		c.logger.Error("Failed to create session",
			zap.Error(err),
			zap.String("pipeline_type", req.PipelineType),
			zap.String("workspace_id", req.WorkspaceID),
		)
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	c.logger.Info("Session created successfully",
		zap.String("session_id", session.ID.String()),
		zap.String("pipeline_type", req.PipelineType),
		zap.Bool("auto_proceed", req.AutoProceed),
	)

	// Create session in SSE manager for real-time updates
	// Use the SAME session ID from the database
	// This must happen BEFORE SSE connection so the initial event can include stages
	testimonialIDStr := ""
	if testimonialID != nil {
		testimonialIDStr = testimonialID.String()
	}
	sseSession := c.sseManager.CreateProcessingSessionWithID(
		session.ID.String(),
		testimonialIDStr,
		workspaceID.String(),
		session.SessionType, // Use actual session type from database
		session.AutoProceed, // BUGFIX: Pass auto_proceed setting to SSE manager
	)

	// Read stages from database and populate SSE session
	dbStages, err := c.stageRepo.GetBySessionID(r.Context(), session.ID, c.db)
	if err != nil {
		c.logger.Error("Failed to read stages from database",
			zap.Error(err),
			zap.String("session_id", session.ID.String()))
	} else {
		// Populate SSE session stages from database
		for _, dbStage := range dbStages {
			sseSession.Stages[dbStage.StageID] = &sse.ProcessingStageEvent{
				ID:          dbStage.StageID,
				Name:        dbStage.StageName,
				DisplayName: dbStage.DisplayName,
				Order:       dbStage.StageOrder,
				Status:      string(dbStage.Status),
				Progress:    dbStage.Progress,
				Message:     "",
				StartedAt:   dbStage.StartedAt,
				CompletedAt: dbStage.CompletedAt,
			}
		}
	}

	c.logger.Info("Created SSE session",
		zap.String("sse_session_id", sseSession.ID),
		zap.String("db_session_id", session.ID.String()),
		zap.Int("stages_count", len(sseSession.Stages)))

	// Start execution of the first step in a background goroutine
	// In auto_proceed mode, all steps will run sequentially
	// In step-by-step mode, only the first step runs, then waits for user input
	go func() {
		defer func() {
			if r := recover(); r != nil {
				c.logger.Error("Panic in step execution",
					zap.String("session_id", session.ID.String()),
					zap.Any("panic", r),
				)
			}
		}()

		// Wait for SSE client to connect (max 3 seconds)
		// Frontend needs time to: receive response → mount component → connect SSE
		maxWait := 3 * time.Second
		checkInterval := 100 * time.Millisecond
		waited := time.Duration(0)

		c.logger.Info("Waiting for SSE client to connect",
			zap.String("session_id", session.ID.String()))

		for waited < maxWait {
			if c.sseManager.HasStudioClient(session.ID.String()) {
				c.logger.Info("SSE client connected, starting execution",
					zap.String("session_id", session.ID.String()),
					zap.Duration("waited", waited))
				break
			}
			time.Sleep(checkInterval)
			waited += checkInterval
		}

		if waited >= maxWait {
			c.logger.Warn("Started execution without SSE client connected (timeout)",
				zap.String("session_id", session.ID.String()))
		}

		// Use background context since HTTP request context will be canceled after response
		ctx := context.Background()

		if err := c.stepOrchestrator.ExecuteNextStep(ctx, session.ID); err != nil {
			c.logger.Error("Failed to start execution",
				zap.Error(err),
				zap.String("session_id", session.ID.String()),
			)
		}
	}()

	// Return session details
	utils.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"session_id":    session.ID,
		"pipeline_type": session.SessionType,
		"status":        session.Status,
		"auto_proceed":  session.AutoProceed,
		"created_at":    session.StartedAt,
		"stream_url":    "/studio/sessions/" + session.ID.String() + "/stream",
	})
}
