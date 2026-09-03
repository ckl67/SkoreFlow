package v2

// cspell:ignore gonic

// In Go, a pair of orphaned curly brackets (without an `if`, `for` or `func`)
// creates a local variable scope and serves as a visual convention.

// Design strategy:
// - GET  → simple queries (pagination, filters via query params)
// - POST → complex searches (large payload, advanced filters)

import (
	v1 "backend/api/routes/v1"
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

// Global registration of all V1 routes
func RegisterRoutes(
	rg *gin.RouterGroup,
	authCtrl *controllers.AuthController,
	userCtrl *controllers.UserController,
	composerCtrl *controllers.ComposerController,
	scoreCtrl *controllers.ScoreController,
	serverVersion string,
) {

	// NEW implementation specific to V2
	RegisterHealthRoutes(rg, serverVersion)

	// Direct REUSE of V1 modules that have NOT changed
	// Demo routes
	v1.RegisterDemoRoutes(rg, composerCtrl, scoreCtrl)

	// Authentication routes (public)
	v1.RegisterAuthRoutes(rg, authCtrl, userCtrl)

	// User routes (authenticated users only)
	v1.RegisterUserRoutes(rg, userCtrl)

	// Composer Routes (authenticated users only)
	v1.RegisterComposerRoutes(rg, composerCtrl)

	// Score Routes (authenticated users only)
	v1.RegisterScoreRoutes(rg, scoreCtrl)

	// Admin Routes (admin users only)
	v1.RegisterAdminRoutes(rg, authCtrl, userCtrl)

}
