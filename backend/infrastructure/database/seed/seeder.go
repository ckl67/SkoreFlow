package seed

import (
	"backend/core/models"
	"backend/infrastructure/logger"
	"backend/pkg/format"
	"backend/pkg/security"

	"gorm.io/gorm"
)

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

func LoadComposer(db *gorm.DB, name string, epoch string, externalUrl string, picturePath string) {
	var Composer models.Composer

	// 1. Check if composer exists (silent check)
	// Avoids triggering "record not found" on an empty database
	exist, _ := Composer.ExistsByName(db, name)

	if exist {
		logger.DB.Info("%s Composer already exists", name)
		return
	}

	// 2. Build  Composer model
	newComposer := models.Composer{
		Name:        name,
		SafeName:    format.SanitizeName(name),
		Epoch:       epoch,
		ExternalURL: externalUrl,
		PicturePath: picturePath,
		IsVerified:  true,
	}

	// 3. Persist Composer
	err := newComposer.Create(db)
	if err != nil {
		logger.DB.Error("cannot create %s Composer: %v", name, err)
	}

	logger.DB.Info("%s Composer created with Name : %s", name, err)
}
