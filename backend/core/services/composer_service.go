package services

// APPLICATION ARCHITECTURE

// ===============================================================================================
// Layer              | Component      | Responsibility
// -------------------|----------------|----------------------------------------------------------
// ORCHESTRATION      | services/      | Business logic coordination layer.
//                    |                | Handles authorization, validation flow,
//                    |                | and delegates persistence & file operations.
// ===============================================================================================

import (
	"errors"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"backend/core/apperrors"
	"backend/core/forms"
	"backend/core/models"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/pkg/filedir"
	"backend/pkg/format"

	"gorm.io/gorm"
)

// ComposerService handles business logic related to composers.
type ComposerService struct {
	db    *gorm.DB
	paths *config.Paths
}

// NewComposerService creates a new ComposerService instance.
func NewComposerService(db *gorm.DB, paths *config.Paths) *ComposerService {
	return &ComposerService{
		db:    db,
		paths: paths,
	}
}

var allowedImageExt = map[string]struct{}{
	".jpg":  {},
	".jpeg": {},
	".png":  {},
	".webp": {},
}

// CreateComposer
// Creates a new composer entity with optional image upload.
func (s *ComposerService) CreateComposer(uid uint32, userRole int, req forms.CreateComposerRequest, file *multipart.FileHeader) error {
	logger.Composer.Debug("(CreateComposer Service) UID=%d Role=%d Name=%s", uid, userRole, req.Name)

	// 1. Authorization check
	isAdmin := userRole == config.RoleAdmin
	isModerator := userRole == config.RoleModerator

	if !isAdmin && !isModerator {
		logger.Composer.Warn(
			"Unauthorized composer creation: user=%d role=%d required=[%d,%d] name=%s",
			uid, userRole, config.RoleAdmin, config.RoleModerator, req.Name,
		)
		return apperrors.ErrAccessForbidden
	}

	// 2. Mandatory fields validation
	if req.Name == "" {
		logger.Composer.Debug("(CreateComposer Service): name is required")
		return apperrors.ErrComposerMandatory
	}

	safeName := format.SanitizeName(req.Name)

	// 3. Build model with default values
	composer := models.Composer{
		Name:        req.Name,
		SafeName:    safeName,
		Epoch:       req.Epoch,
		ExternalURL: req.ExternalURL,
		PicturePath: "assets/default-avatar.png",
		IsVerified:  false,
	}

	if req.IsVerified != nil {
		composer.IsVerified = *req.IsVerified
	}

	// 4. File processing (optional)
	if err := s.ProcessComposerStorage(&composer, file); err != nil {
		return err
	}

	// 5. Database persistence
	if err := composer.Create(s.db); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			logger.Composer.Error("(CreateComposer Service) duplicate entry: %v", err)
			return apperrors.ErrComposerAlreadyExists
		}
		logger.Composer.Error("(CreateComposer Service) DB error: %v", err)
		return err
	}

	logger.Composer.Debug("(CreateComposer Service) composer created: %s", composer.SafeName)
	return nil
}

// GetComposersPage
// Retrieves a paginated list of composers based on search criteria.
func (s *ComposerService) GetComposersPage(uid uint32, form forms.GetComposersPageRequest) (*models.Pagination, error) {
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

	logger.Composer.Debug("(Service - GetComposersPage): sort=%s", pagination.Sort)

	var composer models.Composer

	result, err := composer.List(s.db, &pagination, form.Search, uid)
	if err != nil {
		logger.Composer.Error("Failed to list composers: %v", err)
		return nil, err
	}

	if result == nil || len(result.Rows.([]*models.Composer)) == 0 {
		logger.Composer.Warn("No composers found for search: %s", form.Search)
	}

	return result, err
}

// GetComposer

// Retrieves a composer by its ID.
// No authorization required (public access).
func (s *ComposerService) GetComposer(ComposerID uint) (*models.Composer, error) {
	composer, err := models.FindComposerByID(s.db, ComposerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrComposerNotFound
		}
		return nil, err
	}

	return composer, nil
}

// Updates an existing composer entity.
func (s *ComposerService) UpdateComposer(uid uint32, userRole int, ComposerID uint, form forms.UpdateComposerRequest, file *multipart.FileHeader) (*models.Composer, error) {
	composer, err := models.FindComposerByID(s.db, ComposerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrComposerNotFound
		}
		return nil, err
	}

	isAdmin := userRole == config.RoleAdmin
	isModerator := userRole == config.RoleModerator

	if !isAdmin && !isModerator {
		logger.Composer.Warn("Unauthorized update attempt: user=%d role=%d", uid, userRole)
		return nil, apperrors.ErrAccessForbidden
	}

	if form.Name != "" {
		composer.Name = form.Name
		composer.SafeName = format.SanitizeName(form.Name)
	}

	if form.IsVerified != nil {
		composer.IsVerified = *form.IsVerified
	}

	// Optional file update
	if err := s.ProcessComposerStorage(composer, file); err != nil {
		return nil, err
	}

	if err := composer.Update(s.db); err != nil {
		logger.Composer.Error("(UpdateComposer Service) DB error: %v", err)
		return nil, err
	}

	return composer, nil
}

// ProcessComposerStorage
// Handles image upload and storage for a composer.
// Responsibilities:
// - Validate file extension
// - Create storage directories
// - Save file to disk
// - Update model path
func (s *ComposerService) ProcessComposerStorage(composer *models.Composer, file *multipart.FileHeader) error {
	if file == nil {
		return nil
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" {
		return apperrors.ErrImageFormatInvalid
	}
	logger.Composer.Debug("(ProcessComposerStorage Service) extension: %s", ext)

	if _, ok := allowedImageExt[ext]; !ok {
		logger.Composer.Debug("(ProcessComposerStorage Service) invalid format: %s", ext)
		return apperrors.ErrImageFormatInvalid
	}

	// Build storage paths - Relative
	// filePath = composer/mozart.png
	filePath := s.paths.ComposerPicturePath(composer.SafeName, ext)
	composer.PicturePath = filePath

	// Absolute path
	fullPath := s.paths.StorageAbsPath(filePath)

	if err := filedir.CreateDir(filepath.Dir(fullPath)); err != nil {
		logger.Composer.Error("(ProcessComposerStorage Service) create dir failed: %v", err)
		return err
	}

	src, err := file.Open()
	if err != nil {
		logger.Composer.Error("(ProcessComposerStorage Service) open file failed: %v", err)
		return err
	}
	defer src.Close()

	return filedir.SaveFileToDisk(fullPath, src)
}

// Deletes a composer and associated assets.
func (s *ComposerService) DeleteComposer(uid uint32, composerID uint, userRole int) error {
	composer, err := models.FindComposerByID(s.db, composerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.ErrComposerNotFound
		}
		return err
	}

	isAdmin := userRole == config.RoleAdmin
	isModerator := userRole == config.RoleModerator

	if !isAdmin && !isModerator {
		logger.Composer.Warn("Unauthorized deletion attempt: user=%d role=%d", uid, userRole)
		return apperrors.ErrAccessForbidden
	}

	if err := s.deleteComposerOrchestrator(composer); err != nil {
		logger.Composer.Error("Deletion failed for ID %d: %v", composerID, err)
		return err
	}

	logger.Composer.Info("Composer ID %d deleted by user %d", composerID, uid)
	return nil
}

// deleteComposerOrchestrator

// Handles full deletion lifecycle:
//
// 1. Delete physical files
// 2. Delete database record
// 3. Return appropriate error based on outcome priority
//
// Error priority:
// - File deletion error > File not found > success
func (s *ComposerService) deleteComposerOrchestrator(composer *models.Composer) error {
	var hasNotFound bool
	var hasDeletionError bool

	// Absolute path
	fullFilePath := s.paths.StorageAbsPath(composer.PicturePath)

	paths := []string{fullFilePath}

	for _, path := range paths {
		if path == "" {
			continue
		}

		err := filedir.RemoveFileIfExists(path)
		if err != nil {
			switch {
			case os.IsNotExist(err):
				hasNotFound = true
				logger.Composer.Warn("File missing during deletion: %s", path)

			default:
				hasDeletionError = true
				logger.Composer.Error("File deletion failed: %s (%v)", path, err)
			}
		}
	}

	_, err := composer.Delete(s.db)
	if err != nil {
		return err
	}

	if hasDeletionError {
		return apperrors.ErrFileDeletion
	}

	if hasNotFound {
		return apperrors.ErrFileNotFound
	}

	return nil
}
