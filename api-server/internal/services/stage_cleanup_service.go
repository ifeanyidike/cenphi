package services

import (
	"context"
	"database/sql"
	"time"

	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

// StageCleanupService handles automatic cleanup of old processing stages
type StageCleanupService struct {
	stageRepo repositories.ProcessingStageRepository
	db        *sql.DB
	logger    *zap.Logger
}

// NewStageCleanupService creates a new stage cleanup service
func NewStageCleanupService(
	stageRepo repositories.ProcessingStageRepository,
	db *sql.DB,
	logger *zap.Logger,
) *StageCleanupService {
	return &StageCleanupService{
		stageRepo: stageRepo,
		db:        db,
		logger:    logger,
	}
}

// CleanupOldStages removes old processing stages based on retention policy:
// - Cancelled sessions: 7 days retention
// - Completed/Failed sessions: 90 days retention
func (s *StageCleanupService) CleanupOldStages(ctx context.Context) error {
	s.logger.Info("🧹 Starting processing stages cleanup job")

	// Define retention periods
	const (
		cancelledRetentionDays = 7
		completedRetentionDays = 90
	)

	cancelledCutoff := time.Now().AddDate(0, 0, -cancelledRetentionDays)
	completedCutoff := time.Now().AddDate(0, 0, -completedRetentionDays)

	// Cleanup stages for cancelled sessions older than 7 days
	cancelledDeleted, err := s.cleanupBySessionStatus(ctx, "cancelled", cancelledCutoff)
	if err != nil {
		s.logger.Error("Failed to cleanup cancelled session stages",
			zap.Error(err),
			zap.Time("cutoff", cancelledCutoff))
		return err
	}

	// Cleanup stages for completed sessions older than 90 days
	completedDeleted, err := s.cleanupBySessionStatus(ctx, "completed", completedCutoff)
	if err != nil {
		s.logger.Error("Failed to cleanup completed session stages",
			zap.Error(err),
			zap.Time("cutoff", completedCutoff))
		return err
	}

	// Cleanup stages for failed sessions older than 90 days
	failedDeleted, err := s.cleanupBySessionStatus(ctx, "failed", completedCutoff)
	if err != nil {
		s.logger.Error("Failed to cleanup failed session stages",
			zap.Error(err),
			zap.Time("cutoff", completedCutoff))
		return err
	}

	totalDeleted := cancelledDeleted + completedDeleted + failedDeleted

	s.logger.Info("✅ Processing stages cleanup completed",
		zap.Int("cancelled_stages_deleted", cancelledDeleted),
		zap.Int("completed_stages_deleted", completedDeleted),
		zap.Int("failed_stages_deleted", failedDeleted),
		zap.Int("total_deleted", totalDeleted),
		zap.Time("cancelled_cutoff", cancelledCutoff),
		zap.Time("completed_cutoff", completedCutoff))

	return nil
}

// cleanupBySessionStatus deletes stages for sessions with the given status older than cutoff
func (s *StageCleanupService) cleanupBySessionStatus(ctx context.Context, status string, cutoff time.Time) (int, error) {
	deleted, err := s.stageRepo.DeleteOldStagesBySessionStatus(ctx, s.db, status, cutoff)
	if err != nil {
		return 0, err
	}

	s.logger.Info("Deleted old processing stages",
		zap.String("session_status", status),
		zap.Int("stages_deleted", deleted),
		zap.Time("cutoff", cutoff))

	return deleted, nil
}

// StartCleanupScheduler starts a background goroutine that runs cleanup daily at 2 AM
func (s *StageCleanupService) StartCleanupScheduler(ctx context.Context) {
	s.logger.Info("🚀 Starting stage cleanup scheduler (runs daily at 2 AM)")

	go func() {
		ticker := time.NewTicker(1 * time.Hour) // Check every hour
		defer ticker.Stop()

		// Run immediately on startup (but wait 30 seconds for app to stabilize)
		time.Sleep(30 * time.Second)
		if err := s.CleanupOldStages(ctx); err != nil {
			s.logger.Error("Initial cleanup failed", zap.Error(err))
		}

		for {
			select {
			case <-ctx.Done():
				s.logger.Info("Stage cleanup scheduler stopped")
				return
			case <-ticker.C:
				// Run cleanup at 2 AM local time
				now := time.Now()
				if now.Hour() == 2 && now.Minute() < 60 {
					if err := s.CleanupOldStages(ctx); err != nil {
						s.logger.Error("Scheduled cleanup failed", zap.Error(err))
					}
				}
			}
		}
	}()
}
