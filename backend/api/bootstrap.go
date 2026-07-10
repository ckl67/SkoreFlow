package api

import (
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/logger"
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
	appServer.SeederService.User("admin", cfg.AdminEmail, cfg.AdminPassword, config.RoleAdmin, "assets/icon/admin.png")

	if config.Config().TestMode {
		// Users
		appServer.SeederService.User("user1", "user1@test.com", "password123", config.RoleUser, "assets/icon/default.png")
		appServer.SeederService.User("user2", "user2@test.com", "password123", config.RoleUser, "assets/icon/default.png")
		appServer.SeederService.User("user3", "user3@test.com", "password123", config.RoleUser, "assets/icon/default.png")
		appServer.SeederService.User("moderator1", "moderator1@test.com", "password123", config.RoleModerator, "assets/icon/moderator.png")
		appServer.SeederService.User("moderator2", "moderator2@test.com", "password123", config.RoleModerator, "assets/icon/moderator.png")

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
