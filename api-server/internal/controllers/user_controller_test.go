package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func setupTestLogger() *zap.Logger {
	config := zap.NewDevelopmentConfig()
	config.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
	logger, _ := config.Build()
	return logger
}

func TestUserController(t *testing.T) {
	mockService := &mocks.UserService{}
	logger := setupTestLogger()
	defer logger.Sync()

	controller := NewUserController(mockService, logger)

	t.Run("RegisterUser", func(t *testing.T) {
		user := &models.User{
			ID:            uuid.New(),
			Email:         "test@example.com",
			FirebaseUID:   "test-uid",
			FirstName:     "John",
			LastName:      "Doe",
			EmailVerified: true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		mockService.On("RegisterUser", mock.Anything, mock.AnythingOfType("*models.User")).Return(nil)
		body, _ := json.Marshal(user)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewReader(body))
		rec := httptest.NewRecorder()
		controller.RegisterUser(rec, req)

		assert.Equal(t, http.StatusCreated, rec.Code)
		mockService.AssertCalled(t, "RegisterUser", mock.Anything, mock.AnythingOfType("*models.User"))
	})

	t.Run("GetUser", func(t *testing.T) {
		user := &models.User{
			ID:            uuid.New(),
			Email:         "test@example.com",
			FirstName:     "John",
			LastName:      "Doe",
			EmailVerified: true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		route := fmt.Sprintf("/api/v1/users/%v", user.ID)
		mockService.On("GetUser", mock.Anything, user.ID).Return(user, nil)
		req := httptest.NewRequest(http.MethodGet, route, nil)
		rec := httptest.NewRecorder()
		controller.GetUser(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		var responseUser models.User
		_ = json.Unmarshal(rec.Body.Bytes(), &responseUser)
		assert.Equal(t, user.Email, responseUser.Email)
		mockService.AssertCalled(t, "GetUser", mock.Anything, user.ID)
	})
}
