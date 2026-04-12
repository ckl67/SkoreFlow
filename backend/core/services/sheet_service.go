package services

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// ORCHESTRATION      | services/      | Core business logic. Coordinates models, storage,
//                    |                | file processing, and business rules for sheets.
// ===============================================================================================

import (
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"backend/core/apperrors"
	"backend/core/domain"
	"backend/core/forms"
	"backend/core/models"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/pkg/filedir"
	"backend/pkg/format"
	"backend/pkg/pdf"

	"gorm.io/gorm"
)

// SheetService handles business logic related to music sheets.

type SheetService struct {
	db *gorm.DB
}

// NewSheetService creates a new instance of SheetService.
func NewSheetService(db *gorm.DB) *SheetService {
	return &SheetService{db: db}
}

// findOrCreateComposer retrieves an existing composer by safe name,
// or creates a new one if it does not exist.
//
// Behavior:
// - Uses sanitized name for lookup
// - Creates a minimal composer if not found
func (s *SheetService) findOrCreateComposer(name string) (*models.Composer, error) {
	safeName := format.SanitizeName(name)
	var composer models.Composer

	// 1. Try to find existing composer
	err := s.db.Where("safe_name = ?", safeName).First(&composer).Error
	if err == nil {
		return &composer, nil
	}

	// 2. If not found → create
	if errors.Is(err, gorm.ErrRecordNotFound) {
		composer = models.Composer{
			Name:        strings.TrimSpace(name),
			SafeName:    safeName,
			PicturePath: "default.webp", // default fallback
		}

		if err := composer.Create(s.db); err != nil {
			return nil, err
		}

		return &composer, nil
	}

	return nil, err
}

// CreateSheet orchestrates the full creation workflow of a sheet.
//
// Steps:
// 1. Normalize input
// 2. Resolve or create composer
// 3. Check uniqueness (user + composer + sheet)
// 4. Build storage paths
// 5. Parse release date
// 6. Build model
// 7. Process file storage (PDF + thumbnail)
// 8. Persist to database
//
// Storage mapping:
//
//	DB paths:
//	  sheets/uploaded-sheets/user-1/mozart/fur-elise.pdf
//	  sheets/thumbnails/user-1/mozart/fur-elise.png
//
//	Disk paths:
//	  ./storage/sheets/uploaded-sheets/user-1/mozart/fur-elise.pdf
//	  ./storage/sheets/thumbnails/user-1/mozart/fur-elise.png
func (s *SheetService) CreateSheet(uid uint32, form forms.CreateSheetRequest, file *multipart.FileHeader) error {
	// 1. Normalize sheet name
	safeSheetName := format.SanitizeName(form.SheetName)

	// 2. Resolve composer
	composer, err := s.findOrCreateComposer(form.Composer)
	if err != nil {
		return err
	}

	// 3. Uniqueness check
	exists, err := models.SheetExists(s.db, safeSheetName, composer.ID, uid)
	if err != nil {
		return err
	}
	if exists {
		return apperrors.ErrSheetAlreadyExists
	}

	// 4. Build storage paths
	filePath := path.Join(
		"sheets/uploaded-sheets",
		fmt.Sprintf("user-%d", uid),
		composer.SafeName,
		safeSheetName+".pdf",
	)

	thumbnailPath := path.Join(
		"sheets/thumbnails",
		fmt.Sprintf("user-%d", uid),
		composer.SafeName,
		safeSheetName+".png",
	)

	// 5. Parse release date
	releaseDate, err := createDate(form.ReleaseDate)
	if err != nil {
		return apperrors.ErrInvalidDate
	}

	// 6. Build model
	sheet := models.Sheet{
		SafeSheetName: safeSheetName,
		SheetName:     strings.TrimSpace(form.SheetName),

		ComposerID: composer.ID,

		UploaderID:  uid,
		ReleaseDate: releaseDate,

		FilePath:      filePath,
		ThumbnailPath: thumbnailPath,

		InformationText: form.InformationText,
		Tags:            format.ParseSemicolonList(form.Tags),
		Categories:      format.ParseSemicolonList(form.Categories),
	}

	// 7. Storage processing
	if err := s.ProcessSheetStorage(&sheet, file); err != nil {
		return err
	}

	// 8. Persist
	return sheet.Create(s.db)
}

// UpdateSheet updates sheet metadata and optionally replaces the file.
//
// Behavior:
// - Verifies ownership
// - Applies partial updates
// - Re-checks uniqueness if name changes
// - Reprocesses file if provided
func (s *SheetService) UpdateSheet(uid uint32, sheetID uint, form forms.UpdateSheetRequest, file *multipart.FileHeader) (*models.Sheet, error) {
	// 1. Fetch existing sheet
	sheet, err := models.FindSheetByID(s.db, sheetID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrSheetNotFound
		}
		return nil, err
	}

	// 2. Ownership check
	if sheet.UploaderID != uid {
		logger.Sheet.Warn("Unauthorized modification attempt: user=%d sheetID=%d owner=%d", uid, sheetID, sheet.UploaderID)
		return nil, apperrors.ErrAccessForbidden
	}

	// 3. Apply updates

	if form.SheetName != "" {
		newSafeName := format.SanitizeName(form.SheetName)

		exists, err := models.SheetExists(s.db, newSafeName, sheet.ComposerID, uid)
		if err != nil {
			return nil, err
		}
		if exists && newSafeName != sheet.SafeSheetName {
			return nil, apperrors.ErrSheetAlreadyExists
		}

		sheet.SheetName = form.SheetName
		sheet.SafeSheetName = newSafeName
	}

	if form.ReleaseDate != "" {
		date, err := time.Parse(time.RFC3339, form.ReleaseDate)
		if err != nil {
			return nil, apperrors.ErrInvalidDate
		}
		sheet.ReleaseDate = date
	}

	if form.Tags != "" {
		sheet.Tags = domain.CleanTagsCategories(form.Tags)
	}

	if form.Categories != "" {
		sheet.Categories = domain.CleanTagsCategories(form.Categories)
	}

	if form.InformationText != "" {
		sheet.InformationText = form.InformationText
	}

	// 4. File processing (if provided)
	if err := s.ProcessSheetStorage(sheet, file); err != nil {
		return nil, err
	}

	// 5. Persist
	if err := sheet.Update(s.db); err != nil {
		return nil, err
	}

	return sheet, nil
}

// DeleteSheet performs full deletion (authorization + files + database).
//
// Rules:
// - Allowed for owner or admin
// - Deletes physical files first, then DB record
func (s *SheetService) DeleteSheet(uid uint32, sheetID uint, userRole int) error {
	// 1. Fetch sheet
	sheet, err := models.FindSheetByID(s.db, sheetID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.ErrSheetNotFound
		}
		return err
	}

	// 2. Authorization
	isAdmin := userRole == config.RoleAdmin
	isOwner := sheet.UploaderID == uid

	if !isAdmin && !isOwner {
		logger.Sheet.Warn("Unauthorized deletion attempt: user=%d sheetID=%d", uid, sheetID)
		return apperrors.ErrAccessForbidden
	}

	// 3. Orchestrate deletion
	if err := s.deleteSheetOrchestrator(sheet); err != nil {
		logger.Sheet.Error("Deletion failed: sheetID=%d error=%v", sheetID, err)
		return err
	}

	logger.Sheet.Info("Sheet deleted: sheetID=%d user=%d", sheetID, uid)
	return nil
}

// GetSheet retrieves a sheet after verifying access permissions.
func (s *SheetService) GetSheet(uid uint32, sheetID uint, userRole int) (*models.Sheet, error) {
	sheet, err := models.FindSheetByID(s.db, sheetID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrSheetNotFound
		}
		return nil, err
	}

	isAdmin := userRole == config.RoleAdmin
	isOwner := sheet.UploaderID == uid

	if !isAdmin && !isOwner {
		logger.Sheet.Error("Access denied: user=%d sheetID=%d owner=%d", uid, sheetID, sheet.UploaderID)
		return nil, apperrors.ErrAccessForbidden
	}

	return sheet, nil
}

// UpdateAnnotations updates only the annotations field for a given sheet.
func (s *SheetService) UpdateAnnotations(uid uint32, sheetID uint, annotations string) error {
	result := s.db.Model(&models.Sheet{}).
		Where("id = ? AND uploader_id = ?", sheetID, uid).
		Update("annotations", annotations).
		Update("updated_at", time.Now())

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return apperrors.ErrSheetNotFound
	}

	return nil
}

// GetSheetsPage handles paginated listing with filters and search.
func (s *SheetService) GetSheetsPage(uid uint32, form forms.GetSheetsPageRequest) (*models.Pagination, error) {
	// 1. Defaults
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

	// 2. Normalize sorting
	pagination.Sort = pagination.GetSort()

	// 3. Prepare composer filter
	var safeCompSearch string
	if form.Composer != "" {
		safeCompSearch = "%" + format.SanitizeName(form.Composer) + "%"
	}

	logger.Sheet.Debug("GetSheetsPage: sort=%s", pagination.Sort)

	var sheet models.Sheet
	result, err := sheet.List(s.db, &pagination, safeCompSearch, form.Tag, form.Category, form.Search, uid)
	if err != nil {
		logger.Sheet.Error("List failed: %v", err)
		return nil, err
	}

	rows, ok := result.Rows.([]*models.Sheet)
	if !ok || len(rows) == 0 {
		logger.Sheet.Warn("No sheets found for search=%s", form.Search)
	}

	return result, nil
}

// ProcessSheetStorage handles file persistence and thumbnail generation.
//
// Behavior:
// - Creates directories if needed
// - Saves PDF file
// - Removes old thumbnail
// - Generates new thumbnail asynchronously
func (s *SheetService) ProcessSheetStorage(sheet *models.Sheet, file *multipart.FileHeader) error {
	if file == nil {
		return nil
	}

	storageRoot := config.Config().StoragePath

	fullFilePath := filepath.Join(storageRoot, sheet.FilePath)
	fullThumbnailPath := filepath.Join(storageRoot, sheet.ThumbnailPath)

	filedir.CreateDir(filepath.Dir(fullFilePath))
	filedir.CreateDir(filepath.Dir(fullThumbnailPath))

	// Save file
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	if err := filedir.SaveFileToDisk(fullFilePath, src); err != nil {
		return err
	}

	// Remove old thumbnail
	filedir.RemoveFileIfExists(fullThumbnailPath)

	// Async thumbnail generation
	go func() {
		time.Sleep(100 * time.Millisecond)
		pdf.RequestToPdfToImage(fullFilePath, fullThumbnailPath, logger.GetModuleLevel("sheet"))
	}()

	return nil
}

// deleteSheetOrchestrator handles full deletion lifecycle (files + DB + cleanup).
//
// Priority of errors:
// 1. File deletion error
// 2. File not found
// 3. Success
func (s *SheetService) deleteSheetOrchestrator(sheet *models.Sheet) error {
	var hasNotFound bool
	var hasDeletionError bool

	storageRoot := config.Config().StoragePath

	fullFilePath := filepath.Join(storageRoot, sheet.FilePath)
	fullThumbnailPath := filepath.Join(storageRoot, sheet.ThumbnailPath)

	paths := []string{fullFilePath, fullThumbnailPath}

	// 1. Delete physical files
	for _, path := range paths {
		if path == "" {
			continue
		}

		err := filedir.RemoveFileIfExists(path)
		if err != nil {
			switch {
			case os.IsNotExist(err):
				hasNotFound = true
				logger.Sheet.Warn("File missing: %s", path)

			default:
				hasDeletionError = true
				logger.Sheet.Error("Deletion failed: %s (%v)", path, err)
			}
		}
	}

	// 2. Delete DB record
	rows, err := sheet.Delete(s.db)
	if err != nil {
		return err
	}

	// 3. Cleanup directories
	if rows > 0 {
		for _, path := range paths {
			if path != "" {
				filedir.CleanEmptyDirs(filepath.Dir(path))
			}
		}
	}

	// 4. Return priority error
	if hasDeletionError {
		return apperrors.ErrFileDeletion
	}
	if hasNotFound {
		return apperrors.ErrFileNotFound
	}

	return nil
}

// createDate parses an RFC3339 string into time.Time.
// The frontend is responsible for providing a valid format.
func createDate(date string) (time.Time, error) {
	return time.Parse(time.RFC3339, date)
}
