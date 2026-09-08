// cspell:ignore gorm storagepath datatypes  JJTHH
package services

// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// ORCHESTRATION      | services/      | Core business logic. Coordinates models, storage,
//                    |                | file processing, and business rules for scores.
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

	"backend/infrastructure/logger"
	"backend/internal/apperrors"
	"backend/internal/domain"
	"backend/internal/forms"
	"backend/internal/models"
	"backend/pkg/filedir"
	"backend/pkg/format"
	"backend/pkg/media"
	"backend/pkg/storagepath"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// ScoreService handles business logic related to music scores.

type ScoreService struct {
	db    *gorm.DB
	paths *storagepath.Paths
}

// NewScoreService creates a new instance of ScoreService.
func NewScoreService(db *gorm.DB, paths *storagepath.Paths) *ScoreService {
	return &ScoreService{
		db:    db,
		paths: paths,
	}
}

// findOrCreateComposer retrieves an existing composer by safe name,
// or creates a new one if it does not exist.
func (s *ScoreService) findOrCreateComposer(name string) (*models.Composer, error) {
	safeName := format.SanitizeName(name)

	var composer *models.Composer
	var err error

	// 1. Try to find existing composer
	composer, err = models.FindComposerBySafeName(s.db, safeName, false)
	if err == nil {
		return composer, nil
	}

	// 2. If not found → create
	if errors.Is(err, gorm.ErrRecordNotFound) {
		composer = &models.Composer{
			Name:     strings.TrimSpace(name),
			SafeName: safeName,
			Picture:  "composers/default.png", // default fallback
		}

		if err := composer.Create(s.db); err != nil {
			return nil, err
		}

		return composer, nil
	}

	return nil, err
}

// CreateScore orchestrates the full creation workflow of a score.
func (s *ScoreService) CreateScore(uid uint32, form forms.CreateScoreRequest) (*models.Score, error) {
	// 1. Composer ID verification
	composer, err := models.FindComposerByID(s.db, form.ComposerId, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrComposerNotFound
		}
		return nil, err
	}

	// 2. Normalize score name
	safeScoreName := format.SanitizeName(form.ScoreName)

	// 3. Uniqueness check
	exists, err := models.ScoreExists(s.db, safeScoreName, composer.ID, uid)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.ErrScoreAlreadyExists
	}

	// 4. Parse release date
	releaseDate, err := createDate(form.ReleaseDate)
	if err != nil {
		return nil, apperrors.ErrInvalidDate
	}

	// 5. Build model
	score := models.Score{
		ScoreName:     strings.TrimSpace(form.ScoreName),
		SafeScoreName: safeScoreName,
		ComposerID:    composer.ID,
		ReleaseDate:   releaseDate,
		//	FilePath:      relativePath,
		//	ThumbnailPath: relativeThumbnailPath,
		UploaderID:      uid,
		Tags:            format.ParseSemicolonList(form.Tags),
		Categories:      format.ParseSemicolonList(form.Categories),
		InformationText: form.InformationText,
		Annotations:     datatypes.JSON("[]"),
	}

	// 6. File processing : Read pdf --> store pdf + thumbnail
	// Update also the score.FilePath and score.ThumbnailPath fields
	if err := s.ProcessScoreStorage(&score, form.File); err != nil {
		return nil, err
	}

	// 7. Database persistence
	if err := score.Create(s.db); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			logger.Score.Error("(CreateScore Service) duplicate entry: %v", err)
			return nil, apperrors.ErrScoreAlreadyExists
		}
		logger.Score.Error("(CreateScore Service) DB error: %v", err)
		return nil, err
	}

	logger.Score.Debug("(CreateScore Service) score created: %s", score.SafeScoreName)
	return &score, nil

}

// ProcessScoreStorage handles the uploaded score file.
//
// Responsibilities:
// - Extract file content from multipart upload
// - Delegate validation + storage to StoreScorePicture
//
// This function acts as an HTTP adapter layer between:
// HTTP layer (multipart.FileHeader)
// and domain storage logic (io.Reader based service)
func (s *ScoreService) ProcessScoreStorage(score *models.Score, file *multipart.FileHeader) error {
	if file == nil {
		return apperrors.ErrScoreFileRequired
	}

	f, err := file.Open()
	if err != nil {
		return err
	}
	defer f.Close()

	return s.StoreScorePdfThumbnail(score, f, file.Filename)
}

// StoreScorePdfThumbnail validates and stores the score PDF,
// then generates its thumbnail.
func (s *ScoreService) StoreScorePdfThumbnail(
	score *models.Score,
	reader io.Reader,
	filename string,
) error {

	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return apperrors.ErrScoreFileFormatInvalid
	}

	if _, ok := media.AllowedScoreFileExt[ext]; !ok {
		//logger.Score.Debug("(StoreScorePdfThumbnail) invalid format: %s", ext)
		return apperrors.ErrImageFormatInvalid
	}

	// ---------------------------------------------------------
	// Build storage paths
	// ---------------------------------------------------------
	// Build storage path
	//			├── scores/
	//			│   ├── uploaded
	//			│   │    ├── user-1/
	//			│   │    │   ├── Mozart/
	//			│   │    │   │   └── Pour Elise.pdf
	//			│   ├── thumbnails
	//			│   │    ├── user-1/
	//			│   │        └─── Mozart/
	//			│   │            └── Pour Elise.png

	uid := score.UploaderID
	SafeComposerName := score.Composer.SafeName
	safeScoreName := score.SafeScoreName

	relativePath := s.paths.ScorePdfRel(uid, SafeComposerName, safeScoreName)
	relativeThumbnailPath := s.paths.ScoreThumbnailRel(uid, SafeComposerName, safeScoreName)

	uploadedPath := s.paths.ResolveDataRoot(relativePath)
	thumbnailPath := s.paths.ResolveDataRoot(relativeThumbnailPath)

	//logger.Score.Debug("(StoreScorePdfThumbnail) uploadedPath=%s", uploadedPath)
	//logger.Score.Debug("(StoreScorePdfThumbnail) thumbnailPath=%s", thumbnailPath)

	score.FilePath = uploadedPath
	score.ThumbnailPath = thumbnailPath

	// ---------------------------------------------------------
	// 1. Save pdf file
	// ---------------------------------------------------------

	if err := filedir.SaveFile(uploadedPath, reader); err != nil {
		return err
	}

	// ---------------------------------------------------------
	// 3. Generate thumbnail
	// ---------------------------------------------------------

	if err := s.GenerateResizedImage(
		uploadedPath,
		thumbnailPath,
		media.ScoreSizeThumb,
	); err != nil {
		return err
	}

	return nil

}

// GenerateResizedImage
func (s *ScoreService) GenerateResizedImage(fullFilePath string, fullThumbnailPath string, maxSize int) error {
	//logger.Score.Debug("(ScorePictureData) GenerateResizedImage %s  thumbnail=%s", fullFilePath, fullThumbnailPath)

	res := media.RequestThumbnail(
		fullFilePath,
		fullThumbnailPath,
		maxSize,
		logger.GetModuleLevel("microservices"),
	)
	if res {
		return nil
	} else {
		return apperrors.ErrScoreThumbnail
	}
}

// UpdateScore updates score metadata and optionally replaces the file.
func (s *ScoreService) UpdateScore(
	userId uint32,
	scoreId uint,
	form forms.UpdateScoreRequest,
) (*models.Score, error) {

	// 1. Fetch existing Score = base for save
	score, err := models.FindScoreByID(
		s.db,
		userId,
		scoreId,
		false,
	)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrScoreNotFound
		}
		return nil, err
	}

	// logger.Score.Debug( "After fetching: Score ID=%d ComposerID=%d Composer=%s", score.ID, score.ComposerID, score.Composer.Name, ) logger.Score.Debug("New Composer ID %d", *form.ComposerId)

	oldSafeScoreName := score.SafeScoreName
	oldComposerID := score.ComposerID

	// 2. Ownership check
	if score.UploaderID != userId {
		logger.Score.Warn(
			"Unauthorized modification attempt: user=%d scoreId=%d owner=%d",
			userId,
			scoreId,
			score.UploaderID,
		)
		return nil, apperrors.ErrAccessForbidden
	}

	// 3. Prepare new score identity
	if form.ScoreName != nil {
		score.ScoreName = *form.ScoreName
		score.SafeScoreName = format.SanitizeName(*form.ScoreName)
	}

	if form.ComposerId != nil {
		composer, err := models.FindComposerByID(
			s.db,
			*form.ComposerId,
			false,
		)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, apperrors.ErrComposerNotFound
			}
			return nil, err
		}

		score.ComposerID = composer.ID
	}

	// 4. Check score uniqueness with final name + composer
	if oldSafeScoreName != score.SafeScoreName ||
		oldComposerID != score.ComposerID {

		exists, err := models.ScoreExists(
			s.db,
			score.SafeScoreName,
			score.ComposerID,
			userId,
		)
		if err != nil {
			return nil, err
		}

		if exists {
			return nil, apperrors.ErrScoreAlreadyExists
		}
	}

	// 6. Other metadata
	if form.ReleaseDate != nil {
		releaseDate, err := createDate(*form.ReleaseDate)
		if err != nil {
			return nil, apperrors.ErrInvalidDate
		}
		score.ReleaseDate = releaseDate
	}

	if form.Tags != nil {
		score.Tags = format.ParseSemicolonList(*form.Tags)
	}

	if form.Categories != nil {
		score.Categories = format.ParseSemicolonList(*form.Categories)
	}

	if form.InformationText != nil {
		score.InformationText = *form.InformationText
	}

	// 7. File processing if present
	if form.File != nil {
		if err := s.ProcessScoreStorage(score, form.File); err != nil {
			return nil, err
		}
	}

	// logger.Score.Debug( "Before Update: Score ID=%d ComposerID=%d Composer=%s", score.ID, score.ComposerID, score.Composer.Name, )

	// 9. Persist
	if err := score.Update(s.db); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			logger.Score.Error(
				"(UpdateScore Service) duplicate entry: %v",
				err,
			)
			return nil, apperrors.ErrScoreAlreadyExists
		}

		logger.Score.Error(
			"(UpdateScore Service) DB error: %v",
			err,
		)
		return nil, err
	}

	// logger.Score.Debug( "After Update: Score ID=%d ComposerID=%d Composer=%s", score.ID, score.ComposerID, score.Composer.Name, )
	return score, nil
}

// DeleteScore performs full deletion (authorization + files + database).
//
// Rules:
// - Allowed for owner or admin
// - Deletes physical files first, then DB record
func (s *ScoreService) DeleteScore(userId uint32, scoreId uint, userRole int) error {
	// 1. Fetch score
	score, err := models.FindScoreByID(s.db, userId, scoreId, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.ErrScoreNotFound
		}
		return err
	}

	// 2. Authorization
	isAdmin := userRole == domain.RoleAdmin
	isOwner := score.UploaderID == userId

	if !isAdmin && !isOwner {
		logger.Score.Warn("Unauthorized deletion attempt: user=%d scoreId=%d", userId, scoreId)
		return apperrors.ErrAccessForbidden
	}

	// 3. Orchestrate deletion
	if err := s.deleteScoreOrchestrator(score); err != nil {
		logger.Score.Error("Deletion failed: scoreId=%d error=%v", scoreId, err)
		return err
	}

	logger.Score.Info("Score deleted: scoreId=%d user=%d", scoreId, userId)
	return nil
}

// GetScore retrieves a score
// Will return only for the uid
func (s *ScoreService) GetScore(uid uint32, scoreId uint) (*models.Score, error) {
	score, err := models.FindScoreByID(s.db, uid, scoreId, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.ErrScoreNotFound
		}
		return nil, err
	}

	return score, nil
}

// GetScoresPage handles paginated listing with filters and search.
func (s *ScoreService) GetScoresPage(uid uint32, isDemo bool, form forms.GetScoresPageRequest) (*models.Pagination, error) {
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
	// Composer name should be provided, however we test !!
	var safeCompSearch *string
	if form.Composer != nil {
		safeCompName := format.SanitizeName(*form.Composer)
		safeCompSearch = &safeCompName
	} else {
		safeCompSearch = nil
	}

	logger.Score.Debug("GetScoresPage: sort=%s", pagination.Sort)

	var score models.Score
	// safeCompSearch, form.Tag, form.Category, form.Name can be nil
	result, err := score.List(s.db, &pagination, safeCompSearch, form.Name, form.Tag, form.Category, uid, isDemo)
	if err != nil {
		logger.Score.Error("Failed to List Scores: %v", err)
		return nil, err
	}

	if result == nil {
		return nil, fmt.Errorf("invalid pagination result")
	}

	scores, ok := result.Rows.([]*models.Score)
	if !ok {
		return nil, fmt.Errorf("invalid scores type")
	}

	if len(scores) == 0 {
		if form.Name != nil {
			logger.Score.Warn("No scores found for search: %s", *form.Name)
		} else {
			logger.Score.Warn("No scores found")
		}
	}

	return result, nil
}

// UpdateAnnotations updates only the annotations field for a given score.
func (s *ScoreService) UpdateAnnotations(userId uint32, scoreId uint, form forms.UpdateScoreAnnotationRequest) error {
	// 1. Fetch existing Score
	score, err := models.FindScoreByID(s.db, userId, scoreId, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.ErrScoreNotFound
		}
		return err
	}

	// 2. Ownership check
	if score.UploaderID != userId {
		logger.Score.Warn("Unauthorized modification attempt: user=%d scoreId=%d owner=%d", userId, scoreId, score.UploaderID)
		return apperrors.ErrAccessForbidden
	}

	// 3. Apply updates

	if form.Annotations != nil {
		if err := score.UpdateAnnotations(
			s.db,
			form.Annotations,
		); err != nil {
			logger.Score.Error(
				"(UpdateAnnotations Service) DB error: %v",
				err,
			)
			return err
		}
	}

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
	fullFilePath := s.paths.ResolveDataRoot(score.FilePath)
	fullThumbnailPath := s.paths.ResolveDataRoot(score.ThumbnailPath)

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
// 	The input format must strictly adhere to the AAAA-MM-JJTHH:MM:SSZ format
// 	(or with a time zone offset such as +02:00).
// 		1965-12-12T00:00:00Z: This works because it includes the year, month, day, the ‘T’ separator,
// 		the hour, minutes, seconds and the UTC indicator ‘Z’.
// However, we will accept simple format !

func createDate(date string) (time.Time, error) {

	// 1. Try the full RFC3339 format
	t, err := time.Parse(time.RFC3339, date)
	if err == nil {
		return t, nil
	}

	// 2. Try the ‘Year only’ format (‘2006’ is the template for YYYY in GB)
	t, err = time.Parse("2006", date)
	if err == nil {
		// Returns 1 January of the year at 00:00:00 UTC
		return t, nil
	}

	// 3. Try the simple date format ("2006-01-02")
	t, err = time.Parse("2006-01-02", date)
	if err == nil {
		return t, nil
	}

	return time.Time{}, apperrors.ErrInvalidDate
}
