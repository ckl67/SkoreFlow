package api

// ===============================================================================================
// APPLICATION ARCHITECTURE
// ===============================================================================================
// Layer              | Component      | Business Role
// -------------------|----------------|----------------------------------------------------------
// TRANSPORT          | controllers/   | Handles HTTP requests, extracts files and JSON data.
//                    | forms/         | Delegates validation/binding to forms.
//                    |                | No business logic, no DB access.
//                    |                |
// ORCHESTRATION      | services/       | Business "Brain". Aware of the models.
//                    |                | Coordinates storage, thumbnails, and business rules.
//                    |                |
// PERSISTENCE        | models/        | Handles database only (SQL via GORM).
//                    |                | Represents the pure data structure.
//                    |                |
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ===============================================================================================
//
// PIPELINE
//
//
//		HTTP REQUEST
//		   ↓
//		ROUTER
//		   ↓
//		CONTROLLER (transport)
//		   ↓
//		FORM (validation)
//		↓
//		SERVICE (business logic)
//		   ↓
//		MODEL (DB)
//		↓
//		RESPONSE JSON
//
// ===============================================================================================

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"backend/core/controllers"
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"backend/middlewares"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter initializes all HTTP routes and middleware for the API server.
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
	// 3. Global middleware
	// --> Mandatory to declare all the Middleware here !
	// -------------------------------------------------------------------------------------------

	// Base middlewares

	// CORS configuration (required for cross-origin frontend) --> see document cors.md
	// Parameter Purpose
	//  - AllowOrigins Lists the domains permitted to contact the API (e.g., http://localhost:5173).
	//  - AllowMethods Defines which HTTP verbs are allowed (GET, POST, etc.).
	//  - AllowHeaders Permits specific headers like Authorization (essential for JWT tokens).
	//  - AllowCredentials Allows the exchange of cookies or authentication headers between front and back.
	//  - MaxAge Tells the browser how long (12h) to cache the "Preflight" response. 3. Configuration via Environment Variables
	//

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
	logger.Server.Info("CORS origin READING = %q", origins)

	// Gin Logger
	// r.Use(gin.Logger()) — The Logger
	// This middleware is used to log requests arriving at your server.
	// It writes log entries to the console for each interaction.
	// It displays the time, the HTTP status (200, 404, 500…), and the response time

	// r.Use(gin.Recovery()) — The Life Jacket
	// This middleware is used to intercept panics (fatal errors in Go) to prevent your server from shutting down completely.

	// r.Use(gin.Logger()): Enables the default logger on all routes.
	// r.Use(gin.LoggerWithConfig(...)): Enables a second logger on all routes (which duplicates the first one), except for /health and /version.

	// r.Use(gin.Logger()) <-- has been removed otherwise we will have double logs
	//	POST /api/login
	//	POST /api/login

	// Custom logger configuration:
	// Skip noisy endpoints (health checks, version)
	r.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{"/health", "/version"},
	}))
	r.Use(gin.Recovery())

	// -------------------------------------------------------------------------------------------
	// 4. Controller instantiation
	// -------------------------------------------------------------------------------------------
	// Controllers act as HTTP adapters → they depend on services
	userCtrl := controllers.NewUserController(server.userService)
	authCtrl := controllers.NewAuthController(server.authService)
	scoreCtrl := controllers.NewScoreController(server.ScoreService)
	composerCtrl := controllers.NewComposerController(server.ComposerService)

	// -------------------------------------------------------------------------------------------
	// 5. Public system endpoints
	// -------------------------------------------------------------------------------------------

	// Health check (used by monitoring tools)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "OK"})
	})

	// API version
	r.GET("/version", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"version": server.Version})
	})

	// Root endpoint
	r.GET("/api", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "API is running"})
	})

	// -------------------------------------------------------------------------------------------
	// 6. API grouping
	// -------------------------------------------------------------------------------------------
	api := r.Group("/api")
	// v1 := api.Group("/v1")
	{
		// ---------------------------------------------------------------------------------------
		// Public authentication routes
		// ---------------------------------------------------------------------------------------
		// v1.POST("/register", authCtrl.Register)

		// ==============================================
		// Registration Flow:
		// ------------------
		// 1. User POSTs /register {username, email, password}
		//    → creates user with IsVerified=false
		//    → backend sends confirmation email with frontend link:
		//       https://frontend/register/confirm?token=abc123
		// 2. User clicks frontend link
		//    → frontend calls POST /register/confirm {token}
		//    → backend validates token and sets IsVerified=true
		// 3. Optional: POST /register/request_confirmation {email}
		//    → re-sends confirmation email if user did not receive it
		//		Remark : Do not confuse user's IsVerified with composer's IsVerified, the second one indicate that it has been confirmed by moderator or admin
		//
		// Login Flow:
		// -----------
		// POST /login {email, password}
		//    → standard login, returns token/session
		//
		// Password Reset Flow:
		// --------------------
		// 1. POST /password/forgot {email}
		//    → backend generates token, sends frontend link:
		//       https://frontend/reset-password?token=abc123
		// 2. Frontend displays reset form (new password / confirm)
		//    → POST /password/reset {token, password}
		//    → backend validates token and updates password
		// ==============================================

		api.POST("/auth/register", middlewares.RateLimiter(1, 5), authCtrl.Register) // vitest -->   req/sec, burst 5
		api.POST("/auth/register/confirm", authCtrl.ConfirmRegistration)             // vitest
		api.POST("/auth/register/resend", authCtrl.ResendRegistration)               // vitest
		api.POST("/login", authCtrl.Login)                                           // vitest
		api.POST("/logout", authCtrl.Logout)                                         // vitest
		api.POST("/password/forgot", authCtrl.ForgotPassword)                        // vitest
		api.POST("/password/reset", authCtrl.ResetPassword)                          // vitest

		// The route : api.POST("/me/mail/confirm", userCtrl.ConfirmUpdateMail) is the following of the route protected.PUT("/me/mail", userCtrl.UpdateMail)
		// However, we prefer use the route with no login route, because the process is : change mail  --> logout --> Link email later
		api.POST("/me/mail/confirm", userCtrl.ConfirmUpdateMail) // vitest

		// ---------------------------------------------------------------------------------------
		// Demo
		// ---------------------------------------------------------------------------------------
		api.GET("/demo/composers/:id/picture", composerCtrl.GetComposerPicture)
		api.HEAD("/demo/composers/:id/picture", composerCtrl.GetComposerPicture)
		//api.GET("/demo/composers/:id/thumbnail", composerCtrl.ResetPassword)

		// ---------------------------------------------------------------------------------------
		// Protected routes (authenticated users only)
		// ---------------------------------------------------------------------------------------
		protected := api.Group("/")
		protected.Use(middlewares.AuthMiddleware())
		{
			// -----------------------------------------------------------------------------------
			// User self-management
			// -----------------------------------------------------------------------------------
			// Return Json
			protected.GET("/me", userCtrl.GetProfile)             // vitest
			protected.PUT("/me/profile", userCtrl.UpdateProfile)  // vitest
			protected.PUT("/me/mail", userCtrl.UpdateMail)        // vitest
			protected.POST("/me/avatar", userCtrl.UploadAvatar)   // vitest
			protected.DELETE("/me/avatar", userCtrl.DeleteAvatar) // vitest

			// Return Data
			protected.GET("/me/avatar", userCtrl.GetAvatar)  //
			protected.HEAD("/me/avatar", userCtrl.GetAvatar) //

			// -----------------------------------------------------------------------------------
			// SCORES (Music scores)
			// -----------------------------------------------------------------------------------
			// Design strategy:
			// - GET  → simple queries (pagination, filters via query params)
			// - POST → complex searches (large payload, advanced filters)

			// Upload
			protected.POST("/scores", scoreCtrl.CreateScore)

			// Search & listing
			protected.GET("/scores", scoreCtrl.GetScoresPage)

			// CRUD operations
			protected.GET("/scores/:id", scoreCtrl.GetScore)
			protected.PUT("/scores/:id", scoreCtrl.UpdateScore)
			protected.DELETE("/scores/:id", scoreCtrl.DeleteScore)

			// Partial update (annotations only)
			protected.PATCH("/scores/:id/annotations", scoreCtrl.UpdateAnnotations)

			// -----------------------------------------------------------------------------------
			// COMPOSERS
			// -----------------------------------------------------------------------------------

			// Return Json
			protected.POST("/composers", composerCtrl.CreateComposer) // vitest

			protected.GET("/composers", composerCtrl.GetComposersPage) // vitest
			protected.GET("/composers/:id", composerCtrl.GetComposer)  // vitest

			protected.PUT("/composers/:id", composerCtrl.UpdateComposer) // vitest
			protected.DELETE("/composers/:id", composerCtrl.DeleteComposer)

			protected.PUT("/composers/merge", composerCtrl.MergeComposers)

			// Return Data
			protected.GET("/composers/:id/picture", composerCtrl.GetComposerPicture)
			protected.HEAD("/composers/:id/picture", composerCtrl.GetComposerPicture)

			// -----------------------------------------------------------------------------------
			// ADMIN ROUTES (restricted)
			// -----------------------------------------------------------------------------------
			adminRoutes := protected.Group("/")
			adminRoutes.Use(middlewares.AdminOnlyMiddleware())
			{
				// Return Json
				adminRoutes.GET("/admin/users", userCtrl.AdminGetUsersPage)      // vitest
				adminRoutes.GET("/admin/users/:id", userCtrl.AdminGetUser)       // vitest
				adminRoutes.POST("/admin/users", userCtrl.AdminCreateUser)       // vitest
				adminRoutes.PUT("/admin/users/:id", userCtrl.AdminUpdateUser)    // vitest
				adminRoutes.DELETE("/admin/users/:id", userCtrl.AdminDeleteUser) // vitest

				// Only for vitest
				if config.Config().TestMode {
					fmt.Println("=================================")
					fmt.Println("BE CARE ROOT NOT ALLOWED IN PROD")
					fmt.Println("     ONLY IN TEST MODE ")
					fmt.Println("		- /test/reset-token/:email")
					fmt.Println("		- /test/expire-token")
					adminRoutes.GET("/test/reset-token/:email", authCtrl.AdmGetResetToken) // vitest : Currently NOT USED
					adminRoutes.POST("/test/expire-token", authCtrl.AdmExpireToken)        // vitest - used in auth.ts
					fmt.Println("=================================")
				}

				// Return Data
				protected.GET("/admin/users/:id/avatar", userCtrl.AdminGetAvatar)

			}
		}
	}

	// We Set r to the "server.Router"
	server.Router = r
}
