package database

import (
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"fmt"
	"os"
	"path"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLog "gorm.io/gorm/logger"
)

// connectDB establishes a connection to the database based on the provided configuration.
func ConnectDB(cfg config.ServerConfig) *gorm.DB {
	var (
		db  *gorm.DB
		err error
	)

	// Configure GORM's internal logger (set to Silent by default)
	// We use the 'gormLog' alias here to differentiate from our custom logger.
	dbConfig := &gorm.Config{
		Logger: gormLog.Default.LogMode(gormLog.Silent),
	}

	switch cfg.Database.Driver {

	case "mysql":
		dsn := fmt.Sprintf(
			"%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			cfg.Database.User,
			cfg.Database.Password,
			cfg.Database.Host,
			cfg.Database.Port,
			cfg.Database.Name,
		)
		db, err = gorm.Open(mysql.Open(dsn), dbConfig)

	case "postgres":
		dsn := fmt.Sprintf(
			"host=%s port=%d user=%s dbname=%s password=%s sslmode=disable",
			cfg.Database.Host,
			cfg.Database.Port,
			cfg.Database.User,
			cfg.Database.Name,
			cfg.Database.Password,
		)
		db, err = gorm.Open(postgres.Open(dsn), dbConfig)

	default: // SQLite as fallback
		if _, err := os.Stat(cfg.StoragePath); os.IsNotExist(err) {
			_ = os.Mkdir(cfg.StoragePath, os.ModePerm)
		}

		dbPath := path.Join(cfg.StoragePath, "database.db")
		db, err = gorm.Open(sqlite.Open(dbPath), dbConfig)
	}

	// Error handling using our custom module-based logger
	if err != nil {
		logger.DB.Error("(connectDB) : database connection failed: %v", err)
	} else {
		logger.DB.Info("(connectDB) : Database connected successfully")
	}

	return db
}
