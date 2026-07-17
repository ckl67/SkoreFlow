package api

import (
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/logger"
	"backend/shared"
	"os"
	"path/filepath"
)

// Start orchestrates the application setup and launches the server.
// It handles configuration loading, database connection, and service bootstrapping.
func Start(version string) {
	// Log configuration details (redacted/safe version)
	cfg := config.Config()
	cfg.LogSafe()

	// 1. Infrastructure Setup -- Database Connection
	db := database.ConnectDB(cfg)

	// 2. Application Core Setup - Server instance (local scope, not global)
	appServer := Server{}
	appServer.Setup(version, db)

	// 3. Database Seeding
	// For users
	// 	file is not saved in the DataRoot Directory !
	// 	We will use ResolveAssetRoot returns the get the absolute path in the Assets, for displaying the file
	appServer.SeederService.User("admin", cfg.AdminEmail, cfg.AdminPassword, shared.RoleAdmin, "users/admin.png")

	if config.Config().TestMode {

		// Test presence of the users assets
		// Useful for deployment diagnostics
		cwd, err := os.Getwd()
		if err != nil {
			logger.Main.Error("Cannot get current directory: %v", err)
		} else {
			logger.Main.Info("Current working directory: %s", cwd)
		}

		logger.Main.Info("ProjectRoot: %s", cfg.ProjectRoot)

		path := filepath.Join(cfg.ProjectRoot, "assets/users")

		logger.Main.Info("Checking assets directory: %s", path)

		// Check parent directories step by step
		for _, dir := range []string{
			cfg.ProjectRoot,
			filepath.Join(cfg.ProjectRoot, "assets"),
			filepath.Join(cfg.ProjectRoot, "assets/users"),
		} {
			info, err := os.Stat(dir)

			if err != nil {
				logger.Main.Error("Missing path: %s (%v)", dir, err)
				continue
			}

			logger.Main.Info(
				"Found path: %s (directory=%v)",
				dir,
				info.IsDir(),
			)
		}

		entries, err := os.ReadDir(path)
		if err != nil {
			logger.Main.Error("Cannot read assets: %v", err)
			return
		}

		for _, e := range entries {
			logger.Main.Info("Asset found: %s", e.Name())
		}
		// Users
		appServer.SeederService.User("user1", "user1@test.com", "password123", shared.RoleUser, "users/default.png")
		appServer.SeederService.User("user2", "user2@test.com", "password123", shared.RoleUser, "users/default.png")
		appServer.SeederService.User("user3", "user3@test.com", "password123", shared.RoleUser, "users/default.png")
		appServer.SeederService.User("moderator1", "moderator1@test.com", "password123", shared.RoleModerator, "users/moderator.png")
		appServer.SeederService.User("moderator2", "moderator2@test.com", "password123", shared.RoleModerator, "users/moderator.png")

		if err := appServer.SeederService.Composer(
			"Wolfgang Amadeus Mozart",
			"Classical period",
			"https://fr.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart",
			"../testauto/backend/resources/composers/Mozart.png",
		); err != nil {
			logger.Main.Fatal("Seed failed: %v", err)
		}

		if err := appServer.SeederService.Composer("Ludwig van Beethoven",
			"Classical period",
			"https://fr.wikipedia.org/wiki/Ludwig_van_Beethoven",
			"../testauto/backend/resources/composers/Beethoven.png",
		); err != nil {
			logger.Main.Fatal("Seed failed: %v", err)
		}

		if err := appServer.SeederService.Composer("Supertramp",
			"Rock gradual, Pop, Art Rock, Blues-rock",
			"https://fr.wikipedia.org/wiki/Supertramp",
			"../testauto/backend/resources/composers/Supertramp.png",
		); err != nil {
			logger.Main.Fatal("Seed failed: %v", err)
		}

	}

	// 4. Port Configuration
	// Go Listening [Nginx / Reverse Proxy]
	addr := cfg.BackendListenAddress
	if addr == "" {
		addr = "0.0.0.0:8080"
	}

	// 5. Execution
	// We call ListenAndServe .
	appServer.ListenAndServe(addr)
}
