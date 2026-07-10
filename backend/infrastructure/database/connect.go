package database

import (
	"fmt"
	"os"
	"path/filepath"

	"backend/infrastructure/config"
	"backend/infrastructure/logger"

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
			"host=%s port=%d user=%s DB name=%s password=%s ssl mode=disable",
			cfg.Database.Host,
			cfg.Database.Port,
			cfg.Database.User,
			cfg.Database.Name,
			cfg.Database.Password,
		)
		db, err = gorm.Open(postgres.Open(dsn), dbConfig)

	default: // SQLite as fallback
		logger.DB.Warn("SQLite is suitable for development and testing, but not recommended for production environments.")

		// MkdirAll ensures that the DataRoot directory exists before attempting to create the SQLite database file.
		// It can create multiple levels of directories if they do not exist.
		if err := os.MkdirAll(cfg.DataRoot, 0755); err != nil {
			logger.DB.Fatal("unable to create data directory: %v", err)
		}

		// Check if the DataRoot directory exists before proceeding to create the SQLite database file.
		if _, err := os.Stat(cfg.DataRoot); err != nil {
			logger.DB.Fatal("DataRoot does not exist: %v", err)
		}

		dbPath := filepath.Join(cfg.DataRoot, "database.db")
		logger.DB.Info("SQLite database file path: %s", dbPath)
		db, err = gorm.Open(sqlite.Open(dbPath), dbConfig)

	}

	// Error handling using our custom module-based logger
	if err != nil {
		logger.DB.Fatal("(connectDB) : database connection failed: %v", err)

	} else {
		logger.DB.Info("(connectDB) : Database connected successfully")
	}

	return db
}
