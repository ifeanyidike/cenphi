package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type TeamMemberController interface {
	GetTeamMember(w http.ResponseWriter, r *http.Request)
	GetTeamMemberByUserID(w http.ResponseWriter, r *http.Request)
	GetTeamMemberByFirebaseUID(w http.ResponseWriter, r *http.Request)
	CreateTeamMember(w http.ResponseWriter, r *http.Request)
	DeleteTeamMember(w http.ResponseWriter, r *http.Request)
	GetTeamMembers(w http.ResponseWriter, r *http.Request)
}

type teamMemberController struct {
	logger  *zap.Logger
	service services.TeamMemberService
	userSvc services.UserService
}

func NewTeamMemberController(service services.TeamMemberService, userSvc services.UserService, logger *zap.Logger) TeamMemberController {
	return &teamMemberController{logger: logger, service: service, userSvc: userSvc}
}

// GetTeamMember Gets team member data by its ID.
// @Summary Get Team Member by its ID.
// @Description Fetch a team member by their ID.
// @Tags TeamMembers
// @Accept json
// @Produce json
// @Param id path string true "ID"
// @Success 200 {object} models.TeamMember
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /team-member [get]
func (c *teamMemberController) GetTeamMember(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil || id == uuid.Nil {
		c.logger.Error("invalid team member ID", zap.String("team member ID", idStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid or missing ID")
		return
	}

	user, err := c.service.GetTeamMemberData(r.Context(), id)
	if err != nil {
		c.logger.Error("failed to get team member", zap.String("team member ID", id.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, user)
}

// GetTeamMemberByUserID Gets team member data by userID.
// @Summary Get Team Member by by userID.
// @Description Fetch a team member by userID.
// @Tags TeamMembers
// @Accept json
// @Produce json
// @Param id path string true "ID"
// @Success 200 {object} models.TeamMember
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /team-member [get]
func (c *teamMemberController) GetTeamMemberByUserID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil || id == uuid.Nil {
		c.logger.Error("invalid team member ID", zap.String("team member ID", idStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid or missing ID")
		return
	}

	teammember, err := c.service.GetTeamMemberDataByUserID(r.Context(), id)
	if err != nil {
		c.logger.Error("failed to get team member", zap.String("team member ID", id.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, teammember)
}

// GetTeamMemberByFirebaseUID Gets team member data by FirebaseUID.
// @Summary Get Team Member by by FirebaseUID.
// @Description Fetch a team member by FirebaseUID.
// @Tags TeamMembers
// @Accept json
// @Produce json
// @Param id path string true "ID"
// @Success 200 {object} models.TeamMember
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /team-member [get]
func (c *teamMemberController) GetTeamMemberByFirebaseUID(w http.ResponseWriter, r *http.Request) {
	uid := chi.URLParam(r, "id")
	if uid == "" {
		c.logger.Error("invalid user firebase uid", zap.String("user firebase uid", uid))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid or missing ID")
		return
	}

	user, err := c.userSvc.FindByUID(r.Context(), uid)
	if err != nil {
		c.logger.Error("failed to get user", zap.String("Firebase UID", uid), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	member, err := c.service.GetTeamMemberDataByUserID(r.Context(), user.ID)
	if err != nil {
		c.logger.Error("failed to get team member", zap.String("team member ID", user.ID.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, member)
}

// CreateTeamMember creates a new team member.
// @Summary Create Team Member
// @Description Create a new team member.
// @Tags TeamMembers
// @Accept json
// @Produce json
// @Param team member body models.TeamMember true "TeamMember data"
// @Success 201 {string} string "TeamMember created successfully"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /team-member [post]
func (c *teamMemberController) CreateTeamMember(w http.ResponseWriter, r *http.Request) {
	var member models.TeamMember

	// Parse and validate the input
	if err := json.NewDecoder(r.Body).Decode(&member); err != nil {
		c.logger.Error("invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if member.WorkspaceID == uuid.Nil || member.UserID == uuid.Nil {
		utils.RespondWithError(w, http.StatusBadRequest, "The member data is malformed: Invalid member")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := c.service.AddTeamMember(ctx, &member); err != nil {
		c.logger.Error("failed to register member", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to register member")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, "User registered successfully")
}

// DeleteTeamMember deletes a team member by their ID.
// @Summary Delete Team Member
// @Description Delete a team member by their ID.
// @Tags TeamMembers
// @Accept json
// @Produce json
// @Param id path string true "ID"
// @Success 200 {string} string "TeamMember deleted successfully"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /team-member/{id} [delete]
func (c *teamMemberController) DeleteTeamMember(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil || id == uuid.Nil {
		c.logger.Error("invalid team member ID", zap.String("team member ID", idStr), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid or missing ID")
		return
	}

	if err := c.service.RemoveTeamMember(r.Context(), id); err != nil {
		c.logger.Error("failed to delete team member", zap.String("team member ID", id.String()), zap.Error(err))
		if err == apperrors.ErrNotFound {
			utils.RespondWithError(w, http.StatusNotFound, "Team member not found")
		} else {
			utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete team member")
		}
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Team member deleted successfully",
	})
}

// GetTeamMembers retrieves a list of team members with pagination support.
// @Summary Get Team Members
// @Description Retrieve a list of team members with pagination support.
// @Tags TeamMembers
// @Accept json
// @Produce json
// @Param workspaceID path string true "workspaceID"
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Number of items per page (default: 10)"
// @Success 200 {array} models.TeamMember
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /team-members [get]
func (c *teamMemberController) GetTeamMembers(w http.ResponseWriter, r *http.Request) {

	workspaceID, err := uuid.Parse(chi.URLParam(r, "workspace_id"))
	if err != nil || workspaceID == uuid.Nil {
		c.logger.Error("invalid team member ID", zap.String("workspace  ID", workspaceID.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid or missing ID")
		return
	}

	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil {
		page = 1
	}

	pageSize, err := strconv.Atoi(r.URL.Query().Get("page_size"))
	if err != nil {
		pageSize = 10
	}

	if page < 1 || pageSize < 1 {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid page or page_size")
		return
	}

	teamMembers, err := c.service.GetTeamMembers(r.Context(), workspaceID, page, pageSize)
	if err != nil {
		c.logger.Error("failed to get team members", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve team members")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, teamMembers)
}
