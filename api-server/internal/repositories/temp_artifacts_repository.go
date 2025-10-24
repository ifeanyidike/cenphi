package repositories

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/redis/go-redis/v9"
)

type TempArtifactsRepository interface {
	Create(ctx context.Context, artifact *models.TempArtifact, db *sql.DB) error
	GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.TempArtifact, error)
	GetBySessionID(ctx context.Context, sessionID uuid.UUID, db *sql.DB) ([]*models.TempArtifact, error)
	GetByStageID(ctx context.Context, stageID uuid.UUID, db *sql.DB) ([]*models.TempArtifact, error)
	DeleteByID(ctx context.Context, id uuid.UUID, db *sql.DB) error
	DeleteBySessionID(ctx context.Context, sessionID uuid.UUID, db *sql.DB) error
	ExtendTTL(ctx context.Context, sessionID uuid.UUID, hours int, db *sql.DB) error
	GetExpiredArtifacts(ctx context.Context, db *sql.DB) ([]*models.TempArtifact, error)
	DeleteExpiredArtifacts(ctx context.Context, db *sql.DB) (int, error)
}

type tempArtifactsRepository struct {
	*BaseRepository[models.TempArtifact]
}

func NewTempArtifactsRepository(redis *redis.Client) TempArtifactsRepository {
	return &tempArtifactsRepository{
		BaseRepository: NewBaseRepository[models.TempArtifact](redis, "temp_artifacts"),
	}
}

func (r *tempArtifactsRepository) Create(ctx context.Context, artifact *models.TempArtifact, db *sql.DB) error {
	query := `
		INSERT INTO temp_artifacts (
			id, session_id, stage_id, storage_path, preview_url, artifact_type,
			file_size_bytes, ttl_expires_at, extended_ttl, is_checkpoint, metadata, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
	`

	if artifact.ID == uuid.Nil {
		artifact.ID = uuid.New()
	}

	if artifact.CreatedAt.IsZero() {
		artifact.CreatedAt = time.Now()
	}

	// Default TTL: 1 hour
	if artifact.TTLExpiresAt.IsZero() {
		artifact.TTLExpiresAt = time.Now().Add(1 * time.Hour)
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

func (r *tempArtifactsRepository) GetByID(ctx context.Context, id uuid.UUID, db *sql.DB) (*models.TempArtifact, error) {
	query := `
		SELECT id, session_id, stage_id, storage_path, preview_url, artifact_type,
		       file_size_bytes, ttl_expires_at, extended_ttl, is_checkpoint, metadata, created_at
		FROM temp_artifacts
		WHERE id = $1
	`

	var artifact models.TempArtifact
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

func (r *tempArtifactsRepository) GetBySessionID(ctx context.Context, sessionID uuid.UUID, db *sql.DB) ([]*models.TempArtifact, error) {
	query := `
		SELECT id, session_id, stage_id, storage_path, preview_url, artifact_type,
		       file_size_bytes, ttl_expires_at, extended_ttl, is_checkpoint, metadata, created_at
		FROM temp_artifacts
		WHERE session_id = $1
		ORDER BY created_at ASC
	`

	rows, err := db.QueryContext(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artifacts []*models.TempArtifact
	for rows.Next() {
		var artifact models.TempArtifact
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

func (r *tempArtifactsRepository) GetByStageID(ctx context.Context, stageID uuid.UUID, db *sql.DB) ([]*models.TempArtifact, error) {
	query := `
		SELECT id, session_id, stage_id, storage_path, preview_url, artifact_type,
		       file_size_bytes, ttl_expires_at, extended_ttl, is_checkpoint, metadata, created_at
		FROM temp_artifacts
		WHERE stage_id = $1
		ORDER BY created_at ASC
	`

	rows, err := db.QueryContext(ctx, query, stageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artifacts []*models.TempArtifact
	for rows.Next() {
		var artifact models.TempArtifact
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

func (r *tempArtifactsRepository) DeleteByID(ctx context.Context, id uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM temp_artifacts WHERE id = $1`
	_, err := db.ExecContext(ctx, query, id)
	return err
}

func (r *tempArtifactsRepository) DeleteBySessionID(ctx context.Context, sessionID uuid.UUID, db *sql.DB) error {
	query := `DELETE FROM temp_artifacts WHERE session_id = $1`
	_, err := db.ExecContext(ctx, query, sessionID)
	return err
}

func (r *tempArtifactsRepository) ExtendTTL(ctx context.Context, sessionID uuid.UUID, hours int, db *sql.DB) error {
	query := `
		UPDATE temp_artifacts
		SET ttl_expires_at = NOW() + $1 * INTERVAL '1 hour',
		    extended_ttl = TRUE
		WHERE session_id = $2
	`

	_, err := db.ExecContext(ctx, query, hours, sessionID)
	return err
}

func (r *tempArtifactsRepository) GetExpiredArtifacts(ctx context.Context, db *sql.DB) ([]*models.TempArtifact, error) {
	query := `
		SELECT id, session_id, stage_id, storage_path, preview_url, artifact_type,
		       file_size_bytes, ttl_expires_at, extended_ttl, is_checkpoint, metadata, created_at
		FROM temp_artifacts
		WHERE ttl_expires_at < NOW()
		ORDER BY created_at ASC
	`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var artifacts []*models.TempArtifact
	for rows.Next() {
		var artifact models.TempArtifact
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

func (r *tempArtifactsRepository) DeleteExpiredArtifacts(ctx context.Context, db *sql.DB) (int, error) {
	query := `
		DELETE FROM temp_artifacts
		WHERE ttl_expires_at < NOW()
	`

	result, err := db.ExecContext(ctx, query)
	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, err
	}

	return int(rowsAffected), nil
}
