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

	// Relative Path (stored in DB)
	filePath := s.paths.UserAvatarStorageRel(uid)

	// Absolute Path
	fullFilePath := s.paths.StorageAbsPath(filePath)

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
