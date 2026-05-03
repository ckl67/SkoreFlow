package config

import (
	"fmt"
	"log"
	"strings"
	"sync"

	"backend/infrastructure/logger"

	"github.com/golobby/config/v3"
	"github.com/golobby/config/v3/pkg/feeder"
)

// Server Configuration Principles
// Configuration loading flow:
// 1. NewConfig() initializes default values
// 2. DotEnv feeder loads values from .env file
// 3. Env feeder overrides with system environment variables
//
// This mechanism is handled by:
//   github.com/golobby/config/v3
//
// ⚠️ IMPORTANT:
// Do NOT mix os.Getenv() with golobby/config,
// otherwise you break the consistency of the configuration layer.

// SMTP Configuration
// Used for sending emails (password reset, notifications, etc.)
type SmtpConfig struct {
	Enabled        bool   `env:"SMTP_ENABLED"` // Even bool must be considered as string
	From           string `env:"SMTP_FROM"`
	HostServerAddr string `env:"SMTP_HOST"`
	HostServerPort int    `env:"SMTP_PORT"`
	Username       string `env:"SMTP_USERNAME"`
	PasswordBase64 string `env:"SMTP_PASSWORD_BASE64"` // store it base64 encoded for safety in config parsing
}

// Database Configuration
// Defines connection parameters for the database layer (GORM)
type DatabaseConfig struct {
	Driver   string `env:"DB_DRIVER"` // e.g. sqlite, postgres, mysql
	Host     string `env:"DB_HOST"`
	User     string `env:"DB_USER"`
	Password string `env:"DB_PASSWORD"`
	Name     string `env:"DB_NAME"`
	Port     int    `env:"DB_PORT"`
}

// Internal Microservice Configuration
// Used for internal services (e.g. thumbnail generation)
type MicroServiceConfig struct {
	MsName string `env:"MS_NAME"`
	MsPort int    `env:"MS_PORT"`
	MsRoot string `env:"MS_ROOT"`
}

// Frontend Configuration
type FrontendConfig struct {
	Origin              string `env:"FRONTEND_ORIGIN"`                // e.g. http://localhost:3000
	ResetPasswordPath   string `env:"FRONTEND_RESET_PASSWORD_PATH"`   // e.g. /reset-password
	RegisterConfirmPath string `env:"FRONTEND_REGISTER_CONFIRM_PATH"` // e.g. /register/confirm

	CorsAllowedOrigins string `env:"CORS_ALLOWED_ORIGINS"` // Allowed origins for CORS e.g. http://localhost:3000,https://app.skoreflow.com
}

// Global Server Configuration
// Central struct holding ALL configuration used across the app
type ServerConfig struct {
	Backend_Dev_Mode bool `env:"BACKEND_DEV_MODE"`

	// Paths
	AppRoot     string `env:"APP_ROOT"`     //	APP_ROOT=/app or APP_ROOT=/home/<linuxuser>/SkoreFlow_Project/SkoreFlow/backend
	StoragePath string `env:"STORAGE_PATH"` // STORAGE_PATH=storage

	// Admin Email
	AdminEmail    string `env:"ADMIN_EMAIL"`
	AdminPassword string `env:"ADMIN_PASSWORD"`

	// Authentification
	ApiSecret string `env:"API_SECRET"`

	// Access
	BackendListenAddress string `env:"BACKEND_LISTEN_ADDRESS"` // e.g. : 0.0.0.0:8080

	// Others
	Database     DatabaseConfig
	Smtp         SmtpConfig
	MicroService MicroServiceConfig
	Frontend     FrontendConfig
}

// Config Builder
// Builder pattern used to configure how config is loaded
type configBuilder struct {
	dotenvFile           string
	errorOnMissingDotenv bool
}

// Singleton Pattern
// sync.Once guarantees that configuration is initialized ONLY ONCE,
// even in concurrent environments.
//
// This avoids:
// - duplicated loads
// - race conditions
// - inconsistent config states
var (
	serverConfig ServerConfig
	configOnce   sync.Once
)

// Safe Logging (⚠️ NOT production-safe)
// Logs configuration for debugging purposes
// This function exposes sensitive data (passwords, secrets).
// Use ONLY in development or debug mode.
func (c ServerConfig) LogSafe() {
	fmt.Println("------ SERVER CONFIG ------")

	if c.Backend_Dev_Mode {

		fmt.Printf("BACKEND_DEV_MODE :%t\n", c.Backend_Dev_Mode)

		fmt.Println("Paths:")
		fmt.Printf("  StoragePath: %s\n", c.StoragePath)
		fmt.Printf("  AppRoot: %s\n", c.AppRoot)
		fmt.Printf("  StoragePath (joined): %s\n", c.AppRoot+"/"+c.StoragePath)

		fmt.Println("Admin Mail:")
		fmt.Printf("  AdminEmail: %s\n", c.AdminEmail)
		fmt.Printf("  AdminPassword: %s\n", c.AdminPassword) // ❌ sensitive

		fmt.Println("Authentification:")
		fmt.Printf("  ApiSecret: %s\n", c.ApiSecret) // ❌ sensitive

		fmt.Println("Backend Access:")
		fmt.Printf("  BackendListenAddress: %s\n", c.BackendListenAddress)

		fmt.Println("Database:")
		fmt.Printf("  Driver: %s\n", c.Database.Driver)
		fmt.Printf("  Host: %s\n", c.Database.Host)
		fmt.Printf("  User: %s\n", c.Database.User)
		fmt.Printf("  Password: %s\n", c.Database.Password) // ❌ sensitive
		fmt.Printf("  Name: %s\n", c.Database.Name)
		fmt.Printf("  Port: %d\n", c.Database.Port)

		fmt.Println("SMTP:")
		fmt.Printf("  Enabled: %t\n", c.Smtp.Enabled)
		fmt.Printf("  From: %s\n", c.Smtp.From)
		fmt.Printf("  Host: %s\n", c.Smtp.HostServerAddr)
		fmt.Printf("  Port: %d\n", c.Smtp.HostServerPort)
		fmt.Printf("  Username: %s\n", c.Smtp.Username)
		fmt.Printf("  Password: %s\n", c.Smtp.PasswordBase64) // ❌ sensitive

		fmt.Println("MicroService:")
		fmt.Printf("  Name: %s\n", c.MicroService.MsName)
		fmt.Printf("  Port: %d\n", c.MicroService.MsPort)
		fmt.Printf("  Root %s:\n", c.MicroService.MsRoot)
		fmt.Printf("  Full Path: %s\n", c.AppRoot+"/"+c.MicroService.MsRoot)

		fmt.Println("Frontend:")
		fmt.Printf("  FrontendOrigin: %s\n", c.Frontend.Origin)
		fmt.Printf("  FrontendResetPasswordPath: %s\n", c.Frontend.ResetPasswordPath)
		fmt.Printf("  FrontendRegisterConfirmPath: %s\n", c.Frontend.RegisterConfirmPath)
		fmt.Printf("  CORS Origins: %s\n", c.Frontend.CorsAllowedOrigins)

	} else {
		fmt.Println("BACKEND PROD MODE")
	}

	fmt.Println("--------------------------------------")
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
		fmt.Println("Loading configuration...")
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
	// Read Configuration via initialisation
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
		Backend_Dev_Mode: false,

		AppRoot:     "",
		StoragePath: "",

		AdminEmail:    "admin@admin.com",
		AdminPassword: "",
		ApiSecret:     "",

		BackendListenAddress: "0.0.0.0:8080",

		Frontend: FrontendConfig{
			Origin:              "http://localhost:3000", //(ex: Dev http://localhost:3000 ou Prod https://app.skoreflow.com)
			ResetPasswordPath:   "/reset-password",
			RegisterConfirmPath: "/register/confirm",
			CorsAllowedOrigins:  "http://localhost:3000", //(ex: http://localhost:3000,https://app.skoreflow.com)
		},

		Database: DatabaseConfig{
			Driver: "sqlite",
		},

		Smtp: SmtpConfig{},

		MicroService: MicroServiceConfig{
			MsName: "thumbnail-service",
			MsPort: 5010,
			MsRoot: "",
		},
	}
}
