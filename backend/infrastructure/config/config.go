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
type microServiceConfig struct {
	MsName string `env:"MS_NAME"`
	MsPort int    `env:"MS_PORT"`
	MsRoot string `env:"MS_ROOT"`
}

// Global Server Configuration
// Central struct holding ALL configuration used across the app
type ServerConfig struct {
	Backend_Dev_Mode bool `env:"BACKEND_DEV_MODE"`

	AdminEmail    string `env:"ADMIN_EMAIL"`
	AdminPassword string `env:"ADMIN_PASSWORD"`
	ApiSecret     string `env:"API_SECRET"`
	StoragePath   string `env:"STORAGE_PATH"`

	BackendListenAddress string `env:"BACKEND_LISTEN_ADDRESS"` // e.g. : 0.0.0.0:8080

	FrontendOrigin              string `env:"FRONTEND_ORIGIN"`                // e.g. http://localhost:3000
	FrontendResetPasswordPath   string `env:"FRONTEND_RESET_PASSWORD_PATH"`   // e.g. /reset-password
	FrontendRegisterConfirmPath string `env:"FRONTEND_REGISTER_CONFIRM_PATH"` // e.g. /register/confirm

	CorsAllowedOrigins string `env:"CORS_ALLOWED_ORIGINS"` // Allowed origins for CORS e.g. http://localhost:3000,https://app.sheetflow.com

	Database     DatabaseConfig
	Smtp         SmtpConfig
	MicroService microServiceConfig
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
	logger.Main.Debug("------ SERVER CONFIG ------")

	logger.Main.Debug("BACKEND_DEV_MODE :%t", c.Backend_Dev_Mode)

	logger.Main.Debug("AdminEmail: %s", c.AdminEmail)
	logger.Main.Debug("AdminPassword: %s", c.AdminPassword) // ❌ sensitive
	logger.Main.Debug("ApiSecret: %s", c.ApiSecret)         // ❌ sensitive

	logger.Main.Debug("StoragePath: %s", c.StoragePath)

	logger.Main.Debug("BackendListenAddress: %s", c.BackendListenAddress)

	logger.Main.Debug("Database:")
	logger.Main.Debug("  Driver: %s", c.Database.Driver)
	logger.Main.Debug("  Host: %s", c.Database.Host)
	logger.Main.Debug("  User: %s", c.Database.User)
	logger.Main.Debug("  Password: %s", c.Database.Password) // ❌ sensitive
	logger.Main.Debug("  Name: %s", c.Database.Name)
	logger.Main.Debug("  Port: %d", c.Database.Port)

	logger.Main.Debug("SMTP:")
	logger.Main.Debug("  Enabled: %t", c.Smtp.Enabled)
	logger.Main.Debug("  From: %s", c.Smtp.From)
	logger.Main.Debug("  Host: %s", c.Smtp.HostServerAddr)
	logger.Main.Debug("  Port: %d", c.Smtp.HostServerPort)
	logger.Main.Debug("  Username: %s", c.Smtp.Username)
	logger.Main.Debug("  Password: %s", c.Smtp.PasswordBase64) // ❌ sensitive

	logger.Main.Debug("MicroService:")
	logger.Main.Debug("  Name: %s", c.MicroService.MsName)
	logger.Main.Debug("  Port: %d", c.MicroService.MsPort)
	logger.Main.Debug("  Root %s:", c.MicroService.MsRoot)

	logger.Main.Debug("Frontend:")
	logger.Main.Debug("FrontendOrigin: %s", c.FrontendOrigin)
	logger.Main.Debug("FrontendResetPasswordPath: %s", c.FrontendResetPasswordPath)
	logger.Main.Debug("FrontendRegisterConfirmPath: %s", c.FrontendRegisterConfirmPath)
	logger.Main.Debug("CORS Origins: %s", c.CorsAllowedOrigins)

	logger.Main.Debug("--------------------------------------")
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
	conf := NewConfig()

	dotenvFile := ".env"
	if b.dotenvFile != "" {
		dotenvFile = b.dotenvFile
	}

	dotenvFeeder := feeder.DotEnv{Path: dotenvFile}
	envFeeder := feeder.Env{}

	logger.Main.Debug("Looking for .env in: %s", dotenvFile)

	err := config.New().
		AddStruct(&conf).
		AddFeeder(dotenvFeeder).
		AddFeeder(envFeeder).
		Feed()
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

		AdminEmail:    "admin@admin.com",
		AdminPassword: "",
		ApiSecret:     "",
		StoragePath:   "./storage/",

		BackendListenAddress: "0.0.0.0:8080",

		FrontendOrigin:              "http://localhost:3000", //(ex: Dev http://localhost:3000 ou Prod https://app.sheetflow.com)
		FrontendResetPasswordPath:   "/reset-password",
		FrontendRegisterConfirmPath: "/register/confirm",

		CorsAllowedOrigins: "http://localhost:3000", //(ex: http://localhost:3000,https://app.sheetflow.com)

		Database: DatabaseConfig{
			Driver: "sqlite",
		},

		Smtp: SmtpConfig{},

		MicroService: microServiceConfig{
			MsName: "thumbnail-service",
			MsPort: 5010,
			MsRoot: "",
		},
	}
}
