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
	"backend/core/models"
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

// --- DTO - Data Transfer Object ---
// Lightweight response DTO to avoid exposing sensitive/internal fields.
type UserResponse struct {
	ID         uint32 `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	Avatar     string `json:"avatar"`
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
		responses.FAIL(c, http.StatusNotFound, fmt.Errorf("user not found"))
		return
	}

	responses.SUCCESS(c, http.StatusOK, userGotten)
}

// Updates user data (PATCH-style).
// Only provided fields are modified.
func (ctrl *UserController) UpdateProfile(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.User.Info("User %d (role %d) attempts to update itself", userID, userRole)

	var input forms.UpdateUserRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	updatedUser, err := ctrl.userService.UpdateProfile(uint32(userID), input)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, updatedUser)
}

// Returns the full list of users.
// Typically restricted or monitored (admin/audit usage).
func (ctrl *UserController) AdmGetUsers(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.User.Info("User %d (role %d) requests all users", userID, userRole)

	users, err := ctrl.userService.GetAllUsers()
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, users)
}

// GetUsersPage fetches a paginated list of composers with optional search filters
func (ctrl *UserController) AdmGetUsersPage(c *gin.Context) {
	uid := c.GetUint32("user_id")

	var form forms.GetUsersPageRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Score.Debug("(Controller AdmGetUsersPage) : User: %d | Page: %d | PageSize: %d | SortBy: %s",
		uid, form.Page, form.Limit, form.SortBy)

	pageData, err := ctrl.userService.GetUsersPage(uid, form)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, pageData)
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
		responses.FAIL(c, http.StatusUnprocessableEntity, err)
		return
	}

	userCreated, err := ctrl.userService.CreateUser(input)
	if err != nil {
		responses.FAIL(c, http.StatusUnprocessableEntity, err)
		return
	}

	location := fmt.Sprintf("%s%s/%d", c.Request.Host, c.Request.URL.Path, userCreated.ID)
	c.Header("Location", location)

	responses.SUCCESS(c, http.StatusCreated, userCreated)
}

// Retrieves a specific user by ID.
// Includes validation of path parameter and error mapping.
func (ctrl *UserController) AdmGetUser(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	uidString := c.Param("id")
	uid, err := strconv.ParseUint(uidString, 10, 32)
	if err != nil || uid <= 0 {
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid user id"))
		return
	}

	logger.User.Debug("Admin %d (role %d) retrieves user %d", userID, userRole, uid)

	userGotten, err := ctrl.userService.GetUserByID(uint32(uid))
	if err != nil {
		if errors.Is(err, apperrors.ErrUserNotFound) {
			responses.FAIL(c, http.StatusNotFound, err)
			return
		}
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	response := UserResponse{
		ID:         userGotten.ID,
		Username:   userGotten.Username,
		Email:      userGotten.Email,
		Avatar:     userGotten.Avatar,
		Role:       userGotten.Role,
		IsVerified: userGotten.IsVerified,
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Updates user data (PATCH-style).
// Only provided fields are modified.
func (ctrl *UserController) AdmUpdateUser(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	var err error
	var uid uint64
	var updatedUser *models.User

	uidString := c.Param("id")
	uid, err = strconv.ParseUint(uidString, 10, 32)
	if err != nil || uid <= 0 {
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid user id"))
		return
	}

	logger.User.Info("User %d (role %d) attempts to update user %d", userID, userRole, uid)

	var input forms.AdmUpdateUserRequest
	if err = c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	updatedUser, err = ctrl.userService.UpdateUser(uint32(uid), input)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	response := UserResponse{
		ID:         updatedUser.ID,
		Username:   updatedUser.Username,
		Email:      updatedUser.Email,
		Avatar:     updatedUser.Avatar,
		Role:       updatedUser.Role,
		IsVerified: updatedUser.IsVerified,
	}

	responses.SUCCESS(c, http.StatusOK, response)
}

// Handles avatar upload (multipart/form-data).
// Delegates storage and update logic to the service layer.
func (ctrl *UserController) UploadAvatar(c *gin.Context) {
	uid := c.GetUint32("user_id")

	logger.User.Debug("User %d attempts to upload file", uid)

	var form forms.UploadAvatarRequest
	if err := c.ShouldBind(&form); err != nil {

		responses.VALIDATION_ERROR(c, err)
		return
	}

	// 3. Validation
	if err := form.ValidateForm(); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.User.Debug("User %d attempts to upload file %s", uid, form.File.Filename)

	user, err := ctrl.userService.UploadAvatar(uid, form.File)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, user)
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
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid ID format"))
		return
	}

	targetUID := uint32(uid)
	logger.User.Warn("Admin %d attempts to delete user %d", adminID, targetUID)

	err = ctrl.userService.DeleteUser(targetUID, adminID)
	if err != nil {
		if strings.Contains(err.Error(), "SECURITY_ERR") {
			responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("Security: an administrator cannot delete their own account"))
			return
		}

		responses.FAIL(c, http.StatusInternalServerError, fmt.Errorf("error while deleting user"))
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": fmt.Sprintf("User %d successfully deleted", targetUID),
	})
}

// Removes the user's avatar file from storage.
func (ctrl *UserController) DeleteAvatar(c *gin.Context) {
	uid := c.GetUint32("user_id")

	err := ctrl.userService.DeleteAvatarFile(uid)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, err)
}
