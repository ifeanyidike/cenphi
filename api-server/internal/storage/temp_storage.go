package storage

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// TempArtifact represents a temporary processing artifact
type TempArtifact struct {
	ID            uuid.UUID              `db:"id" json:"id"`
	SessionID     uuid.UUID              `db:"session_id" json:"session_id"`
	StageID       *uuid.UUID             `db:"stage_id" json:"stage_id,omitempty"`
	StoragePath   string                 `db:"storage_path" json:"storage_path"`
	PreviewURL    *string                `db:"preview_url" json:"preview_url,omitempty"`
	ArtifactType  string                 `db:"artifact_type" json:"artifact_type"`
	FileSizeBytes *int64                 `db:"file_size_bytes" json:"file_size_bytes,omitempty"`
	TTLExpiresAt  time.Time              `db:"ttl_expires_at" json:"ttl_expires_at"`
	ExtendedTTL   bool                   `db:"extended_ttl" json:"extended_ttl"`
	IsCheckpoint  bool                   `db:"is_checkpoint" json:"is_checkpoint"`
	Metadata      map[string]interface{} `db:"metadata" json:"metadata"`
	CreatedAt     time.Time              `db:"created_at" json:"created_at"`
}

// StorageRepository defines the interface for temp artifact DB operations
type StorageRepository interface {
	CreateTempArtifact(ctx context.Context, artifact *TempArtifact, db *sql.DB) error
	GetTempArtifactByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*TempArtifact, error)
	GetSessionArtifacts(ctx context.Context, sessionID uuid.UUID, db *sql.DB) ([]*TempArtifact, error)
	UpdatePresignedURL(ctx context.Context, id uuid.UUID, previewURL string, db *sql.DB) error
	ExtendTTLForSession(ctx context.Context, sessionID uuid.UUID, newTTL time.Time, db *sql.DB) (int64, error)
	GetExpiredArtifacts(ctx context.Context, db *sql.DB) ([]*TempArtifact, error)
	DeleteExpiredArtifacts(ctx context.Context, db *sql.DB) (int64, error)
	DeleteSessionArtifacts(ctx context.Context, sessionID uuid.UUID, db *sql.DB) error
}

// TempStorageService handles temporary artifact storage with TTL
type TempStorageService struct {
	db            *sql.DB
	repo          StorageRepository
	provider      Provider
	logger        *zap.Logger
	defaultTTL    time.Duration
	extendedTTL   time.Duration
	previewURLTTL time.Duration
}

// NewTempStorageService creates a new temp storage service
func NewTempStorageService(db *sql.DB, repo StorageRepository, provider Provider, logger *zap.Logger) *TempStorageService {
	return &TempStorageService{
		db:            db,
		repo:          repo,
		provider:      provider,
		logger:        logger,
		defaultTTL:    24 * time.Hour,     // 24 hours for active sessions
		extendedTTL:   7 * 24 * time.Hour, // 7 days for paused sessions
		previewURLTTL: 15 * time.Minute,   // 15 minutes for presigned URLs
	}
}

// GenerateTempPath creates a deterministic temp artifact path
func (s *TempStorageService) GenerateTempPath(sessionID, stageID, fileName string) string {
	return fmt.Sprintf("temp/%s/%s/%s", sessionID, stageID, fileName)
}

// UploadTempArtifact uploads a temporary artifact and creates DB record
func (s *TempStorageService) UploadTempArtifact(
	ctx context.Context,
	sessionID uuid.UUID,
	stageID *uuid.UUID,
	filePath string,
	artifactType string,
	metadata map[string]interface{},
) (*TempArtifact, error) {
	// Generate deterministic storage path
	fileName := filepath.Base(filePath)
	stageName := "session"
	if stageID != nil {
		stageName = stageID.String()[:8] // Use first 8 chars of UUID
	}
	storagePath := s.GenerateTempPath(sessionID.String(), stageName, fileName)

	// Determine content type
	contentType := guessContentTypeFromPath(filePath)

	// Upload to storage
	uploadedURL, err := s.provider.Upload(ctx, filePath, storagePath, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload temp artifact: %w", err)
	}

	// Get file size
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		s.logger.Warn("Failed to get file size", zap.Error(err))
	}
	var fileSize *int64
	if fileInfo != nil {
		size := fileInfo.Size()
		fileSize = &size
	}

	// Generate presigned URL for preview
	previewURL, err := s.provider.PresignedURL(ctx, storagePath, s.previewURLTTL)
	if err != nil {
		s.logger.Warn("Failed to generate presigned URL", zap.Error(err))
		previewURL = uploadedURL // Fallback to public URL
	}

	// Create DB record
	artifact := &TempArtifact{
		ID:            uuid.New(),
		SessionID:     sessionID,
		StageID:       stageID,
		StoragePath:   storagePath,
		PreviewURL:    &previewURL,
		ArtifactType:  artifactType,
		FileSizeBytes: fileSize,
		TTLExpiresAt:  time.Now().Add(s.defaultTTL),
		ExtendedTTL:   false,
		IsCheckpoint:  false,
		Metadata:      metadata,
		CreatedAt:     time.Now(),
	}

	err = s.repo.CreateTempArtifact(ctx, artifact, s.db)
	if err != nil {
		// Cleanup uploaded file if DB insert fails
		_ = s.provider.Delete(ctx, storagePath)
		return nil, fmt.Errorf("failed to create temp artifact record: %w", err)
	}

	s.logger.Info("Temp artifact created",
		zap.String("session_id", sessionID.String()),
		zap.String("storage_path", artifact.StoragePath),
		zap.Time("expires_at", artifact.TTLExpiresAt))

	return artifact, nil
}

// GetTempArtifact retrieves a temp artifact by ID
func (s *TempStorageService) GetTempArtifact(ctx context.Context, artifactID uuid.UUID) (*TempArtifact, error) {
	return s.repo.GetTempArtifactByID(ctx, artifactID, s.db)
}

// GetSessionArtifacts retrieves all temp artifacts for a session
func (s *TempStorageService) GetSessionArtifacts(ctx context.Context, sessionID uuid.UUID) ([]*TempArtifact, error) {
	return s.repo.GetSessionArtifacts(ctx, sessionID, s.db)
}

// RefreshPresignedURL generates a new presigned URL for an artifact
func (s *TempStorageService) RefreshPresignedURL(ctx context.Context, artifactID uuid.UUID) (string, error) {
	artifact, err := s.GetTempArtifact(ctx, artifactID)
	if err != nil {
		return "", err
	}

	previewURL, err := s.provider.PresignedURL(ctx, artifact.StoragePath, s.previewURLTTL)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	// Update DB with new URL
	err = s.repo.UpdatePresignedURL(ctx, artifactID, previewURL, s.db)
	if err != nil {
		s.logger.Warn("Failed to update presigned URL in DB", zap.Error(err))
	}

	return previewURL, nil
}

// ExtendTTLForSession extends TTL for all artifacts in a paused session
func (s *TempStorageService) ExtendTTLForSession(ctx context.Context, sessionID uuid.UUID) error {
	newTTL := time.Now().Add(s.extendedTTL)

	rowsAffected, err := s.repo.ExtendTTLForSession(ctx, sessionID, newTTL, s.db)
	if err != nil {
		return fmt.Errorf("failed to extend TTL: %w", err)
	}

	s.logger.Info("Extended TTL for session artifacts",
		zap.String("session_id", sessionID.String()),
		zap.Int64("artifacts_updated", rowsAffected),
		zap.Time("new_expiry", newTTL))

	return nil
}

// MoveToFinalStorage moves temp artifact to permanent storage
func (s *TempStorageService) MoveToFinalStorage(
	ctx context.Context,
	artifactID uuid.UUID,
	finalPath string,
) (string, error) {
	artifact, err := s.GetTempArtifact(ctx, artifactID)
	if err != nil {
		return "", err
	}

	// Note: Actual file moving is handled by the finalization service
	// This method is kept for interface compatibility but is deprecated
	s.logger.Info("MoveToFinalStorage called - delegating to finalization service",
		zap.String("temp_path", artifact.StoragePath),
		zap.String("final_path", finalPath))

	return artifact.StoragePath, fmt.Errorf("use finalization service for moving artifacts to final storage")
}

// CleanupExpiredArtifacts removes expired temp artifacts
func (s *TempStorageService) CleanupExpiredArtifacts(ctx context.Context) (int, error) {
	// Get expired artifacts
	expiredArtifacts, err := s.repo.GetExpiredArtifacts(ctx, s.db)
	if err != nil {
		return 0, fmt.Errorf("failed to get expired artifacts: %w", err)
	}

	// Delete from storage
	for _, artifact := range expiredArtifacts {
		if err := s.provider.Delete(ctx, artifact.StoragePath); err != nil {
			s.logger.Warn("Failed to delete temp artifact from storage",
				zap.String("path", artifact.StoragePath),
				zap.Error(err))
		}
	}

	// Delete from DB
	rowsDeleted, err := s.repo.DeleteExpiredArtifacts(ctx, s.db)
	if err != nil {
		return 0, fmt.Errorf("failed to delete expired artifacts: %w", err)
	}

	s.logger.Info("Cleaned up expired temp artifacts",
		zap.Int64("count", rowsDeleted))

	return int(rowsDeleted), nil
}

// CopyToPermanentStorage copies a temp file to permanent storage
// Returns the permanent URL
// uniqueID is optional - if provided, it will be used instead of timestamp for uniqueness
func (s *TempStorageService) CopyToPermanentStorage(ctx context.Context, tempURL string, testimonialID uuid.UUID, uniqueID ...string) (string, error) {
	s.logger.Info("🔍 [COPY-DEBUG] Starting CopyToPermanentStorage",
		zap.String("temp_url", tempURL),
		zap.String("testimonial_id", testimonialID.String()))

	// Check if provider is StorageFactory (which embeds the actual provider)
	var ociProvider *OCIProvider
	if factory, ok := s.provider.(*StorageFactory); ok {
		s.logger.Info("🔍 [COPY-DEBUG] Provider is StorageFactory, extracting embedded provider")
		// Extract the embedded provider from the factory
		ociProvider, ok = factory.Provider.(*OCIProvider)
		if !ok {
			s.logger.Error("🚨 [COPY-DEBUG] Embedded provider is not OCI",
				zap.String("embedded_provider_type", fmt.Sprintf("%T", factory.Provider)))
			return "", fmt.Errorf("copy to permanent storage only supported for OCI provider")
		}
	} else {
		// Try direct cast to OCIProvider
		ociProvider, ok = s.provider.(*OCIProvider)
		if !ok {
			s.logger.Error("🚨 [COPY-DEBUG] Provider is not OCI - cannot copy to permanent storage",
				zap.String("provider_type", fmt.Sprintf("%T", s.provider)))
			return "", fmt.Errorf("copy to permanent storage only supported for OCI provider")
		}
	}

	// Generate permanent path with unique identifier
	// CRITICAL FIX: Use uniqueID (clip_id) to prevent overwriting clips with same timestamp
	var identifier string
	if len(uniqueID) > 0 && uniqueID[0] != "" {
		identifier = uniqueID[0]
		s.logger.Info("🔍 [COPY-DEBUG] Using provided unique ID",
			zap.String("unique_id", identifier))
	} else {
		// Fallback to timestamp + UUID for uniqueness
		timestamp := time.Now().Format("20060102_150405")
		identifier = fmt.Sprintf("%s_%s", timestamp, uuid.New().String()[:8])
		s.logger.Warn("⚠️ [COPY-DEBUG] No unique ID provided, using timestamp+uuid",
			zap.String("identifier", identifier))
	}

	fileExt := ".mp4" // Default to mp4
	if strings.Contains(tempURL, ".") {
		parts := strings.Split(tempURL, ".")
		if len(parts) > 0 {
			fileExt = "." + parts[len(parts)-1]
		}
	}

	permanentPath := fmt.Sprintf("processed/%s/clip_%s%s", testimonialID.String(), identifier, fileExt)

	s.logger.Info("🔄 [COPY-DEBUG] Calling OCI provider to copy file",
		zap.String("temp_url", tempURL),
		zap.String("permanent_path", permanentPath),
		zap.String("file_ext", fileExt))

	// Use OCI server-side copy (much faster than download/upload)
	permanentURL, err := ociProvider.CopyToPermanentStorage(ctx, tempURL, permanentPath)
	if err != nil {
		s.logger.Error("🚨 [COPY-DEBUG] Failed to copy to permanent storage",
			zap.Error(err),
			zap.String("temp_url", tempURL),
			zap.String("permanent_path", permanentPath))
		return "", fmt.Errorf("failed to copy to permanent storage: %w", err)
	}

	s.logger.Info("✅ [COPY-DEBUG] Successfully copied to permanent storage",
		zap.String("temp_url", tempURL),
		zap.String("permanent_url", permanentURL),
		zap.String("permanent_path", permanentPath))

	return permanentURL, nil
}

// DeleteSessionArtifacts deletes all temp artifacts for a session
// DeleteByPath deletes a file from storage by its storage path
func (s *TempStorageService) DeleteByPath(ctx context.Context, storagePath string) error {
	if err := s.provider.Delete(ctx, storagePath); err != nil {
		return fmt.Errorf("failed to delete file at path %s: %w", storagePath, err)
	}

	s.logger.Info("Deleted artifact from storage",
		zap.String("storage_path", storagePath))

	return nil
}

// DeleteByPrefix deletes all files with storage paths starting with the given prefix
// This is useful for cleaning up entire session directories like "temp/{session_id}/"
func (s *TempStorageService) DeleteByPrefix(ctx context.Context, prefix string) error {
	s.logger.Info("Deleting artifacts by prefix",
		zap.String("prefix", prefix))

	// Query temp_artifacts table for all paths matching the prefix
	query := `
		SELECT id, storage_path
		FROM temp_artifacts
		WHERE storage_path LIKE $1 || '%'
	`

	rows, err := s.db.QueryContext(ctx, query, prefix)
	if err != nil {
		return fmt.Errorf("failed to query artifacts by prefix: %w", err)
	}
	defer rows.Close()

	var artifactsToDelete []struct {
		ID          uuid.UUID
		StoragePath string
	}

	for rows.Next() {
		var artifact struct {
			ID          uuid.UUID
			StoragePath string
		}
		if err := rows.Scan(&artifact.ID, &artifact.StoragePath); err != nil {
			s.logger.Warn("Failed to scan artifact", zap.Error(err))
			continue
		}
		artifactsToDelete = append(artifactsToDelete, artifact)
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("error iterating artifacts: %w", err)
	}

	if len(artifactsToDelete) == 0 {
		s.logger.Info("No artifacts found with prefix", zap.String("prefix", prefix))
		return nil
	}

	s.logger.Info("Found artifacts to delete",
		zap.Int("count", len(artifactsToDelete)),
		zap.String("prefix", prefix))

	// Delete from storage
	deletedCount := 0
	for _, artifact := range artifactsToDelete {
		if err := s.provider.Delete(ctx, artifact.StoragePath); err != nil {
			s.logger.Warn("Failed to delete artifact from storage",
				zap.String("path", artifact.StoragePath),
				zap.Error(err))
			// Continue deleting others
		} else {
			deletedCount++
		}

		// Delete from database
		deleteQuery := `DELETE FROM temp_artifacts WHERE id = $1`
		if _, err := s.db.ExecContext(ctx, deleteQuery, artifact.ID); err != nil {
			s.logger.Warn("Failed to delete artifact from database",
				zap.String("id", artifact.ID.String()),
				zap.Error(err))
		}
	}

	s.logger.Info("Deleted artifacts by prefix",
		zap.String("prefix", prefix),
		zap.Int("deleted", deletedCount),
		zap.Int("total", len(artifactsToDelete)))

	return nil
}

func (s *TempStorageService) DeleteSessionArtifacts(ctx context.Context, sessionID uuid.UUID) error {
	// Get all artifacts for session
	artifacts, err := s.GetSessionArtifacts(ctx, sessionID)
	if err != nil {
		return err
	}

	// Delete from storage
	for _, artifact := range artifacts {
		if err := s.provider.Delete(ctx, artifact.StoragePath); err != nil {
			s.logger.Warn("Failed to delete temp artifact from storage",
				zap.String("path", artifact.StoragePath),
				zap.Error(err))
		}
	}

	// Delete from DB
	err = s.repo.DeleteSessionArtifacts(ctx, sessionID, s.db)
	if err != nil {
		return fmt.Errorf("failed to delete session artifacts: %w", err)
	}

	s.logger.Info("Deleted all session artifacts",
		zap.String("session_id", sessionID.String()),
		zap.Int("count", len(artifacts)))

	return nil
}

// Helper function to guess content type from file path
func guessContentTypeFromPath(filePath string) string {
	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".mp4":
		return "video/mp4"
	case ".mov":
		return "video/quicktime"
	case ".avi":
		return "video/x-msvideo"
	case ".webm":
		return "video/webm"
	case ".mkv":
		return "video/x-matroska"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".wav":
		return "audio/wav"
	case ".mp3":
		return "audio/mpeg"
	case ".json":
		return "application/json"
	default:
		return "application/octet-stream"
	}
}
