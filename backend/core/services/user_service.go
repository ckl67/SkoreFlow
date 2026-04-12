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
	"backend/pkg/security"

	"gorm.io/gorm"
)

// UserService handles user-related business logic and orchestration.
type UserService struct {
	db *gorm.DB
}

// NewUserService creates a new instance of UserService.
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
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
func (s *UserService) CreateUser(input forms.CreateUserRequest) (*models.User, error) {
	hashedPassword, err := security.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	user := models.User{
		Email:               format.SanitizeUserEmail(input.Email),
		Password:            hashedPassword,
		Role:                config.RoleUser,
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
func (s *UserService) UpdateUser(uid uint32, input forms.UpdateUserRequest) (*models.User, error) {
	var user models.User

	// 1. Retrieve existing user
	if err := user.FindByID(s.db, uid); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	// 2. Apply updates (partial update)

	if input.Username != nil {
		user.Username = *input.Username
	}

	if input.Email != nil {
		user.Email = format.SanitizeUserEmail(*input.Email)
	}

	if input.Role != nil {
		user.Role = *input.Role
	}

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

// UploadAvatar uploads and assigns a new avatar to a user.
func (s *UserService) UploadAvatar(uid uint32, file *multipart.FileHeader) (*models.User, error) {
	var user models.User

	if err := user.FindByID(s.db, uid); err != nil {
		return nil, apperrors.ErrUserNotFound
	}

	// Build storage path
	path := fmt.Sprintf("assets/avatars/user-%d.png", uid)

	if err := filedir.SaveFile(file, path); err != nil {
		return nil, err
	}

	user.Avatar = path

	if err := user.Update(s.db); err != nil {
		return nil, err
	}

	return &user, nil
}

// DeleteUser deletes a user with security checks.
// Rules:
// - An admin cannot delete their own account.
func (s *UserService) DeleteUser(targetUID uint32, adminID uint32) error {
	// Prevent self-deletion
	if targetUID == adminID {
		return fmt.Errorf("SECURITY_ERR: an admin cannot delete their own account")
	}

	var user models.User

	if err := user.FindByID(s.db, targetUID); err != nil {
		return apperrors.ErrUserNotFound
	}

	// Perform hard delete
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

	fullPath := filepath.Join(config.Config().StoragePath, relativePath)

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
