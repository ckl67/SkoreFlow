// cspell:ignore gorm datatypes storagepath
package services

import (
	"backend/infrastructure/logger"
	"backend/internal/apperrors"
	"backend/internal/forms"
	"backend/internal/models"
	"backend/pkg/format"
	"backend/pkg/security"
	"backend/pkg/storagepath"
	"fmt"
	"os"
	"strings"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Structure
type SeederService struct {
	db              *gorm.DB
	paths           *storagepath.Paths
	composerService *ComposerService
	scoreService    *ScoreService
}

// NewSeederService creates a new SeederService instance.
func NewSeederService(db *gorm.DB, paths *storagepath.Paths, composerService *ComposerService, scoreService *ScoreService) *SeederService {

	if composerService == nil {
		panic("ComposerService is required for SeederService")
	}

	if scoreService == nil {
		panic("scoreService is required for SeederService")
	}
	return &SeederService{
		db:              db,
		paths:           paths,
		composerService: composerService,
		scoreService:    scoreService,
	}
}

// User
// For default avatars no file are saved
func (s *SeederService) User(name string, email string, password string, role int, avatar string) error {
	var user models.User

	// 1. Check if user exists (silent check)
	exist, _ := user.ExistsByEmail(s.db, email)
	if exist {
		logger.Main.Info("%s User already exists", name)
		return nil
	}

	// 2. Hash password before persistence
	hashedPassword, err := security.HashPassword(password)
	if err != nil {
		logger.Main.Error("cannot hash password: %v", err)
	}

	// 3. Build admin user model
	newUser := models.User{
		Username:   name,
		Email:      format.SanitizeUserEmail(email),
		Password:   hashedPassword,
		Role:       role,
		Avatar:     avatar,
		IsVerified: true,
	}

	// 4. Persist User
	err = newUser.Create(s.db)
	if err != nil {
		logger.Main.Error("cannot create %s User: %v", name, err)
		return err
	}

	logger.Main.Info("%s User created", name)
	return nil
}

// Composer
func (s *SeederService) SeederComposer(name string, epoch string, externalURL string, picturePath string, demo bool) error {

	var composer models.Composer

	// 1. Check existing
	exist, err := composer.ExistsByName(s.db, name)
	if err != nil {
		return err
	}
	if exist {
		logger.Main.Info("%s Composer already exists", name)
		return nil
	}

	safeName := format.SanitizeName(name)

	// 2. Build composer model first
	newComposer := models.Composer{
		Name:        name,
		SafeName:    safeName,
		Epoch:       epoch,
		ExternalURL: externalURL,
		IsVerified:  true,
		IsDemo:      demo,
	}

	// 3. Store picture using ComposerService
	if picturePath != "" {

		logger.Main.Debug("((s *SeederService) Composer):: picturePath %s ", picturePath)

		file, err := os.Open(picturePath)
		if err != nil {
			return fmt.Errorf("cannot open seed image %q: %w", picturePath, err)
		}
		defer file.Close()

		err = s.composerService.StoreComposerPicture(&newComposer, file, picturePath)

		if err != nil {
			return err
		}

	} else {
		newComposer.Picture = "composers/default.png"
	}

	// 4. Persist composer
	err = newComposer.Create(s.db)

	if err != nil {
		logger.Main.Error("cannot create %s Composer: %v", name, err)
		return err
	}
	logger.Main.Info("%s Composer created", name)

	return nil
}

// creation workflow of a score.
// Score creates a demo or test score during application startup.
func (s *SeederService) SeederScore(
	composerName string,
	scoreName string,
	releaseDate string,
	tags string,
	categories string,
	informationText string,
	annotations datatypes.JSON,
	partitionFilePath string,
	demo bool,
	userId int32,
) error {

	// ---------------------------------------------------------
	// 1. Find composer
	// ---------------------------------------------------------

	form := forms.GetComposersPageRequest{
		PaginatedRequest: forms.PaginatedRequest{
			Page:  1,
			Limit: 10,
		},
		Name: &composerName,
	}

	pageData, err := s.composerService.GetComposersPage(demo, form)
	if err != nil {
		return err
	}

	composers, ok := pageData.Rows.([]*models.Composer)
	if !ok {
		return fmt.Errorf("invalid composers type")
	}

	if len(composers) == 0 {
		return fmt.Errorf("composer not found: %s", composerName)
	}

	if len(composers) > 1 {
		return fmt.Errorf(
			"multiple composers found for name: %s",
			composerName,
		)
	}

	composer := composers[0]

	logger.Main.Debug(
		"(SeederScore) Composer found: %s (ID=%d, Demo=%t)",
		composer.Name,
		composer.ID,
		composer.IsDemo,
	)

	// ---------------------------------------------------------
	// 2. Create score
	// ---------------------------------------------------------

	// Normalize score name
	safeScoreName := format.SanitizeName(scoreName)

	// Uniqueness check
	exists, err := models.ScoreExists(
		s.db,
		safeScoreName,
		composer.ID,
		uint32(userId),
	)
	if err != nil {
		return err
	}

	if exists {
		logger.Main.Debug(
			"(SeederScore) Score already exists: %s / %s",
			composerName,
			scoreName,
		)
		return nil
	}

	// Parse release date
	parsedReleaseDate, err := createDate(releaseDate)
	if err != nil {
		return apperrors.ErrInvalidDate
	}

	// Build model
	// Remember
	// 		ComposerID uint32 `gorm:"not null;index;uniqueIndex:idx_score_user" json:"composer_id"`
	//		Composer   Composer `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"composer"`
	// Composer is used for the GORM/preload relationship,
	newScore := models.Score{
		ScoreName:     strings.TrimSpace(scoreName),
		SafeScoreName: safeScoreName,
		ComposerID:    composer.ID,
		ReleaseDate:   parsedReleaseDate,
		//	FilePath:      relativePath,
		//	ThumbnailPath: relativeThumbnailPath,
		UploaderID:      uint32(userId),
		Tags:            format.ParseSemicolonList(tags),
		Categories:      format.ParseSemicolonList(categories),
		InformationText: informationText,
		Annotations:     annotations,
		IsDemo:          demo,
	}

	// Store score PDF and generate thumbnail using ScoreService
	// will update FilePath & ThumbnailPath
	if partitionFilePath != "" {

		logger.Main.Debug("(SeederScore): partitionFilePath=%s", partitionFilePath)

		file, err := os.Open(partitionFilePath)
		if err != nil {
			return fmt.Errorf("cannot open seed pdf file %q: %w", partitionFilePath, err)
		}
		defer file.Close()

		err = s.scoreService.StoreScorePdfThumbnail(&newScore, file, partitionFilePath)

		if err != nil {
			return err
		}

	} else {
		return fmt.Errorf("score seed file must be provided")
	}

	//  Persist score
	err = newScore.Create(s.db)

	if err != nil {
		logger.Main.Error("cannot create %s Score: %v", scoreName, err)
		return err
	}
	logger.Main.Info("%s Score created", scoreName)

	return nil
}
