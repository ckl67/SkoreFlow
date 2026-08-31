package main

import (
	"backend/api"
	"backend/infrastructure/logger"
	"backend/pkg/misc"
	"fmt"
)

// ===============================================================================================
// Version represents the application version, injected during build (pending).
// 	VERSION=$(shell git describe --tags --always)
//	COMMIT=$(shell git rev-parse --short HEAD)
//	BUILD_DATE=$(shell date -u +%Y-%m-%dT%H:%M:%SZ)
//	LDFLAGS=-ldflags="-X main.Version=$(VERSION) -X main.Commit=$(COMMIT) -X main.BuildDate=$(BUILD_DATE)"
// ===============================================================================================

var Version string = "Git version injection (pending)"
var Commit = "Commit (pending)"
var BuildDate = "Date (pending)"

// Main
func main() {
	// Logger initialization
	// Refer to logger/module.go for the list of available modules.

	// -------------------------------------------------------------------------------------------
	// --- WARNING: LOGS ARE DISPLAYED IN THE TERMINAL WINDOW WHERE THE SERVER IS RUNNING ---
	// -------------------------------------------------------------------------------------------

	// Initialization: Defining specific log levels per module
	logger.SetModuleLevel("main", "debug") // In debug, will also display the configuration used
	logger.SetModuleLevel("server", "debug")
	logger.SetModuleLevel("microservices", "info")
	logger.SetModuleLevel("login", "debug")
	logger.SetModuleLevel("user", "debug")
	logger.SetModuleLevel("score", "debug")
	logger.SetModuleLevel("composer", "info")
	logger.SetModuleLevel("db", "info")
	logger.SetModuleLevel("http", "info")
	logger.SetModuleLevel("api", "info")

	// Print the ASCII banner with the current version
	misc.PrintAsciiVersion(Version, Commit, BuildDate)

	fullVersion := fmt.Sprintf("%s (commit: %s) built at %s", Version, Commit, BuildDate)

	// Start the main application bootstrap
	api.Start(fullVersion)
}
