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

	"backend/core/controllers"
	"backend/infrastructure/config"
	"backend/middlewares"

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
	// -------------------------------------------------------------------------------------------

	// Recovery middleware prevents server crashes on panic.
	// Instead of crashing, it returns HTTP 500 and keeps the server alive.
	r.Use(gin.Recovery())

	// Custom logger configuration:
	// Skip noisy endpoints (health checks, version)
	r.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{"/health", "/version"},
	}))

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

		api.POST("/auth/register", authCtrl.Register)                    //vitest
		api.POST("/auth/register/confirm", authCtrl.ConfirmRegistration) //vitest
		api.POST("/auth/register/resend", authCtrl.ResendRegistrationConfirmation)

		api.POST("/login", authCtrl.Login)

		api.POST("/password/forgot", authCtrl.ForgotPassword)
		api.POST("/password/reset", authCtrl.ResetPassword)

		// ---------------------------------------------------------------------------------------
		// Protected routes (authenticated users only)
		// ---------------------------------------------------------------------------------------
		protected := api.Group("/")
		protected.Use(middlewares.AuthMiddleware())
		{
			// -----------------------------------------------------------------------------------
			// User self-management (no ID needed)
			// -----------------------------------------------------------------------------------
			protected.GET("/me", userCtrl.GetProfile)
			protected.PUT("/me", userCtrl.UpdateProfile)
			protected.POST("/me/avatar", userCtrl.UploadAvatar)
			// protected.DELETE("/me/avatar", userCtrl.DeleteAvatar)

			// -----------------------------------------------------------------------------------
			// SCORES (Music scores)
			// -----------------------------------------------------------------------------------
			// Design strategy:
			// - GET  → simple queries (pagination, filters via query params)
			// - POST → complex searches (large payload, advanced filters)

			// Upload
			protected.POST("/scores/upload", scoreCtrl.CreateScore)

			// Search & listing
			protected.GET("/scores", scoreCtrl.GetScoresPage)
			protected.POST("/scores/search", scoreCtrl.GetScoresPage)

			// CRUD operations
			protected.GET("/scores/:id", scoreCtrl.GetScore)
			protected.PUT("/scores/:id", scoreCtrl.UpdateScore)
			protected.DELETE("/scores/:id", scoreCtrl.DeleteScore)

			// Partial update (annotations only)
			protected.PATCH("/scores/:id/annotations", scoreCtrl.UpdateAnnotations)

			// -----------------------------------------------------------------------------------
			// COMPOSERS
			// -----------------------------------------------------------------------------------
			protected.POST("/composers/upload", composerCtrl.CreateComposer)

			protected.GET("/composers", composerCtrl.GetComposersPage)
			protected.POST("/composers/search", composerCtrl.GetComposersPage)

			protected.GET("/composers/:id", composerCtrl.GetComposer)
			protected.PUT("/composers/:id", composerCtrl.UpdateComposer)
			protected.DELETE("/composers/:id", composerCtrl.DeleteComposer)

			protected.PUT("/composers/merge", composerCtrl.MergeComposers)

			// -----------------------------------------------------------------------------------
			// ADMIN ROUTES (restricted)
			// -----------------------------------------------------------------------------------
			adminRoutes := protected.Group("/")
			adminRoutes.Use(middlewares.AdminOnlyMiddleware())
			{
				adminRoutes.GET("/admin/users", userCtrl.AdmGetUsersPage)
				adminRoutes.GET("/admin/users/:id", userCtrl.AdmGetUser)
				adminRoutes.POST("/admin/users", userCtrl.AdmCreateUser)
				adminRoutes.PUT("/admin/users/:id", userCtrl.AdmUpdateUser)
				adminRoutes.DELETE("/admin/users/:id", userCtrl.AdmDeleteUser)

				if config.Config().AppEnv == "test" {
					fmt.Println("=================================")
					fmt.Println("BE CARE ROOT NOT ALLOWED IN PROD")
					fmt.Println("=================================")
					adminRoutes.GET("/test/reset-token/:email", authCtrl.AdmGetResetToken)
					adminRoutes.POST("/test/expire-token", authCtrl.AdmExpireToken)
				}
			}
		}
	}

	server.Router = r
}
