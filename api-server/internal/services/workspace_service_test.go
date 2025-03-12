package services

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestWorkspaceService(t *testing.T) {
	mockRepo := &mocks.WorkspaceRepository{}
	db, _, _ := sqlmock.New()
	svc := NewWorkspaceService(mockRepo, db)

	t.Run("CreateWorkspace", func(t *testing.T) {
		workspace := &models.Workspace{
			ID:           uuid.New(),
			Name:         "Test Workspace",
			Plan:         models.PlanEssential,
			CustomDomain: "test-workspace.cenphi.app",
			WebsiteURL:   "https://org.cenphi.app",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		mockRepo.On("Create", mock.Anything, workspace, db).Return(nil)

		err := svc.CreateWorkspace(context.Background(), workspace)
		assert.NoError(t, err)
		mockRepo.AssertCalled(t, "Create", mock.Anything, workspace, db)
	})

	t.Run("GetUser", func(t *testing.T) {
		workspace := &models.Workspace{
			ID:           uuid.New(),
			Name:         "Test Workspace1",
			Plan:         models.PlanEssential,
			CustomDomain: "test-workspace.cenphi.app",
			WebsiteURL:   "https://org.cenphi.app",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		mockRepo.On("GetByID", mock.Anything, workspace.ID, db).Return(workspace, nil)

		result, err := svc.GetWorkspace(context.Background(), workspace.ID)
		assert.NoError(t, err)
		assert.Equal(t, workspace.Name, result.Name)
		assert.Equal(t, workspace.WebsiteURL, result.WebsiteURL)
		mockRepo.AssertCalled(t, "GetByID", mock.Anything, workspace.ID, db)
	})
}

func TestWorkspaceService_UpdateWorkspace(t *testing.T) {
	mockRepo := &mocks.WorkspaceRepository{}
	db, _, _ := sqlmock.New()
	svc := NewWorkspaceService(mockRepo, db)

	t.Run("UpdateWorkspace", func(t *testing.T) {
		// First create a workspace
		workspace := &models.Workspace{
			ID:           uuid.New(),
			Name:         "Test Workspace",
			Plan:         models.PlanEssential,
			CustomDomain: "test-workspace.cenphi.app",
			WebsiteURL:   "https://org.cenphi.app",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		// Mock the Create call
		mockRepo.On("Create",
			mock.MatchedBy(func(ctx context.Context) bool { return true }),
			workspace,
			db,
		).Return(nil)

		// Create the workspace
		err := svc.CreateWorkspace(context.Background(), workspace)
		assert.NoError(t, err)

		// Now set up the update
		updates := map[string]any{
			"name":          "Updated Workspace",
			"plan":          models.PlanGrowth,
			"custom_domain": "updated-workspace.cenphi.app",
			"website_url":   "https://updated.cenphi.app",
		}

		// Mock the Update call with exact argument matching
		mockRepo.On("UpdateAny",
			mock.MatchedBy(func(ctx context.Context) bool { return true }),
			updates,
			workspace.ID, // fourth argument in the expectation
			mock.MatchedBy(func(db *sql.DB) bool { return true }),
		).Return(nil)

		// Perform the update
		err = svc.UpdateWorkspace(context.Background(), workspace.ID, updates)
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("UpdateWorkspace_ValidationFailed", func(t *testing.T) {
		workspace := &models.Workspace{
			ID:           uuid.New(),
			Name:         "Test Workspace",
			Plan:         models.PlanEssential,
			CustomDomain: "test-workspace.cenphi.app",
			WebsiteURL:   "https://org.cenphi.app",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		// Mock the Create call
		mockRepo.On("Create",
			mock.MatchedBy(func(ctx context.Context) bool { return true }),
			workspace,
			db,
		).Return(nil)

		// Create the workspace
		err := svc.CreateWorkspace(context.Background(), workspace)
		assert.NoError(t, err)

		invalidUpdates := map[string]any{
			"name": "",
			"plan": "invalid-plan",
		}

		mockRepo.On("UpdateAny",
			mock.MatchedBy(func(ctx context.Context) bool { return true }),
			invalidUpdates,
			workspace.ID, // fourth argument in the expectation
			mock.MatchedBy(func(db *sql.DB) bool { return true }),
		).Return(apperrors.ErrValidationFailed)

		err = svc.UpdateWorkspace(context.Background(), workspace.ID, invalidUpdates)
		assert.Error(t, err)
		mockRepo.AssertNotCalled(t, "UpdateAny")
	})

	t.Run("UpdateWorkspace_RepositoryError", func(t *testing.T) {
		workspace := &models.Workspace{
			ID:           uuid.New(),
			Name:         "Test Workspace",
			Plan:         models.PlanEssential,
			CustomDomain: "test-workspace.cenphi.app",
			WebsiteURL:   "https://org.cenphi.app",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		// Mock the Create call
		mockRepo.On("Create",
			mock.MatchedBy(func(ctx context.Context) bool { return true }),
			workspace,
			db,
		).Return(nil)

		// Create the workspace
		err := svc.CreateWorkspace(context.Background(), workspace)
		assert.NoError(t, err)

		updates := map[string]any{
			"name": "Updated Workspace",
			"plan": models.PlanGrowth,
		}

		expectedErr := errors.New("database error")
		mockRepo.On("UpdateAny",
			mock.MatchedBy(func(ctx context.Context) bool { return true }),
			updates,
			workspace.ID,
			mock.MatchedBy(func(db *sql.DB) bool { return true }),
		).Return(expectedErr)

		err = svc.UpdateWorkspace(context.Background(), workspace.ID, updates)
		assert.Error(t, err)
		assert.Equal(t, expectedErr, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("UpdateWorkspace_EmptyUpdates", func(t *testing.T) {
		workspace := &models.Workspace{
			ID:           uuid.New(),
			Name:         "Test Workspace",
			Plan:         models.PlanEssential,
			CustomDomain: "test-workspace.cenphi.app",
			WebsiteURL:   "https://org.cenphi.app",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		// Mock the Create call
		mockRepo.On("Create",
			mock.MatchedBy(func(ctx context.Context) bool { return true }),
			workspace,
			db,
		).Return(nil)

		// Create the workspace
		err := svc.CreateWorkspace(context.Background(), workspace)
		assert.NoError(t, err)

		updates := map[string]any{}

		mockRepo.On("UpdateAny",
			mock.MatchedBy(func(ctx context.Context) bool { return true }),
			updates,
			workspace.ID,
			mock.MatchedBy(func(db *sql.DB) bool { return true }),
		).Return(nil)

		err = svc.UpdateWorkspace(context.Background(), workspace.ID, updates)
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}
