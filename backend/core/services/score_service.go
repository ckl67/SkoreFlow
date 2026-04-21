package services

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// ORCHESTRATION      | services/      | Core business logic. Coordinates models, storage,
//                    |                | file processing, and business rules for scores.
// ===============================================================================================

import (
	"errors"
	"mime/multipart"
	"os"
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

// ScoreService handles business logic related to music scores.

type ScoreService struct {
	db    *gorm.DB
	paths *config.Paths
}

// NewScoreService creates a new instance of ScoreService.
func NewScoreService(db *gorm.DB, paths *config.Paths) *ScoreService {
	return &ScoreService{
		db:    db,
		paths: paths,
	}
}

// findOrCreateComposer retrieves an existing composer by safe name,
// or creates a new one if it does not exist.
//
// Behavior:
// - Uses sanitized name for lookup
// - Creates a minimal composer if not found
func (s *ScoreService) findOrCreateComposer(name string) (*models.Composer, error) {
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
			PicturePath: "composers/default.png", // default fallback
		}

		if err := composer.Create(s.db); err != nil {
			return nil, err
		}

		return &composer, nil
	}

	return nil, err
}

// CreateScore orchestrates the full creation workflow of a score.
// Storage mapping:
//
//	DB paths:
//	  scores/uploaded-scores/user-1/mozart/fur-elise.pdf
//	  scores/thumbnails/user-1/mozart/fur-elise.png
//
//	Disk paths:
//	  ./storage/scores/uploaded-scores/user-1/mozart/fur-elise.pdf
//	  ./storage/scores/thumbnails/user-1/mozart/fur-elise.png
func (s *ScoreService) CreateScore(uid uint32, form forms.CreateScoreRequest, file *multipart.FileHeader) error {
	// 1. Normalize score name
	safeScoreName := format.SanitizeName(form.ScoreName)

	// 2. Resolve composer or will create a new one
	composer, err := s.findOrCreateComposer(form.Composer)
	if err != nil {
		return err
	}

	// 3. Uniqueness check
	exists, err := models.ScoreExists(s.db, safeScoreName, composer.ID, uid)
	if err != nil {
		return err
	}
	if exists {
		return apperrors.ErrScoreAlreadyExists
	}

	// 4. Build storage paths - Relative
	// filePath = scores/uploaded-scores/user-1/mozart/prelude.pdf
	filePath := s.paths.ScorePDFStorageRel(uid, composer.SafeName, safeScoreName)
	thumbnailPath := s.paths.ScoreThumbnailStorageRel(uid, composer.SafeName, safeScoreName)

	logger.Score.Debug("(CreateScore) filePath Relative %s", filePath)
	logger.Score.Debug("(CreateScore) thumbnailPath Relative %s", thumbnailPath)

	// 5. Parse release date
	releaseDate, err := createDate(form.ReleaseDate)
	if err != nil {
		return apperrors.ErrInvalidDate
	}

	// 6. Build model
	score := models.Score{
		SafeScoreName: safeScoreName,
		ScoreName:     strings.TrimSpace(form.ScoreName),

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
	if err := s.ProcessScoreStorage(&score, file); err != nil {
		return err
	}

	// 8. Persist
	return score.Create(s.db)
}

// UpdateScore updates score metadata and optionally replaces the file.
//
// Behavior:
// - Verifies ownership
// - Applies partial updates
// - Re-checks uniqueness if name changes
// - Reprocesses file if provided
func (s *ScoreService) UpdateScore(uid uint32, scoreID uint, form forms.UpdateScoreRequest, file *multipart.FileHeader) (*models.Score, error) {
	// 1. Fetch existing score
	score, err := models.FindScoreByID(s.db, scoreID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrScoreNotFound
		}
		return nil, err
	}

	// 2. Ownership check
	if score.UploaderID != uid {
		logger.Score.Warn("Unauthorized modification attempt: user=%d scoreID=%d owner=%d", uid, scoreID, score.UploaderID)
		return nil, apperrors.ErrAccessForbidden
	}

	// 3. Apply updates

	if form.ScoreName != "" {
		newSafeName := format.SanitizeName(form.ScoreName)

		exists, err := models.ScoreExists(s.db, newSafeName, score.ComposerID, uid)
		if err != nil {
			return nil, err
		}
		if exists && newSafeName != score.SafeScoreName {
			return nil, apperrors.ErrScoreAlreadyExists
		}

		score.ScoreName = form.ScoreName
		score.SafeScoreName = newSafeName
	}

	if form.ReleaseDate != "" {
		date, err := time.Parse(time.RFC3339, form.ReleaseDate)
		if err != nil {
			return nil, apperrors.ErrInvalidDate
		}
		score.ReleaseDate = date
	}

	if form.Tags != "" {
		score.Tags = domain.CleanTagsCategories(form.Tags)
	}

	if form.Categories != "" {
		score.Categories = domain.CleanTagsCategories(form.Categories)
	}

	if form.InformationText != "" {
		score.InformationText = form.InformationText
	}

	// 4. File processing (if provided)
	if err := s.ProcessScoreStorage(score, file); err != nil {
		return nil, err
	}

	// 5. Persist
	if err := score.Update(s.db); err != nil {
		return nil, err
	}

	return score, nil
}

// DeleteScore performs full deletion (authorization + files + database).
//
// Rules:
// - Allowed for owner or admin
// - Deletes physical files first, then DB record
func (s *ScoreService) DeleteScore(uid uint32, scoreID uint, userRole int) error {
	// 1. Fetch score
	score, err := models.FindScoreByID(s.db, scoreID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.ErrScoreNotFound
		}
		return err
	}

	// 2. Authorization
	isAdmin := userRole == config.RoleAdmin
	isOwner := score.UploaderID == uid

	if !isAdmin && !isOwner {
		logger.Score.Warn("Unauthorized deletion attempt: user=%d scoreID=%d", uid, scoreID)
		return apperrors.ErrAccessForbidden
	}

	// 3. Orchestrate deletion
	if err := s.deleteScoreOrchestrator(score); err != nil {
		logger.Score.Error("Deletion failed: scoreID=%d error=%v", scoreID, err)
		return err
	}

	logger.Score.Info("Score deleted: scoreID=%d user=%d", scoreID, uid)
	return nil
}

// GetScore retrieves a score after verifying access permissions.
func (s *ScoreService) GetScore(uid uint32, scoreID uint, userRole int) (*models.Score, error) {
	score, err := models.FindScoreByID(s.db, scoreID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrScoreNotFound
		}
		return nil, err
	}

	isAdmin := userRole == config.RoleAdmin
	isOwner := score.UploaderID == uid

	if !isAdmin && !isOwner {
		logger.Score.Error("Access denied: user=%d scoreID=%d owner=%d", uid, scoreID, score.UploaderID)
		return nil, apperrors.ErrAccessForbidden
	}

	return score, nil
}

// UpdateAnnotations updates only the annotations field for a given score.
func (s *ScoreService) UpdateAnnotations(uid uint32, scoreID uint, annotations string) error {
	result := s.db.Model(&models.Score{}).
		Where("id = ? AND uploader_id = ?", scoreID, uid).
		Update("annotations", annotations).
		Update("updated_at", time.Now())

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return apperrors.ErrScoreNotFound
	}

	return nil
}

// GetScoresPage handles paginated listing with filters and search.
func (s *ScoreService) GetScoresPage(uid uint32, form forms.GetScoresPageRequest) (*models.Pagination, error) {
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

	logger.Score.Debug("GetScoresPage: sort=%s", pagination.Sort)

	var score models.Score
	result, err := score.List(s.db, &pagination, safeCompSearch, form.Tag, form.Category, form.Search, uid)
	if err != nil {
		logger.Score.Error("List failed: %v", err)
		return nil, err
	}

	rows, ok := result.Rows.([]*models.Score)
	if !ok || len(rows) == 0 {
		logger.Score.Warn("No scores found for search=%s", form.Search)
	}

	return result, nil
}

// ProcessScoreStorage handles file persistence and thumbnail generation.
// For Creation and Update (SafeScoreName will not be modified !!)
// Behavior:
// - Creates directories if needed
// - Saves PDF file
// - Removes old thumbnail
// - Generates new thumbnail asynchronously
func (s *ScoreService) ProcessScoreStorage(score *models.Score, file *multipart.FileHeader) error {
	if file == nil {
		return nil
	}

	fullFilePath := s.paths.StorageAbsPath(score.FilePath)
	fullThumbnailPath := s.paths.StorageAbsPath(score.ThumbnailPath)

	logger.Score.Debug("fullFilePath Absolute : %s", fullFilePath)
	logger.Score.Debug("fullThumbnailPath Absolute : %s", fullThumbnailPath)

	// Create file and full path directory
	if err := filedir.SaveFile(file, fullFilePath); err != nil {
		return err
	}

	// Create the thumbnail directory : full path
	if err := filedir.CreateDirTree(fullThumbnailPath); err != nil {
		return err
	}

	// Remove old thumbnail
	if err := filedir.RemoveFileIfExists(fullThumbnailPath); err != nil {
		logger.Score.Error("(ProcessComposerStorage Service) delete file failed: %v", err)
		return err
	}

	// Async thumbnail generation
	go func() {
		time.Sleep(100 * time.Millisecond)
		pdf.RequestToPdfToImage(fullFilePath, fullThumbnailPath, logger.GetModuleLevel("score"))
	}()

	return nil
}

// deleteScoreOrchestrator handles full deletion lifecycle (files + DB + cleanup).
//
// Priority of errors:
// 1. File deletion error
// 2. File not found
// 3. Success
func (s *ScoreService) deleteScoreOrchestrator(score *models.Score) error {
	var hasNotFound bool
	var hasDeletionError bool

	// Example :
	// rel = scores/uploaded-scores/user-1/mozart/prelude.pdf
	// return =  /home/christian/SkoreFlow_Project/SkoreFlow/backend/storage/scores/uploaded-scores/user-1/mozart/prelude.pdf
	fullFilePath := s.paths.StorageAbsPath(score.FilePath)
	fullThumbnailPath := s.paths.StorageAbsPath(score.ThumbnailPath)

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
				logger.Score.Warn("File missing: %s", path)

			default:
				hasDeletionError = true
				logger.Score.Error("Deletion failed: %s (%v)", path, err)
			}
		}
	}

	// 2. Delete DB record
	rows, err := score.Delete(s.db)
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
