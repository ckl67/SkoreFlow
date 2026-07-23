package services

import (
	"backend/core/models"
	"backend/infrastructure/logger"
	"backend/pkg/format"
	"backend/pkg/security"
	"backend/pkg/storagepath"
	"fmt"
	"os"

	"gorm.io/gorm"
)

// Structure
type SeederService struct {
	db              *gorm.DB
	paths           *storagepath.Paths
	composerService *ComposerService
}

// NewSeederService creates a new SeederService instance.
func NewSeederService(db *gorm.DB, paths *storagepath.Paths, composerService *ComposerService) *SeederService {

	if composerService == nil {
		panic("ComposerService is required for SeederService")
	}
	return &SeederService{
		db:              db,
		paths:           paths,
		composerService: composerService,
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
func (s *SeederService) Composer(name string, epoch string, externalURL string, picturePath string) error {

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
	}

	// 3. Store picture using ComposerService
	if picturePath != "" {

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
