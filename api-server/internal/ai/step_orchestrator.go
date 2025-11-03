package ai

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/sse"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"go.uber.org/zap"
)

// StepDefinition defines a single processing step
type StepDefinition struct {
	StageID      string
	StageName    string
	DisplayName  string
	StageOrder   int
	Dependencies []string // IDs of stages that must complete before this one
	CanSkip      bool
	IsOptional   bool
	Handler      StepHandler
}

// StepHandler executes a single processing step
type StepHandler func(ctx context.Context, input *StepInput) (*StepOutput, error)

// StepInput contains all data needed for a step
type StepInput struct {
	SessionID             uuid.UUID
	TestimonialID         *uuid.UUID
	WorkspaceID           uuid.UUID
	StageID               string
	InputArtifactPath     *string // Output from previous stage
	Config                map[string]interface{}
	PreviousStageMetadata map[string]interface{} // Metadata from previous completed stage
	BrandContext          interface{}
}

// StepOutput contains the result of a step execution
type StepOutput struct {
	TempArtifactPath  *string
	PreviewURL        *string
	Metadata          map[string]interface{}
	StreamedBytes     []byte // For small artifacts that can be streamed directly
	SkipReason        *string
	NextStageOverride *string // Override which stage to run next
}

// sessionContext holds both the context and cancel function for a session
type sessionContext struct {
	ctx    context.Context
	cancel context.CancelFunc
}

// StepOrchestrator manages step-by-step execution
type StepOrchestrator struct {
	sessionRepo        repositories.ProcessingSessionRepository
	stageRepo          repositories.ProcessingStageRepository
	testimonialRepo    repositories.TestimonialRepository
	workspaceRepo      repositories.WorkspaceRepository
	artifactsRepo      repositories.TestimonialArtifactRepository
	tempStorageService *storage.TempStorageService
	sseManager         *sse.SSEManager
	db                 *sql.DB
	logger             *zap.Logger

	// Cancellation management
	sessionContexts map[string]*sessionContext
	cancelMutex     sync.RWMutex
}

func NewStepOrchestrator(
	sessionRepo repositories.ProcessingSessionRepository,
	stageRepo repositories.ProcessingStageRepository,
	testimonialRepo repositories.TestimonialRepository,
	workspaceRepo repositories.WorkspaceRepository,
	artifactsRepo repositories.TestimonialArtifactRepository,
	tempStorageService *storage.TempStorageService,
	sseManager *sse.SSEManager,
	db *sql.DB,
	logger *zap.Logger,
) *StepOrchestrator {
	return &StepOrchestrator{
		sessionRepo:        sessionRepo,
		stageRepo:          stageRepo,
		testimonialRepo:    testimonialRepo,
		workspaceRepo:      workspaceRepo,
		artifactsRepo:      artifactsRepo,
		tempStorageService: tempStorageService,
		sseManager:         sseManager,
		db:                 db,
		logger:             logger,
		sessionContexts:    make(map[string]*sessionContext),
	}
}

// CreateSession creates a new processing session with stages
func (o *StepOrchestrator) CreateSession(
	ctx context.Context,
	testimonialID *uuid.UUID,
	workspaceID uuid.UUID,
	pipelineType string,
	selectedStages []string,
	autoProceed bool,
	config map[string]interface{}, // BUGFIX #12: Accept config parameter
) (*models.ProcessingSession, error) {
	// Convert selectedStages to JSONArray
	selectedStagesArray := models.JSONArray{}
	for _, stageID := range selectedStages {
		selectedStagesArray = append(selectedStagesArray, stageID)
	}

	// BUGFIX #12: Store initial config in session Metadata
	sessionMetadata := models.JSONMap{}
	for k, v := range config {
		sessionMetadata[k] = v
	}

	session := &models.ProcessingSession{
		ID:             uuid.New(),
		TestimonialID:  testimonialID,
		WorkspaceID:    workspaceID,
		SessionType:    pipelineType,
		Status:         models.SessionStatusActive,
		SelectedStages: selectedStagesArray,
		AutoProceed:    autoProceed,
		Metadata:       sessionMetadata, // BUGFIX #12: Store config in metadata
	}

	if err := o.sessionRepo.Create(ctx, session, o.db); err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// Create stages based on pipeline type
	stageDefinitions := o.getStageDefinitions(pipelineType, selectedStages)
	createdStages := []*models.ProcessingStage{}

	// CRITICAL BUGFIX: For custom_pipeline, getCustomPipelineStages already returns ONLY selected stages
	// with normalized names. Filtering again causes name mismatch (e.g., "burn_captions" != "captions")
	// and filters out stages with aliases. Only apply filtering logic to fixed pipelines.
	skipFiltering := pipelineType == "custom_pipeline"

	for _, stageDef := range stageDefinitions {
		// BUGFIX: Always include required stages (IsOptional: false)
		// Only filter by selected_stages for optional stages
		// Skip filtering entirely for custom_pipeline (already pre-filtered)
		if !skipFiltering {
			isSelected := len(selectedStages) == 0 || contains(selectedStages, stageDef.StageID)
			isRequired := !stageDef.IsOptional

			if !isSelected && !isRequired {
				// Skip optional stages that weren't selected
				o.logger.Debug("Skipping unselected optional stage",
					zap.String("stage_id", stageDef.StageID),
					zap.String("pipeline", pipelineType))
				continue
			}

			if !isSelected && isRequired {
				// Log warning when required stage wasn't explicitly selected
				o.logger.Warn("Including required stage not in selection",
					zap.String("stage_id", stageDef.StageID),
					zap.String("pipeline", pipelineType),
					zap.Strings("selected_stages", selectedStages))
			}
		}

		// Convert dependencies to JSONArray
		depsArray := models.JSONArray{}
		for _, dep := range stageDef.Dependencies {
			depsArray = append(depsArray, dep)
		}

		stage := &models.ProcessingStage{
			SessionID:    session.ID,
			StageID:      stageDef.StageID,
			StageName:    stageDef.StageName,
			DisplayName:  stageDef.DisplayName,
			StageOrder:   stageDef.StageOrder,
			Status:       models.StageStatusPending,
			Dependencies: depsArray,
			CanSkip:      stageDef.CanSkip,
			IsOptional:   stageDef.IsOptional,
		}

		if err := o.stageRepo.Create(ctx, stage, o.db); err != nil {
			return nil, fmt.Errorf("failed to create stage %s: %w", stageDef.StageID, err)
		}

		createdStages = append(createdStages, stage)
	}

	// Set InputFromStageID to chain stages sequentially
	// For platform_optimization and similar pipelines, each stage should use the output from the previous stage
	// Sort stages by order to ensure correct chaining
	for i := range createdStages {
		for j := i + 1; j < len(createdStages); j++ {
			if createdStages[i].StageOrder > createdStages[j].StageOrder {
				createdStages[i], createdStages[j] = createdStages[j], createdStages[i]
			}
		}
	}

	// Now set InputFromStageID based on sequential order
	// Each stage (except the first) should use output from previous stage
	for i := 1; i < len(createdStages); i++ {
		// Set InputFromStageID to the previous stage in order
		createdStages[i].InputFromStageID = &createdStages[i-1].ID

		if err := o.stageRepo.Update(ctx, createdStages[i], o.db); err != nil {
			o.logger.Error("Failed to update stage InputFromStageID",
				zap.String("stage_id", createdStages[i].StageID),
				zap.String("input_from", createdStages[i-1].StageID),
				zap.Error(err))
		} else {
			o.logger.Info("Set stage input chaining",
				zap.String("stage_id", createdStages[i].StageID),
				zap.String("input_from", createdStages[i-1].StageID))
		}
	}

	// Prepare stages data for immediate display
	stagesData := make([]map[string]interface{}, len(createdStages))
	for i, stage := range createdStages {
		stagesData[i] = map[string]interface{}{
			"id":           stage.ID,
			"session_id":   stage.SessionID,
			"stage_id":     stage.StageID,
			"stage_name":   stage.StageName,
			"display_name": stage.DisplayName,
			"stage_order":  stage.StageOrder,
			"status":       stage.Status,
			"progress":     stage.Progress,
			"metadata":     stage.Metadata,
			"can_skip":     stage.CanSkip,
			"is_optional":  stage.IsOptional,
		}
	}

	// Emit session_created SSE event with stages included for immediate display
	o.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "session_created",
		SessionID: session.ID.String(),
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"session_id":      session.ID,
			"pipeline_type":   pipelineType,
			"auto_proceed":    autoProceed,
			"stage_count":     len(createdStages),
			"selected_stages": selectedStages,
			"stages":          stagesData, // Include stages in first event
		},
	})

	return session, nil
}

// ExecuteNextStep finds and executes the next pending step
func (o *StepOrchestrator) ExecuteNextStep(ctx context.Context, sessionID uuid.UUID) error {
	o.logger.Info("ExecuteNextStep called", zap.String("session_id", sessionID.String()))

	session, err := o.sessionRepo.GetByID(ctx, sessionID, o.db)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	if session.Status != models.SessionStatusActive {
		o.logger.Warn("Session is not active",
			zap.String("session_id", sessionID.String()),
			zap.String("status", string(session.Status)))
		return fmt.Errorf("session is not active (status: %s)", session.Status)
	}

	// Get all stages for this session
	stages, err := o.stageRepo.GetBySessionID(ctx, sessionID, o.db)
	if err != nil {
		return fmt.Errorf("failed to get stages: %w", err)
	}

	o.logger.Info("Retrieved stages for session",
		zap.String("session_id", sessionID.String()),
		zap.Int("total_stages", len(stages)),
		zap.Strings("stage_ids", getStageIDs(stages)),
		zap.Strings("stage_statuses", getStageStatuses(stages)))

	// Find next executable stage (pending + all dependencies met)
	nextStage := o.findNextExecutableStage(stages)
	if nextStage == nil {
		o.logger.Info("No more executable stages found - completing session",
			zap.String("session_id", sessionID.String()))
		// No more stages to execute - mark session as completed
		return o.completeSession(ctx, session)
	}

	o.logger.Info("Found next executable stage",
		zap.String("session_id", sessionID.String()),
		zap.String("stage_id", nextStage.StageID),
		zap.String("stage_name", nextStage.StageName))

	// Execute the stage
	return o.executeStage(ctx, session, nextStage, stages)
}

// ExecuteStage executes a specific stage by ID (used for retry)
func (o *StepOrchestrator) ExecuteStage(ctx context.Context, sessionID uuid.UUID, stageID string) error {
	// Get session
	session, err := o.sessionRepo.GetByID(ctx, sessionID, o.db)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	// Get all stages for this session
	stages, err := o.stageRepo.GetBySessionID(ctx, sessionID, o.db)
	if err != nil {
		return fmt.Errorf("failed to get stages: %w", err)
	}

	// Find the specific stage to retry
	var targetStage *models.ProcessingStage
	for _, stage := range stages {
		if stage.StageID == stageID {
			targetStage = stage
			break
		}
	}

	if targetStage == nil {
		return fmt.Errorf("stage not found: %s", stageID)
	}

	// Validate stage is in a retryable state
	// Allow retry of: pending, failed, processing (stuck), skipped, skipped_auto
	// Don't allow retry of: completed, accepted (these are successful)
	nonRetryableStatuses := []string{
		models.StageStatusCompleted,
		models.StageStatusAccepted,
	}

	isNonRetryable := false
	for _, status := range nonRetryableStatuses {
		if targetStage.Status == status {
			isNonRetryable = true
			break
		}
	}

	if isNonRetryable {
		return fmt.Errorf("stage %s cannot be retried - already completed successfully (current status: %s)", stageID, targetStage.Status)
	}

	// Reset stage to pending before retry
	if targetStage.Status != models.StageStatusPending {
		o.logger.Info("Resetting stage for retry",
			zap.String("stage_id", stageID),
			zap.String("old_status", targetStage.Status))

		targetStage.Status = models.StageStatusPending
		targetStage.StartedAt = nil
		targetStage.CompletedAt = nil
		targetStage.Progress = 0
		targetStage.Message = nil
		targetStage.SkipReason = nil
		if err := o.stageRepo.Update(ctx, targetStage, o.db); err != nil {
			return fmt.Errorf("failed to reset stage: %w", err)
		}
	}

	o.logger.Info("Executing stage",
		zap.String("session_id", sessionID.String()),
		zap.String("stage_id", stageID),
		zap.String("status", string(targetStage.Status)))

	// Execute the specific stage
	return o.executeStage(ctx, session, targetStage, stages)
}

// executeStage executes a single stage
func (o *StepOrchestrator) executeStage(
	ctx context.Context,
	session *models.ProcessingSession,
	stage *models.ProcessingStage,
	_ []*models.ProcessingStage, // allStages parameter kept for API compatibility but currently unused
) error {
	// Update stage status to processing
	now := time.Now()
	stage.Status = models.StageStatusProcessing
	stage.StartedAt = &now
	if err := o.stageRepo.Update(ctx, stage, o.db); err != nil {
		return fmt.Errorf("failed to update stage status: %w", err)
	}

	// Emit step_started event
	stageID := stage.StageID
	o.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:      "step_started",
		SessionID: session.ID.String(),
		JobID:     session.ID.String(),
		StageID:   &stageID,
		Stage: &sse.ProcessingStageEvent{
			ID:          stage.StageID,
			Name:        stage.StageName,
			DisplayName: stage.DisplayName,
			Order:       stage.StageOrder,
			Status:      "processing",
			Progress:    0,
			Message:     "",
			StartedAt:   stage.StartedAt,
		},
		Timestamp: time.Now(),
	})

	// Get input from previous stage (if any)
	// CRITICAL FIX: If previous stage has no output, walk back to find last stage with output
	var inputArtifactPath *string
	if stage.InputFromStageID != nil {
		inputStage, err := o.stageRepo.GetByID(ctx, *stage.InputFromStageID, o.db)
		if err == nil && inputStage.Message != nil {
			inputArtifactPath = inputStage.Message
		} else if err == nil && inputStage.Message == nil {
			// Previous stage completed but has no output - find earlier output
			allStages, err := o.stageRepo.GetBySessionID(ctx, session.ID, o.db)
			if err == nil {
				sort.Slice(allStages, func(i, j int) bool {
					return allStages[i].StageOrder < allStages[j].StageOrder
				})
				for i := len(allStages) - 1; i >= 0; i-- {
					if allStages[i].ID == stage.ID {
						for j := i - 1; j >= 0; j-- {
							if allStages[j].Message != nil && *allStages[j].Message != "" {
								inputArtifactPath = allStages[j].Message
								break
							}
						}
						break
					}
				}
			}
		}
	}

	// BUGFIX #12: Load config from session metadata and merge with stage metadata
	stepConfig := make(map[string]interface{})

	// 1. Start with session-level config (user configuration)
	if session.Metadata != nil {
		for k, v := range session.Metadata {
			stepConfig[k] = v
		}
	}

	// 2. Merge metadata from previous stage (outputs from previous processing)
	var previousStageMetadata map[string]interface{}
	if stage.InputFromStageID != nil {
		inputStage, err := o.stageRepo.GetByID(ctx, *stage.InputFromStageID, o.db)
		if err == nil && inputStage.Metadata != nil {
			// Store previous stage metadata separately for handlers to access
			previousStageMetadata = inputStage.Metadata

			for k, v := range inputStage.Metadata {
				stepConfig[k] = v // Previous stage outputs override session config
			}
		}
	}

	// 3. Add session_type to config so handlers can check what type of session they're in
	stepConfig["session_type"] = session.SessionType

	// Prepare step input
	stepInput := &StepInput{
		SessionID:             session.ID,
		TestimonialID:         session.TestimonialID,
		WorkspaceID:           session.WorkspaceID,
		StageID:               stage.StageID,
		InputArtifactPath:     inputArtifactPath,
		Config:                stepConfig,            // BUGFIX #12: Now populated with real config!
		PreviousStageMetadata: previousStageMetadata, // CRITICAL FIX: Pass previous stage metadata for aspect_ratio/platform propagation
	}

	// Get the handler for this stage
	handler := o.getStepHandler(session.SessionType, stage.StageID)
	if handler == nil {
		return o.failStage(ctx, stage, fmt.Errorf("no handler found for stage %s", stage.StageID))
	}

	// Get or create cancellable context for this session
	sessionIDStr := session.ID.String()
	sessionCtx := o.getOrCreateSessionContext(ctx, sessionIDStr)

	// Execute the handler with timeout (45 minutes per stage max)
	// CRITICAL: Long video processing operations (story video assembly, enhancement, etc.)
	// can legitimately take 20-30 minutes for longer videos. The timeout should only catch
	// truly hung processes. As long as the stage emits progress, it won't be marked as stale.
	timeoutCtx, timeoutCancel := context.WithTimeout(sessionCtx, 45*time.Minute)
	defer timeoutCancel()

	// Execute in goroutine to handle timeout and cancellation
	type handlerResult struct {
		output *StepOutput
		err    error
	}
	resultChan := make(chan handlerResult, 1)

	go func() {
		output, err := handler(timeoutCtx, stepInput)
		resultChan <- handlerResult{output: output, err: err}
	}()

	// Wait for either completion, timeout, or cancellation
	var output *StepOutput
	var err error
	select {
	case result := <-resultChan:
		output = result.output
		err = result.err
	case <-timeoutCtx.Done():
		// Check if it was a timeout or cancellation
		if sessionCtx.Err() == context.Canceled {
			err = fmt.Errorf("stage execution cancelled by user")
			o.logger.Info("Stage execution cancelled",
				zap.String("session_id", sessionIDStr),
				zap.String("stage_id", stage.StageID),
			)
			// Mark stage as cancelled (use Background context to ensure DB update completes)
			stage.Status = models.StageStatusCancelled
			o.stageRepo.Update(context.Background(), stage, o.db)
		} else {
			err = fmt.Errorf("stage execution timeout after 45 minutes - process may be hung")
			o.logger.Error("Stage execution timeout",
				zap.String("session_id", sessionIDStr),
				zap.String("stage_id", stage.StageID),
				zap.String("error", "Stage exceeded 45 minute timeout without completing"),
			)
		}
	}

	if err != nil {
		// Don't call failStage if it was a cancellation
		if sessionCtx.Err() == context.Canceled {
			return err
		}
		return o.failStage(ctx, stage, err)
	}

	// Handle step completion
	return o.completeStage(ctx, session, stage, output)
}

// completeStage marks a stage as completed and handles the output
func (o *StepOrchestrator) completeStage(
	ctx context.Context,
	session *models.ProcessingSession,
	stage *models.ProcessingStage,
	output *StepOutput,
) error {
	now := time.Now()
	// BUGFIX: Don't hardcode status - will be determined by auto_proceed setting below
	// stage.Status = models.StageStatusCompleted
	stage.Progress = 100
	stage.CompletedAt = &now

	// Store artifact path in message field
	if output.TempArtifactPath != nil {
		stage.Message = output.TempArtifactPath
	}

	// BUGFIX #12: Store handler output metadata in stage for next stage to consume
	if len(output.Metadata) > 0 {
		if stage.Metadata == nil {
			stage.Metadata = models.JSONMap{}
		}
		for k, v := range output.Metadata {
			stage.Metadata[k] = v
		}
	}

	// BUGFIX: Store preview URL in metadata for session restoration
	if output.PreviewURL != nil {
		if stage.Metadata == nil {
			stage.Metadata = models.JSONMap{}
		}
		stage.Metadata["preview_url"] = *output.PreviewURL
	}

	// CRITICAL: Determine final stage status BEFORE database update
	// In step-by-step mode (auto_proceed=false), mark as "reviewing" so user can accept/retry
	// In auto-proceed mode, mark as "completed" and automatically move to next stage
	if !session.AutoProceed {
		stage.Status = models.StageStatusReviewing
	} else {
		stage.Status = models.StageStatusCompleted
	}

	o.logger.Info("[STATUS-TRANSITION] Preparing to commit stage status to database",
		zap.String("session_id", session.ID.String()),
		zap.String("stage_id", stage.StageID),
		zap.String("stage_uuid", stage.ID.String()), // CRITICAL: Log the UUID being used in WHERE clause
		zap.String("new_status", string(stage.Status)),
		zap.Bool("auto_proceed", session.AutoProceed),
		zap.String("transition", fmt.Sprintf("processing → %s", stage.Status)))

	// CRITICAL FIX: Use explicit transaction to ensure commit is visible to subsequent queries
	// Without this, the UPDATE happens in an implicit transaction that may not be flushed
	// before the goroutine's SELECT query runs, causing read-after-write inconsistency
	tx, err := o.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback() // Rollback if we don't reach commit

	// Perform the UPDATE inside the transaction
	updateQuery := `
		UPDATE processing_stages SET
			status = $2, progress = $3, message = $4, skip_reason = $5,
			input_from_stage_id = $6, attempt_count = $7, started_at = $8,
			completed_at = $9, metadata = $10, updated_at = $11
		WHERE id = $1
	`

	stage.UpdatedAt = time.Now()

	// Initialize metadata if nil
	if stage.Metadata == nil {
		stage.Metadata = models.JSONMap{}
	}

	// Marshal metadata to JSON string
	metadataBytes, err := json.Marshal(stage.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	result, err := tx.ExecContext(ctx, updateQuery,
		stage.ID,
		stage.Status,
		stage.Progress,
		stage.Message,
		stage.SkipReason,
		stage.InputFromStageID,
		stage.AttemptCount,
		stage.StartedAt,
		stage.CompletedAt,
		string(metadataBytes),
		stage.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update stage: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("UPDATE affected 0 rows - stage ID may not exist: %s", stage.ID.String())
	}

	// CRITICAL: Commit the transaction BEFORE spawning goroutine
	// This ensures the UPDATE is flushed and visible to all subsequent queries
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit stage update: %w", err)
	}

	o.logger.Info("[STATUS-TRANSITION] Stage status COMMITTED to database - now visible to all queries",
		zap.String("session_id", session.ID.String()),
		zap.String("stage_id", stage.StageID),
		zap.String("stage_uuid", stage.ID.String()), // CRITICAL: Verify same UUID
		zap.String("committed_status", string(stage.Status)),
		zap.Int64("rows_affected", rowsAffected),
		zap.Time("commit_time", time.Now()))

	// CRITICAL FIX: DO NOT cleanup previous stage artifacts after each stage completes!
	// Temp artifacts must remain accessible so users can switch between stage previews.
	// Cleanup only happens when:
	//   1. Session is cancelled (handled by SessionCleanupService.CleanupSessionCompletely)
	//   2. Session is finalized (handled by SessionCleanupService.CleanupSessionAfterSave)
	//   3. Session becomes stale/inactive for 30min (handled by SessionCleanupService.CleanupStaleSessionWithDraft)
	// o.cleanupPreviousStageArtifacts(ctx, session, stage) // REMOVED: Too aggressive, breaks stage preview navigation

	// CRITICAL: Update in-memory SSE session so reconnections show correct status
	o.sseManager.UpdateStageComplete(session.ID.String(), stage.StageID, 100, stage.Metadata)

	// Emit preview_ready event if there's a preview URL
	if output.PreviewURL != nil {
		stageID := stage.StageID
		o.sseManager.BroadcastStudioEvent(sse.StudioEvent{
			ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
			Type:      "preview_ready",
			SessionID: session.ID.String(),
			JobID:     session.ID.String(),
			StageID:   &stageID,
			Preview: &sse.PreviewData{
				Type:       "video",
				Content:    *output.PreviewURL, // Keep for backwards compatibility
				PreviewURL: *output.PreviewURL, // Add explicit preview_url field
				URL:        *output.PreviewURL, // Add url alias
				StageID:    stage.StageID,
				Quality:    0.85,
				IsPartial:  false,
				Metadata:   stage.Metadata, // CRITICAL: Include metadata for aspect_ratio
			},
			Timestamp: time.Now(),
		})
	}

	// Emit step_complete event with metadata
	// Note: stage.Status was already set above based on auto_proceed setting
	stageID := stage.StageID
	o.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:      "step_complete",
		SessionID: session.ID.String(),
		JobID:     session.ID.String(),
		StageID:   &stageID,
		Stage: &sse.ProcessingStageEvent{
			ID:          stage.StageID,
			Name:        stage.StageName,
			DisplayName: stage.DisplayName,
			Order:       stage.StageOrder,
			Status:      stage.Status, // BUGFIX: Use stage.Status (already set to "reviewing" or "completed")
			Progress:    100,
			Message:     "",
			StartedAt:   stage.StartedAt,
			CompletedAt: stage.CompletedAt,
			Metadata:    stage.Metadata, // BUGFIX: Include metadata with clips
		},
		Data: map[string]interface{}{
			"auto_proceed":         session.AutoProceed,
			"requires_user_action": !session.AutoProceed, // Signal to frontend
		},
		Timestamp: time.Now(),
	})

	// BUGFIX: Only auto-proceed if enabled
	// In step-by-step mode (auto_proceed=false), wait for user to call /accept endpoint
	if session.AutoProceed {
		o.logger.Info("[AUTO-PROCEED] Spawning goroutine for next stage execution",
			zap.String("session_id", session.ID.String()),
			zap.String("completed_stage", stage.StageID),
			zap.String("committed_status", string(stage.Status)))

		// CRITICAL: With explicit transaction commit above, the UPDATE is now guaranteed
		// to be visible to all subsequent queries. Execute next step in goroutine.
		// Any async progress updates will now be protected by UpdateStatus atomic WHERE clause
		go func() {
			// Use a fresh context since the original might be cancelled
			freshCtx := context.Background()

			// BUGFIX: Retry mechanism to handle PostgreSQL connection pool read-after-write consistency
			// Even after explicit commit, connection pooling can cause next query to use
			// a different connection that hasn't seen the commit yet.
			var freshSession *models.ProcessingSession
			var freshStages []*models.ProcessingStage
			var err error

			maxRetries := 5
			baseDelay := 10 * time.Millisecond // Start small: 10ms, 20ms, 40ms, 80ms, 160ms

			for attempt := 0; attempt < maxRetries; attempt++ {
				if attempt > 0 {
					delay := baseDelay * time.Duration(1<<uint(attempt-1))
					o.logger.Info("Retrying stage refresh after delay",
						zap.String("session_id", session.ID.String()),
						zap.Int("attempt", attempt),
						zap.Duration("delay", delay))
					time.Sleep(delay)
				}

				// Refresh session and stages from database
				freshSession, err = o.sessionRepo.GetByID(freshCtx, session.ID, o.db)
				if err != nil {
					o.logger.Error("Failed to get fresh session for auto-proceed",
						zap.String("session_id", session.ID.String()),
						zap.Int("attempt", attempt),
						zap.Error(err))
					continue // Retry
				}

				freshStages, err = o.stageRepo.GetBySessionID(freshCtx, session.ID, o.db)
				if err != nil {
					o.logger.Error("Failed to get fresh stages for auto-proceed",
						zap.String("session_id", session.ID.String()),
						zap.Int("attempt", attempt),
						zap.Error(err))
					continue // Retry
				}

				// Check if the just-completed stage is now showing as "completed" (not "processing")
				completedStageFound := false
				for _, s := range freshStages {
					if s.StageID == stage.StageID && s.Status == models.StageStatusCompleted {
						completedStageFound = true
						break
					}
				}

				if completedStageFound {
					o.logger.Info("Stage status correctly reflects completion after refresh",
						zap.String("session_id", session.ID.String()),
						zap.String("stage_id", stage.StageID),
						zap.Int("attempt", attempt))
					break // Success!
				}

				// Stage still shows as "processing" - retry
				o.logger.Warn("Stage still shows as processing after commit, will retry",
					zap.String("session_id", session.ID.String()),
					zap.String("stage_id", stage.StageID),
					zap.Int("attempt", attempt),
					zap.Strings("stage_statuses", getStageStatuses(freshStages)))
			}

			if freshSession == nil || len(freshStages) == 0 {
				o.logger.Error("Failed to refresh session/stages after all retries",
					zap.String("session_id", session.ID.String()))
				return
			}

			o.logger.Info("Refreshed stages for auto-proceed",
				zap.String("session_id", session.ID.String()),
				zap.Strings("stage_statuses", getStageStatuses(freshStages)))

			// Find next executable stage
			nextStage := o.findNextExecutableStage(freshStages)
			if nextStage == nil {
				o.logger.Info("No more executable stages after refresh - completing session",
					zap.String("session_id", session.ID.String()))
				if err := o.completeSession(freshCtx, freshSession); err != nil {
					o.logger.Error("Failed to complete session",
						zap.String("session_id", session.ID.String()),
						zap.Error(err))
				}
				return
			}

			o.logger.Info("Executing next stage after auto-proceed",
				zap.String("session_id", session.ID.String()),
				zap.String("next_stage_id", nextStage.StageID))

			if err := o.executeStage(freshCtx, freshSession, nextStage, freshStages); err != nil {
				o.logger.Error("Failed to execute next stage",
					zap.String("session_id", session.ID.String()),
					zap.String("stage_id", nextStage.StageID),
					zap.Error(err))
			}
		}()
		return nil
	} else {
		o.logger.Info("Step-by-step mode, waiting for user acceptance",
			zap.String("session_id", session.ID.String()),
			zap.String("completed_stage", stage.StageID))
	}

	return nil
}

// cleanupPreviousStageArtifacts deletes temp artifacts from previous stages
// This is called after a stage completes successfully to free up storage space
func (o *StepOrchestrator) cleanupPreviousStageArtifacts(
	ctx context.Context,
	session *models.ProcessingSession,
	currentStage *models.ProcessingStage,
) {
	// Get all stages for this session
	stages, err := o.stageRepo.GetBySessionID(ctx, session.ID, o.db)
	if err != nil {
		o.logger.Warn("Failed to get stages for cleanup",
			zap.String("session_id", session.ID.String()),
			zap.Error(err))
		return
	}

	// Find the stage that this stage depends on (input_from_stage_id)
	var previousStage *models.ProcessingStage
	if currentStage.InputFromStageID != nil {
		for _, s := range stages {
			if s.ID == *currentStage.InputFromStageID {
				previousStage = s
				break
			}
		}
	}

	// If no explicit dependency, find the previous stage by order
	if previousStage == nil && currentStage.StageOrder > 1 {
		for _, s := range stages {
			if s.StageOrder == currentStage.StageOrder-1 {
				previousStage = s
				break
			}
		}
	}

	// If we found a previous stage, clean up its temp artifacts
	if previousStage != nil {
		// Only cleanup if the previous stage is completed/accepted (not if it might be retried)
		if previousStage.Status == models.StageStatusCompleted ||
			previousStage.Status == models.StageStatusAccepted {

			// Extract temp artifact path from previous stage's message field
			if previousStage.Message != nil && *previousStage.Message != "" {
				tempPath := *previousStage.Message

				o.logger.Info("Cleaning up previous stage temp artifact",
					zap.String("session_id", session.ID.String()),
					zap.String("current_stage", currentStage.StageID),
					zap.String("previous_stage", previousStage.StageID),
					zap.String("temp_path", tempPath))

				// Delete from temp storage (cloud)
				if err := o.tempStorageService.DeleteByPath(ctx, tempPath); err != nil {
					o.logger.Warn("Failed to delete previous stage temp artifact",
						zap.String("session_id", session.ID.String()),
						zap.String("stage_id", previousStage.StageID),
						zap.String("temp_path", tempPath),
						zap.Error(err))
				} else {
					o.logger.Info("Successfully cleaned up previous stage artifact",
						zap.String("session_id", session.ID.String()),
						zap.String("stage_id", previousStage.StageID))
				}
			}
		}
	}
}

// failStage marks a stage as failed
func (o *StepOrchestrator) failStage(ctx context.Context, stage *models.ProcessingStage, err error) error {
	now := time.Now()
	stage.Status = models.StageStatusFailed
	stage.CompletedAt = &now
	errorMsg := err.Error()
	stage.Message = &errorMsg

	if updateErr := o.stageRepo.Update(ctx, stage, o.db); updateErr != nil {
		o.logger.Error("Failed to update failed stage", zap.Error(updateErr))
	}

	// Emit error event
	o.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "error",
		SessionID: stage.SessionID.String(),
		StageID:   &stage.StageID,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"stage_id":  stage.StageID,
			"error":     err.Error(),
			"retryable": true,
		},
	})

	return err
}

// completeSession marks the session as completed
func (o *StepOrchestrator) completeSession(ctx context.Context, session *models.ProcessingSession) error {
	session.Status = models.SessionStatusCompleted
	now := time.Now()
	session.CompletedAt = &now

	if err := o.sessionRepo.Update(ctx, session, o.db); err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}

	// Emit job_complete event
	o.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "job_complete",
		SessionID: session.ID.String(),
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"session_id":   session.ID,
			"completed_at": now,
			"status":       "completed",
		},
	})

	return nil
}

// findNextExecutableStage finds the next stage that can be executed
func (o *StepOrchestrator) findNextExecutableStage(stages []*models.ProcessingStage) *models.ProcessingStage {
	for _, stage := range stages {
		if stage.Status != models.StageStatusPending {
			continue
		}

		// Check if all dependencies are met
		if o.areDependenciesMet(stage, stages) {
			return stage
		}
	}
	return nil
}

// Helper functions for logging
func getStageIDs(stages []*models.ProcessingStage) []string {
	ids := make([]string, len(stages))
	for i, s := range stages {
		ids[i] = s.StageID
	}
	return ids
}

func getStageStatuses(stages []*models.ProcessingStage) []string {
	statuses := make([]string, len(stages))
	for i, s := range stages {
		statuses[i] = string(s.Status)
	}
	return statuses
}

// areDependenciesMet checks if all dependencies for a stage are satisfied
func (o *StepOrchestrator) areDependenciesMet(stage *models.ProcessingStage, allStages []*models.ProcessingStage) bool {
	if len(stage.Dependencies) == 0 {
		return true
	}

	// Extract dependency IDs from JSONMap
	for _, depValue := range stage.Dependencies {
		depID, ok := depValue.(string)
		if !ok {
			continue
		}

		depMet := false
		for _, s := range allStages {
			if s.StageID == depID {
				// A dependency is met if the stage is completed, accepted, skipped, or auto-skipped
				if s.Status == models.StageStatusCompleted ||
					s.Status == models.StageStatusAccepted ||
					s.Status == models.StageStatusSkipped ||
					s.Status == models.StageStatusSkippedAuto {
					depMet = true
					break
				}
			}
		}
		if !depMet {
			return false
		}
	}
	return true
}

// getStageDefinitions returns stage definitions for a pipeline type
func (o *StepOrchestrator) getStageDefinitions(pipelineType string, selectedStages []string) []StepDefinition {
	switch pipelineType {
	case "platform_optimization":
		return o.getPlatformOptimizationStages()
	case "clipping":
		return o.getClippingStages()
	case "story_video":
		return o.getStoryVideoStages()
	case "custom_pipeline":
		return o.getCustomPipelineStages(selectedStages)
	default:
		return []StepDefinition{}
	}
}

// getPlatformOptimizationStages returns stages for platform optimization
func (o *StepOrchestrator) getPlatformOptimizationStages() []StepDefinition {
	return []StepDefinition{
		{
			StageID:      "crop_resize",
			StageName:    "crop_resize",
			DisplayName:  "Crop & Resize",
			StageOrder:   1,
			Dependencies: []string{},
			CanSkip:      false,
			IsOptional:   false,
		},
		{
			StageID:      "burn_captions",
			StageName:    "burn_captions",
			DisplayName:  "Burn Captions",
			StageOrder:   2,
			Dependencies: []string{"crop_resize"},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "text_overlay",
			StageName:    "text_overlay",
			DisplayName:  "Text Overlay",
			StageOrder:   3,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "apply_broll",
			StageName:    "apply_broll",
			DisplayName:  "Apply B-roll",
			StageOrder:   4,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "noise_removal",
			StageName:    "noise_removal",
			DisplayName:  "Remove Noise",
			StageOrder:   5,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "mix_music",
			StageName:    "mix_music",
			DisplayName:  "Mix Music",
			StageOrder:   6,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "apply_branding",
			StageName:    "apply_branding",
			DisplayName:  "Apply Branding",
			StageOrder:   7,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "enhance",
			StageName:    "enhance",
			DisplayName:  "Enhance Video",
			StageOrder:   8,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "text_optimization",
			StageName:    "text_optimization",
			DisplayName:  "Optimize Text",
			StageOrder:   9,
			Dependencies: []string{}, // No dependency on video steps
			CanSkip:      true,
			IsOptional:   true,
		},
	}
}

// getClippingStages returns stages for clipping
func (o *StepOrchestrator) getClippingStages() []StepDefinition {
	return []StepDefinition{
		{
			StageID:      "generate_highlights",
			StageName:    "generate_highlights",
			DisplayName:  "Generate Highlights",
			StageOrder:   1,
			Dependencies: []string{},
			CanSkip:      false,
			IsOptional:   false,
		},
		{
			StageID:      "extract_clips",
			StageName:    "extract_clips",
			DisplayName:  "Extract Clips",
			StageOrder:   2,
			Dependencies: []string{"generate_highlights"},
			CanSkip:      false,
			IsOptional:   false,
		},
	}
}

// getStoryVideoStages returns stages for story video
// THREE-STEP WORKFLOW for better user control:
// 1. Extract clips from testimonials (with preview)
// 2. AI smart ordering (user can accept/reject/reorder manually)
// 3. Assemble draft video (first finished product)
// Then optional enhancements (intro/outro, branding, music, etc.)
func (o *StepOrchestrator) getStoryVideoStages() []StepDefinition {
	return []StepDefinition{
		// {
		// 	StageID:      "extract_clips",
		// 	StageName:    "extract_clips",
		// 	DisplayName:  "Extract & Collect Clips",
		// 	StageOrder:   1,
		// 	Dependencies: []string{},
		// 	CanSkip:      false, // Cannot skip - need clips to proceed
		// 	IsOptional:   false,
		// },
		// {
		// 	StageID:      "ai_ordering",
		// 	StageName:    "ai_ordering",
		// 	DisplayName:  "AI Smart Ordering",
		// 	StageOrder:   2,
		// 	Dependencies: []string{"extract_clips"},
		// 	CanSkip:      true, // Can skip and use manual timeline order
		// 	IsOptional:   true,
		// },
		{
			StageID:     "assemble_clips",
			StageName:   "assemble_clips",
			DisplayName: "Assemble Story Clips",
			StageOrder:  1,
			// Dependencies: []string{"extract_clips"}, // Only needs clips, not ordering
			Dependencies: []string{},
			CanSkip:      false, // Cannot skip - this creates the video
			IsOptional:   false,
		},
		{
			StageID:      "add_intro_outro",
			StageName:    "add_intro_outro",
			DisplayName:  "Add Intro/Outro",
			StageOrder:   2,
			Dependencies: []string{"assemble_clips"},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "text_overlay",
			StageName:    "text_overlay",
			DisplayName:  "Text Overlay",
			StageOrder:   3,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "apply_broll",
			StageName:    "apply_broll",
			DisplayName:  "Apply B-roll",
			StageOrder:   4,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "apply_branding",
			StageName:    "apply_branding",
			DisplayName:  "Apply Branding",
			StageOrder:   5,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "noise_removal",
			StageName:    "noise_removal",
			DisplayName:  "Remove Noise",
			StageOrder:   6,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "mix_music",
			StageName:    "mix_music",
			DisplayName:  "Mix Music",
			StageOrder:   7,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
		{
			StageID:      "enhance",
			StageName:    "enhance",
			DisplayName:  "Enhance Video",
			StageOrder:   8,
			Dependencies: []string{},
			CanSkip:      true,
			IsOptional:   true,
		},
	}
}

// getCustomPipelineStages returns dynamically generated stages based on user's selected steps
// Unlike fixed pipelines, custom pipeline allows users to select and reorder processing steps
func (o *StepOrchestrator) getCustomPipelineStages(selectedStages []string) []StepDefinition {
	// Map of all available step types to their display names
	stageDisplayNames := map[string]string{
		"crop_resize":          "Crop & Resize",
		"burn_captions":        "Burn Captions",
		"text_overlay":         "Text Overlay",
		"noise_removal":        "Remove Noise",
		"mix_music":            "Mix Music",
		"apply_branding":       "Apply Branding",
		"apply_broll":          "Apply B-roll",
		"enhance":              "Enhance Video",
		"audio_normalization":  "Normalize Audio",
		"captions":             "Burn Captions", // Alias for burn_captions
		"branding":             "Apply Branding", // Alias for apply_branding
		"music_mix":            "Mix Music",      // Alias for mix_music
		"enhancement":          "Enhance Video",  // Alias for enhance
		"broll":                "Apply B-roll",   // Alias for apply_broll
	}

	// Normalize step names (frontend uses some aliases)
	normalizeStepName := func(stepName string) string {
		switch stepName {
		case "captions":
			return "burn_captions"
		case "branding":
			return "apply_branding"
		case "music_mix":
			return "mix_music"
		case "enhancement":
			return "enhance"
		case "broll":
			return "apply_broll"
		default:
			return stepName
		}
	}

	// Build stage definitions based on user's selected steps
	var stages []StepDefinition

	for i, stepType := range selectedStages {
		normalizedName := normalizeStepName(stepType)
		displayName := stageDisplayNames[normalizedName]
		if displayName == "" {
			displayName = normalizedName // Fallback to stage ID if no display name
		}

		stage := StepDefinition{
			StageID:      normalizedName,
			StageName:    normalizedName,
			DisplayName:  displayName,
			StageOrder:   i + 1, // Order based on user's selection
			Dependencies: []string{},
			CanSkip:      true,  // All custom pipeline steps can be skipped
			IsOptional:   true,  // All custom pipeline steps are optional (user controls which to include)
		}

		// Sequential dependency: each stage depends on previous one
		// This ensures proper artifact chaining (each step uses output from previous step)
		if i > 0 {
			prevStepName := normalizeStepName(selectedStages[i-1])
			stage.Dependencies = []string{prevStepName}
		}

		stages = append(stages, stage)
	}

	return stages
}

// getStepHandler is defined in platform_optimization_orchestrator.go

// CleanupStaleProcessingStages marks stages stuck in "processing" as failed
func (o *StepOrchestrator) CleanupStaleProcessingStages(ctx context.Context) error {
	// Define stale threshold - if a stage has been processing for > 60 minutes WITH NO ACTIVITY, it's stale
	// Note: Stages in "reviewing" status are not affected (waiting for user acceptance)
	// BUGFIX: Increased from 30m to 60m to accommodate long-running story video assembly operations
	// CRITICAL FIX: Use updated_at instead of started_at to detect truly stale stages
	// A stage is only stale if it hasn't been updated (no progress) for the threshold period
	staleThreshold := 60 * time.Minute

	// Query all processing stages that haven't been updated recently
	// A stage is stale if: status='processing' AND updated_at hasn't changed in 60 minutes
	// This correctly identifies stuck stages while allowing long-running operations that emit progress
	query := `
		SELECT id, session_id, stage_id, stage_name, display_name, stage_order, status,
		       progress, started_at, completed_at, message, skip_reason,
		       input_from_stage_id, attempt_count
		FROM processing_stages
		WHERE status = 'processing' AND updated_at < $1
	`

	cutoffTime := time.Now().Add(-staleThreshold)
	rows, err := o.db.QueryContext(ctx, query, cutoffTime)
	if err != nil {
		return fmt.Errorf("failed to query stale stages: %w", err)
	}
	defer rows.Close()

	var staleStages []*models.ProcessingStage
	for rows.Next() {
		stage := &models.ProcessingStage{}
		err := rows.Scan(
			&stage.ID,
			&stage.SessionID,
			&stage.StageID,
			&stage.StageName,
			&stage.DisplayName,
			&stage.StageOrder,
			&stage.Status,
			&stage.Progress,
			&stage.StartedAt,
			&stage.CompletedAt,
			&stage.Message,
			&stage.SkipReason,
			&stage.InputFromStageID,
			&stage.AttemptCount,
		)
		if err != nil {
			o.logger.Error("Failed to scan stale stage", zap.Error(err))
			continue
		}
		staleStages = append(staleStages, stage)
	}

	// Mark all stale stages as failed
	for _, stage := range staleStages {
		o.logger.Warn("Detected stale processing stage",
			zap.String("session_id", stage.SessionID.String()),
			zap.String("stage_id", stage.StageID),
			zap.Time("started_at", *stage.StartedAt),
		)

		// Use the existing failStage method
		if err := o.failStage(ctx, stage, fmt.Errorf("stage timeout - no progress for 60 minutes")); err != nil {
			o.logger.Error("Failed to mark stale stage as failed",
				zap.String("stage_id", stage.StageID),
				zap.Error(err),
			)
		}
	}

	if len(staleStages) > 0 {
		o.logger.Info("Cleaned up stale processing stages", zap.Int("count", len(staleStages)))
	}

	return nil
}

// CheckAndExecuteNextStage checks for the next executable stage and executes it
// Used after skip, retry, or other user actions that should trigger auto-proceed
func (o *StepOrchestrator) CheckAndExecuteNextStage(ctx context.Context, session *models.ProcessingSession) error {
	o.logger.Info("CheckAndExecuteNextStage called",
		zap.String("session_id", session.ID.String()),
		zap.Bool("auto_proceed", session.AutoProceed))

	if !session.AutoProceed {
		o.logger.Info("Auto-proceed disabled, skipping next stage execution",
			zap.String("session_id", session.ID.String()))
		return nil
	}

	// Get fresh stages from database
	stages, err := o.stageRepo.GetBySessionID(ctx, session.ID, o.db)
	if err != nil {
		return fmt.Errorf("failed to get stages: %w", err)
	}

	o.logger.Info("Retrieved stages for next execution check",
		zap.String("session_id", session.ID.String()),
		zap.Int("total_stages", len(stages)),
		zap.Strings("stage_statuses", getStageStatuses(stages)))

	// Find next executable stage
	nextStage := o.findNextExecutableStage(stages)
	if nextStage == nil {
		o.logger.Info("No more executable stages - completing session",
			zap.String("session_id", session.ID.String()),
			zap.Strings("final_stage_statuses", getStageStatuses(stages)))

		// Check if all stages are skipped or completed - complete the session
		if err := o.completeSession(ctx, session); err != nil {
			o.logger.Error("Failed to complete session",
				zap.String("session_id", session.ID.String()),
				zap.Error(err))
			return fmt.Errorf("failed to complete session: %w", err)
		}

		o.logger.Info("Session completed successfully",
			zap.String("session_id", session.ID.String()),
			zap.String("status", session.Status))
		return nil
	}

	o.logger.Info("Executing next stage",
		zap.String("session_id", session.ID.String()),
		zap.String("next_stage_id", nextStage.StageID),
		zap.String("next_stage_name", nextStage.StageName))

	// Execute the next stage
	if err := o.executeStage(ctx, session, nextStage, stages); err != nil {
		o.logger.Error("Failed to execute next stage",
			zap.String("session_id", session.ID.String()),
			zap.String("stage_id", nextStage.StageID),
			zap.Error(err))
		return fmt.Errorf("failed to execute next stage: %w", err)
	}

	return nil
}

// getOrCreateSessionContext gets an existing session context or creates a new one
func (o *StepOrchestrator) getOrCreateSessionContext(parentCtx context.Context, sessionID string) context.Context {
	o.cancelMutex.Lock()
	defer o.cancelMutex.Unlock()

	// Return existing context if it exists
	if sessCtx, exists := o.sessionContexts[sessionID]; exists {
		return sessCtx.ctx
	}

	// Create new cancellable context for this session
	ctx, cancel := context.WithCancel(parentCtx)
	o.sessionContexts[sessionID] = &sessionContext{
		ctx:    ctx,
		cancel: cancel,
	}

	o.logger.Debug("Created new session context",
		zap.String("session_id", sessionID))

	return ctx
}

// CleanupSessionContext removes the session context and calls cancel
// This should be called when a session completes or is finalized
func (o *StepOrchestrator) CleanupSessionContext(sessionID string) {
	o.cancelMutex.Lock()
	defer o.cancelMutex.Unlock()

	if sessCtx, exists := o.sessionContexts[sessionID]; exists {
		sessCtx.cancel() // Cancel the context
		delete(o.sessionContexts, sessionID)
		o.logger.Debug("Cleaned up session context",
			zap.String("session_id", sessionID))
	}
}

// CancelSession cancels an ongoing session and notifies the AI service
func (o *StepOrchestrator) CancelSession(ctx context.Context, sessionID uuid.UUID, mediaIntelligence MediaIntelligence) error {
	sessionIDStr := sessionID.String()

	o.logger.Info("Cancelling session", zap.String("session_id", sessionIDStr))

	// Cancel the context to stop any ongoing stage execution
	o.cancelMutex.Lock()
	if sessCtx, exists := o.sessionContexts[sessionIDStr]; exists {
		sessCtx.cancel()
		// Don't delete yet - let cleanup happen via CleanupSessionContext
	}
	o.cancelMutex.Unlock()

	// Notify AI service to cancel the job (for gRPC client)
	if mediaIntelligence != nil {
		if grpcClient, ok := mediaIntelligence.(*GRPCClient); ok {
			if err := grpcClient.CancelJob(ctx, sessionIDStr); err != nil {
				o.logger.Warn("Failed to cancel job in AI service via gRPC",
					zap.String("session_id", sessionIDStr),
					zap.Error(err))
				// Don't return error - continue with local cancellation
			}
		}
	}

	// Use Background context for DB operations to ensure they complete
	bgCtx := context.Background()

	// Update session status to cancelled
	session, err := o.sessionRepo.GetByID(bgCtx, sessionID, o.db)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	session.Status = models.SessionStatusCancelled
	if err := o.sessionRepo.Update(bgCtx, session, o.db); err != nil {
		return fmt.Errorf("failed to update session status: %w", err)
	}

	// Update all pending/processing stages to cancelled
	stages, err := o.stageRepo.GetBySessionID(bgCtx, sessionID, o.db)
	if err == nil {
		for _, stage := range stages {
			if stage.Status == models.StageStatusPending || stage.Status == models.StageStatusProcessing {
				stage.Status = models.StageStatusCancelled
				o.stageRepo.Update(bgCtx, stage, o.db)
			}
		}
	}

	// Emit cancellation event
	o.sseManager.BroadcastStudioEvent(sse.StudioEvent{
		Type:      "job_cancelled",
		SessionID: sessionIDStr,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"session_id": sessionIDStr,
			"message":    "Session cancelled by user",
		},
	})

	o.logger.Info("Session cancelled successfully", zap.String("session_id", sessionIDStr))
	return nil
}

// Helper function
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
