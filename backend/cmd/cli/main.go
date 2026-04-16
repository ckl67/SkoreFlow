package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"backend/core/models"
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/logger"

	"gorm.io/gorm"
)

// ===============================================================================================
//	cd backend/cmd/cli
// 	go build -o skoreflow-cli
//	Exemples d’utilisation :
//		./skoreflow-cli -version
//		./skoreflow-cli -list-users
//		./skoreflow-cli -reset-password user@example.com
// ===============================================================================================

const cliVersion = "0.1.0"

// CLI Flags
var (
	listUsersFlag      = flag.Bool("list-users", false, "List all users in the database")
	cleanupAvatarsFlag = flag.Bool("cleanup-avatars", false, "Remove orphan avatar files")
	showVersionFlag    = flag.Bool("version", false, "Show CLI version")
)

func main() {
	logger.SetModuleLevel("main", "debug") // In debug, will also display the configuration used

	flag.Parse()

	if *showVersionFlag {
		fmt.Printf("skoreflow CLI version %s\n", cliVersion)
		return
	}

	cfg := config.Config()
	cfg.LogSafe()

	db := database.ConnectDB(cfg)

	paths := config.NewPaths(cfg)

	if *listUsersFlag {
		listUsers(db)
		return
	}

	if *cleanupAvatarsFlag {
		runAvatarCleanup(db, paths)
		return
	}

	fmt.Println("No command provided. Use -h for help.")
}

// listUsers prints all users
func listUsers(db *gorm.DB) {
	var users []struct {
		ID    uint
		Email string
	}
	if err := db.Table("users").Select("id, email").Scan(&users).Error; err != nil {
		fmt.Printf("Error fetching users: %v\n", err)
		return
	}
	fmt.Println("Users:")
	for _, u := range users {
		fmt.Printf(" - %d: %s\n", u.ID, u.Email)
	}
}

func runAvatarCleanup(db *gorm.DB, paths *config.Paths) {
	// Start the cleanup process
	logger.Main.Info("Starting avatar cleanup...")

	// ----------------------------------------------------------------------------
	// 1. Fetch all users (only IDs for efficiency)
	// ----------------------------------------------------------------------------
	var users []models.User
	// Specifies which columns to retrieve from the database. id == SELECT id FROM users;
	// Find(&users) : Executes the query and stores the result into users.
	if err := db.Select("id").Find(&users).Error; err != nil {
		// Fatal: cannot proceed without user reference data
		logger.Main.Fatal("Failed to fetch users: %v", err)
	}

	// ----------------------------------------------------------------------------
	// 2. Build a set of valid avatar identifiers (user-<id>)
	//    Using map[string]struct{} as a memory-efficient set
	// ----------------------------------------------------------------------------
	validUsers := make(map[string]struct{})
	for _, u := range users {
		key := fmt.Sprintf("user-%d", u.ID)
		validUsers[key] = struct{}{}
	}

	// ----------------------------------------------------------------------------
	// 2.b Define protected files (must NEVER be deleted)
	// ----------------------------------------------------------------------------
	protectedFiles := map[string]struct{}{
		"admin.png":   {},
		"default.png": {},
	}
	// ----------------------------------------------------------------------------
	// 3. Resolve avatar storage directory
	// ----------------------------------------------------------------------------
	avatarDir := paths.StorageAbsPath("users")

	// Read all entries (files + directories) in the avatar folder
	files, err := os.ReadDir(avatarDir)
	if err != nil {
		// Fatal: cannot inspect filesystem
		logger.Main.Fatal("Failed to read avatar directory: %v", err)
	}

	// Counter for deleted files
	deleted := 0

	// ----------------------------------------------------------------------------
	// 4. Iterate over all files
	// ----------------------------------------------------------------------------
	for _, f := range files {
		if f.IsDir() {
			continue
		}

		name := f.Name()

		// ----------------------------------------------------------------------------
		// Skip protected files explicitly
		// ----------------------------------------------------------------------------
		if _, isProtected := protectedFiles[name]; isProtected {
			continue
		}

		// Extract base name without extension → "user-5"
		base := strings.TrimSuffix(name, filepath.Ext(name))

		// Check if file belongs to a valid user
		if _, exists := validUsers[base]; !exists {
			fullPath := filepath.Join(avatarDir, name)

			err := os.Remove(fullPath)
			if err != nil {
				logger.Main.Warn("Failed to delete %s: %v", fullPath, err)
				continue
			}

			logger.Main.Info("Deleted orphan avatar: %s", fullPath)
			deleted++
		}
	}

	// ----------------------------------------------------------------------------
	// 5. Final report
	// ----------------------------------------------------------------------------
	logger.Main.Info("Cleanup finished. Deleted %d files.", deleted)
}
