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
	// if cfg.Backend_Dev_Mode == "true" {
	cfg.LogSafe()
	//	}

	// 1. Infrastructure Setup -- Database Connection
	db := database.ConnectDB(cfg)

	// 2. Application Core Setup - Server instance (local scope, not global)
	appServer := Server{}
	appServer.Setup(version, db)

	// 3. Database Seeding
	seed.Load(appServer.DB, cfg.AdminEmail, cfg.AdminPassword)

	// 4. Port Configuration
	// Go Listening [Nginx / Reverse Proxy]
	addr := cfg.BackendListenAddress
	if addr == "" {
		addr = "0.0.0.0:8080"
	}

	// 5. Execution
	// We call ListenAndServe (or Serve) to show this is where the process blocks.
	appServer.ListenAndServe(addr)
}
