// internal/services/content_folder_service.go
package services

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type ContentFolderService struct {
	repo         repositories.ContentFolderRepository
	artifactRepo repositories.TestimonialArtifactRepository
	db           *sql.DB
	redis        *redis.Client
	logger       *zap.Logger
}

func NewContentFolderService(
	repo repositories.ContentFolderRepository,
	artifactRepo repositories.TestimonialArtifactRepository,
	db *sql.DB,
	redis *redis.Client,
	logger *zap.Logger,
) ContentFolderService {
	return ContentFolderService{
		repo:         repo,
		artifactRepo: artifactRepo,
		db:           db,
		redis:        redis,
		logger:       logger,
	}
}

// CreateFolder creates a new content folder
func (s ContentFolderService) CreateFolder(ctx context.Context, req models.CreateFolderRequest, workspaceID uuid.UUID) (*models.ContentFolder, error) {
	folder := &models.ContentFolder{
		ID:          uuid.New(),
		WorkspaceID: workspaceID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		Icon:        req.Icon,
		IsDefault:   false,
		SortOrder:   0,
	}

	if req.SortOrder != nil {
		folder.SortOrder = *req.SortOrder
	}

	err := s.repo.Create(ctx, folder, s.db)
	if err != nil {
		s.logger.Error("Failed to create folder",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()),
			zap.String("name", req.Name))
		return nil, fmt.Errorf("failed to create folder: %w", err)
	}

	s.logger.Info("Folder created successfully",
		zap.String("id", folder.ID.String()),
		zap.String("name", folder.Name),
		zap.String("workspace_id", workspaceID.String()))

	return folder, nil
}

// GetFolder retrieves a folder by ID
func (s ContentFolderService) GetFolder(ctx context.Context, folderID uuid.UUID) (*models.ContentFolder, error) {
	folder, err := s.repo.GetByID(ctx, folderID, s.db)
	if err != nil {
		s.logger.Error("Failed to get folder",
			zap.Error(err),
			zap.String("folder_id", folderID.String()))
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}

	if folder == nil {
		return nil, fmt.Errorf("folder not found")
	}

	return folder, nil
}

// ListFolders retrieves all folders for a workspace
func (s ContentFolderService) ListFolders(ctx context.Context, workspaceID uuid.UUID) ([]models.ContentFolder, error) {
	folders, err := s.repo.ListByWorkspace(ctx, workspaceID, s.db)
	if err != nil {
		s.logger.Error("Failed to list folders",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return nil, fmt.Errorf("failed to list folders: %w", err)
	}

	return folders, nil
}

// UpdateFolder updates a folder
func (s ContentFolderService) UpdateFolder(ctx context.Context, folderID uuid.UUID, req models.UpdateFolderRequest, workspaceID uuid.UUID) (*models.ContentFolder, error) {
	// Get existing folder
	folder, err := s.repo.GetByID(ctx, folderID, s.db)
	if err != nil {
		s.logger.Error("Failed to get folder for update",
			zap.Error(err),
			zap.String("folder_id", folderID.String()))
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}

	if folder == nil {
		return nil, fmt.Errorf("folder not found")
	}

	// Verify workspace ownership
	if folder.WorkspaceID != workspaceID {
		return nil, fmt.Errorf("folder does not belong to workspace")
	}

	// Update fields if provided
	if req.Name != nil {
		folder.Name = *req.Name
	}
	if req.Description != nil {
		folder.Description = req.Description
	}
	if req.Color != nil {
		folder.Color = req.Color
	}
	if req.Icon != nil {
		folder.Icon = req.Icon
	}
	if req.SortOrder != nil {
		folder.SortOrder = *req.SortOrder
	}

	err = s.repo.Update(ctx, folder, s.db)
	if err != nil {
		s.logger.Error("Failed to update folder",
			zap.Error(err),
			zap.String("folder_id", folderID.String()))
		return nil, fmt.Errorf("failed to update folder: %w", err)
	}

	s.logger.Info("Folder updated successfully",
		zap.String("id", folder.ID.String()),
		zap.String("name", folder.Name))

	return folder, nil
}

// DeleteFolder deletes a folder
func (s ContentFolderService) DeleteFolder(ctx context.Context, folderID uuid.UUID, workspaceID uuid.UUID) error {
	err := s.repo.Delete(ctx, folderID, workspaceID, s.db)
	if err != nil {
		s.logger.Error("Failed to delete folder",
			zap.Error(err),
			zap.String("folder_id", folderID.String()),
			zap.String("workspace_id", workspaceID.String()))
		return fmt.Errorf("failed to delete folder: %w", err)
	}

	s.logger.Info("Folder deleted successfully",
		zap.String("id", folderID.String()),
		zap.String("workspace_id", workspaceID.String()))

	return nil
}

// AddItemsToFolder adds artifacts to a folder
func (s ContentFolderService) AddItemsToFolder(ctx context.Context, folderID uuid.UUID, req models.AddItemsToFolderRequest, workspaceID uuid.UUID) error {
	// Verify folder exists and belongs to workspace
	folder, err := s.repo.GetByID(ctx, folderID, s.db)
	if err != nil {
		s.logger.Error("Failed to get folder",
			zap.Error(err),
			zap.String("folder_id", folderID.String()))
		return fmt.Errorf("failed to get folder: %w", err)
	}

	if folder == nil {
		return fmt.Errorf("folder not found")
	}

	if folder.WorkspaceID != workspaceID {
		return fmt.Errorf("folder does not belong to workspace")
	}

	// Add each artifact to the folder
	for _, artifactID := range req.ArtifactIDs {
		err := s.repo.AddItem(ctx, folderID, artifactID, s.db)
		if err != nil {
			s.logger.Error("Failed to add item to folder",
				zap.Error(err),
				zap.String("folder_id", folderID.String()),
				zap.String("artifact_id", artifactID.String()))
			// Continue adding other items even if one fails
			continue
		}
	}

	s.logger.Info("Items added to folder",
		zap.String("folder_id", folderID.String()),
		zap.Int("count", len(req.ArtifactIDs)))

	return nil
}

// RemoveItemFromFolder removes an artifact from a folder
func (s ContentFolderService) RemoveItemFromFolder(ctx context.Context, folderID uuid.UUID, artifactID uuid.UUID, workspaceID uuid.UUID) error {
	// Verify folder exists and belongs to workspace
	folder, err := s.repo.GetByID(ctx, folderID, s.db)
	if err != nil {
		s.logger.Error("Failed to get folder",
			zap.Error(err),
			zap.String("folder_id", folderID.String()))
		return fmt.Errorf("failed to get folder: %w", err)
	}

	if folder == nil {
		return fmt.Errorf("folder not found")
	}

	if folder.WorkspaceID != workspaceID {
		return fmt.Errorf("folder does not belong to workspace")
	}

	err = s.repo.RemoveItem(ctx, folderID, artifactID, s.db)
	if err != nil {
		s.logger.Error("Failed to remove item from folder",
			zap.Error(err),
			zap.String("folder_id", folderID.String()),
			zap.String("artifact_id", artifactID.String()))
		return fmt.Errorf("failed to remove item from folder: %w", err)
	}

	s.logger.Info("Item removed from folder",
		zap.String("folder_id", folderID.String()),
		zap.String("artifact_id", artifactID.String()))

	return nil
}

// GetFolderItems retrieves all artifacts in a folder
func (s ContentFolderService) GetFolderItems(ctx context.Context, folderID uuid.UUID, workspaceID uuid.UUID) ([]models.TestimonialArtifact, error) {
	// Verify folder exists and belongs to workspace
	folder, err := s.repo.GetByID(ctx, folderID, s.db)
	if err != nil {
		s.logger.Error("Failed to get folder",
			zap.Error(err),
			zap.String("folder_id", folderID.String()))
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}

	if folder == nil {
		return nil, fmt.Errorf("folder not found")
	}

	if folder.WorkspaceID != workspaceID {
		return nil, fmt.Errorf("folder does not belong to workspace")
	}

	// Get artifact IDs
	artifactIDs, err := s.repo.GetFolderItems(ctx, folderID, s.db)
	if err != nil {
		s.logger.Error("Failed to get folder items",
			zap.Error(err),
			zap.String("folder_id", folderID.String()))
		return nil, fmt.Errorf("failed to get folder items: %w", err)
	}

	// Fetch full artifact details
	var artifacts []models.TestimonialArtifact
	for _, artifactID := range artifactIDs {
		artifact, err := s.artifactRepo.GetByID(ctx, artifactID, s.db)
		if err != nil {
			s.logger.Warn("Failed to get artifact details",
				zap.Error(err),
				zap.String("artifact_id", artifactID.String()))
			continue
		}
		if artifact != nil {
			artifacts = append(artifacts, *artifact)
		}
	}

	return artifacts, nil
}

// GetFolderWithItems retrieves a folder with its artifacts
func (s ContentFolderService) GetFolderWithItems(ctx context.Context, folderID uuid.UUID, workspaceID uuid.UUID) (*models.FolderWithItems, error) {
	// Get folder
	folder, err := s.GetFolder(ctx, folderID)
	if err != nil {
		return nil, err
	}

	if folder.WorkspaceID != workspaceID {
		return nil, fmt.Errorf("folder does not belong to workspace")
	}

	// Get artifacts
	artifacts, err := s.GetFolderItems(ctx, folderID, workspaceID)
	if err != nil {
		return nil, err
	}

	folderWithItems := &models.FolderWithItems{
		ContentFolder: *folder,
		Artifacts:     artifacts,
	}

	return folderWithItems, nil
}

// GetArtifactFolders retrieves all folders that contain a specific artifact
func (s ContentFolderService) GetArtifactFolders(ctx context.Context, artifactID uuid.UUID) ([]uuid.UUID, error) {
	folderIDs, err := s.repo.GetArtifactFolders(ctx, artifactID, s.db)
	if err != nil {
		s.logger.Error("Failed to get artifact folders",
			zap.Error(err),
			zap.String("artifact_id", artifactID.String()))
		return nil, fmt.Errorf("failed to get artifact folders: %w", err)
	}

	return folderIDs, nil
}

// GetArtifactsByWorkspace retrieves all artifacts for a workspace
func (s ContentFolderService) GetArtifactsByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]models.TestimonialArtifact, error) {
	// Get all artifacts without filtering by processing type, with no limit
	artifacts, err := s.artifactRepo.GetByWorkspaceID(ctx, workspaceID, nil, 10000, 0, s.db)
	if err != nil {
		s.logger.Error("Failed to get artifacts by workspace",
			zap.Error(err),
			zap.String("workspace_id", workspaceID.String()))
		return nil, fmt.Errorf("failed to get artifacts by workspace: %w", err)
	}

	return artifacts, nil
}
