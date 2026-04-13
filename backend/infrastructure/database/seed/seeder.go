package seed

import (
	"backend/core/models"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/pkg/format"
	"backend/pkg/security"

	"gorm.io/gorm"
)

// Load initializes seed data after database connection.
// Responsibility:
// - Ensure a default admin user exists
// - Create the admin account if it does not already exist
//
// Notes:
// - Uses a lightweight existence check to avoid unnecessary DB errors
// - Designed to run safely on every application startup
func Load(db *gorm.DB, email string, password string) {
	var user models.User

	// 1. Check if admin already exists (silent check)
	// Avoids triggering "record not found" on an empty database
	exist, _ := user.ExistsByEmail(db, email)

	if exist {
		logger.DB.Info("Admin user already exists")
		return
	}

	// 2. Hash password before persistence
	hashedPassword, err := security.HashPassword(password)
	if err != nil {
		logger.DB.Error("cannot hash password: %v", err)
	}

	// 3. Build admin user model
	admin := models.User{
		Email:      format.SanitizeUserEmail(email),
		Password:   hashedPassword,
		Role:       config.RoleAdmin,
		IsVerified: true,
	}

	// 4. Persist admin user
	err = admin.Create(db)
	if err != nil {
		logger.DB.Error("cannot create admin user: %v", err)
	}

	logger.DB.Info("Admin user created with email: %s", email)
}
