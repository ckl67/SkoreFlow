package controllers

// ===============================================================================================
// Layer              | Component      | Responsibility
// -------------------|----------------|----------------------------------------------------------
// TRANSPORT          | controllers/   | 1. Handle HTTP requests (JSON, form-data, query params)
//                    |                | 2. Delegate validation to the forms layer
//                    |                | 3. Call services for business logic
//                    |                | 4. Format and return HTTP responses
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

	"backend/core/apperrors"
	"backend/core/dto"
	"backend/core/forms"
	"backend/core/services"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/pkg/responses"

	"github.com/gin-gonic/gin"
)

// Handles all authentication-related HTTP operations:
// - User registration
// - Email confirmation flow
// - Login (JWT issuance)
// - Password reset flow (request + update)
// - Token validation
type AuthController struct {
	authService *services.AuthService
}

func NewAuthController(as *services.AuthService) *AuthController {
	return &AuthController{authService: as}
}

// Creates a new user account:
// - Email sending failure does NOT block user creation
// - SMTP misconfiguration is explicitly handled
func (ctrl *AuthController) Register(c *gin.Context) {
	var form forms.RegisterRequest

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	user, err := ctrl.authService.Register(form)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, err)
		return
	}

	logger.Login.Debug("Attempting to send registration confirmation email to %s", user.Email)
	// Trigger confirmation email (non-blocking for user creation)
	token, err := ctrl.authService.SendRegistration(form.Email)
	if err != nil {
		logger.Login.Error("Registration Confirmation failed for %s: %v", form.Email, err)

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.FAIL(c, http.StatusServiceUnavailable, apperrors.ErrSmtpNotConfigured)
			return
		}
	}

	response := dto.RegisterResponse{
		Message:    "User Register Requested",
		IsVerified: user.IsVerified,
	}

	// Only for vitest
	if config.Config().TestMode {
		response.Token = token
	}

	responses.SUCCESS(c, http.StatusCreated, response)

}

// ResendRegistration
// re-sends a registration confirmation email.
// Security:
// - Always returns a generic response to prevent email enumeration
func (ctrl *AuthController) ResendRegistration(c *gin.Context) {
	var form forms.ResendRegistrationRequest

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	token, err := ctrl.authService.SendRegistration(form.Email)
	if err != nil {
		logger.Login.Error("Registration Confirmation failed for %s: %v", form.Email, err)

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.FAIL(c, http.StatusServiceUnavailable, apperrors.ErrSmtpNotConfigured)
			return
		}
	}

	response := dto.ResendRegistrationResponse{
		Message: "If this email exists, a registration confirmation link has been sent.",
	}

	// Only for vitest
	if config.Config().TestMode {
		response.Token = token
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Confirms a user account using a token.
// Security:
// - Does NOT expose whether token is invalid or expired
func (ctrl *AuthController) ConfirmRegistration(c *gin.Context) {
	var form forms.ConfirmRegistrationRequest

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	logger.Login.Debug("Attempting to confirm registration with token: %s", form.Token)

	user, err := ctrl.authService.ConfirmRegistration(form.Token)
	if err != nil {

		logger.Login.Warn("Registration confirmation failed: %v", err)

		if errors.Is(err, apperrors.ErrAuthInvalidToken) {
			responses.FAIL(c, http.StatusBadRequest, apperrors.ErrAuthInvalidToken)
			return
		}
		if errors.Is(err, apperrors.ErrAuthTokenExpired) {
			responses.FAIL(c, http.StatusBadRequest, apperrors.ErrAuthTokenExpired)
			return
		}

		// Unified error for security reasons
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrAuthTokenInvalidExpired)
		return
	}

	response := dto.ConfirmRegistrationResponse{
		Message:    "Registration confirmed successfully.",
		UserId:     user.ID,
		IsVerified: user.IsVerified,
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// Authenticates a user and returns a JWT token.
// Notes:
// - Invalid credentials return HTTP 401
// - Verification status is enforced at service level
func (ctrl *AuthController) Login(c *gin.Context) {
	var input forms.LoginRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	user, token, err := ctrl.authService.Login(input.Email, input.Password)
	if err != nil {
		responses.FAIL(c, http.StatusUnauthorized, err)
		return
	}

	response := dto.LoginResponse{
		Message: "Success Login",
		Token:   token,
		User:    dto.ToUserPublicResponse(user),
	}

	responses.SUCCESS(c, http.StatusOK, response)
}

// Logout
// Real Logout will be done on the frontend via :
//
//	localStorage.removeItem("token");
//
// Login time will expire after x hours, meaning user has to be login again : Time is configured in file token.go
func (ctrl *AuthController) Logout(c *gin.Context) {
	response := dto.LogoutResponse{
		Message: "Logout successful",
	}

	responses.SUCCESS(c, http.StatusOK, response)
}

// Initiates the password reset process.
// Security:
// - Always returns a generic response (prevents email enumeration)
func (ctrl *AuthController) ForgotPassword(c *gin.Context) {
	var form forms.ForgotPasswordRequest

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	token, err := ctrl.authService.ForgotPassword(form.Email)
	if err != nil {
		logger.Login.Error("Password reset request failed for %s: %v", form.Email, err)

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.FAIL(c, http.StatusServiceUnavailable, fmt.Errorf("service unavailable"))
			return
		}
	}

	response := dto.ForgotPasswordResponse{
		Message: "If this email exists, a reset link has been sent.",
	}

	// Only for vitest
	if config.Config().TestMode {
		response.Token = token
	}
	responses.SUCCESS(c, http.StatusOK, response)

}

// Resets a user's password using a valid reset token.
func (ctrl *AuthController) ResetPassword(c *gin.Context) {
	var form forms.ResetPasswordRequest

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	user, err := ctrl.authService.ResetPassword(form.Token, form.Password)
	if err != nil {
		logger.Login.Warn("Password reset failed: %v", err)

		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrAuthTokenInvalidExpired)
		return
	}

	response := dto.ResetPasswordResponse{
		Message: "If this email exists, a reset link has been sent.",
		UserId:  user.ID,
	}

	responses.SUCCESS(c, http.StatusOK, response)

}

// ValidateResetToken
// Validates whether a password reset token is still valid.
func (ctrl *AuthController) ValidateResetToken(c *gin.Context) {
	token := c.Query("token")

	if token == "" {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrMissingToken)
		return
	}

	err := ctrl.authService.ValidateResetToken(token)
	if err != nil {
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrAuthTokenInvalidExpired)
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": "Token is valid",
	})
}

// Only for test : AdmGetResetToken
func (ctrl *AuthController) AdmGetResetToken(c *gin.Context) {
	adminID := c.GetUint32("user_id")
	email := c.Param("email")

	logger.User.Warn("Admin %d requested reset token for %s", adminID, email)

	token, err := ctrl.authService.GetResetToken(email)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": "Only for test : Get Rest Token",
		"token":   token,
	})
}

// Only for test : AdmExpireToken
func (ctrl *AuthController) AdmExpireToken(c *gin.Context) {
	adminID := c.GetUint32("user_id")
	var input struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	logger.User.Warn("(AdmExpireToken) Admin %d requested reset token for %s", adminID, input.Email)

	err := ctrl.authService.SetExpireToken(input.Email)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": "Only for test : Expired time set",
	})

}
