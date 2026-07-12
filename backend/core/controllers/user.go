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

	"backend/core/apperrors"
	"backend/core/dto"
	"backend/core/forms"
	"backend/core/models"
	"backend/core/services"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/pkg/responses"

	"github.com/gin-gonic/gin"
)

// Handles all user-related HTTP endpoints.
// Acts as a bridge between HTTP layer and business logic (UserService).
type UserController struct {
	userService *services.UserService
}

func NewUserController(
	userService *services.UserService,
) *UserController {

	return &UserController{
		userService: userService,
	}
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

	userProfile, err := ctrl.userService.GetProfileByID(userID)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, fmt.Errorf("user not found"))
		return
	}

	response := dto.ProfileUserResponse{
		Message: fmt.Sprintf("Get Profile of UserID %d", userID),
		User:    dto.ToUserPublicResponse(userProfile),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Update user profile
func (ctrl *UserController) UpdateProfile(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.User.Info("User %d (role %d) attempts to update itself", userID, userRole)

	var input forms.UpdateProfileRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}
	logger.User.Debug("Update payload: %+v", input)

	updatedUser, err := ctrl.userService.UpdateProfile(uint32(userID), input)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	response := dto.ProfileUserResponse{
		Message: fmt.Sprintf("Update Profile of UserID %d", userID),
		User:    dto.ToUserPublicResponse(updatedUser),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Update mail
func (ctrl *UserController) UpdateMail(c *gin.Context) {
	userID := c.GetUint32("user_id")
	var input forms.UpdateMailRequest
	var updatedUser *models.User
	var err error

	if err = c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	// Update the user (pointer) with the new email and with expired token for second step validation
	updatedUser, err = ctrl.userService.UpdateEmail(uint32(userID), input)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	// Send confirmation email (non-blocking in test mode ,and token in test mode)
	tokenEmail, err := ctrl.userService.SendUpdateEmailToken(updatedUser)
	if err != nil {

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.FAIL(c, http.StatusServiceUnavailable, err)
			return
		}

		responses.FAIL(c, http.StatusInternalServerError, err)
		return

	}

	response := dto.UpdateMailResponse{
		Email:        updatedUser.Email,
		PendingEmail: updatedUser.PendingEmail,
		Message:      "email Update",
	}

	// Only for vitest
	if config.Config().TestMode {
		response.TokenEmail = tokenEmail
	}

	responses.SUCCESS(c, http.StatusOK, response)
}

// Confirms email update using a token.
func (ctrl *UserController) ConfirmUpdateMail(c *gin.Context) {
	var form forms.ConfirmUpdateMailRequest

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	user, err := ctrl.userService.ConfirmUpdateMail(form.Token)
	if err != nil {
		logger.Login.Warn("Email Update confirmation failed: %v", err)

		// Unified error for security reasons
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrAuthTokenInvalidExpired)
		return
	}

	response := dto.ConfirmUpdateMailResponse{
		Message: "email update confirmed successfully.",
		UserId:  user.ID,
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Handles avatar upload (multipart/form-data).
// Delegates storage and update logic to the service layer.
func (ctrl *UserController) UploadAvatar(c *gin.Context) {
	userID := c.GetUint32("user_id")

	logger.User.Debug("User %d attempts to upload file", userID)

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

	logger.User.Debug("Upload file %s", form.File.Filename)

	user, err := ctrl.userService.UploadAvatar(userID, form.File)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	response := dto.ProfileUserResponse{
		Message: fmt.Sprintf("Upload Avatar of UserID %d", userID),
		User:    dto.ToUserPublicResponse(user),
	}

	responses.SUCCESS(c, http.StatusOK, response)
}

// GetUsersPage fetches a paginated list of composers with optional search filters
func (ctrl *UserController) AdminGetUsersPage(c *gin.Context) {
	uid := c.GetUint32("user_id")

	var form forms.AdminGetUsersPageRequest
	if err := c.ShouldBind(&form); err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Score.Debug("(Controller AdminGetUsersPage) : User: %d | Page: %d | PageSize: %d | SortBy: %s",
		uid, form.Page, form.Limit, form.SortBy)

	pageData, err := ctrl.userService.AdminGetUsersPage(uid, form)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	// Cast to users
	// Pagination.Rows is stored as interface{} because the same Pagination
	// structure is reused for different entities (users, scores, composers, ...).
	//
	// Here we know that AdminGetUsersPage() populated Rows with []*models.User,
	// so we perform a type assertion to recover the concrete type.
	//
	// The "ok" value prevents a panic if Rows contains an unexpected type.
	// This is mandatory to avoid a panic and a program stop !!
	//
	// Example
	// var x interface{} --> x contains something but we don't know what
	// Could be
	//		x = 123
	//		x = "hello"
	//    x = []*models.User{}
	// To get the right value
	// 	users, ok := x.([]*models.User)

	var users []*models.User
	var ok bool
	users, ok = pageData.Rows.([]*models.User)
	if !ok {
		responses.FAIL(c, http.StatusInternalServerError, fmt.Errorf("invalid users type"))
		return
	}

	response := dto.AdminGetUsersPageResponse{
		Message:    "Users retrieved successfully",
		Page:       pageData.Page,
		Limit:      pageData.Limit,
		TotalRows:  pageData.TotalRows,
		TotalPages: pageData.TotalPages,
		Users:      dto.ToUsersPublicResponse(users),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Creates a new user.
// - Validates JSON input via Gin binding
// - Delegates creation logic to service
func (ctrl *UserController) AdminCreateUser(c *gin.Context) {
	userID := c.GetUint32("user_id")
	userRole := c.GetInt("user_role")

	logger.User.Info("User %d (role %d) attempts to create a new user", userID, userRole)

	var input forms.AdminCreateUserRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		responses.FAIL(c, http.StatusUnprocessableEntity, err)
		return
	}

	userCreated, err := ctrl.userService.AdminCreateUser(input)
	if err != nil {
		responses.FAIL(c, http.StatusUnprocessableEntity, err)
		return
	}

	response := dto.AdminCreateUserResponse{
		Message: "User created successfully",
		UserId:  userCreated.ID,
	}
	responses.SUCCESS(c, http.StatusCreated, response)

}

// Retrieves a specific user by ID.
// Includes validation of path parameter and error mapping.
func (ctrl *UserController) AdminGetUser(c *gin.Context) {
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

	response := dto.AdminGetUserResponse{
		Message: "User retrieved successfully",
		User:    dto.ToUserPublicResponse(userGotten),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Updates user data (PATCH-style).
// Only provided fields are modified.
func (ctrl *UserController) AdminUpdateUser(c *gin.Context) {
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

	var input forms.AdminUpdateUserRequest
	if err = c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	updatedUser, err = ctrl.userService.AdminUpdateUser(uint32(uid), input)
	if err != nil {
		if err == apperrors.ErrUserUsernameAlreadyUsed || err == apperrors.ErrUserEmailAlreadyUsed {
			responses.FAIL(c, http.StatusConflict, err)
			return
		}

		if err == apperrors.ErrUserNotFound {
			responses.FAIL(c, http.StatusNotFound, err)
			return
		}

		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	response := dto.AdminUpdateUserResponse{
		Message: "User Updated successfully",
		User:    dto.ToUserPublicResponse(updatedUser),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Deletes a user from the system.
//
// Security rules:
// - An admin cannot delete their own account
// - Errors are mapped to appropriate HTTP responses
func (ctrl *UserController) AdminDeleteUser(c *gin.Context) {
	adminID := c.GetUint32("user_id")

	uidString := c.Param("id")
	uid, err := strconv.ParseUint(uidString, 10, 32)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, fmt.Errorf("invalid ID format"))
		return
	}

	targetUID := uint32(uid)
	logger.User.Warn("Admin %d attempts to delete user %d", adminID, targetUID)

	err = ctrl.userService.AdminDeleteUser(targetUID, adminID)

	if err != nil {

		if err == apperrors.ErrSelfAccountProtection {
			responses.FAIL(c, http.StatusForbidden, err)
			return
		}

		if err == apperrors.ErrUserNotFound {
			responses.FAIL(c, http.StatusNotFound, err)
			return
		}

		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	response := dto.AdminDeleteUserResponse{
		Message: fmt.Sprintf("User %d successfully deleted", uid),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Removes the user's avatar file from storage.
func (ctrl *UserController) DeleteAvatar(c *gin.Context) {
	uid := c.GetUint32("user_id")

	err := ctrl.userService.DeleteAvatarFile(uid)
	if err != nil {
		responses.FAIL(c, http.StatusInternalServerError, err)
		return
	}

	response := dto.DeleteAvatarResponse{
		Message: fmt.Sprintf("Avatar deleted successfully for UserID %d", uid),
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

func (ctrl *UserController) GetAvatar(c *gin.Context) {
	userID := c.GetUint32("user_id")
	file, err := ctrl.userService.AvatarFile(userID)
	logger.User.Debug("(Ctrl-GetAvatar) AvatarFile : %s", file)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	c.File(file)
}
