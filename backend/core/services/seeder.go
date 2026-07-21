package services

import (
	"backend/core/apperrors"
	"backend/core/models"
	"backend/infrastructure/logger"
	"backend/pkg/filedir"
	"backend/pkg/format"
	"backend/pkg/media"
	"backend/pkg/security"
	"backend/pkg/storagepath"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gorm.io/gorm"
)

// Structure
type SeederService struct {
	db    *gorm.DB
	paths *storagepath.Paths
}

// NewSeederService creates a new SeederService instance.
func NewSeederService(db *gorm.DB, paths *storagepath.Paths) *SeederService {
	return &SeederService{
		db:    db,
		paths: paths,
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
func (s *SeederService) Composer(name, epoch, externalURL, picturePath string) error {
	var composer models.Composer

	// 1. Check if composer exists (silent check)
	// Avoids triggering "record not found" on an empty database
	exist, _ := composer.ExistsByName(s.db, name)
	if exist {
		logger.Main.Info("%s Composer already exists", name)
		return nil
	}

	safeName := format.SanitizeName(name)

	var relativePath string
	if picturePath != "" {

		// 2 File Storage
		file, err := os.Open(picturePath)
		if err != nil {
			// For debug
			wd, _ := os.Getwd()
			logger.Main.Info("WORKDIR = %s", wd)

			abs, _ := filepath.Abs(picturePath)
			logger.Main.Info("INPUT IMAGE PATH = %s", picturePath)
			logger.Main.Info("RESOLVED IMAGE PATH = %s", abs)

			return fmt.Errorf("cannot open seed image %q: %w", picturePath, err)
		}
		defer file.Close()

		ext := strings.ToLower(filepath.Ext(picturePath))
		if ext == "" {
			return apperrors.ErrImageFormatInvalid
		}

		if _, ok := media.AllowedImageExt[ext]; !ok {
			logger.Main.Debug("(LoadComposer) invalid format: %s", ext)
			return apperrors.ErrImageFormatInvalid
		}

		// Build storage path
		relativePath = s.paths.ComposerPictureRel(safeName, ext)
		absolutePath := s.paths.ResolveDataRoot(relativePath)

		if err := filedir.SaveFile(absolutePath, file); err != nil {
			return err
		}
	} else {
		relativePath = "composers/default.png"
	}
	// 3. Build  Composer model
	newComposer := models.Composer{
		Name:        name,
		SafeName:    safeName,
		Epoch:       epoch,
		ExternalURL: externalURL,
		Picture:     relativePath,
		IsVerified:  true,
	}

	// 4. Persist Composer
	err := newComposer.Create(s.db)
	if err != nil {
		logger.Main.Error("cannot create %s Composer: %v", name, err)
		return err
	}

	logger.Main.Info("%s Composer created", name)
	return nil
}
