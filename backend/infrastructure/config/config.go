// cspell:ignore Autorized GORM Seedata golobby

package config

import (
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	"backend/infrastructure/logger"

	"github.com/golobby/config/v3"
	"github.com/golobby/config/v3/pkg/feeder"
)

// Configuration loading flow handled by github.com/golobby/config/v3
// 1. NewConfig() initializes default values
// 2. DotEnv feeder loads values from .env file
// 3. Env feeder overrides with system environment variables
// 	Do NOT mix os.Getenv() with golobby/config,

// ------------------------------
// SMTP Configuration : sending emails (password reset, notifications, etc.)
// ------------------------------
type SmtpConfig struct {
	Enabled        bool   `env:"SMTP_ENABLED"` // Even bool must be considered as string
	From           string `env:"SMTP_FROM"`
	HostServerAddr string `env:"SMTP_HOST"`
	HostServerPort int    `env:"SMTP_PORT"`
	Username       string `env:"SMTP_USERNAME"`
	PasswordBase64 string `env:"SMTP_PASSWORD_BASE64"` // store it base64 encoded for safety in config parsing
}

// ------------------------------
// Database Configuration : Connection parameters for the database layer (GORM)
// ------------------------------
type DatabaseConfig struct {
	Driver   string `env:"DB_DRIVER"` // e.g. sqlite, postgres, mysql
	Host     string `env:"DB_HOST"`
	User     string `env:"DB_USER"`
	Password string `env:"DB_PASSWORD"`
	Name     string `env:"DB_NAME"`
	Port     int    `env:"DB_PORT"`
}

// ------------------------------
// Microservices Configuration : For internal services (e.g. thumbnail generation)
// ------------------------------
type MicroServicesConfig struct {
	ThumbnailServiceURL string `env:"THUMBNAIL_SERVICE_URL"`
}

// ------------------------------
// Frontend Configuration
// ------------------------------
type FrontendConfig struct {
	Origin                string `env:"FRONTEND_ORIGIN"`                   // e.g. http://localhost:5173
	ResetPasswordPath     string `env:"FRONTEND_RESET_PASSWORD_PATH"`      // e.g. /reset/password
	RegisterConfirmPath   string `env:"FRONTEND_REGISTER_CONFIRM_PATH"`    // e.g. /register/confirm
	UpdateMailConfirmPath string `env:"FRONTEND_UPDATE_MAIL_CONFIRM_PATH"` // e.g. /mail/confirm
	CorsAllowedOrigins    string `env:"CORS_ALLOWED_ORIGINS"`              // Allowed origins for CORS e.g. http://localhost:5173,https://app.skoreflow.com
}

// ------------------------------
// DevelopmentConfig
// Everything that describes how the application starts up in Development mode
// ------------------------------
type DevelopmentConfig struct {
	SeedData                bool `env:"SEED_DATA"`                 // Populate test data in the data base
	ExposeRegistrationToken bool `env:"EXPOSE_REGISTRATION_TOKEN"` // Return the confirmation token in the API response
}

// ------------------------------
// Paths Configuration
// ------------------------------
type PathsConfig struct {
	ProjectRoot string `env:"PROJECT_ROOT"` //	PROJECT_ROOT=/app or PROJECT_ROOT=/home/<linux user>/SkoreFlow_Project/SkoreFlow/backend
	DataRoot    string `env:"DATA_ROOT"`
}

// ------------------------------
// Admin Configuration
// ------------------------------
type AdminConfig struct {
	Email    string `env:"ADMIN_EMAIL"`
	Password string `env:"ADMIN_PASSWORD"`
}

// ------------------------------
// SecurityConfig
// ------------------------------
type SecurityConfig struct {
	ProtectionLevel string `env:"PROTECTION_LEVEL"` // none, basic, full.
}

// ------------------------------
// AuthenticationConfig
// ------------------------------
type AuthenticationConfig struct {
	ApiSecret                 string `env:"API_SECRET"`
	ExpirationDays            int    `env:"EXPIRATION_DAYS"`
	JwtLifetime               int    `env:"JWT_LIFE_TIME"`
	ResetTokenLifetime        int    `env:"RESET_TOKEN_LIFE_TIME"`
	ConfirmationTokenLifetime int    `env:"CONFIRMATION_TOKEN_LIFE_TIME"`
}

// ============================================================================================================
// Backend Global Server Configuration Central struct holding ALL configuration used across the app
// ============================================================================================================
type ServerConfig struct {
	AppEnv               string `env:"APP_ENV"`                // development, production
	BackendListenAddress string `env:"BACKEND_LISTEN_ADDRESS"` // e.g. : 0.0.0.0:8080

	// -----------------------------------------------

	DevelopmentRuntime DevelopmentConfig
	Security           SecurityConfig
	Paths              PathsConfig
	Admin              AdminConfig
	Authentication     AuthenticationConfig

	Database      DatabaseConfig
	Smtp          SmtpConfig
	MicroServices MicroServicesConfig
	Frontend      FrontendConfig
}

// Config Builder
// Builder pattern used to configure how config is loaded
type configBuilder struct {
	dotenvFile           string
	errorOnMissingDotenv bool
}

// Singleton Pattern
// sync.Once guarantees that configuration is initialized ONLY ONCE even in concurrent environments.
// This avoids: - duplicated loads - race conditions - inconsistent config states
var (
	serverConfig ServerConfig
	configOnce   sync.Once
)

// Safe Logging (⚠️ NOT production-safe)
// Use ONLY in development or test mode.
func (c ServerConfig) LogSafe() {
	fmt.Printf("-------------------------------------------------\n")
	fmt.Printf("------------- BACKEND SERVER CONFIG -------------\n")
	fmt.Printf("-------------------------------------------------\n")

	fmt.Printf("General\n")
	fmt.Printf("  - Environment Mode (production/development) - (AppEnv) : %s\n", c.AppEnv)

	if c.AppEnv == "development" {

		fmt.Printf("  - Autorized Address (BackendListenAddress) : %s\n", c.BackendListenAddress)

		fmt.Printf("Development Runtime\n")
		fmt.Printf("  - Populate test data in the data base (Seedata) : %t\n", c.DevelopmentRuntime.SeedData)
		fmt.Printf("  - Registration token will be exposed in the HTTP response (ExposeRegistrationToken) : %t\n", c.DevelopmentRuntime.ExposeRegistrationToken)

		fmt.Printf("Security\n")
		fmt.Printf("    Protection Level (none/basic/full) :%s\n", c.Security.ProtectionLevel)

		fmt.Printf("Paths\n")
		fmt.Printf("  ProjectRoot: %s\n", c.Paths.ProjectRoot)
		fmt.Printf("  DataRoot   : %s\n", c.Paths.DataRoot)

		fmt.Printf("Admin\n")
		fmt.Printf("  - Email): %s\n", c.Admin.Email)
		fmt.Printf("  - Password): %s\n", c.Admin.Password) // ❌ sensitive

		fmt.Printf("Authentication\n")
		fmt.Printf("  - ApiSecret: %s\n", c.Authentication.ApiSecret) // ❌ sensitive
		fmt.Printf("  - ExpirationDays: %d\n", c.Authentication.ExpirationDays)
		fmt.Printf("  - JwtLifetime: %d\n", c.Authentication.JwtLifetime)
		fmt.Printf("  - ResetTokenLifetime: %d\n", c.Authentication.ResetTokenLifetime)
		fmt.Printf("  - ConfirmationTokenLifetime: %d\n", c.Authentication.ConfirmationTokenLifetime)

		fmt.Printf("Database\n")
		fmt.Printf("  Driver: %s\n", c.Database.Driver)
		fmt.Printf("  Host: %s\n", c.Database.Host)
		fmt.Printf("  User: %s\n", c.Database.User)
		fmt.Printf("  Password: %s\n", c.Database.Password) // ❌ sensitive
		fmt.Printf("  Name: %s\n", c.Database.Name)
		fmt.Printf("  Port: %d\n", c.Database.Port)

		fmt.Printf("SMTP\n")
		fmt.Printf("  Enabled: %t\n", c.Smtp.Enabled)
		fmt.Printf("  From: %s\n", c.Smtp.From)
		fmt.Printf("  Host: %s\n", c.Smtp.HostServerAddr)
		fmt.Printf("  Port: %d\n", c.Smtp.HostServerPort)
		fmt.Printf("  Username: %s\n", c.Smtp.Username)
		fmt.Printf("  Password: %s\n", c.Smtp.PasswordBase64) // ❌ sensitive
		fmt.Printf("  ==> In case MailPit is used you can access to its interface via local interface : http://localhost:8025 \n")

		fmt.Printf("MicroServices\n")
		fmt.Printf("  ThumbnailServiceURL: %s\n", c.MicroServices.ThumbnailServiceURL)

		fmt.Printf("Frontend\n")
		fmt.Printf("  Origin: %s\n", c.Frontend.Origin)
		fmt.Printf("  ResetPasswordPath: %s\n", c.Frontend.ResetPasswordPath)
		fmt.Printf("  RegisterConfirmPath: %s\n", c.Frontend.RegisterConfirmPath)
		fmt.Printf("  UpdateMailConfirmPath: %s\n", c.Frontend.UpdateMailConfirmPath)
		fmt.Printf("  CORS Origins: %s\n", c.Frontend.CorsAllowedOrigins)

		// Help to setup the ProjectRoot
		fmt.Printf("Help to setup the Project Root Directory  \n")
		cwd, err := os.Getwd()
		if err != nil {
			logger.Main.Error("   Cannot get current directory: %v\n", err)
		} else {
			fmt.Printf("   Current working directory: %s\n", cwd)
		}

		fmt.Printf("   ProjectRoot              : %s\n", c.Paths.ProjectRoot)

	}

	fmt.Printf("-----------------------------------------\n")

}

// Builder Entry Point
func ConfigBuilder() configBuilder {
	return configBuilder{}
}

// Specify a custom .env file
func (b configBuilder) WithDotenvFile(file string) configBuilder {
	b.dotenvFile = file
	return b
}

// Enable panic if .env file is missing
func (b configBuilder) PanicOnMissingDotenv(status bool) configBuilder {
	b.errorOnMissingDotenv = status
	return b
}

// Global Access (Singleton)

// This is the ONLY entry point used across the application.
// Guarantees a single initialized configuration.
func Config() ServerConfig {
	configOnce.Do(func() {
		fmt.Printf("Loading configuration...\n")
		serverConfig = ConfigBuilder().Build()
	})
	return serverConfig
}

// Build Configuration

// Loads configuration using:
// - default values
// - .env file
// - environment variables (override priority)
func (b configBuilder) Build() ServerConfig {
	// Read Configuration via initialization
	conf := NewConfig()

	// Read Configuration via .env file
	// from the working directory
	dotenvFile := ".env"
	if b.dotenvFile != "" {
		dotenvFile = b.dotenvFile
	}
	dotenvFeeder := feeder.DotEnv{Path: dotenvFile}
	logger.Main.Debug("Looking for .env in: %s", dotenvFile)

	// Read Configuration via environment linux variables
	envFeeder := feeder.Env{}

	// Order
	err := config.New().
		AddStruct(&conf).        // Read Struct
		AddFeeder(dotenvFeeder). // Read file .env
		AddFeeder(envFeeder).    // Read Linux environment variables
		Feed()                   // Feed tge structure !
	if err != nil {
		if strings.Contains(err.Error(), "no such file") {
			if b.errorOnMissingDotenv {
				log.Fatalf("error: dotenv file %s not found", dotenvFile)
			}

			// fallback to environment variables only
			cfg := config.New().
				AddStruct(&conf).
				AddFeeder(envFeeder)

			if err := cfg.Feed(); err != nil {
				logger.Server.Error("failed to load config: %v", err)
			}

		} else {
			logger.Main.Error("Warning during config feed: %v\n", err)
		}
	}

	return conf
}

// Default Configuration
// Provides fallback values when nothing is defined
func NewConfig() ServerConfig {
	return ServerConfig{
		AppEnv:               "",
		BackendListenAddress: "0.0.0.0:8080",

		DevelopmentRuntime: DevelopmentConfig{
			SeedData:                true,
			ExposeRegistrationToken: true,
		},

		Security: SecurityConfig{
			ProtectionLevel: "full",
		},

		Paths: PathsConfig{
			ProjectRoot: "",
			DataRoot:    "",
		},

		Admin: AdminConfig{
			Email:    "admin@admin.com",
			Password: "",
		},

		Authentication: AuthenticationConfig{
			ApiSecret:                 "",
			ExpirationDays:            2,
			JwtLifetime:               3,
			ResetTokenLifetime:        2,
			ConfirmationTokenLifetime: 2,
		},

		Frontend: FrontendConfig{ // Don't forget to configure vite.config.js file
			Origin:                "http://localhost:5173", //(ex: Dev http://localhost:5173 ou Prod https://app.skoreflow.com)
			ResetPasswordPath:     "/reset/password",
			RegisterConfirmPath:   "/register/confirm",
			UpdateMailConfirmPath: "/mail/confirm",
			CorsAllowedOrigins:    "http://localhost:5173", //(ex: http://localhost:5173,https://app.skoreflow.com)
		},

		Database: DatabaseConfig{
			Driver: "sqlite",
		},

		Smtp: SmtpConfig{},

		MicroServices: MicroServicesConfig{
			ThumbnailServiceURL: "http://localhost:5001",
		},
	}
}
