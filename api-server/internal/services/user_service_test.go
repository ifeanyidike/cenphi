package services

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestUserService(t *testing.T) {
	mockRepo := &mocks.UserRepository{}
	svc := NewUserService(mockRepo)

	t.Run("RegisterUser", func(t *testing.T) {
		user := &models.User{
			ID:          uuid.New(),
			Email:       "create@example.com",
			FirebaseUID: "firebase-uid",
			FirstName:   "New",
			LastName:    "User",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		mockRepo.On("Create", mock.Anything, user).Return(nil)

		err := svc.RegisterUser(context.Background(), user)
		assert.NoError(t, err)
		mockRepo.AssertCalled(t, "Create", mock.Anything, user)
	})

	t.Run("GetUser", func(t *testing.T) {
		user := &models.User{
			ID:          uuid.New(),
			Email:       "get@example.com",
			FirebaseUID: "firebase-uuid",
			FirstName:   "Get",
			LastName:    "User",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		mockRepo.On("GetByID", mock.Anything, user.ID).Return(user, nil)

		result, err := svc.GetUser(context.Background(), user.ID)
		assert.NoError(t, err)
		assert.Equal(t, user.Email, result.Email)
		mockRepo.AssertCalled(t, "GetByID", mock.Anything, user.ID)
	})

	// t.Run("UpdateUser", func(t *testing.T) {
	// 	user := &models.User{
	// 		ID:        uuid.New(),
	// 		Email:     "update-service@example.com",
	// 		FirstName: "Will",
	// 		LastName:  "Smith",
	// 		CreatedAt: time.Now(),
	// 		UpdatedAt: time.Now(),
	// 	}

	// 	mockRepo.On("UpdateUser", mock.Anything, user).Return(nil)

	// 	err := svc.UpdateUser(context.Background(), user)
	// 	assert.NoError(t, err)
	// 	mockRepo.AssertCalled(t, "UpdateUser", mock.Anything, user)
	// })

	// t.Run("DeleteUser", func(t *testing.T) {
	// 	id := uuid.New()

	// 	mockRepo.On("DeleteUser", mock.Anything, id).Return(nil)

	// 	err := svc.DeleteUser(context.Background(), id)
	// 	assert.NoError(t, err)
	// 	mockRepo.AssertCalled(t, "DeleteUser", mock.Anything, id)
	// })
}
