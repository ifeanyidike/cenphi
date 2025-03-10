package services

import (
	"context"
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

func TestUserService(t *testing.T) {
	mockRepo := &mocks.UserRepository{}
	db, _, _ := sqlmock.New()
	svc := NewUserService(mockRepo, db)

	t.Run("RegisterUser", func(t *testing.T) {
		user := &models.User{
			ID:          uuid.New(),
			Email:       utils.GenerateRandomEmail(),
			FirebaseUID: utils.RandomString(10),
			Name:        utils.RandomString(12),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		mockRepo.On("Create", mock.Anything, user, db).Return(nil)

		err := svc.RegisterUser(context.Background(), user)
		assert.NoError(t, err)
		mockRepo.AssertCalled(t, "Create", mock.Anything, user, db)
	})

	t.Run("GetUser", func(t *testing.T) {
		user := &models.User{
			ID:          uuid.New(),
			Email:       utils.GenerateRandomEmail(),
			FirebaseUID: utils.RandomString(10),
			Name:        utils.RandomString(12),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		mockRepo.On("GetByID", mock.Anything, user.ID, db).Return(user, nil)

		result, err := svc.GetUser(context.Background(), user.ID)
		assert.NoError(t, err)
		assert.Equal(t, user.Email, result.Email)
		mockRepo.AssertCalled(t, "GetByID", mock.Anything, user.ID, db)
	})

}
