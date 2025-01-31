package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi"
	"github.com/golang/mock/gomock"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services/mocks"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestOnboardOwnerSuccess(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockService := mocks.NewMockOnboardingService(ctrl)
	mockLogger := zap.NewNop()

	controller := &onboardingController{
		service: mockService,
		logger:  mockLogger,
	}

	userID := uuid.New()
	workspaceID := uuid.New()

	req := OnboardRequest{
		Workspace: models.Workspace{ID: workspaceID},
		TeamMember: models.TeamMember{
			UserID:      userID,
			WorkspaceID: workspaceID,
			Role:        models.Admin,
		},
		UserId: userID,
	}

	reqBody, _ := json.Marshal(req)

	// Correcting the request URL to match the registered route
	httpReq := httptest.NewRequest(http.MethodPost, "/api/v1/onboard/", bytes.NewBuffer(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")

	// Creating a valid Chi Route Context
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("userId", userID.String())
	httpReq = httpReq.WithContext(context.WithValue(httpReq.Context(), chi.RouteCtxKey, rctx))

	mockService.EXPECT().
		OnboardOwner(gomock.Any(), userID, &req.Workspace, &req.TeamMember).
		Return(nil)

	w := httptest.NewRecorder()
	controller.OnboardOwner(w, httpReq)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Contains(t, w.Body.String(), "Onboarding successful")
}
