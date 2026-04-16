package controllers

// ===============================================================================================
// Layer              | Component      | Responsibility
// -------------------|----------------|----------------------------------------------------------
// TRANSPORT          | controllers/   | 1. Handle HTTP requests (JSON, form-data, params)
//                    |                | 2. Delegate validation to forms layer
//                    |                | 3. Call services for business logic
//                    |                | 4. Format HTTP responses
//
// RULES:
// - No business logic here
// - No direct database access
// - Controllers must remain thin and orchestration-only
// ===============================================================================================

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"backend/core/apperrors"
	"backend/core/forms"
	"backend/core/services"
	"backend/infrastructure/logger"
	"backend/pkg/responses"

	"github.com/gin-gonic/gin"
)

// Handles all user-related HTTP endpoints.
// Acts as a bridge between HTTP layer and business logic (UserService).
type UserController struct {
	userService *services.UserService
}

func NewUserController(s *services.UserService) *UserController {
	return &UserController{userService: s}
}

// Lightweight response DTO to avoid exposing sensitive/internal fields.
type UserResponse struct {
	ID         uint32 `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	Role       int    `json:"role"`
	IsVerified bool   `json:"isVerified"`
}

// Retrieves the currently authenticated user's profile.
// The user ID is injected by the authentication middleware.
func (ctrl *UserController) GetProfile(c *gin.Context) {
	userID := c.GetUint32("user_id")
	logger.User.Debug("User %d retrieves their profile", userID)

	userGotten, err := ctrl.userService.GetProfileByID(userID)
	if err != nil {
		responses.ERROR(c, http.StatusNotFound, fmt.Errorf("user not found"))
		return
	}

	responses.JSON(c, http.StatusOK, userGotten)
}

// Returns the full list of users.
// Typically restricted or monitored (admin/audit usage).
func (ctrl *UserController) AdmGetUsers(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.User.Info("User %d (role %d) requests all users", userID, userRole)

	users, err := ctrl.userService.GetAllUsers()
	if err != nil {
		responses.ERROR(c, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(c, http.StatusOK, users)
}

// Creates a new user.
// - Validates JSON input via Gin binding
// - Delegates creation logic to service
// - Returns 201 with Location header
func (ctrl *UserController) AdmCreateUser(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.User.Info("User %d (role %d) attempts to create a new user", userID, userRole)

	var input forms.AdmCreateUserRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		responses.ERROR(c, http.StatusUnprocessableEntity, err)
		return
	}

	userCreated, err := ctrl.userService.CreateUser(input)
	if err != nil {
		responses.ERROR(c, http.StatusUnprocessableEntity, err)
		return
	}

	location := fmt.Sprintf("%s%s/%d", c.Request.Host, c.Request.URL.Path, userCreated.ID)
	c.Header("Location", location)

	responses.JSON(c, http.StatusCreated, userCreated)
}

// Retrieves a specific user by ID.
// Includes validation of path parameter and error mapping.
func (ctrl *UserController) AdmGetUser(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	uidString := c.Param("id")
	uid, err := strconv.ParseUint(uidString, 10, 32)
	if err != nil || uid <= 0 {
		responses.ERROR(c, http.StatusBadRequest, fmt.Errorf("invalid user id"))
		return
	}

	logger.User.Debug("Admin %d (role %d) retrieves user %d", userID, userRole, uid)

	userGotten, err := ctrl.userService.GetUserByID(uint32(uid))
	if err != nil {
		if errors.Is(err, apperrors.ErrUserNotFound) {
			responses.ERROR(c, http.StatusNotFound, err)
			return
		}
		responses.ERROR(c, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(c, http.StatusOK, UserResponse{
		ID:         userGotten.ID,
		Username:   userGotten.Username,
		Email:      userGotten.Email,
		Role:       userGotten.Role,
		IsVerified: userGotten.IsVerified,
	})
}

// Updates user data (PATCH-style).
// Only provided fields are modified.
func (ctrl *UserController) AdmUpdateUser(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	uidString := c.Param("id")
	uid, err := strconv.ParseUint(uidString, 10, 32)
	if err != nil || uid <= 0 {
		responses.ERROR(c, http.StatusBadRequest, fmt.Errorf("invalid user id"))
		return
	}

	logger.User.Info("User %d (role %d) attempts to update user %d", userID, userRole, uid)

	var input forms.AdmUpdateUserRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	updatedUser, err := ctrl.userService.UpdateUser(uint32(uid), input)
	if err != nil {
		responses.ERROR(c, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(c, http.StatusOK, updatedUser)
}

// Handles avatar upload (multipart/form-data).
// Delegates storage and update logic to the service layer.
func (ctrl *UserController) UploadAvatar(c *gin.Context) {
	uid := c.GetUint32("user_id")

	var form forms.UploadAvatarRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	user, err := ctrl.userService.UploadAvatar(uid, form.File)
	if err != nil {
		responses.ERROR(c, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(c, http.StatusOK, user)
}

// Removes the user's avatar file from storage.
func (ctrl *UserController) DeleteAvatar(c *gin.Context) {
	uid := c.GetUint32("user_id")

	err := ctrl.userService.DeleteAvatarFile(uid)
	if err != nil {
		responses.ERROR(c, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(c, http.StatusOK, err)
}

// Deletes a user from the system.
//
// Security rules:
// - An admin cannot delete their own account
// - Errors are mapped to appropriate HTTP responses
func (ctrl *UserController) AdmDeleteUser(c *gin.Context) {
	adminID := c.GetUint32("user_id")

	uidString := c.Param("id")
	uid, err := strconv.ParseUint(uidString, 10, 32)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, fmt.Errorf("invalid ID format"))
		return
	}

	targetUID := uint32(uid)
	logger.User.Warn("Admin %d attempts to delete user %d", adminID, targetUID)

	err = ctrl.userService.DeleteUser(targetUID, adminID)
	if err != nil {
		if strings.Contains(err.Error(), "SECURITY_ERR") {
			responses.ERROR(c, http.StatusBadRequest, fmt.Errorf("Security: an administrator cannot delete their own account"))
			return
		}

		responses.ERROR(c, http.StatusInternalServerError, fmt.Errorf("error while deleting user"))
		return
	}

	responses.JSON(c, http.StatusOK, gin.H{
		"message": fmt.Sprintf("User %d successfully deleted", targetUID),
	})
}
