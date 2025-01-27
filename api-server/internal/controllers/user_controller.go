package controllers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/services"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type UserController interface {
	GetUser(w http.ResponseWriter, r *http.Request)
	RegisterUser(w http.ResponseWriter, r *http.Request)
}

type userController struct {
	service services.UserService
	logger  *zap.Logger
}

func NewUserController(service services.UserService, logger *zap.Logger) UserController {
	if service == nil || logger == nil {
		panic("userService and logger must not be nil")
	}
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
	// id, err := uuid.Parse(chi.URLParam(r, "id"))
	// if err != nil {
	// 	c.logger.Error("error getting user", zap.String("userID", id.String()), zap.Error(err))
	// 	utils.RespondWithError(w, http.StatusBadRequest, apperrors.ErrInvalidWorkspaceID.Error())
	// 	return
	// }
	// if id == uuid.Nil {
	// 	utils.RespondWithError(w, http.StatusBadRequest, "User ID is required")
	// 	return
	// }

	log.Printf("Request URL: %s", r.URL.String())

	// Log the path specifically
	log.Printf("Request Path: %s", r.URL.Path)

	uid := chi.URLParam(r, "id")
	log.Println("firebase uid", uid)

	if uid == "" {
		c.logger.Error("firebase uid is empty")
		utils.RespondWithError(w, http.StatusBadRequest, "User UID is required")
		return
	}

	user, err := c.service.FindByUID(r.Context(), uid)
	if err != nil {
		c.logger.Error("failed to get user", zap.String("userID", uid), zap.Error(err))
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
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := c.service.RegisterUser(ctx, &user); err != nil {
		c.logger.Error("failed to register user", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to register user")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, "User registered successfully")
}
