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
	"backend/core/apperrors"
	"backend/core/forms"
	"backend/core/services"
	"backend/infrastructure/logger"
	"backend/pkg/responses"
	"errors"
	"fmt"
	"net/http"

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
		responses.ERROR(c, http.StatusBadRequest, err)
		return
	}

	// Trigger confirmation email (non-blocking for user creation)
	err = ctrl.authService.RequestRegistrationConfirmation(form.Email)
	if err != nil {
		logger.Login.Error("Registration Confirmation failed for %s: %v", form.Email, err)

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.ERROR(c, http.StatusServiceUnavailable, apperrors.ErrSmtpNotConfigured)
			return
		}
	}

	responses.JSON(c, http.StatusCreated, gin.H{
		"message": "User registered successfully. Please check your email to confirm registration.",
		"user_id": user.ID,
	})
}

// RequestRegistrationConfirmation
// Resends a registration confirmation email.
// Security:
// - Always returns a generic response to prevent email enumeration
func (ctrl *AuthController) RequestRegistrationConfirmation(c *gin.Context) {
	var form forms.RequestRegistrationConfirmation

	if err := c.ShouldBindJSON(&form); err != nil {
		responses.VALIDATION_ERROR(c, err)
		return
	}

	err := ctrl.authService.RequestRegistrationConfirmation(form.Email)
	if err != nil {
		logger.Login.Error("Registration Confirmation failed for %s: %v", form.Email, err)

		if errors.Is(err, apperrors.ErrSmtpNotConfigured) {
			responses.ERROR(c, http.StatusServiceUnavailable, apperrors.ErrSmtpNotConfigured)
			return
		}
	}

	responses.JSON(c, http.StatusOK, gin.H{
		"message": "If this email exists, a registration confirmation link has been sent.",
	})
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
		responses.ERROR(c, http.StatusBadRequest, apperrors.ErrAuthTokenInvalidExpired)
		return
	}

	responses.JSON(c, http.StatusOK, gin.H{
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
		responses.ERROR(c, http.StatusUnauthorized, err)
		return
	}

	responses.JSON(c, http.StatusOK, gin.H{
		"token": token,
		"user":  user,
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
			responses.ERROR(c, http.StatusServiceUnavailable, fmt.Errorf("service unavailable"))
			return
		}
	}

	responses.JSON(c, http.StatusOK, gin.H{
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

		responses.ERROR(c, http.StatusBadRequest, apperrors.ErrAuthTokenInvalidExpired)
		return
	}

	responses.JSON(c, http.StatusOK, gin.H{
		"message": "Password successfully reset",
		"user_id": user.ID,
	})
}

// ValidateResetToken
// Validates whether a password reset token is still valid.
func (ctrl *AuthController) ValidateResetToken(c *gin.Context) {
	token := c.Query("token")

	if token == "" {
		responses.ERROR(c, http.StatusBadRequest, apperrors.ErrMissingToken)
		return
	}

	err := ctrl.authService.ValidateResetToken(token)
	if err != nil {
		responses.ERROR(c, http.StatusBadRequest, apperrors.ErrAuthTokenInvalidExpired)
		return
	}

	responses.JSON(c, http.StatusOK, gin.H{
		"message": "Token is valid",
	})
}
