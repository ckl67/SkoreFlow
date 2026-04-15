package services

// APPLICATION ARCHITECTURE

// ===============================================================================================
// Layer              | Component      | Responsibility
// -------------------|----------------|----------------------------------------------------------
// ORCHESTRATION      | services/      | Business logic coordination layer.
//                    |                | Handles authentication flows, security,
//                    |                | and user lifecycle operations.
// ===============================================================================================

import (
	"fmt"
	"time"

	"backend/auth"
	"backend/core/apperrors"
	"backend/core/forms"
	"backend/core/models"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/pkg/format"
	"backend/pkg/mail"
	"backend/pkg/security"

	"gorm.io/gorm"
)

// AuthService handles authentication and account lifecycle operations.
type AuthService struct {
	db    *gorm.DB
	paths *config.Paths
}

// NewAuthService creates a new AuthService instance.
func NewAuthService(db *gorm.DB, paths *config.Paths) *AuthService {
	return &AuthService{
		db:    db,
		paths: paths,
	}
}

// Register
// Registers a new user account.
func (s *AuthService) Register(form forms.RegisterRequest) (*models.User, error) {
	// 1. Normalize input
	email := format.SanitizeUserEmail(form.Email)
	username := format.SafeFileName(form.Username)

	// 2. Check email uniqueness
	exists, err := new(models.User).ExistsByEmail(s.db, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.ErrUserEmailAlreadyUsed
	}

	// 3. Check username uniqueness
	exists, err = new(models.User).ExistsByUserName(s.db, username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.ErrUsernameTaken
	}

	// 4. Hash password
	hashedPassword, err := security.HashPassword(form.Password)
	if err != nil {
		return nil, err
	}

	// 5. Build user entity
	user := models.User{
		Username:   username,
		Email:      email,
		Password:   hashedPassword,
		Avatar:     "assets/default-avatar.png",
		Role:       config.RoleUser,
		IsVerified: false,
	}

	// 6. Persist to database
	if err := user.Create(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// SignIn
// Authenticates a user and generates a JWT token.
func (s *AuthService) SignIn(email, password string) (*models.User, string, error) {
	var user models.User

	// 1. Normalize email
	email = format.SanitizeUserEmail(email)

	// 2. Retrieve user
	if err := user.FindByEmail(s.db, email); err != nil {
		return nil, "", apperrors.ErrAuthInvalidCredentials
	}

	// 3. Verify password
	if err := security.CheckPassword(user.Password, password); err != nil {
		return nil, "", apperrors.ErrAuthInvalidCredentials
	}

	// 4. Account verification check
	if !user.IsVerified {
		logger.Login.Warn("User %s not verified", user.Username)
		return nil, "", apperrors.ErrUserNotVerified
	}

	// 5. Generate JWT token
	token, err := auth.CreateToken(user.ID, user.Role, config.Config().ApiSecret)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

// ConfirmRegistration
// Confirms a user account using a token.
func (s *AuthService) ConfirmRegistration(token string) (*models.User, error) {
	var user models.User

	// 1. Retrieve user by token
	if err := user.FindByToken(s.db, token); err != nil {
		return nil, apperrors.ErrAuthInvalideToken
	}

	// 2. Validate expiration
	if time.Now().After(user.PasswordResetExpire) {
		return nil, apperrors.ErrAuthTokenExpired
	}

	// 3. Activate account
	user.PasswordReset = ""
	user.PasswordResetExpire = time.Time{}
	user.IsVerified = true

	if err := user.Update(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// RequestRegistrationConfirmation
// Sends a registration confirmation email.
// Note:
// - Silent failure if user not found (security best practice)
func (s *AuthService) RequestRegistrationConfirmation(email string) error {
	var user models.User
	email = format.SanitizeUserEmail(email)

	if err := user.FindByEmail(s.db, email); err != nil {
		logger.Login.Warn("User not found %s", email)
		return nil
	}

	if err := user.GeneratePasswordResetToken(); err != nil {
		return nil
	}

	if err := user.Update(s.db); err != nil {
		return err
	}

	cfg := config.Config()
	if !cfg.Smtp.Enabled {
		return apperrors.ErrSmtpNotConfigured
	}

	htmlBody := s.buildRegistrationConfirmationBodyHTML(
		user.PasswordReset,
		cfg.FrontendOrigin,
		cfg.FrontendRegisterConfirmPath,
	)

	if err := mail.SendHTMLMail(email, "Confirm Your SkoreFlow Registration", htmlBody); err != nil {
		return apperrors.ErrSmtpFailed
	}

	return nil
}

// ForgotPassword
// Initiates password reset flow.
// Security:
// - Does not expose whether email exists
func (s *AuthService) ForgotPassword(email string) error {
	var user models.User

	email = format.SanitizeUserEmail(email)

	if err := user.FindByEmail(s.db, email); err != nil {
		logger.Login.Warn("User not found %s", email)
		return nil
	}

	err := user.GeneratePasswordResetToken()
	if err != nil {
		logger.Login.Info("Password reset requested for unknown email: %s", email)
		return nil
	}

	if err := user.Update(s.db); err != nil {
		return err
	}

	cfg := config.Config()
	if !cfg.Smtp.Enabled {
		return apperrors.ErrSmtpNotConfigured
	}

	logger.Login.Debug("Sending reset email to %s", email)

	htmlBody := s.buildResetBodyHTML(
		user.PasswordReset,
		cfg.FrontendOrigin,
		cfg.FrontendResetPasswordPath,
	)

	if err := mail.SendHTMLMail(email, "SkoreFlow Password Reset", htmlBody); err != nil {
		return apperrors.ErrSmtpFailed
	}

	return nil
}

// Resets a user's password using a valid token.
func (s *AuthService) ResetPassword(token string, newPassword string) (*models.User, error) {
	var user models.User

	// 1. Retrieve user by token
	if err := user.FindByToken(s.db, token); err != nil {
		logger.Login.Warn("Invalid reset token")
		return nil, apperrors.ErrAuthInvalideToken
	}

	// 2. Validate expiration
	if time.Now().After(user.PasswordResetExpire) {
		return nil, apperrors.ErrAuthTokenExpired
	}

	// 3. Hash password
	hashedPassword, err := security.HashPassword(newPassword)
	if err != nil {
		return nil, err
	}

	// 4. Update user
	user.Password = hashedPassword
	user.PasswordReset = ""
	user.PasswordResetExpire = time.Time{}

	if err := user.Update(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// Validates a password reset token without modifying data.
func (s *AuthService) ValidateResetToken(token string) error {
	var user models.User

	if err := user.FindByToken(s.db, token); err != nil {
		logger.Login.Warn("ValidateResetToken: invalid token")
		return apperrors.ErrAuthInvalideToken
	}

	if time.Now().After(user.PasswordResetExpire) {
		logger.Login.Warn("ValidateResetToken: expired token")
		return apperrors.ErrAuthTokenExpired
	}

	return nil
}

// buildResetBodyHTML (private)
// Builds the HTML email body for password reset.
func (s *AuthService) buildResetBodyHTML(token string, FrontendOrigin string, FrontendRegisterConfirmPath string) string {
	link := fmt.Sprintf("%s%s?token=%s",
		FrontendOrigin,
		FrontendRegisterConfirmPath,
		token,
	)

	return fmt.Sprintf("<p>Click here to reset your password (link expires in 1 hour): <a href='%s'>Link</a></p>", link)
}

// buildRegistrationConfirmationBodyHTML (private)
// Builds the HTML email body for account confirmation.
func (s *AuthService) buildRegistrationConfirmationBodyHTML(token string, FrontendOrigin string, FrontendResetPasswordPath string) string {
	link := fmt.Sprintf("%s%s?token=%s",
		FrontendOrigin,
		FrontendResetPasswordPath,
		token,
	)

	return fmt.Sprintf(
		"<p>Click to validate your registration (link expires in 1 hour): <a href='%s'>Confirm</a></p>",
		link,
	)
}
