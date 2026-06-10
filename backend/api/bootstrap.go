package api

import (
	"backend/infrastructure/config"
	"backend/infrastructure/database"
	"backend/infrastructure/database/seed"
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
	seed.Load(appServer.DB, "admin", cfg.AdminEmail, cfg.AdminPassword, config.RoleAdmin, "users/admin.png")

	if config.Config().TestMode {
		seed.Load(appServer.DB, "user1", "user1@test.com", "password123", config.RoleUser, "users/default.png")
		seed.Load(appServer.DB, "user2", "user2@test.com", "password123", config.RoleUser, "users/default.png")
		seed.Load(appServer.DB, "user3", "user3@test.com", "password123", config.RoleUser, "users/default.png")
		seed.Load(appServer.DB, "moderator1", "moderator1@test.com", "password123", config.RoleModerator, "users/moderator.png")
		seed.Load(appServer.DB, "moderator2", "moderator2@test.com", "password123", config.RoleModerator, "users/moderator.png")
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
