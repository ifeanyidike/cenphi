package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/apperrors"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type UserController interface {
	GetUser(w http.ResponseWriter, r *http.Request)
	RegisterUser(w http.ResponseWriter, r *http.Request)
	UpdateUser(w http.ResponseWriter, r *http.Request)
}

type userController struct {
	service services.UserService
	logger  *zap.Logger
}

func NewUserController(service services.UserService, logger *zap.Logger) UserController {
	return &userController{service: service, logger: logger}
}

// GetUser retrieves a user by ID.
// @Summary Get User
// @Description Fetch a user by their ID.
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} models.User
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /users [get]
func (c *userController) GetUser(w http.ResponseWriter, r *http.Request) {
	params := chi.RouteContext(r.Context())
	c.logger.Info("URL Params", zap.Any("params", params))

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		c.logger.Error("ilogUrl", zap.String("url", r.URL.String()), zap.Error(err))
		c.logger.Error("error getting user", zap.String("userID", id.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, apperrors.ErrInvalidID.Error())
		return
	}
	if id == uuid.Nil {
		utils.RespondWithError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	user, err := c.service.GetUser(r.Context(), id)
	if err != nil {
		c.logger.Error("failed to get user", zap.String("userID", id.String()), zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, user)
}

// RegisterUser registers a new user.
// @Summary Register User
// @Description Register a new user.
// @Tags Users
// @Accept json
// @Produce json
// @Param user body models.User true "User data"
// @Success 201 {string} string "User registered successfully"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /users [post]
func (c *userController) RegisterUser(w http.ResponseWriter, r *http.Request) {
	var user models.User

	// Parse and validate the input
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		c.logger.Error("invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if user.Email == "" || user.FirebaseUID == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "The user data is malformed: Invalid user")
		return
	}
	user.ID = uuid.New()

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := c.service.RegisterUser(ctx, &user); err != nil {
		c.logger.Error("failed to register user", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to register user")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, "User registered successfully")
}

// UpdateUser updates a new user.
// @Summary Update User
// @Description Update a new user.
// @Tags Users
// @Accept json
// @Produce json
// @Param user body models.User true "User data"
// @Param firebase_uid path string true "Firebase UID"
// @Success 200 {string} string "User updateed successfully"
// @Failure 400 {object} utils.ErrorResponse
// @Failure 500 {object} utils.ErrorResponse
// @Router /users [post]
func (c *userController) UpdateUser(w http.ResponseWriter, r *http.Request) {
	uid := chi.URLParam(r, "uid")

	var updates map[string]any

	// Parse and validate the input
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		c.logger.Error("invalid request payload", zap.Error(err))
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := c.service.UpdateUser(ctx, uid, updates); err != nil {
		c.logger.Error("failed to update user", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, "User updated successfully")
}
