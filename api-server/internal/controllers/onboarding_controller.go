package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type OnboardingController interface {
	OnboardOwner(w http.ResponseWriter, r *http.Request)
}

type onboardingController struct {
	logger  *zap.Logger
	service services.OnboardingService
}

// Define a struct to encapsulate both workspace and team member data
type OnboardRequest struct {
	Uid        string            `json:"firebase_uid"`
	Workspace  models.Workspace  `json:"workspace"`
	TeamMember models.TeamMember `json:"team_member"`
}

func (c *onboardingController) handleOnboarding(w http.ResponseWriter, r *http.Request,
	onboardFunc func(ctx context.Context, uid string, workspace *models.Workspace, team_member *models.TeamMember) error,
) {
	var req OnboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Error("Invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
	}

	if req.Uid == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid userId or workspace ID")
		return
	}

	if req.Workspace.ID == uuid.Nil {
		req.Workspace.ID = uuid.New()
	}

	if req.TeamMember.ID == uuid.Nil {
		req.TeamMember.ID = uuid.New()
	}

	req.TeamMember.WorkspaceID = req.Workspace.ID
	req.TeamMember.Role = models.Admin

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := onboardFunc(ctx, req.Uid, &req.Workspace, &req.TeamMember); err != nil {
		c.logger.Error("Failed to onboard owner", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to onboard owner")
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, "Onboarding successful")
}

func NewOnboardingController(service services.OnboardingService, logger *zap.Logger) OnboardingController {
	return &onboardingController{logger: logger, service: service}
}

// OnboardOwner creates a workspace and adds the creator as owner (teammember).
// @Summary Create Workspace as an owner
// @Description Create a new workspace as an owner.
// @Tags Workspaces, TeamMembers, Users
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param request body OnboardRequest true "Onboarding Data"
// @Success 201 {string} string "Onboarding successful"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /onboard [post]
func (c *onboardingController) OnboardOwner(w http.ResponseWriter, r *http.Request) {
	// userID, err := uuid.Parse(chi.URLParam(r, "userId"))
	// if err != nil || userID == uuid.Nil {
	// 	c.logger.Error("Invalid user ID", zap.Error(err))
	// 	utils.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("Invalid or missing user ID %v", err))
	// 	return
	// }

	c.handleOnboarding(w, r, c.service.OnboardOwner)
}
