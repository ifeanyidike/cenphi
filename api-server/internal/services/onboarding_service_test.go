// services/onboarding_service_test.go
package services

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories/mocks"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestOnboardingService_OnboardOwner(t *testing.T) {
	// Create a mock database and transaction
	db, mockDB, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock database: %v", err)
	}
	defer db.Close()

	// Create a mock transaction
	mockDB.ExpectBegin()
	mockDB.ExpectCommit()

	// Create mock repositories
	mockRepo := &mocks.Repo{}
	mockUserRepo := &mocks.UserRepository{}
	mockWorkspaceRepo := &mocks.WorkspaceRepository{}
	mockTeamMemberRepo := &mocks.TeamMemberRepository{}

	// Set up the mock repo to return the mock repositories
	mockRepo.On("User").Return(mockUserRepo)
	mockRepo.On("Workspace").Return(mockWorkspaceRepo)
	mockRepo.On("TeamMember").Return(mockTeamMemberRepo)

	// Create the service
	svc := NewOnboardingService(mockRepo, db)

	// Test data
	userID := uuid.New()
	workspace := &models.Workspace{
		ID:           uuid.New(),
		Name:         utils.RandomString(12),
		WebsiteURL:   utils.GenerateRandomUrl(),
		Plan:         "free",
		CustomDomain: utils.GenerateRandomUrl(),
	}
	teamMember := &models.TeamMember{
		ID:          uuid.New(),
		Role:        models.Admin,
		UserID:      userID,
		WorkspaceID: workspace.ID,
		Settings:    make(map[string]interface{}),
		Permissions: make(map[string]interface{}),
		CreatedAt:   time.Now(),
	}

	// Mock repository responses
	mockUserRepo.On("GetByID", mock.Anything, userID, mock.AnythingOfType("*sql.Tx")).Return(&models.User{
		ID:          userID,
		Email:       utils.GenerateRandomEmail(),
		FirebaseUID: utils.RandomString(10),
		FirstName:   utils.RandomString(5),
		LastName:    utils.RandomString(5),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}, nil)
	mockWorkspaceRepo.On("Create", mock.Anything, workspace, mock.AnythingOfType("*sql.Tx")).Return(nil)
	mockTeamMemberRepo.On("Create", mock.Anything, teamMember, mock.AnythingOfType("*sql.Tx")).Return(nil)

	// Test the OnboardOwner method
	err = svc.OnboardOwner(context.Background(), userID, workspace, teamMember)
	assert.NoError(t, err)

	// Assert that all expectations were met

	mockRepo.AssertExpectations(t)
	mockUserRepo.AssertExpectations(t)
	mockWorkspaceRepo.AssertExpectations(t)
	mockTeamMemberRepo.AssertExpectations(t)
	mockDB.ExpectationsWereMet()
}

func TestOnboardingService_OnboardOwner_Error(t *testing.T) {
	// Create a mock database and transaction
	db, mockDB, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock database: %v", err)
	}
	defer db.Close()

	// Create a mock transaction
	mockDB.ExpectBegin()
	mockDB.ExpectRollback()

	// Create mock repositories
	mockRepo := &mocks.Repo{}
	mockUserRepo := &mocks.UserRepository{}
	mockWorkspaceRepo := &mocks.WorkspaceRepository{}
	mockTeamMemberRepo := &mocks.TeamMemberRepository{}

	// Set up the mock repo to return the mock repositories
	mockRepo.On("User").Return(mockUserRepo)
	mockRepo.On("Workspace").Return(mockWorkspaceRepo)
	mockRepo.On("TeamMember").Return(mockTeamMemberRepo)

	// Create the service
	svc := NewOnboardingService(mockRepo, db)

	// Test data
	userID := uuid.New()
	workspace := &models.Workspace{
		ID:           uuid.New(),
		Name:         utils.RandomString(14),
		WebsiteURL:   utils.GenerateRandomUrl(),
		Plan:         "free",
		CustomDomain: utils.GenerateRandomUrl(),
	}
	teamMember := &models.TeamMember{
		ID:          uuid.New(),
		Role:        models.Admin,
		UserID:      userID,
		WorkspaceID: workspace.ID,
		Settings:    make(map[string]interface{}),
		Permissions: make(map[string]interface{}),
		CreatedAt:   time.Now(),
	}

	// Mock repository responses to simulate an error
	mockUserRepo.On("GetByID", mock.Anything, userID, mock.AnythingOfType("*sql.Tx")).Return(nil, sql.ErrNoRows)

	// Test the OnboardOwner method
	err = svc.OnboardOwner(context.Background(), userID, workspace, teamMember)
	assert.Error(t, err)
	assert.Equal(t, sql.ErrNoRows, err)

	// Assert that all expectations were met
	// mockRepo.AssertExpectations(t)
	// mockUserRepo.AssertExpectations(t)
	mockDB.ExpectationsWereMet()
}
