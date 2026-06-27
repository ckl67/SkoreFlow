package api

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"backend/core/models"
	"backend/core/services"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ===============================================================================================
// Server represents the main application entry point.
// Responsibility:
// - Hold shared dependencies (DB, services, router)
// - Initialize application components
// - Manage lifecycle (startup, shutdown)
//
// Architecture:
// - Services contain business logic and are owned by the Server
// - Controllers are HTTP adapters (Gin) and delegate to services
// - Services are reusable across interfaces (HTTP, CLI, workers)
//
// Notes:
// - Integrates a Python micro-service for PDF processing
// - Ensures proper lifecycle management of external processes
// ===============================================================================================

type Server struct {
	DB *gorm.DB

	sfPath *config.Paths

	authService     *services.AuthService
	userService     *services.UserService
	ScoreService    *services.ScoreService
	ComposerService *services.ComposerService

	Router    *gin.Engine
	Version   string
	MSProcess *os.Process // Reference to the Python micro-service process
}

// Setup initializes the server state and application components.
func (server *Server) Setup(version string, db *gorm.DB, paths *config.Paths) {
	server.sfPath = paths

	server.Version = version
	server.DB = db

	// 1. Initialize services with db and path injection
	server.authService = services.NewAuthService(db, paths)
	server.userService = services.NewUserService(db, paths)
	server.ScoreService = services.NewScoreService(db, paths)
	server.ComposerService = services.NewComposerService(db, paths)

	// 2. Database migrations (schema sync with models)
	if err := server.DB.AutoMigrate(&models.User{}, &models.Score{}, &models.Composer{}); err != nil {
		logger.DB.Error("(Setup) migration failed: %v", err)
	}

	// 3. Start Python micro-service
	server.StartMicroService(paths)

	// 4. Register API routes
	server.SetupRouter()
}

// StartMicroService launches the Python process responsible for PDF → PNG conversion.
// Behavior:
// - Spawns the process using Poetry to manage the virtual environment natively
// - Pipes stdout/stderr to the main server logs
// - Stores process reference for graceful shutdown
//
// Notes:
// - Prevents orphan/zombie processes by binding lifecycle to the server
func (server *Server) StartMicroService(paths *config.Paths) {
	msConfig := config.Config().MicroService

	// ----------------------------------------------------------------
	// MicroService absolute path
	// ----------------------------------------------------------------
	// Example of path construction:
	// root = /home/christian/SkoreFlow_Project/SkoreFlow/backend/micro-service
	root := paths.MSAbs

	// ----------------------------------------------------------------
	// Build paths dynamically
	// ----------------------------------------------------------------
	// We call the global 'poetry' executable instead of a hardcoded venv path.
	// scriptPath : /home/christian/SkoreFlow_Project/SkoreFlow/backend/micro-service/thumbnail-service/app.py
	poetryExe := "poetry"
	scriptPath := filepath.Join(root, msConfig.MsName, "app.py")

	// Optional: debug (can be removed later)
	logger.Server.Info("(StartMicroService) runner: %s", poetryExe)
	logger.Server.Info("(StartMicroService) script: %s", scriptPath)
	logger.Server.Info("(StartMicroService) script: %s run python %s", poetryExe, scriptPath)

	// Automatic detection/installation of Poetry by Go
	logger.Server.Info("(StartMicroService) Checking Python dependencies with Poetry...")

	// We’re setting up a ‘poetry install’ command to be run directly in the correct folder
	installCmd := exec.Command("poetry", "install", "--no-interaction", "--no-root")
	installCmd.Dir = root
	installCmd.Stdout = os.Stdout
	installCmd.Stderr = os.Stderr

	// Go runs the installation properly at start-up
	if err := installCmd.Run(); err != nil {
		logger.Server.Error("(StartMicroService) Failed to run poetry install: %v", err)
	}

	// ----------------------------------------------------------------
	// Create command
	// ----------------------------------------------------------------
	// Equivalent to running: poetry run python /path/to/thumbnail-service/app.py
	cmd := exec.Command(poetryExe, "run", "python", scriptPath)

	// CRITICAL for Poetry: Set the working directory to the micro-service root
	// so Poetry can automatically locate 'pyproject.toml' and 'poetry.lock'
	cmd.Dir = root

	// Inject environment variables into the process
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("MS_PORT=%d", msConfig.MsPort),
		fmt.Sprintf("MS_NAME=%s", msConfig.MsName),
	)

	// Forward logs to main process
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// ----------------------------------------------------------------
	// Start process
	// ----------------------------------------------------------------

	// ADD HERE: Configure SysProcAttr to create a process group (PGID)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		logger.Server.Error("(StartMicroService) Flask/Poetry startup error: %v", err)
		return
	}

	// Store process reference for shutdown handling
	server.MSProcess = cmd.Process

	logger.Server.Info(
		"(StartMicroService) micro-service [%s] running via Poetry (PID: %d)",
		msConfig.MsName,
		server.MSProcess.Pid,
	)
}

// ListenAndServe starts the HTTP server and manages graceful shutdown.
// Responsibilities:
// - Start HTTP listener in a non-blocking goroutine
// - Handle OS signals for graceful termination
// - Ensure external processes are properly stopped
func (server *Server) ListenAndServe(addr string) {
	srv := &http.Server{
		Addr:         addr,
		Handler:      server.Router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	// Start server asynchronously
	go func() {
		logger.Server.Info("(ListenAndServe) server listening on %v", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Server.Error("(ListenAndServe) listen error: %s", err)
		}
	}()

	// Wait for OS interrupt signal (SIGINT, SIGTERM)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Server.Info("(ListenAndServe) shutting down server...")

	// Stop micro-service if running
	if server.MSProcess != nil {
		logger.Server.Info("(ListenAndServe) stopping micro-service group (PID %d)...", server.MSProcess.Pid)

		// Instead of: _ = server.MSProcess.Signal(os.Interrupt)
		// We send SIGINT to the entire group (the minus sign '-' before the PID is the key)
		_ = syscall.Kill(-server.MSProcess.Pid, syscall.SIGINT)
	}

	logger.Server.Info("(ListenAndServe) server exited cleanly")
}
