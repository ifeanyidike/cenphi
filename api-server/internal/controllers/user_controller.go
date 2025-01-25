package controllers

import (
	"encoding/json"
	"net/http"

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
	return &userController{service: service, logger: logger}
}

// GetUser retrieves a user by ID.
// @Summary Get User
// @Description Fetch a user by their ID.
// @Tags Users
// @Accept json
// @Produce json
// @Param id query string true "User ID"
// @Success 200 {object} models.User
// @Failure 400 {object} utils.ErrorResponse
// @Failure 404 {object} utils.ErrorResponse
// @Router /users [get]
func (c *userController) GetUser(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	user, err := c.service.GetUser(id)
	if err != nil {
		c.logger.Error("failed to get user", zap.String("userID", id), zap.Error(err))
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
	if user.Email == "" || user.Password == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Email and Password are required")
		return
	}

	// Register the user via the service layer
	if err := c.service.RegisterUser(&user); err != nil {
		c.logger.Error("failed to register user", zap.Error(err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to register user")
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, "User registered successfully")
}
