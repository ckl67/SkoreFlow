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

	// Trigger confirmation email (non-blocking for user creation)
	token, err := ctrl.authService.RequestRegistrationConfirmation(form.Email)
	if err != nil {
		logger.Login.Error("Registration Confirmation failed for %s: %v", form.Email, err)

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.FAIL(c, http.StatusServiceUnavailable, apperrors.ErrSmtpNotConfigured)
			return
		}
	}

	response := gin.H{
		"message": "User registered successfully",
		"user_id": user.ID,
	}

	if config.Config().AppEnv == "test" {
		response["token"] = token
	}

	responses.SUCCESS(c, http.StatusCreated, response)
}

// RequestRegistrationConfirmation
// re-sends a registration confirmation email.
// Security:
// - Always returns a generic response to prevent email enumeration
func (ctrl *AuthController) RequestRegistrationConfirmation(c *gin.Context) {
	var form forms.RequestRegistrationConfirmation

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	token, err := ctrl.authService.RequestRegistrationConfirmation(form.Email)
	if err != nil {
		logger.Login.Error("Registration Confirmation failed for %s: %v", form.Email, err)

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.FAIL(c, http.StatusServiceUnavailable, apperrors.ErrSmtpNotConfigured)
			return
		}
	}

	response := gin.H{
		"message": "If this email exists, a registration confirmation link has been sent.",
	}

	if config.Config().AppEnv == "test" {
		response["token"] = token
	}

	responses.SUCCESS(c, http.StatusCreated, response)
}

// Confirms a user account using a token.
// Security:
// - Does NOT expose whether token is invalid or expired
func (ctrl *AuthController) ConfirmRegistration(c *gin.Context) {
	var form forms.RegistrationConfirmation

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	user, err := ctrl.authService.ConfirmRegistration(form.Token)
	if err != nil {
		logger.Login.Warn("Registration confirmation failed: %v", err)

		// Unified error for security reasons
		responses.FAIL(c, http.StatusBadRequest, apperrors.ErrAuthTokenInvalidExpired)
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": "Registration confirmed successfully.",
		"user_id": user.ID,
	})
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

	user, token, err := ctrl.authService.SignIn(input.Email, input.Password)
	if err != nil {
		responses.FAIL(c, http.StatusUnauthorized, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": "Success Login",
		"token":   token,
		"user":    user,
	})
}

// Initiates the password reset process.
// Security:
// - Always returns a generic response (prevents email enumeration)
func (ctrl *AuthController) ForgotPassword(c *gin.Context) {
	var form forms.RequestResetPasswordRequest

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	err := ctrl.authService.ForgotPassword(form.Email)
	if err != nil {
		logger.Login.Error("Password reset request failed for %s: %v", form.Email, err)

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.FAIL(c, http.StatusServiceUnavailable, fmt.Errorf("service unavailable"))
			return
		}
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": "If this email exists, a reset link has been sent.",
	})
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

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": "Password successfully reset",
		"user_id": user.ID,
	})
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

	var input struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	err := ctrl.authService.SetExpireToken(input.Email)
	if err != nil {
		responses.FAIL(c, http.StatusNotFound, err)
		return
	}

	responses.SUCCESS(c, http.StatusOK, gin.H{
		"message": "Only for test : Expired time set",
	})

}
