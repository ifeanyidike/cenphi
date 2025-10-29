package services

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"go.uber.org/zap"
)

// SessionCleanupService handles automatic cleanup of stale sessions and temp artifacts
// Works for ALL AI services: platform_optimization, clipping, story_video
type SessionCleanupService struct {
	db                  *sql.DB
	sessionRepo         repositories.ProcessingSessionRepository
	stageRepo           repositories.ProcessingStageRepository
	tempArtifactsRepo   repositories.TempArtifactsRepository
	artifactsRepo       repositories.TestimonialArtifactRepository
	tempStorage         *storage.TempStorageService
	logger              *zap.Logger
	inactivityTimeout   time.Duration
}

func NewSessionCleanupService(
	db *sql.DB,
	sessionRepo repositories.ProcessingSessionRepository,
	stageRepo repositories.ProcessingStageRepository,
	tempArtifactsRepo repositories.TempArtifactsRepository,
	artifactsRepo repositories.TestimonialArtifactRepository,
	tempStorage *storage.TempStorageService,
	logger *zap.Logger,
) *SessionCleanupService {
	return &SessionCleanupService{
		db:                db,
		sessionRepo:       sessionRepo,
		stageRepo:         stageRepo,
		tempArtifactsRepo: tempArtifactsRepo,
		artifactsRepo:     artifactsRepo,
		tempStorage:       tempStorage,
		logger:            logger,
		inactivityTimeout: 30 * time.Minute, // 30 minutes inactivity = stale
	}
}

// RunCleanupLoop runs periodic cleanup in background goroutine
func (s *SessionCleanupService) RunCleanupLoop(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute) // Check every 5 minutes
	defer ticker.Stop()

	s.logger.Info("🧹 Session cleanup service started",
		zap.Duration("inactivity_timeout", s.inactivityTimeout),
		zap.Duration("check_interval", 5*time.Minute))

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("Session cleanup service stopped")
			return
		case <-ticker.C:
			if err := s.CleanupStaleSessions(ctx); err != nil {
				s.logger.Error("Failed to cleanup stale sessions", zap.Error(err))
			}
		}
	}
}

// CleanupStaleSessions finds and cleans up sessions inactive for > 30 minutes
// Applies to ALL services: platform_optimization, clipping, story_video
func (s *SessionCleanupService) CleanupStaleSessions(ctx context.Context) error {
	s.logger.Info("🔍 Checking for stale sessions...")

	// Find sessions inactive for > 30 minutes
	cutoffTime := time.Now().Add(-s.inactivityTimeout)

	query := `
		SELECT id, testimonial_id, workspace_id, session_type, status,
		       last_activity_at, is_stale
		FROM processing_sessions
		WHERE status IN ('active', 'paused')
		  AND last_activity_at < $1
		  AND is_stale = FALSE
		ORDER BY last_activity_at ASC
	`

	rows, err := s.db.QueryContext(ctx, query, cutoffTime)
	if err != nil {
		return fmt.Errorf("failed to query stale sessions: %w", err)
	}
	defer rows.Close()

	var staleSessions []models.ProcessingSession
	for rows.Next() {
		var session models.ProcessingSession
		if err := rows.Scan(
			&session.ID,
			&session.TestimonialID,
			&session.WorkspaceID,
			&session.SessionType,
			&session.Status,
			&session.LastActivityAt,
			&session.IsStale,
		); err != nil {
			s.logger.Error("Failed to scan stale session", zap.Error(err))
			continue
		}

		staleSessions = append(staleSessions, session)

		inactiveDuration := time.Since(session.LastActivityAt)
		s.logger.Warn("⏰ Stale session detected",
			zap.String("session_id", session.ID.String()),
			zap.String("type", session.SessionType),
			zap.Time("last_activity", session.LastActivityAt),
			zap.Duration("inactive_for", inactiveDuration))
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("error iterating stale sessions: %w", err)
	}

	if len(staleSessions) == 0 {
		s.logger.Info("✅ No stale sessions found")
		return nil
	}

	s.logger.Info("🗑️ Found stale sessions to cleanup",
		zap.Int("count", len(staleSessions)),
		zap.Duration("inactive_threshold", s.inactivityTimeout))

	// Cleanup each stale session
	cleanedCount := 0
	for _, session := range staleSessions {
		if err := s.CleanupSession(ctx, session.ID); err != nil {
			s.logger.Error("Failed to cleanup session",
				zap.String("session_id", session.ID.String()),
				zap.Error(err))
			// Continue with others
		} else {
			cleanedCount++
		}
	}

	s.logger.Info("✅ Cleanup completed",
		zap.Int("cleaned", cleanedCount),
		zap.Int("total", len(staleSessions)))

	return nil
}

// CleanupSession is the legacy method - now routes to appropriate cleanup based on session state
func (s *SessionCleanupService) CleanupSession(ctx context.Context, sessionID uuid.UUID) error {
	// CRITICAL: Determine if we should save draft or just delete
	// This is called for stale sessions, so we use the smart cleanup
	return s.CleanupStaleSessionWithDraft(ctx, sessionID)
}

// CleanupSessionImmediately performs immediate cleanup without waiting for background loop
// Used when user explicitly cancels a session
func (s *SessionCleanupService) CleanupSessionImmediately(ctx context.Context, sessionID uuid.UUID) error {
	s.logger.Info("🗑️ Immediate cleanup requested",
		zap.String("session_id", sessionID.String()))

	return s.CleanupSession(ctx, sessionID)
}

// CleanupExpiredSessions finds and cleans up expired sessions (legacy method for compatibility)
func (s *SessionCleanupService) CleanupExpiredSessions(ctx context.Context) (int, error) {
	s.logger.Info("Running expired sessions cleanup job")

	// First, cleanup expired temp artifacts from database
	expiredCount, err := s.tempArtifactsRepo.DeleteExpiredArtifacts(ctx, s.db)
	if err != nil {
		s.logger.Error("Failed to cleanup expired artifacts", zap.Error(err))
		return 0, fmt.Errorf("failed to cleanup expired artifacts: %w", err)
	}

	s.logger.Info("Expired temp artifacts cleaned up", zap.Int("count", expiredCount))

	// Now run stale session cleanup
	if err := s.CleanupStaleSessions(ctx); err != nil {
		s.logger.Error("Failed to cleanup stale sessions", zap.Error(err))
	}

	return expiredCount, nil
}

// ExtendSessionTTL extends TTL for a resumed session
func (s *SessionCleanupService) ExtendSessionTTL(ctx context.Context, sessionID uuid.UUID) error {
	// Extend TTL to 1 hour from now
	if err := s.tempArtifactsRepo.ExtendTTL(ctx, sessionID, 1, s.db); err != nil {
		return fmt.Errorf("failed to extend session TTL: %w", err)
	}

	// Update last_activity_at
	updateQuery := `UPDATE processing_sessions SET last_activity_at = $2 WHERE id = $1`
	if _, err := s.db.ExecContext(ctx, updateQuery, sessionID, time.Now()); err != nil {
		s.logger.Warn("Failed to update last_activity_at", zap.Error(err))
	}

	s.logger.Info("Extended session TTL", zap.String("session_id", sessionID.String()))
	return nil
}

// ===== NEW COMPREHENSIVE CLEANUP METHODS =====

// CleanupSessionCompletely deletes ALL temp artifacts without saving drafts
// Used when user explicitly discards or cancels a session
func (s *SessionCleanupService) CleanupSessionCompletely(ctx context.Context, sessionID uuid.UUID) error {
	s.logger.Info("🗑️ Completely cleaning up session (no drafts)",
		zap.String("session_id", sessionID.String()))

	// Delete entire session temp directory from cloud storage
	if err := s.deleteTempDirectory(ctx, sessionID); err != nil {
		s.logger.Warn("Failed to delete temp directory", zap.Error(err))
	}

	// Delete from temp_artifacts table
	if err := s.tempArtifactsRepo.DeleteBySessionID(ctx, sessionID, s.db); err != nil {
		s.logger.Warn("Failed to delete temp artifacts from database", zap.Error(err))
	}

	// Mark session as cancelled
	updateQuery := `UPDATE processing_sessions SET status = 'cancelled', updated_at = $2 WHERE id = $1`
	if _, err := s.db.ExecContext(ctx, updateQuery, sessionID, time.Now()); err != nil {
		return fmt.Errorf("failed to update session status: %w", err)
	}

	s.logger.Info("✅ Session completely cleaned up",
		zap.String("session_id", sessionID.String()))

	return nil
}

// CleanupSessionAfterSave deletes ALL temp artifacts after permanent artifacts are saved
// Used after successful finalization (save/replace)
func (s *SessionCleanupService) CleanupSessionAfterSave(ctx context.Context, sessionID uuid.UUID) error {
	s.logger.Info("🧹 Cleaning up temp artifacts after successful save",
		zap.String("session_id", sessionID.String()))

	// Delete entire session temp directory
	if err := s.deleteTempDirectory(ctx, sessionID); err != nil {
		s.logger.Warn("Failed to delete temp directory after save", zap.Error(err))
	}

	// Delete from temp_artifacts table
	if err := s.tempArtifactsRepo.DeleteBySessionID(ctx, sessionID, s.db); err != nil {
		s.logger.Warn("Failed to delete temp artifacts from database", zap.Error(err))
	}

	s.logger.Info("✅ Temp artifacts cleaned up after save",
		zap.String("session_id", sessionID.String()))

	return nil
}

// CleanupStaleSessionWithDraft saves the last completed stage as draft before cleanup
// CRITICAL: Only saves draft if session meets ALL criteria (see decision tree)
func (s *SessionCleanupService) CleanupStaleSessionWithDraft(ctx context.Context, sessionID uuid.UUID) error {
	s.logger.Info("🧹 Evaluating stale session for draft saving",
		zap.String("session_id", sessionID.String()))

	// STEP 1: Get session info
	session, err := s.sessionRepo.GetByID(ctx, sessionID, s.db)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	// STEP 2: CRITICAL - Check session status
	// DO NOT save draft if session already completed or cancelled
	if session.Status == "completed" || session.Status == "cancelled" {
		s.logger.Info("⏭️ Skipping draft - session already finalized",
			zap.String("session_id", sessionID.String()),
			zap.String("status", session.Status))
		return s.deleteTempDirectory(ctx, sessionID)
	}

	// STEP 3: Get all stages
	stages, err := s.stageRepo.GetBySessionID(ctx, sessionID, s.db)
	if err != nil {
		return fmt.Errorf("failed to get stages: %w", err)
	}

	// STEP 4: CRITICAL - Count completed/reviewing stages
	completedCount := 0
	for _, stage := range stages {
		if stage.Status == models.StageStatusCompleted || stage.Status == models.StageStatusReviewing {
			completedCount++
		}
	}

	// CRITICAL: Require at least 3 completed stages for meaningful progress
	const MIN_STAGES_FOR_DRAFT = 3
	if completedCount < MIN_STAGES_FOR_DRAFT {
		s.logger.Info("⏭️ Skipping draft - insufficient progress",
			zap.String("session_id", sessionID.String()),
			zap.Int("completed_stages", completedCount),
			zap.Int("required", MIN_STAGES_FOR_DRAFT))
		return s.deleteAllAndMarkStale(ctx, sessionID)
	}

	// STEP 5: CRITICAL - Check if draft already saved
	if s.draftAlreadyExists(ctx, sessionID) {
		s.logger.Info("⏭️ Skipping draft - already saved previously",
			zap.String("session_id", sessionID.String()))
		return s.deleteAllAndMarkStale(ctx, sessionID)
	}

	// STEP 6: Find last completed stage with artifact (reverse order)
	var lastStage *models.ProcessingStage
	for i := len(stages) - 1; i >= 0; i-- {
		stage := stages[i]
		if (stage.Status == models.StageStatusCompleted || stage.Status == models.StageStatusReviewing) &&
		   stage.Message != nil && *stage.Message != "" {
			lastStage = stage
			break
		}
	}

	if lastStage == nil {
		s.logger.Info("⏭️ No stage with artifact found",
			zap.String("session_id", sessionID.String()))
		return s.deleteAllAndMarkStale(ctx, sessionID)
	}

	// STEP 7: CRITICAL - Validate stage is meaningful (assemble_clips or later)
	if !s.isStageMeaningful(lastStage.StageID) {
		s.logger.Info("⏭️ Skipping draft - stage not meaningful enough",
			zap.String("session_id", sessionID.String()),
			zap.String("stage_id", lastStage.StageID))
		return s.deleteAllAndMarkStale(ctx, sessionID)
	}

	// STEP 8: Save draft (all checks passed!)
	s.logger.Info("💾 Saving last stage as draft",
		zap.String("session_id", sessionID.String()),
		zap.String("stage_id", lastStage.StageID),
		zap.Int("total_completed", completedCount))

	draftSaved := s.saveStageDraft(ctx, session, lastStage)

	// STEP 9: Delete ALL temp files regardless of draft save success
	if err := s.deleteAllAndMarkStale(ctx, sessionID); err != nil {
		s.logger.Error("Failed to cleanup after draft save", zap.Error(err))
		return err
	}

	s.logger.Info("✅ Stale session cleaned up",
		zap.String("session_id", sessionID.String()),
		zap.Bool("draft_saved", draftSaved),
		zap.Int("completed_stages", completedCount))

	return nil
}

// ===== HELPER METHODS =====

func (s *SessionCleanupService) deleteTempDirectory(ctx context.Context, sessionID uuid.UUID) error {
	sessionTempPattern := fmt.Sprintf("temp/%s/", sessionID.String())
	if err := s.tempStorage.DeleteByPrefix(ctx, sessionTempPattern); err != nil {
		return fmt.Errorf("failed to delete temp directory: %w", err)
	}
	s.logger.Info("✅ Deleted temp directory",
		zap.String("pattern", sessionTempPattern))
	return nil
}

func (s *SessionCleanupService) deleteAllAndMarkStale(ctx context.Context, sessionID uuid.UUID) error {
	// Delete temp directory
	if err := s.deleteTempDirectory(ctx, sessionID); err != nil {
		s.logger.Warn("Failed to delete temp directory", zap.Error(err))
	}

	// Delete from temp_artifacts table
	if err := s.tempArtifactsRepo.DeleteBySessionID(ctx, sessionID, s.db); err != nil {
		s.logger.Warn("Failed to delete temp artifacts from database", zap.Error(err))
	}

	// Mark session as stale and cancelled
	updateQuery := `
		UPDATE processing_sessions
		SET is_stale = TRUE,
		    stale_marked_at = $2,
		    status = 'cancelled',
		    updated_at = $2
		WHERE id = $1
	`
	if _, err := s.db.ExecContext(ctx, updateQuery, sessionID, time.Now()); err != nil {
		return fmt.Errorf("failed to mark session as stale: %w", err)
	}

	return nil
}

func (s *SessionCleanupService) draftAlreadyExists(ctx context.Context, sessionID uuid.UUID) bool {
	// Check if a draft artifact already exists for this session
	query := `
		SELECT COUNT(*) FROM testimonial_artifacts
		WHERE processing_metadata->>'session_id' = $1
		  AND result_category = 'draft'
	`
	var count int
	if err := s.db.QueryRowContext(ctx, query, sessionID.String()).Scan(&count); err != nil {
		s.logger.Warn("Failed to check for existing draft", zap.Error(err))
		return false
	}
	return count > 0
}

func (s *SessionCleanupService) isStageMeaningful(stageID string) bool {
	// Only save drafts for meaningful stages (NOT early stages like extract_clips)
	meaningfulStages := map[string]bool{
		"enhance":          true, // Final stage
		"add_intro_outro":  true,
		"apply_branding":   true,
		"add_music":        true,
		"assemble_clips":   true, // Minimum meaningful stage
	}
	return meaningfulStages[stageID]
}

func (s *SessionCleanupService) saveStageDraft(ctx context.Context, session *models.ProcessingSession, stage *models.ProcessingStage) bool {
	if session.TestimonialID == nil {
		s.logger.Warn("Cannot save draft - no testimonial ID")
		return false
	}

	tempURL := *stage.Message
	if !strings.Contains(tempURL, "/temp/") {
		s.logger.Warn("Stage artifact is not in temp storage", zap.String("url", tempURL))
		return false
	}

	// Copy temp artifact to permanent storage
	permanentURL, err := s.tempStorage.CopyToPermanentStorage(ctx, tempURL, *session.TestimonialID)
	if err != nil {
		s.logger.Error("Failed to copy draft artifact to permanent storage",
			zap.Error(err),
			zap.String("temp_url", tempURL))
		return false
	}

	// Create draft artifact record
	processingType := session.SessionType
	if processingType == "platform_optimization" {
		processingType = "video_platform_optimization"
	}

	draftArtifact := &models.TestimonialArtifact{
		TestimonialID:  session.TestimonialID,
		WorkspaceID:    session.WorkspaceID,
		ProcessingType: processingType,
		ResultCategory: "draft",
		AssetURL:       &permanentURL,
		ContentType:    "video/mp4",
		IsUserSaved:    false, // Draft, not explicitly saved
		IsStreamed:     false,
		ProcessingMetadata: models.JSONMap{
			"session_id":       session.ID.String(),
			"session_type":     session.SessionType,
			"stage_id":         stage.StageID,
			"saved_as_draft":   true,
			"reason":           "stale_session",
			"auto_saved_at":    time.Now().Format(time.RFC3339),
			"last_activity_at": session.LastActivityAt.Format(time.RFC3339),
		},
	}

	if err := s.artifactsRepo.Create(ctx, draftArtifact, s.db); err != nil {
		s.logger.Error("Failed to create draft artifact", zap.Error(err))
		return false
	}

	s.logger.Info("✅ Saved draft artifact",
		zap.String("artifact_id", draftArtifact.ID.String()),
		zap.String("stage_id", stage.StageID),
		zap.String("permanent_url", permanentURL))

	return true
}
