package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi"
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
	t.Skip("Skipping test: feature not implemented yet")
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
		req := httptest.NewRequest(http.MethodGet, route, nil)

		// Create a new RouteContext and add the userId parameter
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", user.ID.String())

		// Set the RouteContext in the request context
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		mockService.On("GetUser", mock.Anything, user.ID).Return(user, nil)

		rec := httptest.NewRecorder()
		controller.GetUser(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		var responseUser models.User
		_ = json.Unmarshal(rec.Body.Bytes(), &responseUser)
		assert.Equal(t, user.Email, responseUser.Email)
		mockService.AssertCalled(t, "GetUser", mock.Anything, user.ID)
	})
}

// Invalid UUID format in URL parameter returns 400 bad request
// func TestGetUserReturnsBadRequestForInvalidUUID(t *testing.T) {
// 	ctrl := gomock.NewController(t)
// 	defer ctrl.Finish()

// 	mockService := services.NewUserService(ctrl)
// 	mockLogger := zap.NewNop()

// 	controller := NewUserController(mockService, mockLogger)

// 	w := httptest.NewRecorder()
// 	r := httptest.NewRequest(http.MethodGet, "/users/invalid-uuid", nil)
// 	rctx := chi.NewRouteContext()
// 	rctx.URLParams.Add("id", "invalid-uuid")
// 	r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))

// 	controller.GetUser(w, r)

// 	require.Equal(t, http.StatusBadRequest, w.Code)

// 	var response map[string]string
// 	err := json.NewDecoder(w.Body).Decode(&response)
// 	require.NoError(t, err)
// 	require.Equal(t, apperrors.ErrInvalidID.Error(), response["error"])
// }
