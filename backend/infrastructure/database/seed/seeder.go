package seed

import (
	"backend/core/apperrors"
	"backend/core/models"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/pkg/filedir"
	"backend/pkg/format"
	"backend/pkg/media"
	"backend/pkg/security"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gorm.io/gorm"
)

// Structure
type ComposerSeedContext struct {
	DB    *gorm.DB
	Paths *config.Paths
}

// Load initializes seed data after database connection.
// Essentially admin
//
// Notes:
// - Uses a lightweight existence check to avoid unnecessary DB errors
// - Designed to run safely on every application startup
func LoadUser(db *gorm.DB, name string, email string, password string, role int, avatar string) {
	var user models.User

	// 1. Check if account exists (silent check)
	// Avoids triggering "record not found" on an empty database
	exist, _ := user.ExistsByEmail(db, email)

	if exist {
		logger.DB.Info("%s user already exists", name)
		return
	}

	// 2. Hash password before persistence
	hashedPassword, err := security.HashPassword(password)
	if err != nil {
		logger.DB.Error("cannot hash password: %v", err)
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

	// 4. Persist admin user
	err = newUser.Create(db)
	if err != nil {
		logger.DB.Error("cannot create %s user: %v", name, err)
	}

	logger.DB.Info("%s user created with email: %s", name, email)
}

// LoadComposer
func LoadComposer(ctx ComposerSeedContext, name, epoch, externalURL, picturePath string) error {
	var composer models.Composer

	// 1. Check if composer exists (silent check)
	// Avoids triggering "record not found" on an empty database
	exist, _ := composer.ExistsByName(ctx.DB, name)
	if exist {
		logger.DB.Info("%s Composer already exists", name)
		return nil
	}

	// 2 File Storage
	file, err := os.Open(picturePath)
	if err != nil {
		// For debug
		wd, _ := os.Getwd()
		logger.DB.Info("WORKDIR = %s", wd)

		abs, _ := filepath.Abs(picturePath)
		logger.DB.Info("INPUT IMAGE PATH = %s", picturePath)
		logger.DB.Info("RESOLVED IMAGE PATH = %s", abs)

		return fmt.Errorf("cannot open seed image %q: %w", picturePath, err)
	}
	defer file.Close()

	safeName := format.SanitizeName(name)
	ext := strings.ToLower(filepath.Ext(picturePath))
	if ext == "" {
		return apperrors.ErrImageFormatInvalid
	}

	if _, ok := media.AllowedImageExt[ext]; !ok {
		logger.Composer.Debug("(LoadComposer) invalid format: %s", ext)
		return apperrors.ErrImageFormatInvalid
	}

	// Build storage path
	filePath := ctx.Paths.ComposerPicturePath(safeName, ext)
	fullPath := ctx.Paths.StorageAbsPath(filePath)

	if err := filedir.SaveFile(fullPath, file); err != nil {
		return err
	}

	// 3. Build  Composer model
	newComposer := models.Composer{
		Name:        name,
		SafeName:    safeName,
		Epoch:       epoch,
		ExternalURL: externalURL,
		PicturePath: filePath,
		IsVerified:  true,
	}

	// 4. Persist Composer
	err = newComposer.Create(ctx.DB)
	if err != nil {
		logger.DB.Error("cannot create %s Composer: %v", name, err)
		return err
	}

	logger.DB.Info("%s Composer created", name)
	return nil
}
