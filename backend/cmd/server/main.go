package main

import (
	"backend/api"
	"backend/infrastructure/logger"
	"backend/pkg/misc"
)

// ===============================================================================================
// Version represents the application version, injected during build (pending).
// Ref :
//
//	go build -ldflags="-X main.Version=$(git describe --tags --always)" -o build/sf-backend main.go
//	go run -ldflags="-X main.Version=$(git describe --tags --always)" main.go
// ===============================================================================================

var Version string = "Git version injection (pending)"

// Main
func main() {
	// Logger initialization
	// Refer to logger/module.go for the list of available modules.

	// -------------------------------------------------------------------------------------------
	// --- WARNING: LOGS ARE DISPLAYED IN THE TERMINAL WINDOW WHERE THE SERVER IS RUNNING ---
	// -------------------------------------------------------------------------------------------

	// Initialization: Defining specific log levels per module
	logger.SetModuleLevel("main", "debug") // In debug, will also display the configuration used
	logger.SetModuleLevel("server", "info")
	logger.SetModuleLevel("login", "info")
	logger.SetModuleLevel("user", "info")
	logger.SetModuleLevel("sheet", "info")
	logger.SetModuleLevel("composer", "info")

	// Print the ASCII banner with the current version
	misc.PrintAsciiVersion(Version)

	// Start the main application bootstrap
	api.Start(Version)
}
