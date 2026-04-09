package api

import (
	"backend/core/models"
	"backend/core/services"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
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

	authService     *services.AuthService
	userService     *services.UserService
	SheetService    *services.SheetService
	ComposerService *services.ComposerService

	Router    *gin.Engine
	Version   string
	MSProcess *os.Process // Reference to the Python micro-service process
}

// Setup initializes the server state and application components.
func (server *Server) Setup(version string, db *gorm.DB) {
	server.Version = version
	server.DB = db

	// 1. Initialize services
	server.authService = services.NewAuthService(db)
	server.userService = services.NewUserService(db)
	server.SheetService = services.NewSheetService(db)
	server.ComposerService = services.NewComposerService(db)

	// 2. Database migrations (schema sync with models)
	if err := server.DB.AutoMigrate(&models.User{}, &models.Sheet{}, &models.Composer{}); err != nil {
		logger.DB.Error("(Setup) migration failed: %v", err)
	}

	// 3. Start Python micro-service
	server.StartMicroService()

	// 4. Register API routes
	server.SetupRouter()
}

// StartMicroService launches the Python process responsible for PDF → PNG conversion.
// Behavior:
// - Spawns the process with injected environment variables
// - Pipes stdout/stderr to the main server logs
// - Stores process reference for graceful shutdown
//
// Notes:
// - Prevents orphan/zombie processes by binding lifecycle to the server
func (server *Server) StartMicroService() {
	msConfig := config.Config().MicroService
	pythonExe := "../../micro-service/venv/bin/python3"
	scriptPath := "../../micro-service/thumbnail-service/app.py"

	cmd := exec.Command(pythonExe, scriptPath)

	// Inject environment variables into the process
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("MS_PORT=%d", msConfig.MsPort),
		fmt.Sprintf("MS_NAME=%s", msConfig.MsName),
	)

	// Forward logs to main process
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		logger.Server.Error("(StartMicroService) Flask startup error: %v", err)
		return
	}

	// Store process reference for shutdown handling
	server.MSProcess = cmd.Process
	logger.Server.Info("(StartMicroService) micro-service [%s] running (PID: %d)", msConfig.MsName, server.MSProcess.Pid)
}

// ListenAndServe starts the HTTP server and manages graceful shutdown.
// Responsibilities:
// - Configure global middlewares (logging, recovery, CORS)
// - Start HTTP listener in a non-blocking goroutine
// - Handle OS signals for graceful termination
// - Ensure external processes are properly stopped
func (server *Server) ListenAndServe(addr string) {
	// Base middlewares
	server.Router.Use(gin.Logger())
	server.Router.Use(gin.Recovery())

	// CORS configuration (required for cross-origin frontend)
	if origin := config.Config().CorsAllowedOrigins; origin != "" {
		server.Router.Use(cors.New(cors.Config{
			AllowOrigins:     []string{origin},
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}))
	}

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
		logger.Server.Info("(ListenAndServe) stopping micro-service (PID %d)...", server.MSProcess.Pid)
		_ = server.MSProcess.Signal(os.Interrupt)
	}

	logger.Server.Info("(ListenAndServe) server exited cleanly")
}
