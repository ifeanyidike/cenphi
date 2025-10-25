package controllers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/ai"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type StudioController struct {
	db                    *sql.DB
	sessionRepo           repositories.ProcessingSessionRepository
	stageRepo             repositories.ProcessingStageRepository
	testimonialRepo       repositories.TestimonialRepository
	workspaceRepo         repositories.WorkspaceRepository
	artifactsRepo         repositories.TestimonialArtifactRepository
	tempStorageService    *storage.TempStorageService
	sessionCleanupService *services.SessionCleanupService
	stepOrchestrator      *ai.StepOrchestrator
	mediaIntelligence     ai.MediaIntelligence
	sseManager            *sse.SSEManager
	logger                *zap.Logger
}

// SelectClipsRequest represents the request to select specific clips
type SelectClipsRequest struct {
	SelectedClipIDs []string `json:"selected_clip_ids"` // Clips to accept (append to existing)
	RejectedClipIDs []string `json:"rejected_clip_ids"` // Clips to reject (remove and delete)
	Action          string   `json:"action"`            // "accept", "reject", "accept_all", "reject_all"
}

func NewStudioController(
	db *sql.DB,
	sessionRepo repositories.ProcessingSessionRepository,
	stageRepo repositories.ProcessingStageRepository,
	testimonialRepo repositories.TestimonialRepository,
	workspaceRepo repositories.WorkspaceRepository,
	artifactsRepo repositories.TestimonialArtifactRepository,
	tempStorageService *storage.TempStorageService,
	sessionCleanupService *services.SessionCleanupService,
	stepOrchestrator *ai.StepOrchestrator,
	mediaIntelligence ai.MediaIntelligence,
	sseManager *sse.SSEManager,
	logger *zap.Logger,
) StudioController {
	return StudioController{
		db:                    db,
		sessionRepo:           sessionRepo,
		stageRepo:             stageRepo,
		testimonialRepo:       testimonialRepo,
		workspaceRepo:         workspaceRepo,
		artifactsRepo:         artifactsRepo,
		tempStorageService:    tempStorageService,
		sessionCleanupService: sessionCleanupService,
		stepOrchestrator:      stepOrchestrator,
		mediaIntelligence:     mediaIntelligence,
		sseManager:            sseManager,
		logger:                logger,
	}
}

// updateSessionActivity updates the last_activity_at timestamp for a session
// This is called on every user interaction (accept, skip, retry) to prevent stale session cleanup
func (c StudioController) updateSessionActivity(ctx context.Context, sessionID uuid.UUID) {
	query := `UPDATE processing_sessions SET last_activity_at = $1 WHERE id = $2`
	if _, err := c.db.ExecContext(ctx, query, time.Now(), sessionID); err != nil {
		c.logger.Warn("Failed to update session activity",
			zap.String("session_id", sessionID.String()),
			zap.Error(err))
	}
}

// StreamStudioEvents establishes SSE connection for a session
func (c StudioController) StreamStudioEvents(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "sessionID")
	if sessionID == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "session_id required")
		return
	}

	// Refresh session and stages from database to handle reconnection
	// This ensures the client gets the latest state even after disconnect/restart
	sessionUUID, err := uuid.Parse(sessionID)
	if err == nil {
		// First, get or create the session in SSEManager
		sseSession := c.sseManager.GetSession(sessionID)
		if sseSession == nil {
			// Session doesn't exist in memory - load from database
			dbSession, err := c.sessionRepo.GetByID(r.Context(), sessionUUID, c.db)
			if err == nil {
				// Create session in SSEManager
				c.logger.Debug("Restoring session from database to SSEManager",
					zap.String("session_id", sessionID))

				// Convert testimonial ID
				var testimonialID string
				if dbSession.TestimonialID != nil {
					testimonialID = dbSession.TestimonialID.String()
				}

				// BUGFIX: Load stages from database BEFORE restoring session to avoid concurrent map writes
				dbStages, stagesErr := c.stageRepo.GetBySessionID(r.Context(), sessionUUID, c.db)
				stagesMap := make(map[string]*sse.ProcessingStageEvent)

				if stagesErr != nil {
					c.logger.Error("Failed to load stages from database",
						zap.Error(stagesErr),
						zap.String("session_id", sessionID))
				}

				if stagesErr == nil {
					for _, dbStage := range dbStages {
						var message string
						if dbStage.Message != nil {
							message = *dbStage.Message
						}

						// Convert models.JSONMap to map[string]interface{}
						metadata := make(map[string]interface{})
						if dbStage.Metadata != nil {
							for k, v := range dbStage.Metadata {
								metadata[k] = v
							}
						}

						stagesMap[dbStage.StageID] = &sse.ProcessingStageEvent{
							ID:          dbStage.StageID,
							Name:        dbStage.StageName,
							DisplayName: dbStage.DisplayName,
							Order:       dbStage.StageOrder,
							Status:      string(dbStage.Status),
							Progress:    dbStage.Progress,
							Message:     message,
							StartedAt:   dbStage.StartedAt,
							CompletedAt: dbStage.CompletedAt,
							Metadata:    metadata,
						}
					}
				}

				sseSession = &sse.ProcessingSession{
					ID:               sessionID,
					TestimonialID:    testimonialID,
					WorkspaceID:      dbSession.WorkspaceID.String(),
					Type:             string(dbSession.SessionType),
					Status:           string(dbSession.Status),
					AutoProceed:      dbSession.AutoProceed, // BUGFIX: Include auto_proceed setting
					Stages:           stagesMap,             // BUGFIX: Populate stages BEFORE exposing to other goroutines
					AcceptedVersions: make(map[string]string),
					StartedAt:        dbSession.StartedAt,
					UpdatedAt:        dbSession.UpdatedAt,
					CompletedAt:      dbSession.CompletedAt,
					Metadata:         make(map[string]interface{}),
				}

				c.logger.Debug("Restored session from database to SSEManager with stages",
					zap.String("session_id", sessionID),
					zap.Int("stages_count", len(stagesMap)))

				// Restore the session to SSEManager (now thread-safe)
				c.sseManager.RestoreSession(sseSession)
			}
		}
	}

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	err = c.sseManager.StreamStudioEvents(r.Context(), w, sessionID)
	if err != nil {
		c.logger.Error("SSE streaming error", zap.Error(err), zap.String("session_id", sessionID))
	}
}

// PauseSession pauses a processing session
func (c StudioController) PauseSession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	type PauseRequest struct {
		PausedByUser bool `json:"paused_by_user"`
	}

	var req PauseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Check session status before attempting to pause
	session := c.sseManager.GetSession(sessionIDStr)
	if session == nil {
		c.logger.Warn("Session not found in memory, skipping pause",
			zap.String("session_id", sessionIDStr))
		utils.RespondWithError(w, http.StatusNotFound, "session not found")
		return
	}

	// Only pause if session is in active state
	if session.Status != "active" {
		c.logger.Debug("Skipping pause - session not active",
			zap.String("session_id", sessionIDStr),
			zap.String("current_status", session.Status))
		// Return success to avoid frontend errors, but don't actually pause
		utils.RespondWithJSON(w, http.StatusOK, map[string]any{
			"message":    "Session already in non-active state",
			"session_id": sessionID,
			"status":     session.Status,
		})
		return
	}

	// Pause in SSE manager (in-memory)
	if err := c.sseManager.PauseSession(sessionIDStr, req.PausedByUser); err != nil {
		c.logger.Error("Failed to pause session in SSE manager", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Persist to database
	if err := c.sessionRepo.Pause(r.Context(), sessionID, req.PausedByUser, c.db); err != nil {
		c.logger.Error("Failed to persist pause to database", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":    "Session paused successfully",
		"session_id": sessionID,
	})
}

// ResumeSession resumes a paused processing session
func (c StudioController) ResumeSession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	type ResumeRequest struct {
		ResumeFromStageID *string `json:"resume_from_stage_id"`
	}

	var req ResumeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Resume in SSE manager (in-memory)
	if err := c.sseManager.ResumeSession(sessionIDStr, req.ResumeFromStageID); err != nil {
		c.logger.Error("Failed to resume session in SSE manager", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Persist to database
	if err := c.sessionRepo.Resume(r.Context(), sessionID, req.ResumeFromStageID, c.db); err != nil {
		c.logger.Error("Failed to persist resume to database", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":    "Session resumed successfully",
		"session_id": sessionID,
	})
}

// SkipStage skips a stage in the processing pipeline
func (c StudioController) SkipStage(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	stageIDStr := chi.URLParam(r, "stageID")

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	type SkipRequest struct {
		SkipReason string `json:"skip_reason"`
	}

	var req SkipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.SkipReason == "" {
		req.SkipReason = "user_manual_skip"
	}

	// Update session activity timestamp (user interaction)
	c.updateSessionActivity(r.Context(), sessionID)

	// Atomically skip stage only if it's in a skippable state
	// Stages can be skipped if they are: pending, processing, or reviewing
	// Cannot skip stages that are already completed or accepted
	allowedStatuses := []string{
		models.StageStatusPending,
		models.StageStatusProcessing,
		models.StageStatusReviewing,
	}

	_, err = c.stageRepo.SkipIfAllowed(r.Context(), c.db, sessionID, stageIDStr, req.SkipReason, allowedStatuses)
	if err != nil {
		if errors.Is(err, repositories.ErrNoRowsUpdated) {
			c.logger.Warn("Stage cannot be skipped (not in skippable state or not found)",
				zap.String("stage_id", stageIDStr),
				zap.Strings("allowed_statuses", allowedStatuses))
			utils.RespondWithError(w, http.StatusBadRequest, "stage cannot be skipped (must be pending, processing, or reviewing)")
			return
		}
		c.logger.Error("Failed to skip stage", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Update SSE manager (in-memory) after successful database update
	if err := c.sseManager.SkipStage(sessionIDStr, stageIDStr, req.SkipReason); err != nil {
		c.logger.Error("Failed to skip stage in SSE manager", zap.Error(err))
		// Continue - database is already updated
	}

	// CRITICAL FIX: After skipping, trigger next stage execution if auto_proceed is enabled
	// Re-fetch session to ensure we have latest state after skip commit
	session, err := c.sessionRepo.GetByID(r.Context(), sessionID, c.db)
	if err != nil {
		c.logger.Error("Failed to get session after skip", zap.Error(err))
	} else if session != nil && session.AutoProceed {
		c.logger.Info("Triggering auto-proceed after skip",
			zap.String("session_id", sessionIDStr),
			zap.String("skipped_stage", stageIDStr),
			zap.Bool("auto_proceed", session.AutoProceed))

		// Run in goroutine to not block the HTTP response
		go func() {
			ctx := context.Background()
			if err := c.stepOrchestrator.CheckAndExecuteNextStage(ctx, session); err != nil {
				c.logger.Error("Failed to execute next stage after skip",
					zap.String("session_id", sessionIDStr),
					zap.Error(err))
			}
		}()
	} else {
		c.logger.Info("Skip completed, but not triggering auto-proceed",
			zap.String("session_id", sessionIDStr),
			zap.Bool("auto_proceed", session != nil && session.AutoProceed),
			zap.Bool("session_exists", session != nil))
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":  "Stage skipped successfully",
		"stage_id": stageIDStr,
	})
}

// RetryStage retries a failed or rejected stage
func (c StudioController) RetryStage(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	stageIDStr := chi.URLParam(r, "stageID")

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	// Update session activity timestamp (user interaction)
	c.updateSessionActivity(r.Context(), sessionID)

	// Atomically retry stage only if it's in a retryable state
	// Stages can be retried if they are: failed, skipped, skipped_auto, cancelled, or processing
	// Cannot retry stages that are already completed or accepted
	_, err = c.stageRepo.RetryIfFailed(r.Context(), c.db, sessionID, stageIDStr)
	if err != nil {
		if errors.Is(err, repositories.ErrNoRowsUpdated) {
			c.logger.Warn("Stage cannot be retried (not in retryable state or not found)",
				zap.String("stage_id", stageIDStr))
			utils.RespondWithError(w, http.StatusBadRequest, "stage cannot be retried (must be failed, skipped, or cancelled)")
			return
		}
		c.logger.Error("Failed to retry stage", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Update SSE manager (in-memory) after successful database update
	if err := c.sseManager.RetryStage(sessionIDStr, stageIDStr); err != nil {
		c.logger.Error("Failed to retry stage in SSE manager", zap.Error(err))
		// Continue - database is already updated
	}

	c.logger.Info("Stage retry initiated, triggering execution",
		zap.String("session_id", sessionIDStr),
		zap.String("stage_id", stageIDStr))

	// Actually trigger execution of the retried stage in background
	go func() {
		defer func() {
			if r := recover(); r != nil {
				c.logger.Error("Panic in retry stage execution",
					zap.String("session_id", sessionIDStr),
					zap.String("stage_id", stageIDStr),
					zap.Any("panic", r),
				)
			}
		}()

		// Use background context since HTTP request context will be canceled after response
		ctx := context.Background()

		// Execute the specific stage that was retried
		if err := c.stepOrchestrator.ExecuteStage(ctx, sessionID, stageIDStr); err != nil {
			c.logger.Error("Failed to execute retried stage",
				zap.Error(err),
				zap.String("session_id", sessionIDStr),
				zap.String("stage_id", stageIDStr),
			)
		}
	}()

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":  "Stage retry initiated successfully",
		"stage_id": stageIDStr,
	})
}
func (c StudioController) AcceptStage(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	stageIDStr := chi.URLParam(r, "stageID")

	c.logger.Info("AcceptStage called",
		zap.String("session_id", sessionIDStr),
		zap.String("stage_id", stageIDStr))

	sessionID, er := uuid.Parse(sessionIDStr)
	if er != nil {
		c.logger.Error("Failed to parse session ID",
			zap.String("session_id_str", sessionIDStr),
			zap.Error(er))
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	// update session activity (independent)
	c.updateSessionActivity(r.Context(), sessionID)

	// Atomic accept using repository method
	maxRetries := 5
	baseDelay := 100 * time.Millisecond

	allowed := []string{models.StageStatusCompleted, models.StageStatusReviewing}
	var updatedStage *models.ProcessingStage
	var lastErr error
	now := time.Now()

	for attempt := range maxRetries {
		if attempt > 0 {
			delay := baseDelay * time.Duration(1<<uint(attempt-1))
			c.logger.Info("Retrying AcceptStage DB update", zap.Int("attempt", attempt), zap.Duration("delay", delay))
			time.Sleep(delay)
		}

		updatedStage, lastErr = c.stageRepo.UpdateStatusIfIn(r.Context(), c.db, sessionID, stageIDStr, models.StageStatusAccepted, &now, allowed)
		if lastErr == nil {
			break
		}
		if errors.Is(lastErr, repositories.ErrNoRowsUpdated) {
			// No rows updated -> not in acceptable state or missing
			c.logger.Warn("Stage cannot be accepted (not in acceptable status or not found)", zap.String("stage_id", stageIDStr))
			utils.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("stage cannot be accepted (must be %s or %s)", allowed[0], allowed[1]))
			return
		}
		// If retryable
		if repositories.IsRetryableDBError(lastErr) && attempt < maxRetries-1 {
			continue
		}
		// else fatal DB error
		c.logger.Error("DB error while accepting stage", zap.Error(lastErr))
		utils.RespondWithError(w, http.StatusInternalServerError, "database error")
		return
	}

	if updatedStage == nil {
		// Should not happen, but guard
		c.logger.Error("AcceptStage failed, updatedStage nil", zap.Error(lastErr))
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to accept stage")
		return
	}

	// SSE + artifact saving + background execution exactly as before
	if err := c.sseManager.AcceptStage(sessionIDStr, stageIDStr); err != nil {
		c.logger.Error("Failed to accept stage in SSE manager", zap.Error(err))
	}

	if stageIDStr == "extract_clips" {
		if err := c.saveClipsArtifact(r.Context(), updatedStage); err != nil {
			c.logger.Error("Failed to save clips artifact", zap.Error(err))
		}
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				c.logger.Error("Panic in accept stage execution", zap.Any("panic", r), zap.String("session_id", sessionIDStr))
			}
		}()
		if err := c.stepOrchestrator.ExecuteNextStep(context.Background(), sessionID); err != nil {
			c.logger.Error("Failed to execute next step after accept", zap.Error(err), zap.String("session_id", sessionIDStr))
		}
	}()

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":  "Stage accepted successfully",
		"stage_id": stageIDStr,
	})
}

// RefreshPreviewURL generates a new presigned URL for a temp artifact
func (c StudioController) RefreshPreviewURL(w http.ResponseWriter, r *http.Request) {
	artifactIDStr := chi.URLParam(r, "artifactID")
	artifactID, err := uuid.Parse(artifactIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid artifact_id")
		return
	}

	previewURL, err := c.tempStorageService.RefreshPresignedURL(r.Context(), artifactID)
	if err != nil {
		c.logger.Error("Failed to refresh presigned URL", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"preview_url": previewURL,
		"artifact_id": artifactID,
	})
}

// GetSessionArtifacts retrieves all temp artifacts for a session
func (c StudioController) GetSessionArtifacts(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	artifacts, err := c.tempStorageService.GetSessionArtifacts(r.Context(), sessionID)
	if err != nil {
		c.logger.Error("Failed to get session artifacts", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"artifacts": artifacts,
		"count":     len(artifacts),
	})
}

// CancelSession cancels a session and triggers cleanup
func (c StudioController) CancelSession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	// Cancel the session in the orchestrator (this will stop any running stages)
	if err := c.stepOrchestrator.CancelSession(r.Context(), sessionID, c.mediaIntelligence); err != nil {
		c.logger.Error("Failed to cancel session", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Cleanup session artifacts
	if err := c.sessionCleanupService.CleanupSession(r.Context(), sessionID); err != nil {
		c.logger.Warn("Failed to cleanup session artifacts (session was cancelled)", zap.Error(err))
		// Don't fail the request - session is already cancelled
	}

	// Cleanup session context
	c.stepOrchestrator.CleanupSessionContext(sessionIDStr)

	c.logger.Info("Session cancelled and cleaned up", zap.String("session_id", sessionID.String()))

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":    "Session cancelled and cleaned up successfully",
		"session_id": sessionID,
	})
}

// FinalizeSession finalizes a processing session by saving/discarding artifacts
func (c StudioController) FinalizeSession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		fmt.Println("Error parsing session ID:", err)
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	var req models.FinalizeSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Println("Error decoding finalize request:", err)
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate action
	validActions := map[string]bool{"save": true, "discard": true, "replace": true}
	if !validActions[req.Action] {
		fmt.Println("Invalid action:", req.Action)
		utils.RespondWithError(w, http.StatusBadRequest, "action must be 'save', 'discard', or 'replace'")
		return
	}

	// Get session from database
	session, err := c.sessionRepo.GetByID(r.Context(), sessionID, c.db)
	if err != nil {
		c.logger.Error("Failed to get session", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "session not found")
		return
	}

	// Get all stages for this session
	stages, err := c.stageRepo.GetBySessionID(r.Context(), sessionID, c.db)
	if err != nil {
		c.logger.Error("Failed to get stages", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var finalArtifactIDs []uuid.UUID
	artifactsCreated := 0

	if req.Action == "save" || req.Action == "replace" {
		// Handle artifact creation based on session type
		if session.SessionType == "clipping" {
			// Clipping sessions - artifact already created by SelectClips
			finalArtifactIDs, artifactsCreated = c.finalizeClippingSession(r.Context(), sessionIDStr, session)
		} else {
			// Standard sessions (platform_optimization, story_video, etc.)
			artifactID, err := c.finalizeStandardSession(r.Context(), &req, session, stages)
			if err != nil {
				utils.RespondWithError(w, http.StatusBadRequest, err.Error())
				return
			}
			if artifactID != uuid.Nil {
				finalArtifactIDs = append(finalArtifactIDs, artifactID)
				artifactsCreated = 1
			}
		}
	}

	// Update session status and trigger cleanup
	c.updateSessionStatusAndCleanup(r.Context(), sessionIDStr, sessionID, session, req.Action, artifactsCreated)

	// Send finalization event via SSE
	c.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "session_finalized",
		SessionID: sessionIDStr,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"action":            req.Action,
			"artifacts_created": artifactsCreated,
		},
	})

	// Cleanup session context after finalization
	c.stepOrchestrator.CleanupSessionContext(sessionIDStr)

	response := models.FinalizeSessionResponse{
		SessionID:        sessionID,
		Action:           req.Action,
		ArtifactsCreated: artifactsCreated,
		FinalArtifactIDs: finalArtifactIDs,
		Message:          fmt.Sprintf("Session %s successfully", req.Action),
		FinalizedAt:      time.Now(),
	}

	utils.RespondWithJSON(w, http.StatusOK, response)
}

// finalizeClippingSession handles finalization for clipping sessions
// Clips artifact was created during SelectClips, but we need to move accepted clips from temp to permanent storage
func (c StudioController) finalizeClippingSession(ctx context.Context, sessionIDStr string, session *models.ProcessingSession) ([]uuid.UUID, int) {
	c.logger.Info("🔍 [FINALIZE] Clipping session - moving accepted clips from temp to permanent storage",
		zap.String("session_id", sessionIDStr),
		zap.String("session_type", session.SessionType))

	var finalArtifactIDs []uuid.UUID
	artifactsCreated := 0

	// Find any existing clipping artifacts for this session
	artifacts, err := c.artifactsRepo.GetByTestimonialID(ctx, *session.TestimonialID, c.db)
	if err != nil {
		c.logger.Error("Failed to get testimonial artifacts", zap.Error(err))
		return finalArtifactIDs, artifactsCreated
	}

	for i := range artifacts {
		a := &artifacts[i]

		// Check for last_session_id in ProcessingMetadata or Data field
		if a.ProcessingType == "clipping" {
			var isMatchingSession bool

			// Check ProcessingMetadata for last_session_id
			if a.ProcessingMetadata != nil {
				if lastSessID, ok := a.ProcessingMetadata["last_session_id"].(string); ok {
					isMatchingSession = (lastSessID == sessionIDStr)
				}
			}

			// Fallback: Check Data field for last_session_id
			if !isMatchingSession && a.Data != nil {
				if lastSessID, ok := a.Data["last_session_id"].(string); ok {
					isMatchingSession = (lastSessID == sessionIDStr)
				}
			}

			if isMatchingSession {
				c.logger.Info("Found clip artifact for session",
					zap.String("artifact_id", a.ID.String()),
					zap.String("result_category", a.ResultCategory))

				// Move accepted clips from temp storage to permanent storage
				if err := c.moveClipsToPermanentStorage(ctx, a, session); err != nil {
					c.logger.Error("Failed to move clips to permanent storage",
						zap.Error(err),
						zap.String("artifact_id", a.ID.String()))
					// Don't fail the entire finalization - partial save is better than nothing
				} else {
					finalArtifactIDs = append(finalArtifactIDs, a.ID)
					artifactsCreated++
				}
			}
		}
	}

	return finalArtifactIDs, artifactsCreated
}

// moveClipsToPermanentStorage moves accepted clips from temp storage to permanent storage
func (c StudioController) moveClipsToPermanentStorage(ctx context.Context, artifact *models.TestimonialArtifact, session *models.ProcessingSession) error {
	if artifact.Data == nil {
		return fmt.Errorf("artifact has no data")
	}

	// Get generated clips from artifact data
	generatedClips, ok := artifact.Data["generated_clips"]
	if !ok {
		c.logger.Warn("Artifact has no generated_clips field",
			zap.String("artifact_id", artifact.ID.String()))
		return nil // Not an error - might be empty selection
	}

	// BUGFIX: Handle both []interface{} and []map[string]interface{} types
	// After JSON serialization, the type can be either depending on how it was stored
	var clipsArray []interface{}
	switch v := generatedClips.(type) {
	case []interface{}:
		clipsArray = v
	case []map[string]interface{}:
		// Convert []map[string]interface{} to []interface{}
		clipsArray = make([]interface{}, len(v))
		for i, clip := range v {
			clipsArray[i] = clip
		}
	default:
		// Try to deserialize via JSON as last resort
		clipsJSON, err := json.Marshal(generatedClips)
		if err != nil {
			return fmt.Errorf("generated_clips is not an array (type: %T)", generatedClips)
		}
		if err := json.Unmarshal(clipsJSON, &clipsArray); err != nil {
			return fmt.Errorf("failed to deserialize generated_clips: %w", err)
		}
	}

	if len(clipsArray) == 0 {
		c.logger.Info("No clips to move (user may have rejected all clips)",
			zap.String("artifact_id", artifact.ID.String()))
		return nil
	}

	c.logger.Info("Moving clips from temp to permanent storage",
		zap.Int("clips_count", len(clipsArray)),
		zap.String("artifact_id", artifact.ID.String()))

	updatedClips := make([]interface{}, 0, len(clipsArray))
	movedCount := 0
	skipCount := 0

	for _, clipInterface := range clipsArray {
		clipMap, ok := clipInterface.(map[string]interface{})
		if !ok {
			c.logger.Warn("Clip is not a map, skipping")
			continue
		}

		// Get clip URL
		clipURL, ok := clipMap["url"].(string)
		if !ok || clipURL == "" {
			c.logger.Warn("Clip has no URL, skipping",
				zap.Any("clip_id", clipMap["id"]))
			updatedClips = append(updatedClips, clipInterface)
			skipCount++
			continue
		}

		// Check if URL is already in permanent storage (not temp)
		if !strings.Contains(clipURL, "/temp/") {
			c.logger.Info("Clip already in permanent storage, skipping",
				zap.String("url", clipURL))
			updatedClips = append(updatedClips, clipInterface)
			skipCount++
			continue
		}

		// Move from temp to permanent storage
		var baseID uuid.UUID
		if session.TestimonialID != nil {
			baseID = *session.TestimonialID
		} else {
			baseID = session.WorkspaceID
		}

		// CRITICAL FIX: Pass clip_id as unique identifier to prevent overwriting
		clipID := ""
		if id, ok := clipMap["id"].(string); ok {
			clipID = id
		}

		permanentURL, err := c.tempStorageService.CopyToPermanentStorage(ctx, clipURL, baseID, clipID)
		if err != nil {
			c.logger.Error("Failed to copy clip to permanent storage",
				zap.String("temp_url", clipURL),
				zap.String("clip_id", clipID),
				zap.Error(err))
			// Keep the temp URL - better than losing the clip entirely
			updatedClips = append(updatedClips, clipInterface)
			continue
		}

		// Update clip URL to permanent location
		clipMap["url"] = permanentURL
		updatedClips = append(updatedClips, clipMap)
		movedCount++

		c.logger.Info("✅ Moved clip to permanent storage",
			zap.String("clip_id", clipID),
			zap.String("temp_url", clipURL),
			zap.String("permanent_url", permanentURL))
	}

	c.logger.Info("Finished moving clips to permanent storage",
		zap.Int("total_clips", len(clipsArray)),
		zap.Int("moved", movedCount),
		zap.Int("skipped", skipCount))

	// Update artifact with new permanent URLs
	artifact.Data["generated_clips"] = updatedClips
	artifact.Data["permanent_storage"] = true
	artifact.Data["moved_to_permanent_at"] = time.Now().Format(time.RFC3339)

	if err := c.artifactsRepo.Update(ctx, artifact, c.db); err != nil {
		return fmt.Errorf("failed to update artifact with permanent URLs: %w", err)
	}

	c.logger.Info("✅ Updated artifact with permanent clip URLs",
		zap.String("artifact_id", artifact.ID.String()),
		zap.Int("clips_count", len(updatedClips)))

	return nil
}

// finalizeStandardSession handles finalization for standard sessions (platform_optimization, story_video, etc.)
func (c StudioController) finalizeStandardSession(ctx context.Context, req *models.FinalizeSessionRequest, session *models.ProcessingSession, stages []*models.ProcessingStage) (uuid.UUID, error) {
	// Find the final stage to save
	finalStage, err := c.findFinalStage(stages)
	if err != nil {
		return uuid.Nil, err
	}

	// Auto-accept if status is reviewing
	if finalStage.Status == models.StageStatusReviewing {
		finalStage.Status = models.StageStatusAccepted
		now := time.Now()
		finalStage.CompletedAt = &now
		if err := c.stageRepo.Update(ctx, finalStage, c.db); err != nil {
			c.logger.Warn("Failed to update reviewing stage to accepted",
				zap.Error(err),
				zap.String("stage_id", finalStage.StageID))
		}
	}

	c.logger.Info("🔍 [FINALIZE] Processing FINAL stage only",
		zap.String("stage_id", finalStage.StageID),
		zap.String("session_id", session.ID.String()))

	// Resolve artifact URL and copy to permanent storage if needed
	artifactURL, err := c.resolveAndCopyArtifactURL(ctx, session, stages, finalStage)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to resolve artifact URL: %w", err)
	}

	// Create and save the artifact
	artifactID, err := c.createArtifactFromStage(ctx, req, session, finalStage, artifactURL)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to create artifact: %w", err)
	}

	// If replace action, update testimonial's media_url
	if req.Action == "replace" && session.TestimonialID != nil && artifactID != uuid.Nil {
		c.replaceTestimonialMediaURL(ctx, session, artifactID)
	}

	return artifactID, nil
}

// findFinalStage finds the last completed/accepted/reviewing stage that has an artifact
func (c StudioController) findFinalStage(stages []*models.ProcessingStage) (*models.ProcessingStage, error) {
	for i := len(stages) - 1; i >= 0; i-- {
		stage := stages[i]
		if stage.Status == models.StageStatusCompleted ||
			stage.Status == models.StageStatusAccepted ||
			stage.Status == models.StageStatusReviewing {
			// Check if stage has artifact (Message or text content)
			hasMessage := stage.Message != nil && *stage.Message != ""
			hasTextContent := stage.Metadata != nil && stage.Metadata["optimized_text"] != nil

			if hasMessage || hasTextContent {
				return stage, nil
			}
		}
	}
	return nil, fmt.Errorf("no completed final stage to save")
}

// resolveAndCopyArtifactURL resolves the artifact URL and copies temp files to permanent storage
func (c StudioController) resolveAndCopyArtifactURL(ctx context.Context, session *models.ProcessingSession, stages []*models.ProcessingStage, finalStage *models.ProcessingStage) (string, error) {
	var artifactURL string
	var videoStage *models.ProcessingStage

	// SPECIAL CASE: If final stage is text optimization or has no video artifact,
	// we need to find the previous video stage for the artifact URL
	if finalStage.StageID == "optimize_text" || finalStage.Message == nil || *finalStage.Message == "" {
		// Find the last video stage before the text optimization stage
		for i := len(stages) - 1; i >= 0; i-- {
			stage := stages[i]
			if stage.Message != nil && *stage.Message != "" &&
				(stage.Status == models.StageStatusCompleted || stage.Status == models.StageStatusAccepted || stage.Status == models.StageStatusReviewing) {
				videoStage = stage
				break
			}
		}
	}

	// Get artifact URL from video stage or final stage
	if videoStage != nil && videoStage.Message != nil && *videoStage.Message != "" {
		artifactURL = *videoStage.Message
	} else if finalStage.Message != nil && *finalStage.Message != "" {
		artifactURL = *finalStage.Message

		// Copy temp file to permanent storage
		if strings.Contains(artifactURL, "/temp/") {
			// Use testimonial_id or workspace_id as base path
			var baseID uuid.UUID
			if session.TestimonialID != nil {
				baseID = *session.TestimonialID
			} else {
				baseID = session.WorkspaceID
			}

			permanentURL, err := c.tempStorageService.CopyToPermanentStorage(ctx, artifactURL, baseID)
			if err != nil {
				return "", fmt.Errorf("failed to copy final artifact to permanent storage: %w", err)
			}
			artifactURL = permanentURL
			c.logger.Info("✅ [FINALIZE] Successfully copied to permanent storage",
				zap.String("stage_id", finalStage.StageID),
				zap.String("permanent_url", permanentURL))
		}
	}

	return artifactURL, nil
}

// createArtifactFromStage creates a testimonial artifact from the final stage
func (c StudioController) createArtifactFromStage(ctx context.Context, req *models.FinalizeSessionRequest, session *models.ProcessingSession, finalStage *models.ProcessingStage, artifactURL string) (uuid.UUID, error) {
	// Extract text content - prioritize frontend-provided text over stage metadata
	var textContent *string
	if req.OptimizedText != nil && *req.OptimizedText != "" {
		textContent = req.OptimizedText
		c.logger.Info("✅ [FINALIZE] Using optimized text from frontend request",
			zap.Int("text_length", len(*textContent)))
	}

	// Prepare processing metadata
	processingMetadata := models.JSONMap{
		"session_type":     session.SessionType,
		"session_id":       session.ID.String(),
		"final_stage_id":   finalStage.StageID,
		"final_stage_name": finalStage.StageName,
		"stages_count":     len([]*models.ProcessingStage{}), // Would need to pass this from caller
		"finalized_at":     time.Now().Format(time.RFC3339),
	}

	// Add user-provided metadata
	if req.ArtifactMetadata != nil {
		for k, v := range req.ArtifactMetadata {
			processingMetadata[k] = v
		}
	}

	// Add text optimization metadata if available
	if textContent != nil && finalStage.Metadata != nil {
		if hashtags, ok := finalStage.Metadata["hashtags"]; ok {
			processingMetadata["hashtags"] = hashtags
		}
		if platform, ok := finalStage.Metadata["platform"]; ok {
			processingMetadata["platform"] = platform
		}
		if optimalTiming, ok := finalStage.Metadata["optimal_timing"]; ok {
			processingMetadata["optimal_timing"] = optimalTiming
		}
		if specs, ok := finalStage.Metadata["specifications"]; ok {
			processingMetadata["specifications"] = specs
		}
	}

	// Determine correct processing type
	processingType := session.SessionType
	switch processingType {
	case "platform_optimization":
		processingType = "video_platform_optimization"
	case "story_video":
		processingType = "story_mode_generation"
	case "clipping":
		// clipping stays as "clipping"
	default:
		c.logger.Warn("Unknown session type, using as-is for processing_type",
			zap.String("session_type", session.SessionType))
	}

	// Determine result category and content type
	timestamp := time.Now().Unix()
	resultCategory := fmt.Sprintf("content_%d", timestamp)

	// For story videos, use story_<timestamp> pattern
	if processingType == "story_mode_generation" {
		resultCategory = fmt.Sprintf("story_%d", timestamp)
	}

	contentType := "video/mp4"
	var assetURLPtr *string

	if artifactURL != "" {
		assetURLPtr = &artifactURL
	}

	// If this is text-only optimization (no video artifact)
	if textContent != nil && artifactURL == "" {
		resultCategory = "text_optimization"
		contentType = "text/plain"
	}

	// Populate Data field with all relevant stage metadata
	dataField := models.JSONMap{}
	if finalStage.Metadata != nil {
		for k, v := range finalStage.Metadata {
			dataField[k] = v
		}
	}

	// Extract text_content from dataField if not provided by frontend
	if textContent == nil {
		if optimizedText, ok := dataField["optimized_text"].(string); ok && optimizedText != "" {
			textContent = &optimizedText
			c.logger.Info("✅ [FINALIZE] Extracted text_content from stage metadata dataField",
				zap.Int("text_length", len(optimizedText)),
				zap.String("stage_id", finalStage.StageID))
		}
	}

	// Add stage-specific information
	dataField["stage_id"] = finalStage.StageID
	dataField["stage_name"] = finalStage.StageName
	dataField["asset_url"] = assetURLPtr
	dataField["text_content"] = textContent

	artifact := &models.TestimonialArtifact{
		TestimonialID:      session.TestimonialID,
		WorkspaceID:        session.WorkspaceID,
		ProcessingType:     processingType,
		ResultCategory:     resultCategory,
		AssetURL:           assetURLPtr,
		TextContent:        textContent,
		Data:               dataField,
		ContentType:        contentType,
		IsUserSaved:        true,
		IsStreamed:         false,
		ProcessingMetadata: processingMetadata,
	}

	logFields := []zap.Field{
		zap.String("stage_id", finalStage.StageID),
		zap.String("workspace_id", session.WorkspaceID.String()),
		zap.String("processing_type", processingType),
		zap.String("result_category", resultCategory),
		zap.String("content_type", contentType),
		zap.Bool("has_asset_url", assetURLPtr != nil),
	}
	if session.TestimonialID != nil {
		logFields = append(logFields, zap.String("testimonial_id", session.TestimonialID.String()))
	}
	c.logger.Info("🔍 [FINALIZE] About to call artifactsRepo.Create", logFields...)

	if err := c.artifactsRepo.Create(ctx, artifact, c.db); err != nil {
		errorLogFields := []zap.Field{
			zap.Error(err),
			zap.String("stage_id", finalStage.StageID),
		}
		if session.TestimonialID != nil {
			errorLogFields = append(errorLogFields, zap.String("testimonial_id", session.TestimonialID.String()))
		}
		c.logger.Error("🚨 [FINALIZE] Failed to create artifact in database", errorLogFields...)
		return uuid.Nil, fmt.Errorf("failed to save final artifact")
	}

	c.logger.Info("✅ [FINALIZE] Successfully created artifact in database",
		zap.String("artifact_id", artifact.ID.String()),
		zap.String("stage_id", finalStage.StageID),
		zap.String("artifact_url", artifactURL),
		zap.Bool("has_text_content", textContent != nil))

	return artifact.ID, nil
}

// replaceTestimonialMediaURL updates the testimonial's media_url with the artifact URL
func (c StudioController) replaceTestimonialMediaURL(ctx context.Context, session *models.ProcessingSession, artifactID uuid.UUID) {
	lastArtifact, err := c.artifactsRepo.GetByID(ctx, artifactID, c.db)
	if err == nil && lastArtifact.AssetURL != nil {
		testimonial, err := c.testimonialRepo.FetchByID(ctx, *session.TestimonialID, c.db)
		if err == nil {
			testimonial.MediaURL = lastArtifact.AssetURL
			if err := c.testimonialRepo.Update(ctx, testimonial, *session.TestimonialID, c.db); err != nil {
				c.logger.Error("Failed to update testimonial media URL", zap.Error(err))
			} else {
				c.logger.Info("Replaced testimonial media URL",
					zap.String("testimonial_id", session.TestimonialID.String()),
					zap.String("new_url", *lastArtifact.AssetURL))
			}
		}
	}
}

// updateSessionStatusAndCleanup updates session status and triggers cleanup based on action
func (c StudioController) updateSessionStatusAndCleanup(ctx context.Context, sessionIDStr string, sessionID uuid.UUID, session *models.ProcessingSession, action string, artifactsCreated int) {
	// Update session status to completed/discarded
	if action == "discard" {
		session.Status = models.SessionStatusCancelled
	} else {
		session.Status = models.SessionStatusCompleted
	}
	now := time.Now()
	session.CompletedAt = &now

	if err := c.sessionRepo.Update(ctx, session, c.db); err != nil {
		c.logger.Error("Failed to update session status", zap.Error(err))
		// Continue - artifacts are saved
	}

	// Cleanup temp artifacts based on action
	switch action {
	case "discard":
		// User explicitly discarded - cleanup everything immediately
		c.logger.Info("🗑️ Discarding session - deleting all temp artifacts",
			zap.String("session_id", sessionIDStr))

		go func() {
			if err := c.sessionCleanupService.CleanupSessionCompletely(context.Background(), sessionID); err != nil {
				c.logger.Error("Failed to cleanup discarded session",
					zap.String("session_id", sessionIDStr),
					zap.Error(err))
			} else {
				c.logger.Info("✅ All temp artifacts deleted after discard",
					zap.String("session_id", sessionIDStr))
			}
		}()

	case "save", "replace":
		// Artifacts have been copied to permanent storage
		// Clean up ALL temp files after a short delay
		c.logger.Info("💾 Finalizing session - temp files will be cleaned up",
			zap.String("session_id", sessionIDStr),
			zap.String("action", action),
			zap.Int("artifacts_saved", artifactsCreated))

		go func() {
			// Give 5 seconds to ensure all permanent storage copies complete
			time.Sleep(5 * time.Second)

			if err := c.sessionCleanupService.CleanupSessionAfterSave(context.Background(), sessionID); err != nil {
				c.logger.Error("Failed to cleanup temp artifacts after save",
					zap.String("session_id", sessionIDStr),
					zap.Error(err))
			} else {
				c.logger.Info("✅ Cleaned up all temp artifacts after successful save",
					zap.String("session_id", sessionIDStr),
					zap.Int("artifacts_saved", artifactsCreated))
			}
		}()
	}
}

// GetActiveSessions retrieves active/processing sessions for a testimonial or workspace
func (c StudioController) GetActiveSessions(w http.ResponseWriter, r *http.Request) {
	testimonialIDStr := r.URL.Query().Get("testimonial_id")
	workspaceIDStr := r.URL.Query().Get("workspace_id")

	if testimonialIDStr == "" && workspaceIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "either testimonial_id or workspace_id is required")
		return
	}

	var sessions []map[string]interface{}

	if testimonialIDStr != "" {
		testimonialID, err := uuid.Parse(testimonialIDStr)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "invalid testimonial_id")
			return
		}

		c.logger.Info("Getting active sessions for testimonial",
			zap.String("testimonial_id", testimonialIDStr))

		dbSessions, err := c.sessionRepo.GetActiveByTestimonialID(r.Context(), testimonialID, c.db)
		if err != nil {
			c.logger.Error("Failed to get active sessions by testimonial", zap.Error(err))
			utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
			return
		}

		c.logger.Info("Found active sessions",
			zap.Int("count", len(dbSessions)),
			zap.String("testimonial_id", testimonialIDStr))

		for _, session := range dbSessions {
			c.logger.Info("Active session details",
				zap.String("session_id", session.ID.String()),
				zap.String("session_type", session.SessionType),
				zap.String("status", session.Status),
				zap.Bool("auto_proceed", session.AutoProceed))

			sessions = append(sessions, map[string]interface{}{
				"session_id":     session.ID,
				"testimonial_id": session.TestimonialID,
				"workspace_id":   session.WorkspaceID,
				"session_type":   session.SessionType,
				"status":         session.Status,
				"auto_proceed":   session.AutoProceed,
				"started_at":     session.StartedAt,
				"stream_url":     "/studio/sessions/" + session.ID.String() + "/stream",
			})
		}
	} else if workspaceIDStr != "" {
		workspaceID, err := uuid.Parse(workspaceIDStr)
		if err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "invalid workspace_id")
			return
		}

		dbSessions, err := c.sessionRepo.GetActiveByWorkspaceID(r.Context(), workspaceID, c.db)
		if err != nil {
			c.logger.Error("Failed to get active sessions by workspace", zap.Error(err))
			utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
			return
		}

		for _, session := range dbSessions {
			sessions = append(sessions, map[string]interface{}{
				"session_id":     session.ID,
				"testimonial_id": session.TestimonialID,
				"workspace_id":   session.WorkspaceID,
				"session_type":   session.SessionType,
				"status":         session.Status,
				"auto_proceed":   session.AutoProceed,
				"started_at":     session.StartedAt,
				"stream_url":     "/studio/sessions/" + session.ID.String() + "/stream",
			})
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"sessions": sessions,
		"count":    len(sessions),
	})
}

// SelectClips allows user to select which clips to keep from the clipping stage
func (sc *StudioController) SelectClips(w http.ResponseWriter, r *http.Request) {
	sessionID := chi.URLParam(r, "sessionID")
	stageID := chi.URLParam(r, "stageID")

	if sessionID == "" || stageID == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Session ID and Stage ID are required")
		return
	}

	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid session ID format")
		return
	}

	// Parse request body
	var req SelectClipsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Allow empty selection (user rejecting all clips)

	ctx := r.Context()

	// Get the stage
	stage, err := sc.stageRepo.GetBySessionAndStageID(ctx, sessionUUID, stageID, sc.db)
	if err != nil {
		sc.logger.Error("Failed to get stage", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get stage")
		return
	}

	if stage == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Stage not found")
		return
	}

	// Get all clips from metadata
	allClips, ok := stage.Metadata["clips"].([]interface{})
	if !ok {
		sc.logger.Error("Stage metadata does not contain clips",
			zap.String("stage_id", stageID))
		utils.RespondWithError(w, http.StatusBadRequest, "Stage does not contain clips")
		return
	}

	// Initialize metadata if needed
	if stage.Metadata == nil {
		stage.Metadata = make(map[string]interface{})
	}

	// Get existing accepted clips (accumulated from previous accepts)
	var existingAccepted []map[string]interface{}
	if existing, ok := stage.Metadata["accepted_clips"].([]interface{}); ok {
		for _, item := range existing {
			if clipMap, ok := item.(map[string]interface{}); ok {
				existingAccepted = append(existingAccepted, clipMap)
			}
		}
	}

	// Build a map of all clips by ID for easy lookup
	allClipsMap := make(map[string]map[string]interface{})
	for _, clipData := range allClips {
		if clipMap, ok := clipData.(map[string]interface{}); ok {
			if clipID, ok := clipMap["id"].(string); ok {
				allClipsMap[clipID] = clipMap
			}
		}
	}

	// Handle different actions
	var acceptedClips []map[string]interface{}
	var rejectedClips []map[string]interface{}
	var clipURLsToDelete []string

	switch req.Action {
	case "accept":
		// Start with existing accepted clips
		acceptedClips = existingAccepted

		// Append newly selected clips (avoiding duplicates)
		existingIDs := make(map[string]bool)
		for _, clip := range existingAccepted {
			if id, ok := clip["id"].(string); ok {
				existingIDs[id] = true
			}
		}

		for _, selectedID := range req.SelectedClipIDs {
			if !existingIDs[selectedID] {
				if clip, exists := allClipsMap[selectedID]; exists {
					acceptedClips = append(acceptedClips, clip)
					existingIDs[selectedID] = true
				}
			}
		}

	case "accept_all":
		// Accept all clips from the current stage
		acceptedClips = make([]map[string]interface{}, 0, len(allClipsMap))
		for _, clip := range allClipsMap {
			acceptedClips = append(acceptedClips, clip)
		}

	case "reject":
		// Keep existing accepted clips but remove the rejected ones
		rejectedIDsMap := make(map[string]bool)
		for _, rejID := range req.RejectedClipIDs {
			rejectedIDsMap[rejID] = true
		}

		// Filter out rejected clips from accepted clips
		for _, clip := range existingAccepted {
			if id, ok := clip["id"].(string); ok {
				if !rejectedIDsMap[id] {
					acceptedClips = append(acceptedClips, clip)
				} else {
					// Add to rejected list for deletion
					rejectedClips = append(rejectedClips, clip)
					// Extract URL for deletion
					if url, ok := clip["url"].(string); ok {
						clipURLsToDelete = append(clipURLsToDelete, url)
					}
				}
			}
		}

		// Also remove from all clips metadata
		filteredAllClips := make([]interface{}, 0)
		for _, clipData := range allClips {
			if clipMap, ok := clipData.(map[string]interface{}); ok {
				if id, ok := clipMap["id"].(string); ok {
					if !rejectedIDsMap[id] {
						filteredAllClips = append(filteredAllClips, clipData)
					}
				}
			}
		}
		allClips = filteredAllClips

	case "reject_all":
		// Reject all clips - collect URLs for deletion
		for _, clip := range allClipsMap {
			rejectedClips = append(rejectedClips, clip)
			if url, ok := clip["url"].(string); ok {
				clipURLsToDelete = append(clipURLsToDelete, url)
			}
		}
		acceptedClips = []map[string]interface{}{} // Empty
		allClips = []interface{}{}                 // Clear all clips

	default:
		// If no action specified, treat as legacy behavior (replace with selected)
		for _, selectedID := range req.SelectedClipIDs {
			if clip, exists := allClipsMap[selectedID]; exists {
				acceptedClips = append(acceptedClips, clip)
			}
		}
	}

	// Delete rejected clips from storage
	if len(clipURLsToDelete) > 0 {
		sc.logger.Info("Deleting rejected clips from storage",
			zap.Int("count", len(clipURLsToDelete)))

		for _, url := range clipURLsToDelete {
			// Extract storage path from URL
			// Assuming URL format: https://storage.../workspace_id/testimonials/...
			// We need to extract the path after the bucket name
			if err := sc.deleteClipFromStorage(ctx, url); err != nil {
				sc.logger.Error("Failed to delete clip from storage",
					zap.String("url", url),
					zap.Error(err))
				// Continue with other deletions even if one fails
			}
		}
	}

	// Update stage metadata
	// Convert []map[string]interface{} to []interface{} for consistent type handling
	acceptedClipsInterface := make([]interface{}, len(acceptedClips))
	for i, clip := range acceptedClips {
		acceptedClipsInterface[i] = clip
	}

	stage.Metadata["accepted_clips"] = acceptedClipsInterface
	stage.Metadata["accepted_count"] = len(acceptedClips)
	stage.Metadata["rejected_count"] = len(rejectedClips)
	stage.Metadata["clips"] = allClips
	stage.Metadata["total_clips"] = len(allClips)

	// Update stage in database
	if err := sc.stageRepo.Update(ctx, stage, sc.db); err != nil {
		sc.logger.Error("Failed to update stage metadata", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to save clip selection")
		return
	}

	// Update the artifact with selected clips
	if err := sc.saveClipsArtifact(ctx, stage); err != nil {
		sc.logger.Error("Failed to update clips artifact", zap.Error(err))
		// Continue anyway - selection is saved in stage metadata
	}

	sc.logger.Info("Clips action processed",
		zap.String("session_id", sessionID),
		zap.String("stage_id", stageID),
		zap.String("action", req.Action),
		zap.Int("accepted_count", len(acceptedClips)),
		zap.Int("rejected_count", len(rejectedClips)))

	// Emit SSE event for clip selection
	eventType := "clips_updated"
	if req.Action == "reject" || req.Action == "reject_all" {
		eventType = "clips_rejected"
	}

	sc.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      eventType,
		SessionID: sessionID,
		StageID:   &stageID,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"action":         req.Action,
			"accepted_count": len(acceptedClips),
			"rejected_count": len(rejectedClips),
			"total_clips":    len(allClips),
			"accepted_clips": acceptedClips,
			"rejected_clips": rejectedClips,
			"deleted_urls":   clipURLsToDelete,
		},
	})

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":        true,
		"action":         req.Action,
		"accepted_count": len(acceptedClips),
		"rejected_count": len(rejectedClips),
		"total_clips":    len(allClips),
	})
}

// ReorderClipsRequest represents the request to reorder clips
type ReorderClipsRequest struct {
	ClipOrder []string `json:"clip_order"` // Ordered array of clip IDs
}

// ReorderClips allows user to manually reorder clips (for ai_ordering stage)
func (sc *StudioController) ReorderClips(w http.ResponseWriter, r *http.Request) {
	// Extract session ID and stage ID from URL
	sessionIDStr := chi.URLParam(r, "sessionID")
	stageIDStr := chi.URLParam(r, "stageID")

	if sessionIDStr == "" || stageIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "session_id and stage_id are required")
		return
	}

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id format")
		return
	}

	// Parse request body
	var req ReorderClipsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	// Validate clip order is provided
	if len(req.ClipOrder) == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "clip_order cannot be empty")
		return
	}

	ctx := r.Context()

	// Get session
	session, err := sc.sessionRepo.GetByID(ctx, sessionID, sc.db)
	if err != nil {
		sc.logger.Error("Failed to get session", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to get session")
		return
	}

	if session == nil {
		utils.RespondWithError(w, http.StatusNotFound, "session not found")
		return
	}

	// Get stage
	stage, err := sc.stageRepo.GetBySessionAndStageID(ctx, sessionID, stageIDStr, sc.db)
	if err != nil {
		sc.logger.Error("Failed to get stage", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to get stage")
		return
	}

	if stage == nil {
		utils.RespondWithError(w, http.StatusNotFound, "stage not found")
		return
	}

	// Validate stage is in a state that allows reordering
	// Can reorder if stage is reviewing, completed, or accepted
	if stage.Status != models.StageStatusReviewing &&
		stage.Status != models.StageStatusCompleted &&
		stage.Status != models.StageStatusAccepted {
		utils.RespondWithError(w, http.StatusBadRequest,
			fmt.Sprintf("cannot reorder clips in stage with status: %s", stage.Status))
		return
	}

	// Initialize metadata if nil
	if stage.Metadata == nil {
		stage.Metadata = make(map[string]interface{})
	}

	// Get existing clips from metadata
	var existingClips []interface{}
	if clips, ok := stage.Metadata["clips"]; ok {
		if clipSlice, ok := clips.([]interface{}); ok {
			existingClips = clipSlice
		}
	}

	// If no clips exist yet, can't reorder
	if len(existingClips) == 0 {
		utils.RespondWithError(w, http.StatusBadRequest, "no clips available to reorder")
		return
	}

	// Create a map of existing clips by ID for validation
	clipMap := make(map[string]interface{})
	for _, clip := range existingClips {
		if clipObj, ok := clip.(map[string]interface{}); ok {
			if id, ok := clipObj["id"].(string); ok {
				clipMap[id] = clip
			}
		}
	}

	// Validate that all IDs in clip_order exist
	for _, clipID := range req.ClipOrder {
		if _, exists := clipMap[clipID]; !exists {
			utils.RespondWithError(w, http.StatusBadRequest,
				fmt.Sprintf("clip_id not found: %s", clipID))
			return
		}
	}

	// Validate that clip_order contains all clips (no clips omitted)
	if len(req.ClipOrder) != len(existingClips) {
		utils.RespondWithError(w, http.StatusBadRequest,
			fmt.Sprintf("clip_order must contain all %d clips, got %d", len(existingClips), len(req.ClipOrder)))
		return
	}

	// Reorder clips based on clip_order
	reorderedClips := make([]interface{}, len(req.ClipOrder))
	for i, clipID := range req.ClipOrder {
		reorderedClips[i] = clipMap[clipID]
	}

	// Update metadata with reordered clips
	stage.Metadata["ordered_clips"] = reorderedClips
	stage.Metadata["clip_order"] = req.ClipOrder
	stage.Metadata["user_reordered"] = true

	// Update stage in database
	if err := sc.stageRepo.Update(ctx, stage, sc.db); err != nil {
		sc.logger.Error("Failed to update stage with reordered clips",
			zap.Error(err),
			zap.String("session_id", sessionID.String()),
			zap.String("stage_id", stageIDStr))
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to update stage")
		return
	}

	sc.logger.Info("Clips reordered successfully",
		zap.String("session_id", sessionID.String()),
		zap.String("stage_id", stageIDStr),
		zap.Int("clip_count", len(reorderedClips)))

	// Emit SSE event for clips reordered
	stageID := stage.StageID
	sc.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:      "clips_reordered",
		SessionID: session.ID.String(),
		JobID:     session.ID.String(),
		StageID:   &stageID,
		Data: map[string]interface{}{
			"stage_id":      stage.StageID,
			"ordered_clips": reorderedClips,
			"clip_order":    req.ClipOrder,
			"clip_count":    len(reorderedClips),
		},
		Timestamp: time.Now(),
	})

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Clips reordered successfully",
		"stage_id":      stage.StageID,
		"ordered_clips": reorderedClips,
		"clip_count":    len(reorderedClips),
	})
}

// saveClipsArtifact saves accepted clips as a testimonial artifact
func (sc *StudioController) saveClipsArtifact(ctx context.Context, stage *models.ProcessingStage) error {
	// Validate input
	if stage == nil {
		return fmt.Errorf("stage is nil")
	}

	if stage.Metadata == nil {
		return fmt.Errorf("stage metadata is nil")
	}

	// Get session to find testimonial ID
	session, err := sc.sessionRepo.GetByID(ctx, stage.SessionID, sc.db)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	if session == nil {
		return fmt.Errorf("session not found")
	}

	if session.TestimonialID == nil {
		return fmt.Errorf("session has no testimonial_id")
	}

	// Get highlight type (determines result_category)
	highlightType := "general" // default
	if ht, ok := stage.Metadata["highlight_type"].(string); ok && ht != "" {
		highlightType = ht
	}

	// Get clips from stage metadata
	// Use accepted_clips if explicitly set (even if empty - user might have rejected all)
	var clipsToSave []interface{}
	var hasExplicitSelection bool

	if acceptedClips, ok := stage.Metadata["accepted_clips"]; ok {
		hasExplicitSelection = true

		if clipSlice, ok := acceptedClips.([]interface{}); ok {
			clipsToSave = clipSlice
		} else if acceptedClips == nil {
			// Explicitly set to nil/empty - user rejected all clips
			clipsToSave = []interface{}{}
		}
	}

	// If no explicit acceptance yet, default to all clips (first time artifact creation)
	if !hasExplicitSelection {
		if allClips, ok := stage.Metadata["clips"]; ok {
			if clipSlice, ok := allClips.([]interface{}); ok {
				clipsToSave = clipSlice
			}
		}

		if len(clipsToSave) == 0 {
			// No clips to save - this is valid for session-based workflow
			sc.logger.Info("No clips to save, skipping artifact save")
			return nil
		}
	}

	// Properly serialize clips to ensure clean JSONB data
	clipsJSON, err := json.Marshal(clipsToSave)
	if err != nil {
		return fmt.Errorf("failed to marshal clips: %w", err)
	}

	var newClips []map[string]interface{}
	if err := json.Unmarshal(clipsJSON, &newClips); err != nil {
		return fmt.Errorf("failed to unmarshal clips: %w", err)
	}

	// Add generation timestamp to each new clip
	now := time.Now()
	for i := range newClips {
		if _, exists := newClips[i]["generated_at"]; !exists {
			newClips[i]["generated_at"] = now.Format(time.RFC3339)
		}
		if _, exists := newClips[i]["session_id"]; !exists {
			newClips[i]["session_id"] = stage.SessionID.String()
		}
	}

	// Check if artifact already exists for this testimonial + highlight_type combination
	artifacts, err := sc.artifactsRepo.GetByTestimonialID(ctx, *session.TestimonialID, sc.db)
	if err != nil {
		return fmt.Errorf("failed to check existing artifacts: %w", err)
	}

	var existingArtifact *models.TestimonialArtifact
	for i := range artifacts {
		a := &artifacts[i]
		if a.ProcessingType == "clipping" && a.ResultCategory == highlightType {
			existingArtifact = a
			break
		}
	}

	if existingArtifact != nil {
		// Artifact exists - merge clips intelligently
		return sc.mergeClipsIntoArtifact(ctx, existingArtifact, newClips, stage, highlightType)
	} else {
		// Create new artifact
		return sc.createNewClipsArtifact(ctx, session, newClips, stage, highlightType)
	}
}

// mergeClipsIntoArtifact intelligently merges new clips with existing clips
func (sc *StudioController) mergeClipsIntoArtifact(ctx context.Context, artifact *models.TestimonialArtifact, newClips []map[string]interface{}, stage *models.ProcessingStage, highlightType string) error {
	if artifact.Data == nil {
		artifact.Data = make(models.JSONMap)
	}

	// Get existing clips
	var existingClips []map[string]interface{}
	if genClips, ok := artifact.Data["generated_clips"]; ok && genClips != nil {
		// Handle both []interface{} and []map[string]interface{} types
		switch v := genClips.(type) {
		case []interface{}:
			for _, clipInterface := range v {
				if clipMap, ok := clipInterface.(map[string]interface{}); ok {
					existingClips = append(existingClips, clipMap)
				}
			}
		case []map[string]interface{}:
			existingClips = v
		default:
			// Try JSON round-trip
			clipsJSON, _ := json.Marshal(genClips)
			json.Unmarshal(clipsJSON, &existingClips)
		}
	}

	sc.logger.Info("Merging clips",
		zap.Int("existing_count", len(existingClips)),
		zap.Int("new_count", len(newClips)))

	// Build a map of existing clip IDs for deduplication
	existingClipIDs := make(map[string]bool)
	for _, clip := range existingClips {
		if clipID, ok := clip["id"].(string); ok {
			existingClipIDs[clipID] = true
		}
	}

	// Merge: Add only new clips that don't already exist
	var addedCount int
	var skippedCount int
	var duplicateClipIDs []string

	for _, newClip := range newClips {
		clipID, hasID := newClip["id"].(string)
		if !hasID {
			// Clip without ID - add it anyway
			existingClips = append(existingClips, newClip)
			addedCount++
			continue
		}

		if existingClipIDs[clipID] {
			// Clip already exists - skip
			duplicateClipIDs = append(duplicateClipIDs, clipID)
			skippedCount++
		} else {
			// New clip - add it
			existingClips = append(existingClips, newClip)
			existingClipIDs[clipID] = true
			addedCount++
		}
	}

	sc.logger.Info("Clip merge results",
		zap.Int("added", addedCount),
		zap.Int("skipped_duplicates", skippedCount),
		zap.Int("total_clips", len(existingClips)))

	if skippedCount > 0 {
		sc.logger.Info("Duplicate clips detected",
			zap.Strings("duplicate_ids", duplicateClipIDs))
	}

	// CRITICAL FIX: Properly serialize clips to clean JSONB data
	// Re-marshal and unmarshal to ensure clean JSON without binary data
	clipsJSON, err := json.Marshal(existingClips)
	if err != nil {
		return fmt.Errorf("failed to marshal clips for JSONB: %w", err)
	}
	var cleanClips []map[string]interface{}
	if err := json.Unmarshal(clipsJSON, &cleanClips); err != nil {
		return fmt.Errorf("failed to unmarshal clips for JSONB: %w", err)
	}

	// Update artifact with merged clips
	artifact.Data["generated_clips"] = cleanClips
	artifact.Data["clips_count"] = len(existingClips)
	artifact.Data["last_updated"] = time.Now().Format(time.RFC3339)
	artifact.Data["last_session_id"] = stage.SessionID.String()

	// Track clip generation history
	if artifact.Data["generation_history"] == nil {
		artifact.Data["generation_history"] = []map[string]interface{}{}
	}
	history, _ := artifact.Data["generation_history"].([]interface{})
	history = append(history, map[string]interface{}{
		"session_id":    stage.SessionID.String(),
		"generated_at":  time.Now().Format(time.RFC3339),
		"clips_added":   addedCount,
		"clips_skipped": skippedCount,
	})
	artifact.Data["generation_history"] = history

	if err := sc.artifactsRepo.Update(ctx, artifact, sc.db); err != nil {
		return fmt.Errorf("failed to update clips artifact: %w", err)
	}

	sc.logger.Info("Updated existing clips artifact",
		zap.String("artifact_id", artifact.ID.String()),
		zap.Int("total_clips", len(existingClips)),
		zap.Int("added", addedCount))

	return nil
}

// createNewClipsArtifact creates a brand new clips artifact
func (sc *StudioController) createNewClipsArtifact(ctx context.Context, session *models.ProcessingSession, clips []map[string]interface{}, stage *models.ProcessingStage, highlightType string) error {
	// CRITICAL FIX: Properly serialize clips to clean JSONB data
	// Re-marshal and unmarshal to ensure clean JSON without binary data
	clipsJSON, err := json.Marshal(clips)
	if err != nil {
		return fmt.Errorf("failed to marshal clips for JSONB: %w", err)
	}
	var cleanClips []map[string]interface{}
	if err := json.Unmarshal(clipsJSON, &cleanClips); err != nil {
		return fmt.Errorf("failed to unmarshal clips for JSONB: %w", err)
	}

	// Build source_info
	sourceInfo := models.JSONMap{
		"Data":            session.TestimonialID.String(),
		"Type":            "testimonial",
		"Metadata":        nil,
		"AppliedServices": nil,
	}

	artifact := &models.TestimonialArtifact{
		ID:             uuid.New(),
		TestimonialID:  session.TestimonialID,
		WorkspaceID:    session.WorkspaceID,
		ProcessingType: "clipping",
		ResultCategory: highlightType, // Use highlight_type as result_category
		Data: models.JSONMap{
			"source_info":     sourceInfo,
			"generated_clips": cleanClips,
			"clips_count":     len(clips),
			"last_updated":    time.Now().Format(time.RFC3339),
			"generation_history": []map[string]interface{}{
				{
					"session_id":   stage.SessionID.String(),
					"generated_at": time.Now().Format(time.RFC3339),
					"clips_added":  len(clips),
				},
			},
		},
		ProcessingMetadata: models.JSONMap{
			"last_session_id": stage.SessionID.String(),
			"highlight_type":  highlightType,
		},
		ContentType: "clips",
		IsStreamed:  false,
	}

	if err := sc.artifactsRepo.Create(ctx, artifact, sc.db); err != nil {
		return fmt.Errorf("failed to create clips artifact: %w", err)
	}

	sc.logger.Info("Created new clips artifact",
		zap.String("artifact_id", artifact.ID.String()),
		zap.String("result_category", highlightType),
		zap.Int("clips_count", len(clips)))

	return nil
}

// deleteClipFromStorage deletes a clip file from storage given its URL
func (sc *StudioController) deleteClipFromStorage(ctx context.Context, clipURL string) error {
	// Extract storage path from URL
	// URLs from temp storage typically look like:
	// https://objectstorage.us-ashburn-1.oraclecloud.com/n/{namespace}/b/{bucket}/o/{path}
	// Or presigned URLs with additional query parameters

	// Remove query parameters if present (presigned URL)
	baseURL := strings.Split(clipURL, "?")[0]

	// Extract the object path (everything after /o/)
	parts := strings.Split(baseURL, "/o/")
	if len(parts) < 2 {
		return fmt.Errorf("invalid clip URL format: %s", clipURL)
	}

	objectPath := parts[1]

	// Delete from storage using temp storage service's provider
	if err := sc.tempStorageService.DeleteByPath(ctx, objectPath); err != nil {
		return fmt.Errorf("failed to delete clip from storage: %w", err)
	}

	sc.logger.Info("Deleted clip from storage",
		zap.String("path", objectPath),
		zap.String("url", clipURL))

	return nil
}

// UpdateStageConfig updates configuration for a specific stage (music, branding, intro/outro, etc.)
func (c StudioController) UpdateStageConfig(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	stageIDStr := chi.URLParam(r, "stageID")

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	type ConfigUpdate struct {
		// Music configuration
		MusicTheme     *string `json:"music_theme"`      // "corporate", "upbeat", "calm", "professional", "energetic"
		MusicVolume    *string `json:"music_volume"`     // "low", "medium", "high"
		CustomMusicURL *string `json:"custom_music_url"` // URL to custom music file

		// Branding configuration
		LogoPosition *string  `json:"logo_position"` // "top-left", "top-right", "bottom-left", "bottom-right", "center"
		LogoSize     *string  `json:"logo_size"`     // "small", "medium", "large"
		LogoOpacity  *float64 `json:"logo_opacity"`  // 0.0 - 1.0

		// Watermark configuration
		WatermarkText     *string  `json:"watermark_text"`
		WatermarkPosition *string  `json:"watermark_position"` // "top-left", "top-right", "bottom-left", "bottom-right", "center"
		WatermarkSize     *string  `json:"watermark_size"`     // "small", "medium", "large"
		WatermarkOpacity  *float64 `json:"watermark_opacity"`  // 0.0 - 1.0

		// Intro/Outro configuration (for story video)
		IntroType     *string `json:"intro_type"`      // "text", "image", "none"
		IntroText     *string `json:"intro_text"`      // Text for text-based intro
		IntroImageURL *string `json:"intro_image_url"` // URL for image-based intro
		IntroDuration *int    `json:"intro_duration"`  // Duration in seconds

		OutroType     *string `json:"outro_type"`      // "text", "image", "none"
		OutroText     *string `json:"outro_text"`      // Text for text-based outro
		OutroImageURL *string `json:"outro_image_url"` // URL for image-based outro
		OutroDuration *int    `json:"outro_duration"`  // Duration in seconds

		// General configuration
		CustomPrompt *string `json:"custom_prompt"` // Custom instructions for AI
	}

	var req ConfigUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update session activity
	c.updateSessionActivity(r.Context(), sessionID)

	// Get the stage
	stage, err := c.stageRepo.GetBySessionAndStageID(r.Context(), sessionID, stageIDStr, c.db)
	if err != nil {
		c.logger.Error("Failed to get stage", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "stage not found")
		return
	}

	// Initialize metadata if needed
	if stage.Metadata == nil {
		stage.Metadata = make(map[string]interface{})
	}

	// Update music configuration
	if req.MusicTheme != nil {
		stage.Metadata["music_theme"] = *req.MusicTheme
	}
	if req.MusicVolume != nil {
		stage.Metadata["music_volume"] = *req.MusicVolume
	}
	if req.CustomMusicURL != nil {
		stage.Metadata["custom_music_url"] = *req.CustomMusicURL
	}

	// Update branding configuration
	if req.LogoPosition != nil {
		stage.Metadata["logo_position"] = *req.LogoPosition
	}
	if req.LogoSize != nil {
		stage.Metadata["logo_size"] = *req.LogoSize
	}
	if req.LogoOpacity != nil {
		stage.Metadata["logo_opacity"] = *req.LogoOpacity
	}

	// Update watermark configuration
	if req.WatermarkText != nil {
		stage.Metadata["watermark_text"] = *req.WatermarkText
	}
	if req.WatermarkPosition != nil {
		stage.Metadata["watermark_position"] = *req.WatermarkPosition
	}
	if req.WatermarkSize != nil {
		stage.Metadata["watermark_size"] = *req.WatermarkSize
	}
	if req.WatermarkOpacity != nil {
		stage.Metadata["watermark_opacity"] = *req.WatermarkOpacity
	}

	// Update intro/outro configuration
	if req.IntroType != nil {
		stage.Metadata["intro_type"] = *req.IntroType
	}
	if req.IntroText != nil {
		stage.Metadata["intro_text"] = *req.IntroText
	}
	if req.IntroImageURL != nil {
		stage.Metadata["intro_image_url"] = *req.IntroImageURL
	}
	if req.IntroDuration != nil {
		stage.Metadata["intro_duration"] = *req.IntroDuration
	}

	if req.OutroType != nil {
		stage.Metadata["outro_type"] = *req.OutroType
	}
	if req.OutroText != nil {
		stage.Metadata["outro_text"] = *req.OutroText
	}
	if req.OutroImageURL != nil {
		stage.Metadata["outro_image_url"] = *req.OutroImageURL
	}
	if req.OutroDuration != nil {
		stage.Metadata["outro_duration"] = *req.OutroDuration
	}

	// Update custom prompt
	if req.CustomPrompt != nil {
		stage.Metadata["custom_prompt"] = *req.CustomPrompt
	}

	stage.UpdatedAt = time.Now()

	// Save updated stage
	if err := c.stageRepo.Update(r.Context(), stage, c.db); err != nil {
		c.logger.Error("Failed to update stage", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to update configuration")
		return
	}

	// Broadcast config update event
	c.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "config_updated",
		SessionID: sessionIDStr,
		StageID:   &stageIDStr,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"updated_fields": req,
		},
	})

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":  "Configuration updated successfully",
		"stage_id": stageIDStr,
		"metadata": stage.Metadata,
	})
}

// RegenerateTextOptimization regenerates text optimization for a stage
func (c StudioController) RegenerateTextOptimization(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	stageIDStr := chi.URLParam(r, "stageID")

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	type RegenerateRequest struct {
		CustomPrompt string `json:"custom_prompt"`
	}

	var req RegenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update session activity timestamp
	c.updateSessionActivity(r.Context(), sessionID)

	// Get the stage to find config
	stage, err := c.stageRepo.GetBySessionAndStageID(r.Context(), sessionID, stageIDStr, c.db)
	if err != nil {
		c.logger.Error("Failed to get stage", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "stage not found")
		return
	}

	// Update stage to processing status
	if err := c.stageRepo.UpdateStatus(r.Context(), stage.ID, "processing", 0, nil, c.db); err != nil {
		c.logger.Error("Failed to update stage status", zap.Error(err))
	}

	// Trigger regeneration in background
	go func() {
		defer func() {
			if r := recover(); r != nil {
				c.logger.Error("Panic in regenerate text optimization",
					zap.String("session_id", sessionIDStr),
					zap.String("stage_id", stageIDStr),
					zap.Any("panic", r),
				)
			}
		}()

		ctx := context.Background()

		// Update metadata with custom prompt if provided
		if req.CustomPrompt != "" {
			if stage.Metadata == nil {
				stage.Metadata = make(map[string]interface{})
			}
			stage.Metadata["custom_prompt"] = req.CustomPrompt
			stage.UpdatedAt = time.Now()
			// Save updated stage
			if err := c.stageRepo.Update(ctx, stage, c.db); err != nil {
				c.logger.Error("Failed to update stage", zap.Error(err))
			}
		}

		if err := c.stepOrchestrator.ExecuteStage(ctx, sessionID, stageIDStr); err != nil {
			c.logger.Error("Failed to regenerate text optimization",
				zap.String("session_id", sessionIDStr),
				zap.String("stage_id", stageIDStr),
				zap.Error(err))

			// Update stage to failed
			failMsg := err.Error()
			if err := c.stageRepo.UpdateStatus(ctx, stage.ID, "failed", 0, &failMsg, c.db); err != nil {
				c.logger.Error("Failed to update stage status to failed", zap.Error(err))
			}
		}
	}()

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":  "Text optimization regeneration started",
		"stage_id": stageIDStr,
	})
}

// SaveSession saves the session results to permanent storage and creates artifacts
func (c StudioController) SaveSession(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	type SaveRequest struct {
		ReplaceOriginal bool                   `json:"replace_original"`
		AcceptedStages  []string               `json:"accepted_stages"` // stage IDs user wants to save
		Metadata        map[string]interface{} `json:"metadata"`        // Additional metadata like optimized_text
	}

	var req SaveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Update session activity timestamp
	c.updateSessionActivity(r.Context(), sessionID)

	// Get session
	session, err := c.sessionRepo.GetByID(r.Context(), sessionID, c.db)
	if err != nil {
		c.logger.Error("Failed to get session", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "session not found")
		return
	}

	// Get all temp artifacts for this session
	tempArtifacts, err := c.tempStorageService.GetSessionArtifacts(r.Context(), sessionID)
	if err != nil {
		c.logger.Error("Failed to get session artifacts", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "failed to get artifacts")
		return
	}

	savedArtifacts := []string{}
	var finalArtifactIDs []uuid.UUID

	// Process accepted temp artifacts and promote to permanent storage
	for _, tempArtifact := range tempArtifacts {
		// Check if this stage was accepted
		stageAccepted := false
		for _, acceptedStageID := range req.AcceptedStages {
			if tempArtifact.StageID.String() == acceptedStageID {
				stageAccepted = true
				break
			}
		}

		if !stageAccepted {
			continue
		}

		// 1. Copy temp artifact to permanent storage
		if tempArtifact.PreviewURL == nil || *tempArtifact.PreviewURL == "" {
			c.logger.Warn("Temp artifact has no preview URL, skipping",
				zap.String("artifact_id", tempArtifact.ID.String()))
			continue
		}

		if session.TestimonialID == nil {
			c.logger.Warn("Session has no testimonial_id, cannot save artifact",
				zap.String("session_id", sessionIDStr))
			continue
		}

		permanentURL, err := c.tempStorageService.CopyToPermanentStorage(r.Context(), *tempArtifact.PreviewURL, *session.TestimonialID)
		if err != nil {
			c.logger.Error("Failed to copy temp artifact to permanent storage",
				zap.String("artifact_id", tempArtifact.ID.String()),
				zap.String("temp_url", *tempArtifact.PreviewURL),
				zap.Error(err))
			continue
		}

		c.logger.Info("Copied artifact to permanent storage",
			zap.String("temp_url", *tempArtifact.PreviewURL),
			zap.String("permanent_url", permanentURL))

		// 2. Create testimonial_artifacts record
		processingType := session.SessionType
		if processingType == "platform_optimization" {
			processingType = "video_platform_optimization"
		}

		artifact := &models.TestimonialArtifact{
			TestimonialID:  session.TestimonialID,
			WorkspaceID:    session.WorkspaceID,
			ProcessingType: processingType,
			ResultCategory: "processed_video",
			AssetURL:       &permanentURL,
			ContentType:    "video/mp4",
			IsUserSaved:    true,
			IsStreamed:     false,
			ProcessingMetadata: models.JSONMap{
				"session_type": session.SessionType,
				"session_id":   sessionIDStr,
				"stage_id":     tempArtifact.StageID.String(),
				"saved_at":     time.Now().Format(time.RFC3339),
			},
		}

		if err := c.artifactsRepo.Create(r.Context(), artifact, c.db); err != nil {
			c.logger.Error("Failed to create artifact record",
				zap.String("permanent_url", permanentURL),
				zap.Error(err))
			continue
		}

		savedArtifacts = append(savedArtifacts, artifact.ID.String())
		finalArtifactIDs = append(finalArtifactIDs, artifact.ID)

		c.logger.Info("Created testimonial artifact",
			zap.String("artifact_id", artifact.ID.String()),
			zap.String("permanent_url", permanentURL))
	}

	// 3. Optionally replace original testimonial media_url
	if req.ReplaceOriginal && session.TestimonialID != nil && len(finalArtifactIDs) > 0 {
		// Get the last saved artifact URL
		lastArtifact, err := c.artifactsRepo.GetByID(r.Context(), finalArtifactIDs[len(finalArtifactIDs)-1], c.db)
		if err == nil && lastArtifact.AssetURL != nil {
			// Update testimonial record with new media URL
			testimonial, err := c.testimonialRepo.FetchByID(r.Context(), *session.TestimonialID, c.db)
			if err == nil {
				testimonial.MediaURL = lastArtifact.AssetURL
				if err := c.testimonialRepo.Update(r.Context(), testimonial, *session.TestimonialID, c.db); err != nil {
					c.logger.Error("Failed to update testimonial media URL", zap.Error(err))
					// Continue anyway - artifact is saved
				} else {
					c.logger.Info("Replaced testimonial media URL",
						zap.String("testimonial_id", session.TestimonialID.String()),
						zap.String("new_url", *lastArtifact.AssetURL))
				}
			}
		}
	}

	// Save text optimization metadata if present
	if optimizedText, ok := req.Metadata["optimized_text"].(string); ok && optimizedText != "" {
		if session.TestimonialID == nil {
			c.logger.Warn("Session has no testimonial_id, cannot save text optimization")
		} else {
			c.logger.Info("Saving text optimization metadata",
				zap.String("testimonial_id", session.TestimonialID.String()),
				zap.Int("text_length", len(optimizedText)))

			// Create an artifact record with type "text_optimization"
			textArtifact := &models.TestimonialArtifact{
				TestimonialID:  session.TestimonialID,
				WorkspaceID:    session.WorkspaceID,
				ProcessingType: "text_optimization",
				ResultCategory: "text_optimization",
				TextContent:    &optimizedText,
				ContentType:    "text/plain",
				IsUserSaved:    true,
				IsStreamed:     false,
				ProcessingMetadata: models.JSONMap{
					"session_type": session.SessionType,
					"session_id":   sessionIDStr,
					"saved_at":     time.Now().Format(time.RFC3339),
				},
			}

			// Copy additional metadata fields if provided
			if hashtags, ok := req.Metadata["hashtags"]; ok {
				textArtifact.ProcessingMetadata["hashtags"] = hashtags
			}
			if platform, ok := req.Metadata["platform"]; ok {
				textArtifact.ProcessingMetadata["platform"] = platform
			}
			if optimalTiming, ok := req.Metadata["optimal_timing"]; ok {
				textArtifact.ProcessingMetadata["optimal_timing"] = optimalTiming
			}

			if err := c.artifactsRepo.Create(r.Context(), textArtifact, c.db); err != nil {
				c.logger.Error("Failed to create text optimization artifact", zap.Error(err))
			} else {
				savedArtifacts = append(savedArtifacts, textArtifact.ID.String())
				c.logger.Info("Created text optimization artifact",
					zap.String("artifact_id", textArtifact.ID.String()))
			}
		}
	}

	// Mark session as completed
	if err := c.sessionRepo.UpdateStatus(r.Context(), sessionID, "completed", c.db); err != nil {
		c.logger.Error("Failed to update session status", zap.Error(err))
	}

	// Cleanup temp artifacts (optional - can also rely on TTL expiry)
	go func() {
		if err := c.sessionCleanupService.CleanupSession(context.Background(), sessionID); err != nil {
			c.logger.Error("Failed to cleanup session after save", zap.Error(err))
		}
	}()

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message":          "Session saved successfully",
		"saved_artifacts":  savedArtifacts,
		"artifacts_count":  len(savedArtifacts),
		"replace_original": req.ReplaceOriginal,
	})
}

// GetSessionStatus checks if a session exists and returns its current status
// Route: GET /studio/sessions/{sessionID}/status
func (c StudioController) GetSessionStatus(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "sessionID")
	if sessionIDStr == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "session_id is required")
		return
	}

	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid session_id")
		return
	}

	// Try to get session from SSE manager first (for active sessions)
	session := c.sseManager.GetSession(sessionIDStr)
	if session != nil {
		utils.RespondWithJSON(w, http.StatusOK, map[string]any{
			"session_id": sessionIDStr,
			"status":     session.Status,
			"exists":     true,
		})
		return
	}

	// Fall back to database check
	dbSession, err := c.sessionRepo.GetByID(r.Context(), sessionID, c.db)
	if err != nil {
		// Session not found in SSE or DB
		c.logger.Debug("Session not found",
			zap.String("session_id", sessionIDStr),
			zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "session not found")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]any{
		"session_id": sessionIDStr,
		"status":     dbSession.Status,
		"exists":     true,
	})
}
