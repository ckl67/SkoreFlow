package v1

import (
	"backend/infrastructure/config"
	"backend/internal/controllers"
	"backend/middlewares"
	"fmt"

	"github.com/gin-gonic/gin"
)

func RegisterAdminRoutes(rg *gin.RouterGroup, authCtrl *controllers.AuthController, userCtrl *controllers.UserController) {

	// ADMIN ROUTES (restricted)
	protected := rg.Group("/")
	protected.Use(middlewares.AuthMiddleware())

	adminRoutes := protected.Group("/admin")
	adminRoutes.Use(middlewares.AdminOnlyMiddleware())
	{
		// Return Json
		adminRoutes.GET("/users", userCtrl.AdminGetUsersPage)      // vitest
		adminRoutes.GET("/users/:id", userCtrl.AdminGetUser)       // vitest
		adminRoutes.POST("/users", userCtrl.AdminCreateUser)       // vitest
		adminRoutes.PUT("/users/:id", userCtrl.AdminUpdateUser)    // vitest
		adminRoutes.DELETE("/users/:id", userCtrl.AdminDeleteUser) // vitest

		// Only for TestMode
		if config.Config().AppEnv == "development" {
			fmt.Println("=================================")
			fmt.Println("BE CARE SPECIAL ROOTS ARE OPEN ")
			fmt.Println("=================================")

			adminRoutes.GET("/test/auth/token/reset/:email", authCtrl.AdmGetResetToken) // vitest : Currently NOT USED
			adminRoutes.POST("/test/auth/token/force-expire", authCtrl.AdmExpireToken)  // vitest - used in auth.ts
			adminRoutes.POST("/test/auth/smtp/enable", authCtrl.AdmEnableSmtp)
			adminRoutes.POST("/test/auth/smtp/disable", authCtrl.AdmDisableSmtp)
		}

		// Return Data
		adminRoutes.GET("/users/:id/avatar", userCtrl.AdminGetAvatar)

	}
}
