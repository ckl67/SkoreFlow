package v1

import (
	"backend/internal/controllers"
	"backend/middlewares"

	"github.com/gin-gonic/gin"
)

// ==============================================
// Registration Flow:
// ==============================================
// See document backend/architecture.dio
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
// ------------------------------------------------
// The route : api.POST("/me/mail/confirm", userCtrl.ConfirmUpdateMail) is the following of
// 	the route protected.PUT("/me/mail", userCtrl.UpdateMail)
// 	However, we prefer use the public route because the process is :change mail  --> logout --> Link email later
// ==============================================

func RegisterAuthRoutes(rg *gin.RouterGroup, authCtrl *controllers.AuthController, userCtrl *controllers.UserController) {

	// public routes
	authGroup := rg.Group("/")
	{
		authGroup.POST("/auth/register", middlewares.RateLimiter(1, 5), authCtrl.Register) // vitest -->   req/sec, burst 5
		authGroup.POST("/auth/register/confirm", authCtrl.ConfirmRegistration)             // vitest
		authGroup.POST("/auth/register/resend", authCtrl.ResendRegistration)               // vitest
		authGroup.POST("/login", authCtrl.Login)                                           // vitest
		authGroup.POST("/logout", authCtrl.Logout)                                         // vitest
		authGroup.POST("/password/forgot", authCtrl.ForgotPassword)                        // vitest
		authGroup.POST("/password/reset", authCtrl.ResetPassword)                          // vitest
		authGroup.POST("/me/mail/confirm", userCtrl.ConfirmUpdateMail)                     // vitest
	}
}
