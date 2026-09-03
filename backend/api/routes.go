// cspell:ignore GORM gonic  apiv
package api

// ===============================================================================================
// PIPELINE
// ===============================================================================================
//	HTTP REQUEST ->	ROUTER -> CONTROLLER -> FORM (validation) -> SERVICE (business logic) -> MODEL (DB) ->  DTO -> RESPONSE JSON
// ===============================================================================================
// APPLICATION ARCHITECTURE
// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// TRANSPORT          | controllers/   | Handles HTTP requests, extracts files and JSON data. With
//                    | forms/         |   - Delegates validation/binding to forms.
//                    | dto/           |   - Data Output Control
//                    |                |
// ORCHESTRATION      | services/      | Business "Brain". Aware of the models.
//                    |                | Coordinates storage, thumbnails, and business rules.
//                    |                |
// PERSISTENCE        | models/        | Handles database only (SQL via GORM).
//                    |                | Represents the pure data structure.
//                    |                |
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ===============================================================================================
// FOR DEBUGGING
// ===============================================================================================
// Gin never re-executes these lines.
// SET the Breakpoints in the controllers !
// ===============================================================================================

import (
	"strings"
	"time"

	v1 "backend/api/routes/v1"
	v2 "backend/api/routes/v2"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/internal/controllers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func (server *Server) SetupRouter() {
	// -------------------------------------------------------------------------------------------
	// 1. Gin mode configuration
	// -------------------------------------------------------------------------------------------
	// DebugMode   → verbose logs, useful during development
	// ReleaseMode → optimized, minimal logs (recommended for production)
	// TestMode    → silent, used for unit testing
	gin.SetMode(gin.ReleaseMode)

	// -------------------------------------------------------------------------------------------
	// 2. Router initialization
	// -------------------------------------------------------------------------------------------
	r := gin.New()

	// -------------------------------------------------------------------------------------------
	// 3. Global middleware --> Mandatory to declare all the Middleware here !
	// -------------------------------------------------------------------------------------------
	// Base middlewares
	// CORS configuration (required for cross-origin frontend) --> see document cors.md
	// Parameter Purpose
	//  - AllowOrigins : List of browser allowed to call the backend (e.g., http://localhost:5173).
	//  - AllowMethods Defines which HTTP verbs are allowed (GET, POST, etc.).
	//  - AllowHeaders Permits specific headers like Authorization (essential for JWT tokens).
	//  - AllowCredentials Allows the exchange of cookies or authentication headers between front and back.
	//  - MaxAge Tells the browser how long (12h) to cache the "Preflight" response.

	rawOrigins := strings.Split(config.Config().Frontend.CorsAllowedOrigins, ",")

	origins := make([]string, 0, len(rawOrigins))
	for _, origin := range rawOrigins {
		origins = append(origins, strings.TrimSpace(origin))
	}

	corsMiddleware := cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})

	r.Use(corsMiddleware)
	logger.Server.Info("CORS origin = %q", origins)

	// -------------------------------------------------------------------------------------------
	// 4. Gin Logger
	// -------------------------------------------------------------------------------------------
	// Custom logger configuration (Only one to avoid double logs !)
	// Skip noisy endpoints (health checks, version)
	r.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{"/api/health", "/api/version"},
	}))

	// r.Use(gin.Recovery()) — The Life Jacket
	// This middleware is used to intercept panics (fatal errors in Go) to prevent your server from shutting down completely.
	r.Use(gin.Recovery())

	// -------------------------------------------------------------------------------------------
	// 5. Controller instantiation
	// -------------------------------------------------------------------------------------------
	// Controllers act as HTTP adapters → they depend on services
	userCtrl := controllers.NewUserController(server.userService)
	authCtrl := controllers.NewAuthController(server.authService)
	composerCtrl := controllers.NewComposerController(server.composerService)
	scoreCtrl := controllers.NewScoreController(server.scoreService)

	// -------------------------------------------------------------------------------------------
	// 6. API grouping (Versioning)
	// -------------------------------------------------------------------------------------------
	apiv1 := r.Group("/api/v1")
	v1.RegisterRoutes(apiv1, authCtrl, userCtrl, composerCtrl, scoreCtrl, server.Version)

	apiv2 := r.Group("/api/v2")
	v2.RegisterRoutes(apiv2, authCtrl, userCtrl, composerCtrl, scoreCtrl, server.Version)

	// We Set r to the "server.Router"
	server.Router = r
}
