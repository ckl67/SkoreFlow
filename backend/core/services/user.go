package services

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// ORCHESTRATION      | services/      | Business "brain". Coordinates models, security,
//                    |                | storage, and business rules.
// ===============================================================================================

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend/core/apperrors"
	"backend/core/forms"
	"backend/core/models"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/pkg/filedir"
	"backend/pkg/format"
	"backend/pkg/mail"
	"backend/pkg/media"
	"backend/pkg/security"

	"gorm.io/gorm"
)

// UserService handles user-related business logic and orchestration.
type UserService struct {
	db    *gorm.DB
	paths *config.Paths
}

// NewUserService creates a new instance of UserService.
func NewUserService(db *gorm.DB, paths *config.Paths) *UserService {
	return &UserService{
		db:    db,
		paths: paths,
	}
}

// GetProfileByID retrieves a user profile by ID.
// Returns a business error if the user does not exist.
func (s *UserService) GetProfileByID(userID uint32) (*models.User, error) {
	user := models.User{}

	if err := user.FindByID(s.db, userID); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	return &user, nil
}

// GetAllUsers retrieves all users from the database.
func (s *UserService) GetAllUsers() ([]models.User, error) {
	users, err := models.GetAllUsers(s.db)
	if err != nil {
		return nil, err
	}
	return users, nil
}

// CreateUser creates a new user with hashed password and default role.
func (s *UserService) AdminCreateUser(input forms.AdminCreateUserRequest) (*models.User, error) {
	// 1. Normalize input
	email := format.SanitizeUserEmail(input.Email)
	username := format.SafeFileName(input.Username)

	// 2. Check email uniqueness
	exists, err := new(models.User).ExistsByEmail(s.db, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.ErrUserEmailAlreadyUsed
	}

	// 3. Check username uniqueness
	exists, err = new(models.User).ExistsByUsername(s.db, username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.ErrUsernameTaken
	}

	hashedPassword, err := security.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	user := models.User{
		Username:            username,
		Email:               email,
		Password:            hashedPassword,
		Role:                config.RoleUser,
		Avatar:              "users/default.png",
		PasswordReset:       "",
		PasswordResetExpire: time.Time{},
		IsVerified:          true,
	}

	if err := user.Save(s.db); err != nil {
		return nil, apperrors.ErrDatabaseAccess
	}

	return &user, nil
}

func (s *UserService) GetUserByID(uid uint32) (*models.User, error) {
	user := models.User{}

	if err := user.FindByID(s.db, uid); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

// UpdateMail
func (s *UserService) UpdateEmail(uid uint32, input forms.UpdateMailRequest) (*models.User, error) {
	var user models.User
	var existingUser models.User
	var newEmail string

	// Even if binding includes "require" service should verify and not trust
	if input.Email == nil {
		return nil, apperrors.ErrInvalidInput
	}

	if err := user.FindByID(s.db, uid); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrUserNotFound
		}
		return nil, err
	}

	newEmail = format.SanitizeUserEmail(*input.Email)

	// Check email uniqueness
	exists, err := existingUser.ExistsByEmail(s.db, newEmail)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.ErrUserEmailAlreadyUsed
	}

	// Check email not used by another user !!
	if newEmail == user.Email {
		return nil, apperrors.ErrUserEmailAlreadyUsed
	}

	// All is OK
	user.PendingEmail = newEmail

	// Create token and limitation of token
	if err := user.GenerateEmailChangeToken(); err != nil {
		return nil, err
	}

	// Now we update the user
	if err := user.Update(s.db); err != nil {
		return nil, err
	}
	return &user, nil

}

// Send mail
func (s *UserService) SendUpdateEmailToken(user *models.User) (string, error) {

	cfg := config.Config()

	// Non blocking in case smtp not configured in test Mode only
	if !cfg.Smtp.Enabled {
		if cfg.TestMode {
			logger.User.Info("SMTP disabled, skipping email send for %s", user.PendingEmail)
			return user.EmailChangeToken, nil
		}
		logger.User.Info("SMTP not configured for %s", user.PendingEmail)
		return "", apperrors.ErrSmtpNotConfigured
	}

	htmlBody := s.HtmlBodyUpdateMail(
		user.EmailChangeToken,
		cfg.Frontend.Origin,
		cfg.Frontend.UpdateMailConfirmPath,
	)

	if err := mail.SendHTMLMail(user.PendingEmail, "Confirm Your New email", htmlBody); err != nil {
		return "", apperrors.ErrSmtpFailed
	}

	return user.EmailChangeToken, nil
}

// HtmlBodySendRegistration (private)
// Builds the HTML email body for account confirmation.
func (s *UserService) HtmlBodyUpdateMail(token string, FrontendOrigin string, FrontendResetPasswordPath string) string {
	link := fmt.Sprintf("%s%s?token=%s",
		FrontendOrigin,
		FrontendResetPasswordPath,
		token,
	)

	return fmt.Sprintf(
		"<p>Click to validate your email update (link expires in 1 hour): <a href='%s'>Confirm</a></p>",
		link,
	)
}

// ConfirmUpdateMail
func (s *UserService) ConfirmUpdateMail(token string) (*models.User, error) {
	var user models.User
	var existingUser models.User

	// 1. Retrieve user by token
	if err := user.FindByEmailToken(s.db, token); err != nil {
		return nil, apperrors.ErrAuthInvalidToken
	}

	// 2. Validate expiration
	if time.Now().After(user.EmailChangeTokenExpire) {
		return nil, apperrors.ErrAuthTokenExpired
	}

	if user.PendingEmail == "" {
		return nil, apperrors.ErrInvalidPendingEmail
	}

	// Ultimate verification in case there is a user which subscribe with the same mail !!
	// Check email uniqueness
	exists, err := existingUser.ExistsByEmail(s.db, user.PendingEmail)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.ErrUserEmailAlreadyUsed
	}

	// 3. Activate account
	user.Email = user.PendingEmail
	user.PendingEmail = ""
	user.EmailChangeTokenExpire = time.Time{}
	user.EmailChangeToken = ""

	if err := user.Update(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateUser updates a user using PATCH semantics.
// Behavior:
// - Only provided fields are updated.
// - Password is hashed if provided.
// - Email is normalized before saving.
func (s *UserService) AdminUpdateUser(uid uint32, input forms.AdminUpdateUserRequest) (*models.User, error) {
	var user models.User

	// 1. Retrieve existing user
	if err := user.FindByID(s.db, uid); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	logger.User.Info("(Service AdminUpdateUser) input: (%s, %s) ", *input.Email, *input.Username)
	logger.User.Info("(Service AdminUpdateUser) existing user: %+v", user)

	// 2. Apply updates (partial update)

	if input.Username != nil && *input.Username != user.Username {
		exists, err := user.ExistsByUsername(s.db, *input.Username)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, apperrors.ErrUserUsernameAlreadyUsed
		}
		user.Username = *input.Username
	}

	if input.Email != nil && *input.Email != user.Email {
		exists, err := user.ExistsByEmail(s.db, *input.Email)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, apperrors.ErrUserEmailAlreadyUsed
		}

		user.Email = *input.Email
	}

	if input.Role != nil {
		user.Role = *input.Role
	}

	// Avatar update is handled separately via UploadAvatar, so we ignore it here to avoid confusion.

	if input.IsVerified != nil {
		user.IsVerified = *input.IsVerified
	}

	// 3. Handle password update
	if input.Password != nil {
		hashed, err := security.HashPassword(*input.Password)
		if err != nil {
			return nil, err
		}
		user.Password = hashed
	}

	// 4. Persist changes
	if err := user.Update(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateUser Profile
func (s *UserService) UpdateProfile(uid uint32, input forms.UpdateProfileRequest) (*models.User, error) {
	var user models.User

	// 1. Retrieve existing user
	if err := user.FindByID(s.db, uid); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	// 2. Apply updates (partial update)
	if input.Username != nil {
		user.Username = *input.Username
	}

	// Avatar update is handled separately via UploadAvatar, so we ignore it here to avoid confusion.

	// 4. Persist changes
	if err := user.Update(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// UploadAvatar uploads and assigns a new avatar to a user.
func (s *UserService) UploadAvatar(uid uint32, file *multipart.FileHeader) (*models.User, error) {
	if file == nil {
		return nil, apperrors.ErrImageFormatInvalid
	}

	f, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer f.Close()

	return s.StoreAvatar(uid, f, file.Filename)
}

func (s *UserService) StoreAvatar(uid uint32, reader io.Reader, filename string) (*models.User, error) {
	var user models.User

	if err := user.FindByID(s.db, uid); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	// Minimal tests on files required because service call be called from everywhere !!
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return nil, apperrors.ErrImageFormatInvalid
	}

	if _, ok := media.AllowedImageExt[ext]; !ok {
		logger.Composer.Debug("(UploadAvatar) invalid format: %s", ext)
		return nil, apperrors.ErrImageFormatInvalid
	}

	// Relative Path (stored in DB)
	filePath := s.paths.UserAvatarStorageRel(uid)
	logger.User.Debug("(UploadAvatar) Relative path %s", filePath)

	// Absolute Path
	fullFilePath := s.paths.StorageAbsPath(filePath)
	logger.User.Debug("(UploadAvatar) Absolute path %s", fullFilePath)

	if err := filedir.SaveFile(fullFilePath, reader); err != nil {
		return nil, err
	}

	user.Avatar = filePath

	if err := user.Update(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// DeleteUser deletes a user with security checks.
// Rules:
// - An admin cannot delete their own account.
func (s *UserService) AdminDeleteUser(targetUID uint32, adminID uint32) error {

	logger.User.Debug(
		"(DeleteUser) Admin %d attempts to delete user %d",
		adminID,
		targetUID,
	)

	if targetUID == adminID {
		return apperrors.ErrSelfAccountProtection
	}

	var user models.User

	if err := user.FindByID(s.db, targetUID); err != nil {
		return apperrors.ErrUserNotFound
	}

	// Delete avatar if not default
	if user.Avatar != "" && user.Avatar != "users/default.png" {

		fullPath := s.paths.StorageAbsPath(user.Avatar)

		err := filedir.RemoveFileIfExists(fullPath)

		if err != nil && !os.IsNotExist(err) {
			logger.User.Error(
				"Avatar deletion failed for user %d: %v",
				targetUID,
				err,
			)

			return apperrors.ErrUserAvatarFileNotDeleted

		}
	}

	// Delete user
	if _, err := user.Delete(s.db); err != nil {
		return apperrors.ErrDatabaseAccess
	}

	return nil
}

// DeleteAvatarFile removes a user's avatar file from storage.
// Behavior:
// - Logs warning if file is missing
func (s *UserService) DeleteAvatarFile(userID uint32) error {
	var user models.User

	if err := user.FindByID(s.db, userID); err != nil {
		return apperrors.ErrUserNotFound
	}
	logger.User.Debug("(DeleteAvatarFile) Attempts to delete avatar for user id (%d) with Avatar = %s", userID, user.Avatar)

	if user.Avatar == "users/default.png" {
		// For non blocking
		return nil
		//return apperrors.ErrUserAvatarAlreadyDefault
	}

	relativePath := user.Avatar
	if relativePath == "" {
		return apperrors.ErrUserNotFound
	}

	// Absolute Path
	fullPath := s.paths.StorageAbsPath(relativePath)

	err := filedir.RemoveFileIfExists(fullPath)

	if err != nil && !os.IsNotExist(err) {
		logger.User.Error(
			"Avatar deletion failed: %s (%v)",
			fullPath,
			err,
		)

		return apperrors.ErrUserAvatarFileNotDeleted
	}

	// Here file is deleted, now we set to default
	user.Avatar = "users/default.png"
	if err := user.Update(s.db); err != nil {
		return apperrors.ErrDatabaseAccess
	}

	return nil
}

// Retrieves a paginated list of users
func (s *UserService) AdminGetUsersPage(uid uint32, form forms.AdminGetUsersPageRequest) (*models.Pagination, error) {

	if form.Page <= 0 {
		form.Page = 1
	}
	if form.Limit <= 0 {
		form.Limit = 10
	}

	pagination := models.Pagination{
		Sort:  form.SortBy,
		Limit: form.Limit,
		Page:  form.Page,
	}

	pagination.Sort = pagination.GetSort()

	logger.User.Debug("(Service - GetUsersPage): sort=%s", pagination.Sort)

	var user models.User

	result, err := user.List(s.db, &pagination, uid)
	if err != nil {
		logger.User.Error("Failed to list users: %v", err)
		return nil, err
	}

	if result == nil || len(result.Rows.([]*models.User)) == 0 {
		logger.User.Warn("No users found ")
	}

	return result, err
}
