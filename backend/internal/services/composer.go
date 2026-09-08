// cspell:ignore gorm	storagepath
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
	"backend/assets"
	"backend/infrastructure/logger"
	"backend/internal/apperrors"
	"backend/internal/domain"
	"backend/internal/forms"
	"backend/internal/models"
	"backend/pkg/filedir"
	"backend/pkg/format"
	"backend/pkg/media"
	"backend/pkg/storagepath"
	"errors"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"gorm.io/gorm"
)

// ComposerService handles business logic related to composers.
type ComposerService struct {
	db    *gorm.DB
	paths *storagepath.Paths
}

// NewComposerService creates a new ComposerService instance.
func NewComposerService(db *gorm.DB, paths *storagepath.Paths) *ComposerService {
	return &ComposerService{
		db:    db,
		paths: paths,
	}
}

// CreateComposer
// Creates a new composer entity with optional image upload.
func (s *ComposerService) CreateComposer(uid uint32, userRole int, req forms.CreateComposerRequest) (*models.Composer, error) {
	logger.Composer.Debug("(CreateComposer Service) UID=%d Role=%d Name=%s", uid, userRole, req.Name)

	// Everyone can create a composer, but only admin and moderator can validate verification
	// 1. Authorization check
	isAdmin := userRole == domain.RoleAdmin
	isModerator := userRole == domain.RoleModerator

	// 2. Mandatory fields validation
	if req.Name == "" {
		logger.Composer.Debug("(CreateComposer Service): name is required")
		return nil, apperrors.ErrComposerMandatory
	}

	safeName := format.SanitizeName(req.Name)

	// 3. Build model with default values
	composer := models.Composer{
		Name:        req.Name,
		SafeName:    safeName,
		Picture:     "composers/default.png",
		ExternalURL: req.ExternalURL,
		Epoch:       req.Epoch,
		IsVerified:  false,
		IsDemo:      false,
	}

	if req.IsVerified {
		if !isAdmin && !isModerator {
			logger.Composer.Warn(
				"(CreateComposer Service): Unauthorized composer validation : user=%d role=%d required=[%d,%d] name=%s",
				uid, userRole, domain.RoleAdmin, domain.RoleModerator, req.Name,
			)
			return nil, apperrors.ErrAccessForbidden
		}

		composer.IsVerified = req.IsVerified
	}

	// 4. File processing
	if err := s.ProcessComposerStorage(&composer, req.File); err != nil {
		return nil, err
	}

	// 5. Database persistence
	if err := composer.Create(s.db); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			logger.Composer.Error("(CreateComposer Service) duplicate entry: %v", err)
			return nil, apperrors.ErrComposerAlreadyExists
		}
		logger.Composer.Error("(CreateComposer Service) DB error: %v", err)
		return nil, err
	}

	logger.Composer.Debug("(CreateComposer Service) composer created: %s", composer.SafeName)
	return &composer, nil
}

// GetComposersPage
// Retrieves a paginated list of composers based on search criteria.
func (s *ComposerService) GetComposersPage(isDemo bool, form forms.GetComposersPageRequest) (*models.Pagination, error) {

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

	// form.Name or form.IsVerified can be nil
	result, err := composer.List(s.db, &pagination, form.Name, form.IsVerified, isDemo)
	if err != nil {
		logger.Composer.Error("Failed to list composers: %v", err)
		return nil, err
	}

	if result == nil || len(result.Rows.([]*models.Composer)) == 0 {
		if form.Name != nil {
			logger.Composer.Warn("No composers found for search: %s", *form.Name)
		} else {
			logger.Composer.Warn("No composers found")
		}
	}

	return result, err
}

// GetComposer
// Retrieves a composer by its ID.
// No authorization required (public access).
func (s *ComposerService) GetComposer(ComposerID uint) (*models.Composer, error) {
	composer, err := models.FindComposerByID(s.db, ComposerID, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrComposerNotFound
		}
		return nil, err
	}

	return composer, nil
}

// Updates an existing composer entity.
func (s *ComposerService) UpdateComposer(uid uint32, userRole int, ComposerID uint, form forms.UpdateComposerRequest) (*models.Composer, error) {
	// 1. Fetch existing Composer
	composer, err := models.FindComposerByID(s.db, ComposerID, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrComposerNotFound
		}
		return nil, err
	}

	isAdmin := userRole == domain.RoleAdmin
	isModerator := userRole == domain.RoleModerator

	if !isAdmin && !isModerator {
		logger.Composer.Warn("Unauthorized update attempt: user=%d role=%d", uid, userRole)
		return nil, apperrors.ErrAccessForbidden
	}

	// Name cannot be changed because this would say
	// * delete old picture file
	// * check if new name is not an existing name !
	if form.Epoch != nil {
		composer.Epoch = *form.Epoch
	}

	if form.ExternalURL != nil {
		composer.ExternalURL = *form.ExternalURL
	}

	if form.IsVerified != nil {
		composer.IsVerified = *form.IsVerified
	}

	if form.File != nil {
		// Will store file + update  "composer.Picture"
		if err := s.ProcessComposerStorage(composer, form.File); err != nil {
			return nil, err
		}
	}

	if err := composer.Update(s.db); err != nil {
		logger.Composer.Error("(UpdateComposer Service) DB error: %v", err)
		return nil, err
	}

	return composer, nil
}

func (s *ComposerService) MergeComposers(uid uint32, userRole int, sourceID uint, targetID uint) error {

	// Authorizations
	isAdmin := userRole == domain.RoleAdmin
	isModerator := userRole == domain.RoleModerator

	if !isAdmin && !isModerator {
		logger.Composer.Warn("Unauthorized Merge attempt: user=%d role=%d", uid, userRole)
		return apperrors.ErrAccessForbidden
	}

	// Not the same
	if sourceID == targetID {
		return nil
	}

	// Backup
	// This will just open the transactions , and prepare the commands
	// Once all is complete, than will address all
	// example :
	// 		UPDATE scores SET composer_id = target WHERE composer_id = source;
	//		DELETE FROM composers WHERE id = source;

	tx := s.db.Begin()

	// Security if Panic !
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Verify target
	target, err := models.FindComposerByID(tx, targetID, false)
	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.ErrComposerNotFound
		}
		return err
	}

	if !target.IsVerified {
		tx.Rollback()
		return apperrors.ErrComposerMerging
	}

	// Reassign composer in scores
	if err := models.ReassignComposerInScores(tx, sourceID, targetID); err != nil {
		tx.Rollback()
		return apperrors.ErrComposerMerging
	}

	// Delete source
	composer, err := models.FindComposerByID(tx, sourceID, false)
	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.ErrComposerNotFound
		}
		return err
	}

	rows, err := composer.Delete(tx)
	if err != nil {
		tx.Rollback()
		return apperrors.ErrComposerDeletion
	}
	if rows == 0 {
		tx.Rollback()
		return apperrors.ErrComposerNotFound
	}

	// Last Check
	var count int64
	count, err = models.CountScoreByComposerId(tx, sourceID)
	if err != nil {
		tx.Rollback()
		return err
	}

	if count > 0 {
		tx.Rollback()
		logger.Composer.Error("merge incomplete: scores still reference source composer")
		return apperrors.ErrComposerDeletion
	}

	// Commit
	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

// ProcessComposerStorage handles HTTP file upload for a composer image.
//
// Responsibilities:
// - Extract file content from multipart upload
// - Delegate validation + storage to StoreComposerPicture
//
// This function acts as an HTTP adapter layer between:
// HTTP layer (multipart.FileHeader)
// and domain storage logic (io.Reader based service)
func (s *ComposerService) ProcessComposerStorage(composer *models.Composer, file *multipart.FileHeader) error {
	if file == nil {
		return nil
	}

	f, err := file.Open()
	if err != nil {
		return err
	}
	defer f.Close()

	return s.StoreComposerPicture(composer, f, file.Filename)
}

// StoreComposerPicture handles validation and persistence of a composer image.
// This function is agnostic of HTTP and works with any io.Reader source:
func (s *ComposerService) StoreComposerPicture(
	composer *models.Composer,
	reader io.Reader,
	filename string,
) error {

	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return apperrors.ErrImageFormatInvalid
	}

	if _, ok := media.AllowedImageExt[ext]; !ok {
		logger.Composer.Debug("(StoreComposerPicture) invalid format: %s", ext)
		return apperrors.ErrImageFormatInvalid
	}

	// ---------------------------------------------------------
	// Build storage paths
	// ---------------------------------------------------------
	// Build storage path
	// (composers)
	// │   ├── beethoven
	// │   │   └── uploaded.png
	// │   │   └── picture.png
	// │   │   └── thumbnail.png

	uploadedRelativePath := s.paths.ComposerUploadedRel(composer.SafeName, ext)
	pictureRelativePath := s.paths.ComposerPictureRel(composer.SafeName, ".png")
	thumbnailRelativePath := s.paths.ComposerThumbnailRel(composer.SafeName, ".png")

	uploadedPath := s.paths.ResolveDataRoot(uploadedRelativePath)
	picturePath := s.paths.ResolveDataRoot(pictureRelativePath)
	thumbnailPath := s.paths.ResolveDataRoot(thumbnailRelativePath)

	//logger.Composer.Debug("((s *ComposerService) StoreComposerPicture):: \n uploadedPath=%s \n picturePath=%s \n thumbnailPath=%s", uploadedPath, picturePath, thumbnailPath)

	composer.Picture = pictureRelativePath

	// ---------------------------------------------------------
	// 1. Save uploaded image
	// ---------------------------------------------------------

	if err := filedir.SaveFile(uploadedPath, reader); err != nil {
		return err
	}

	// ---------------------------------------------------------
	// 2. Generate normalized picture
	// ---------------------------------------------------------

	if err := s.GenerateResizedImage(
		uploadedPath,
		picturePath,
		media.ComposerSize,
	); err != nil {
		return err
	}

	// ---------------------------------------------------------
	// 3. Generate thumbnail
	// ---------------------------------------------------------

	if err := s.GenerateResizedImage(
		picturePath,
		thumbnailPath,
		media.ComposerSizeThumb,
	); err != nil {
		return err
	}

	return nil

}

// Deletes a composer and associated assets.
func (s *ComposerService) DeleteComposer(uid uint32, composerID uint, userRole int) error {
	composer, err := models.FindComposerByID(s.db, composerID, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.ErrComposerNotFound
		}
		return err
	}

	isAdmin := userRole == domain.RoleAdmin
	isModerator := userRole == domain.RoleModerator

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
	absolutePath := s.paths.ResolveDataRoot(composer.Picture)

	paths := []string{absolutePath}

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

// =====================================
// Provide the data information of the Picture
// composers
// │   ├── beethoven
// │   │   └── picture.png
// =====================================
func (s *ComposerService) ComposerPictureData(composerID uint32, isDemo bool) (string, error) {

	composer, err := models.FindComposerByID(s.db, (uint)(composerID), isDemo)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", apperrors.ErrComposerNotFound
		}
		return "", err
	}

	if asset, ok := assets.GetDefaultComposerPicture(composer.Picture); ok {
		logger.Composer.Debug("(ComposerPictureData) composer.ComposerPicture %s  asset=%s", composer.Picture, asset)
		return s.paths.ResolveAssetRoot(asset), nil
	}

	logger.Composer.Debug("(ComposerPictureData) Composer.Picture=%s", composer.Picture)
	return s.paths.ResolveDataRoot(composer.Picture), nil

}

// =====================================
// Provide the data information of the thumbnail
// composers
// │   ├── beethoven
// │   │   └── thumbnail.png
// =====================================
func (s *ComposerService) ComposerThumbnailData(composerID uint32, isDemo bool) (string, error) {

	composer, err := models.FindComposerByID(s.db, (uint)(composerID), isDemo)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", apperrors.ErrComposerNotFound
		}
		return "", err
	}

	if asset, ok := assets.GetDefaultComposerThumbnail(composer.Picture); ok {
		logger.Composer.Debug("(ComposerThumbnailData) composer.ComposerThumbnail %s  asset=%s", composer.Picture, asset)
		return s.paths.ResolveAssetRoot(asset), nil
	}

	logger.Composer.Debug("(ComposerThumbnailData) ComposerPicture=%s", composer.Picture)
	return s.paths.ResolveDataRoot(composer.Picture), nil

}

// GenerateResizedImage
func (s *ComposerService) GenerateResizedImage(fullFilePath string, fullThumbnailPath string, maxSize int) error {
	//time.Sleep(100 * time.Millisecond)
	logger.Composer.Debug("(ComposerPictureData) GenerateResizedImage %s  thumbnail=%s", fullFilePath, fullThumbnailPath)

	res := media.RequestThumbnail(
		fullFilePath,
		fullThumbnailPath,
		maxSize,
		logger.GetModuleLevel("microservices"),
	)
	if res {
		return nil
	} else {
		return apperrors.ErrComposerThumbnail
	}
}
