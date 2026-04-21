package logger

import (
	"fmt"
	"os"
	"strings"
	"time"
)

// --- Types & Constants ---

// Level represents the severity of a log entry.
type Level int

const (
	FATAL Level = iota // 0: Unrecoverable errors that cause immediate exit
	ERROR              // 1: Only critical issues
	WARN               // 2: Important warnings
	INFO               // 3: General operational info
	DEBUG              // 4: Detailed technical information
)

// --- Package Instances ---

// These variables provide ready-to-use loggers for specific app modules.
// They are initialized once when the package is loaded, before main() starts.
var (
	Main     = New("main")
	Server   = New("server")
	Login    = New("login")
	User     = New("user")
	Score    = New("score")
	Composer = New("composer")
	DB       = New("db")
	HTTP     = New("http")
	API      = New("api")
)

/*
Usage Examples:
logger.Main.Debug("Loading configuration...")
logger.Login.Info("Login attempt for user: %s", "christian")
logger.Score.Info("New score created: %s", "Sonata No.1")
logger.Composer.Warn("Could not load portrait for composer: %s", "Beethoven")
*/

// --- Internal State ---

// moduleLevels maps module names to their specific verbosity threshold.
var moduleLevels = map[string]Level{}

// enabledModules tracks which modules are authorized to output logs.
var enabledModules = map[string]bool{}

// ModuleLogger represents a logger instance tied to a specific system module.
type ModuleLogger struct {
	name string
}

// --- Constructor & Initialization ---

// New creates and returns a new logger instance for a specific module name.
func New(module string) ModuleLogger {
	return ModuleLogger{name: strings.ToLower(module)}
}

// Init performs global setup. It enables the provided modules at a specific level.
// Useful for a quick startup configuration from main.go.
func Init(level string, modules []string) {
	lvl := parseLevel(level)
	for _, m := range modules {
		moduleName := strings.ToLower(m)
		enabledModules[moduleName] = true
		moduleLevels[moduleName] = lvl
	}
}

// SetModuleLevel enables a specific module and sets its individual log level.
func SetModuleLevel(module string, level string) {
	moduleName := strings.ToLower(module)
	enabledModules[moduleName] = true
	moduleLevels[moduleName] = parseLevel(level)
}

// --- Helpers ---

// parseLevel converts a string ("debug", "info", etc.) to a Level constant.
func parseLevel(level string) Level {
	switch strings.ToLower(level) {
	case "fatal":
		return FATAL
	case "error":
		return ERROR
	case "warn":
		return WARN
	case "info":
		return INFO
	case "debug":
		return DEBUG
	default:
		return INFO
	}
}

// GetModuleLevel returns the current log level of a module as a string.
// Especially useful when communicating settings to external services.
func GetModuleLevel(module string) string {
	moduleName := strings.ToLower(module)

	if !enabledModules[moduleName] {
		return "DISABLED"
	}

	lvl, ok := moduleLevels[moduleName]
	if !ok {
		return "INFO"
	}

	return lvl.String()
}

// String converts the Level constant into a human-readable uppercase string.
func (l Level) String() string {
	switch l {
	case FATAL:
		return "FATAL"
	case ERROR:
		return "ERROR"
	case WARN:
		return "WARN"
	case INFO:
		return "INFO"
	case DEBUG:
		return "DEBUG"
	default:
		return "INFO"
	}
}

// --- Core Logging Logic ---

// log is the internal engine that handles filtering, formatting, and printing.
func (l ModuleLogger) log(level Level, label string, format string, args ...interface{}) {
	// 1. Drop the log if the module isn't explicitly enabled
	// FATAL must always be printed
	if level != FATAL {
		if !enabledModules[l.name] {
			return
		}

		// 2. Determine the threshold for this module
		moduleLevel, ok := moduleLevels[l.name]
		if !ok {
			moduleLevel = INFO
		}

		// 3. Drop the log if the requested severity is too low
		if level > moduleLevel {
			return
		}
	}
	// 4. Format and print the output
	msg := fmt.Sprintf(format, args...)
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	fmt.Printf("%s [%s] [%s] %s\n", timestamp, label, strings.ToUpper(l.name), msg)
}

// --- Public Logging Methods ---

// Fatal logs a message at the ERROR level and then exits the application. Use for unrecoverable errors.
func (l ModuleLogger) Fatal(format string, args ...interface{}) {
	l.log(FATAL, "FATAL", format, args...)
	os.Exit(1)
}

// Error logs a message at the ERROR level. Use for critical failures.
func (l ModuleLogger) Error(format string, args ...interface{}) {
	l.log(ERROR, "ERROR", format, args...)
}

// Warn logs a message at the WARN level. Use for non-critical issues.
func (l ModuleLogger) Warn(format string, args ...interface{}) {
	l.log(WARN, "WARN", format, args...)
}

// Info logs a message at the INFO level. Use for high-level flow tracking.
func (l ModuleLogger) Info(format string, args ...interface{}) {
	l.log(INFO, "INFO", format, args...)
}

// Debug logs a message at the DEBUG level. Use for deep technical tracing.
func (l ModuleLogger) Debug(format string, args ...interface{}) {
	l.log(DEBUG, "DEBUG", format, args...)
}
