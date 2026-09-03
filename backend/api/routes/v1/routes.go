// cspell:ignore gonic
package v1

// In Go, a pair of orphaned curly brackets (without an `if`, `for` or `func`)
// creates a local variable scope and serves as a visual convention.

// Design strategy:
// - GET  → simple queries (pagination, filters via query params)
// - POST → complex searches (large payload, advanced filters)

import (
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

	// Public endpoints
	RegisterHealthRoutes(rg, serverVersion)

	// Demo routes
	RegisterDemoRoutes(rg, composerCtrl, scoreCtrl)

	// Authentication routes (public)
	RegisterAuthRoutes(rg, authCtrl, userCtrl)

	// User routes (authenticated users only)
	RegisterUserRoutes(rg, userCtrl)

	// Composer Routes (authenticated users only)
	RegisterComposerRoutes(rg, composerCtrl)

	// Score Routes (authenticated users only)
	RegisterScoreRoutes(rg, scoreCtrl)

	// Admin Routes (admin users only)
	RegisterAdminRoutes(rg, authCtrl, userCtrl)
}
