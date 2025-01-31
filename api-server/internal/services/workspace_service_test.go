package services

import (
	"context"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
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
		user := &models.Workspace{
			ID:           uuid.New(),
			Name:         "Test Workspace",
			Plan:         "free",
			CustomDomain: "test-workspace.cenphi.app",
			WebsiteURL:   "https://org.cenphi.app",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		mockRepo.On("Create", mock.Anything, user, db).Return(nil)

		err := svc.CreateWorkspace(context.Background(), user)
		assert.NoError(t, err)
		mockRepo.AssertCalled(t, "Create", mock.Anything, user, db)
	})

	t.Run("GetUser", func(t *testing.T) {
		workspace := &models.Workspace{
			ID:           uuid.New(),
			Name:         "Test Workspace1",
			Plan:         "free",
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
