package services

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type PresetService struct {
	db     *sql.DB
	logger *zap.Logger
	repo   repositories.PresetRepository
}

func NewPresetService(db *sql.DB, logger *zap.Logger, repo repositories.PresetRepository) PresetService {
	return PresetService{
		db:     db,
		logger: logger,
		repo:   repo,
	}
}
func (ps PresetService) CreatePreset(ctx context.Context, preset repositories.Preset) error {
	return ps.repo.Create(ctx, preset, ps.db)
}

func (ps PresetService) GetPresetByID(ctx context.Context, id string) (repositories.Preset, error) {
	return ps.repo.GetByID(ctx, id, ps.db)
}
func (ps PresetService) ListPresetsByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]repositories.Preset, error) {
	return ps.repo.ListByWorkspaceID(ctx, workspaceID, ps.db)
}

func (ps PresetService) ListPresetsByWorkspaceAndService(ctx context.Context, workspaceID, serviceID uuid.UUID) ([]repositories.Preset, error) {
	return ps.repo.ListByWorkspaceAndService(ctx, workspaceID, serviceID, ps.db)
}

func (ps PresetService) DeletePreset(ctx context.Context, id string) error {
	return ps.repo.Delete(ctx, id, ps.db)
}

func (ps PresetService) UpdatePreset(ctx context.Context, preset repositories.Preset) error {
	return ps.repo.Update(ctx, preset, ps.db)
}
func (ps PresetService) SetDefaultPreset(ctx context.Context, workspaceID uuid.UUID, serviceID, presetID string) error {
	return ps.repo.SetDefault(ctx, workspaceID, serviceID, presetID, ps.db)
}

func (ps PresetService) GetDefaultPreset(ctx context.Context, workspaceID string) (repositories.Preset, error) {
	return ps.repo.GetDefault(ctx, workspaceID, ps.db)
}
