package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"backend/core/models"
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/logger"
	"backend/pkg/storagepath"

	"gorm.io/gorm"
)

// ===============================================================================================
//	Due to the import, the code has to be run from the backend root !!
//  Directory backen
//		go run ./cmd/cli/main.go
// 		go build ./cmd/cli/main.go -o skoreflow-cli
//	Examples of use :
//		go run ./cmd/cli/main.go -version
//		go run ./cmd/cli/main.go -list-users
//		./skoreflow-cli -list-users
//		......
//
//	Test cleanup-avatars"
//  Create

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

	paths := storagepath.NewPaths(
		cfg.ProjectRoot,
		cfg.DataRoot,
	)

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

// Cleanup orphan files
func runAvatarCleanup(db *gorm.DB, paths *storagepath.Paths) {
	logger.Main.Info("Starting avatar cleanup...")

	// ------------------------------------------------------------------------
	// 1. Fetch all avatar paths stored in database
	// ------------------------------------------------------------------------
	var users []models.User

	if err := db.Select("avatar").Find(&users).Error; err != nil {
		logger.Main.Fatal("Failed to fetch users: %v", err)
	}

	// ------------------------------------------------------------------------
	// 2. Build a set of valid avatar filenames
	//
	// Example:
	// users/user-5.png     -> user-5.png
	// users/avatar.webp    -> avatar.webp
	// ------------------------------------------------------------------------
	validFiles := make(map[string]struct{})

	for _, u := range users {
		if u.Avatar == "" {
			continue
		}

		filename := filepath.Base(u.Avatar)
		validFiles[filename] = struct{}{}
	}

	// ------------------------------------------------------------------------
	// 3. Protected files (never deleted)
	// ------------------------------------------------------------------------
	protectedFiles := map[string]struct{}{
		"admin.png":     {},
		"default.png":   {},
		"moderator.png": {},
	}

	// ------------------------------------------------------------------------
	// 4. Avatar directory
	// ------------------------------------------------------------------------
	avatarDir := paths.ResolveDataRoot("users")

	files, err := os.ReadDir(avatarDir)
	if err != nil {
		logger.Main.Fatal("Failed to read avatar directory: %v", err)
	}

	deleted := 0

	// ------------------------------------------------------------------------
	// 5. Delete orphan files
	// ------------------------------------------------------------------------
	for _, f := range files {

		if f.IsDir() {
			continue
		}

		filename := f.Name()

		// Never delete protected files
		if _, protected := protectedFiles[filename]; protected {
			continue
		}

		// File still referenced by a user
		if _, exists := validFiles[filename]; exists {
			continue
		}

		fullPath := filepath.Join(avatarDir, filename)

		if err := os.Remove(fullPath); err != nil {
			logger.Main.Warn(
				"Failed to delete orphan avatar %s: %v",
				fullPath,
				err,
			)
			continue
		}

		logger.Main.Info("Deleted orphan avatar: %s", fullPath)
		deleted++
	}

	// ------------------------------------------------------------------------
	// 6. Summary
	// ------------------------------------------------------------------------
	logger.Main.Info(
		"Avatar cleanup finished. Deleted %d orphan files.",
		deleted,
	)
}
