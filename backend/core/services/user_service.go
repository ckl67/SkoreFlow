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
func (s *UserService) CreateUser(input forms.AdmCreateUserRequest) (*models.User, error) {
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
	exists, err = new(models.User).ExistsByUserName(s.db, username)
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
	}

	if err := user.Save(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserByID retrieves a specific user by ID.
// Returns a business error if the user is not found.
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

// UpdateUser updates a user using PATCH semantics.
// Behavior:
// - Only provided fields are updated.
// - Password is hashed if provided.
// - Email is normalized before saving.
func (s *UserService) UpdateUser(uid uint32, input forms.AdmUpdateUserRequest) (*models.User, error) {
	var user models.User

	// 1. Retrieve existing user
	if err := user.FindByID(s.db, uid); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	// 2. Apply updates (partial update)

	if input.Username != nil {
		user.Username = *input.Username
	}

	// email not allowed to be updated for now, to avoid complexity with verification and uniqueness

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

		// Handle unique constraint (email)
		if strings.Contains(err.Error(), "UNIQUE") && strings.Contains(err.Error(), "email") {
			return nil, apperrors.ErrUserEmailAlreadyUsed
		}

		return nil, err
	}

	return &user, nil
}

// UpdateUser Profile
func (s *UserService) UpdateProfile(uid uint32, input forms.UpdateUserRequest) (*models.User, error) {
	var user models.User

	// 1. Retrieve existing user
	if err := user.FindByID(s.db, uid); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	// 2. Apply updates (partial update)
	if input.Username != nil {
		user.Username = *input.Username
	}

	// email not allowed to be updated for now, to avoid complexity with verification and uniqueness
	// Avatar update is handled separately via UploadAvatar, so we ignore it here to avoid confusion.

	// 4. Persist changes
	if err := user.Update(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// UploadAvatar uploads and assigns a new avatar to a user.
func (s *UserService) UploadAvatar(uid uint32, file *multipart.FileHeader) (*models.User, error) {
	var user models.User

	if err := user.FindByID(s.db, uid); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	// Minimal tests on files required because service call be called from everywhere !!
	ext := strings.ToLower(filepath.Ext(file.Filename))
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

	if err := filedir.SaveFile(file, fullFilePath); err != nil {
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
func (s *UserService) DeleteUser(targetUID uint32, adminID uint32) error {
	logger.User.Debug("(DeleteUser) Admin %d attempts to delete user %d", adminID, targetUID)

	// Prevent self-deletion
	if targetUID == adminID {
		return fmt.Errorf("SECURITY_ERR: an admin cannot delete their own account")
	}

	var user models.User

	if err := user.FindByID(s.db, targetUID); err != nil {
		return apperrors.ErrUserNotFound
	}

	// Delete avatar file if exists other delete only the user record
	// will not delete the Avatar file because they cab be default.png

	// Perform database hard delete
	if _, err := user.Delete(s.db); err != nil {
		return err
	}

	return nil
}

// DeleteAvatarFile removes a user's avatar file from storage.
// Behavior:
// - Logs warning if file is missing
// - Cleans empty directories after deletion
func (s *UserService) DeleteAvatarFile(userID uint32) error {
	var user models.User

	if err := user.FindByID(s.db, userID); err != nil {
		return apperrors.ErrUserNotFound
	}

	relativePath := user.Avatar
	if relativePath == "" {
		return apperrors.ErrUserNotFound
	}

	// Absolute Path
	fullPath := s.paths.StorageAbsPath(relativePath)

	err := filedir.RemoveFileIfExists(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			logger.User.Warn("Avatar file not found: %s", fullPath)
		} else {
			logger.User.Error("Avatar deletion failed: %s (%v)", fullPath, err)
		}
	}

	filedir.CleanEmptyDirs(filepath.Dir(fullPath))
	return nil
}

// GetResetToken
func (s *UserService) GetResetToken(vemail string) (string, error) {
	var user models.User

	email := format.SanitizeUserEmail(vemail)

	exists, err := new(models.User).ExistsByEmail(s.db, email)
	if err != nil {
		return "", nil
	}
	if exists {
		return "", apperrors.ErrUserEmailAlreadyUsed
	}

	return user.PasswordReset, nil
}

// Retrieves a paginated list of users
func (s *UserService) GetUsersPage(uid uint32, form forms.GetUsersPageRequest) (*models.Pagination, error) {

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
