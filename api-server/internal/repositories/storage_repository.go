package repositories

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/storage"
	"github.com/redis/go-redis/v9"
)

type StorageRepository interface {
	CreateTempArtifact(ctx context.Context, artifact *storage.TempArtifact, db *sql.DB) error
	GetTempArtifactByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*storage.TempArtifact, error)
	GetSessionArtifacts(ctx context.Context, sessionID uuid.UUID, db *sql.DB) ([]*storage.TempArtifact, error)
	UpdatePresignedURL(ctx context.Context, id uuid.UUID, previewURL string, db *sql.DB) error
	ExtendTTLForSession(ctx context.Context, sessionID uuid.UUID, newTTL time.Time, db *sql.DB) (int64, error)
	GetExpiredArtifacts(ctx context.Context, db *sql.DB) ([]*storage.TempArtifact, error)
	DeleteExpiredArtifacts(ctx context.Context, db *sql.DB) (int64, error)
	DeleteSessionArtifacts(ctx context.Context, sessionID uuid.UUID, db *sql.DB) error
}

type storageRepository struct {
	*BaseRepository[storage.TempArtifact]
}

func NewStorageRepository(redis *redis.Client) StorageRepository {
	return &storageRepository{
		BaseRepository: NewBaseRepository[storage.TempArtifact](redis, "temp_artifacts"),
	}
}

func (r *storageRepository) CreateTempArtifact(ctx context.Context, artifact *storage.TempArtifact, db *sql.DB) error {
	query := `
		INSERT INTO temp_artifacts (
			id, session_id, stage_id, storage_path, preview_url,
			artifact_type, file_size_bytes, ttl_expires_at, extended_ttl,
			is_checkpoint, metadata, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	if artifact.ID == uuid.Nil {
		artifact.ID = uuid.New()
	}

	now := time.Now()
	if artifact.CreatedAt.IsZero() {
		artifact.CreatedAt = now
	}

	_, err := db.ExecContext(ctx, query,
		artifact.ID,
		artifact.SessionID,
		artifact.StageID,
		artifact.StoragePath,
		artifact.PreviewURL,
		artifact.ArtifactType,
		artifact.FileSizeBytes,
		artifact.TTLExpiresAt,
		artifact.ExtendedTTL,
		artifact.IsCheckpoint,
		artifact.Metadata,
		artifact.CreatedAt,
	)

	return err
}

func (r *storageRepository) GetTempArtifactByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*storage.TempArtifact, error) {
	query := `
		SELECT id, session_id, stage_id, storage_path, preview_url,
			   artifact_type, file_size_bytes, ttl_expires_at, extended_ttl,
			   is_checkpoint, metadata, created_at
		FROM temp_artifacts
		WHERE id = $1
	`

	var artifact storage.TempArtifact
	err := db.QueryRowContext(ctx, query, id).Scan(
		&artifact.ID,
		&artifact.SessionID,
		&artifact.StageID,
		&artifact.StoragePath,
		&artifact.PreviewURL,
		&artifact.ArtifactType,
		&artifact.FileSizeBytes,
		&artifact.TTLExpiresAt,
		&artifact.ExtendedTTL,
		&artifact.IsCheckpoint,
		&artifact.Metadata,
		&artifact.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &artifact, nil
}

func (r *storageRepository) GetSessionArtifacts(ctx context.Context, sessionID uuid.UUID, db *sql.DB) ([]*storage.TempArtifact, error) {
	query := `
		SELECT id, session_id, stage_id, storage_path, preview_url,
			   artifact_type, file_size_bytes, ttl_expires_at, extended_ttl,
			   is_checkpoint, metadata, created_at
		FROM temp_artifacts
		WHERE session_id = $1
		ORDER BY created_at ASC
	`

	rows, err := db.QueryContext(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artifacts []*storage.TempArtifact
	for rows.Next() {
		var artifact storage.TempArtifact
		err := rows.Scan(
			&artifact.ID,
			&artifact.SessionID,
			&artifact.StageID,
			&artifact.StoragePath,
			&artifact.PreviewURL,
			&artifact.ArtifactType,
			&artifact.FileSizeBytes,
			&artifact.TTLExpiresAt,
			&artifact.ExtendedTTL,
			&artifact.IsCheckpoint,
			&artifact.Metadata,
			&artifact.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		artifacts = append(artifacts, &artifact)
	}

	return artifacts, rows.Err()
}

func (r *storageRepository) UpdatePresignedURL(ctx context.Context, id uuid.UUID, previewURL string, db *sql.DB) error {
	query := `UPDATE temp_artifacts SET preview_url = $1 WHERE id = $2`
	_, err := db.ExecContext(ctx, query, previewURL, id)
	return err
}

func (r *storageRepository) ExtendTTLForSession(ctx context.Context, sessionID uuid.UUID, newTTL time.Time, db *sql.DB) (int64, error) {
	query := `
		UPDATE temp_artifacts
		SET ttl_expires_at = $1,
		    extended_ttl = TRUE,
		    is_checkpoint = TRUE
		WHERE session_id = $2
	`

	result, err := db.ExecContext(ctx, query, newTTL, sessionID)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

func (r *storageRepository) GetExpiredArtifacts(ctx context.Context, db *sql.DB) ([]*storage.TempArtifact, error) {
	query := `
		SELECT id, session_id, stage_id, storage_path, preview_url,
			   artifact_type, file_size_bytes, ttl_expires_at, extended_ttl,
			   is_checkpoint, metadata, created_at
		FROM temp_artifacts
		WHERE ttl_expires_at < NOW()
	`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artifacts []*storage.TempArtifact
	for rows.Next() {
		var artifact storage.TempArtifact
		err := rows.Scan(
			&artifact.ID,
			&artifact.SessionID,
			&artifact.StageID,
			&artifact.StoragePath,
			&artifact.PreviewURL,
			&artifact.ArtifactType,
			&artifact.FileSizeBytes,
			&artifact.TTLExpiresAt,
			&artifact.ExtendedTTL,
			&artifact.IsCheckpoint,
			&artifact.Metadata,
			&artifact.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		artifacts = append(artifacts, &artifact)
	}

	return artifacts, rows.Err()
}

func (r *storageRepository) DeleteExpiredArtifacts(ctx context.Context, db *sql.DB) (int64, error) {
	query := `DELETE FROM temp_artifacts WHERE ttl_expires_at < NOW()`
	result, err := db.ExecContext(ctx, query)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

func (r *storageRepository) DeleteSessionArtifacts(ctx context.Context, sessionID uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM temp_artifacts WHERE session_id = $1`
	_, err := db.ExecContext(ctx, query, sessionID)
	return err
}
