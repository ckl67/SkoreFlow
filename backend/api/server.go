package api

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/core/models"
	"backend/core/services"
	"backend/infrastructure/config"
	"backend/infrastructure/health"
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
// ===============================================================================================

type Server struct {
	DB *gorm.DB

	Path *config.Paths

	authService     *services.AuthService
	userService     *services.UserService
	ScoreService    *services.ScoreService
	ComposerService *services.ComposerService

	Router  *gin.Engine
	Version string
}

// Setup initializes the server state and application components.
func (server *Server) Setup(version string, db *gorm.DB, paths *config.Paths) {
	server.Path = paths

	server.Version = version
	server.DB = db

	cfg := config.Config()
	// ----------------------------------------------------
	// 1. Microservice healthcheck (CRITICAL DEPENDENCY)
	// ----------------------------------------------------

	healthURL := fmt.Sprintf("%s/health", cfg.MicroService.ThumbnailServiceURL)

	for i := 0; i < 5; i++ {
		err := health.CheckThumbnailService(healthURL)
		if err == nil {
			logger.Server.Info("microservice/thumbnail ready")
			break
		}

		logger.Server.Warn("microservice/thumbnail not ready, retrying... (%d/5)", i+1)
		time.Sleep(2 * time.Second)
	}

	err := health.CheckThumbnailService(healthURL)
	if err != nil {
		logger.Server.Error("(Setup) microservice/thumbnail not available: %v", err)
		// Option A: continue anyway
		// Option B: panic (Not recommended)
		// panic(err)
	} else {
		logger.Server.Info("(Setup) microservice/thumbnail is healthy")
	}

	// ----------------------------------------------------
	// 2. Initialize services with db and path injection
	// ----------------------------------------------------
	server.authService = services.NewAuthService(db, paths)
	server.userService = services.NewUserService(db, paths)
	server.ScoreService = services.NewScoreService(db, paths)
	server.ComposerService = services.NewComposerService(db, paths)

	// ----------------------------------------------------
	// 3. Database migrations (schema sync with models)
	// ----------------------------------------------------
	if err := server.DB.AutoMigrate(&models.User{}, &models.Score{}, &models.Composer{}); err != nil {
		logger.DB.Error("(Setup) migration failed: %v", err)
	}

	// ----------------------------------------------------
	// 4. Register API routes
	// ----------------------------------------------------
	server.SetupRouter()
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

	logger.Server.Info("(ListenAndServe) server exited cleanly")
}
