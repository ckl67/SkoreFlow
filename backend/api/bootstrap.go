package api

import (
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/database/seed"
	"backend/infrastructure/logger"
)

// Start orchestrates the application setup and launches the server.
// It handles configuration loading, database connection, and service bootstrapping.
func Start(version string) {
	// Log configuration details (redacted/safe version)
	cfg := config.Config()
	cfg.LogSafe()

	// Path management setup
	paths := config.NewPaths(cfg)

	// 1. Infrastructure Setup -- Database Connection
	db := database.ConnectDB(cfg)

	// 2. Application Core Setup - Server instance (local scope, not global)
	appServer := Server{}
	appServer.Setup(version, db, paths)

	// 3. Database Seeding
	seed.LoadUser(appServer.DB, "admin", cfg.AdminEmail, cfg.AdminPassword, config.RoleAdmin, "users/admin.png")

	if config.Config().TestMode {
		// Users
		seed.LoadUser(appServer.DB, "user1", "user1@test.com", "password123", config.RoleUser, "users/default.png")
		seed.LoadUser(appServer.DB, "user2", "user2@test.com", "password123", config.RoleUser, "users/default.png")
		seed.LoadUser(appServer.DB, "user3", "user3@test.com", "password123", config.RoleUser, "users/default.png")
		seed.LoadUser(appServer.DB, "moderator1", "moderator1@test.com", "password123", config.RoleModerator, "users/moderator.png")
		seed.LoadUser(appServer.DB, "moderator2", "moderator2@test.com", "password123", config.RoleModerator, "users/moderator.png")

		// Some Composers
		csc := seed.ComposerSeedContext{
			DB:    appServer.DB,
			Paths: appServer.Path,
		}
		if err := seed.LoadComposer(csc,
			"Wolfgang Amadeus Mozart",
			"Classical period",
			"https://fr.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart",
			"../testauto/backend/resources/composers/Mozart.png",
		); err != nil {
			logger.DB.Fatal("Seed failed: %v", err)
		}

		if err := seed.LoadComposer(csc, "Ludwig van Beethoven",
			"Classical period",
			"https://fr.wikipedia.org/wiki/Ludwig_van_Beethoven",
			"../testauto/backend/resources/composers/Beethoven.png",
		); err != nil {
			logger.DB.Fatal("Seed failed: %v", err)
		}

		if err := seed.LoadComposer(csc, "Supertramp",
			"Rock gradual, Pop, Art Rock, Blues-rock",
			"https://fr.wikipedia.org/wiki/Supertramp",
			"../testauto/backend/resources/composers/Supertramp.png",
		); err != nil {
			logger.DB.Fatal("Seed failed: %v", err)
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
