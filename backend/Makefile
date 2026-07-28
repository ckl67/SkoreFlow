# Variables

BINARY_NAME=sf-backend
GO=go

DLV=dlv
DLV_OPTION= \
    --headless \
    --listen=:2345 \
    --api-version=2 \
    --accept-multiclient
DLV_OUTPUT := --output=./tmp/delve/sf-backend-debug

## According to standard practice in Go, you need to run the package and not ./cmd/server/main.go
MAIN_FILE=./cmd/server

# Principle
# `make` executes each line of a recipe in a completely independent sub-shell (a process).
#
# Default environment Variables
#  APP_ENV = : development, production
#  SMTP_ENABLED = :  true / false
#  PROTECTION_LEVEL = : full / none
#  TEST_MODE = : true / false
# 		Will automatically seed test users on server startup for testing purposes.
# 		Will authorize all requests without smtp authentication for easier testing of protected routes.

# Versioning via Git
# --tags: Look for tags
# --always: Fallback to commit hash if no tag is found
VERSION=$(shell git describe --tags --always)
COMMIT=$(shell git rev-parse --short HEAD)
BUILD_DATE=$(shell date -u +%Y-%m-%dT%H:%M:%SZ)
LDFLAGS=-ldflags="-X main.Version=$(VERSION) -X main.Commit=$(COMMIT) -X main.BuildDate=$(BUILD_DATE)"

# Makefile Rules
.PHONY: all version build run-test run-dev run cleandb-storage air air-test air-dev tidy clean-build reset debug-test debug-dev help

## all: Clean, organize modules, and compile
all: tidy build

## version: Display the version detected by the Makefile (useful for debugging)
version:
	@echo "Detected Version: $(VERSION)"

## build: Compile the project with version injection
build:
	@echo "==> Compiling binary (Version: $(VERSION))..."
	CGO_ENABLED=0 $(GO) build $(LDFLAGS) -o build/$(BINARY_NAME) $(MAIN_FILE)

debug-test:
	@echo "==> DEBUG TEST - (TEST = TRUE Send Registration Token) (SMTP = FALSE) environment (Version: $(VERSION))...."
	APP_ENV=development \
	TEST_MODE=true \
	SMTP_ENABLED=false \
	PROTECTION_LEVEL=none \
	$(DLV) debug $(LDFLAGS) $(MAIN_FILE) $(DLV_OPTION) $(DLV_OUTPUT)
	@echo "==> DEBUG TEST environment (Version: $(VERSION))...."

debug-dev:
	@echo "==> DEBUG DEV - (TEST = FALSE) (SMTP = TUE) environment (Version: $(VERSION))...."
	APP_ENV=development \
	TEST_MODE=false \
	SMTP_ENABLED=true \
	PROTECTION_LEVEL=none \
	$(DLV) debug $(LDFLAGS) $(MAIN_FILE) $(DLV_OPTION) $(DLV_OUTPUT)
	@echo "==> DEBUG TEST environment (Version: $(VERSION))...."

run-test:
	@echo "==> Running TEST - (TEST = TRUE Send Registration Token) (SMTP = FALSE) environment (Version: $(VERSION))...."
	APP_ENV=development \
	TEST_MODE=true \
	SMTP_ENABLED=false \
	PROTECTION_LEVEL=none \
	$(GO) run $(LDFLAGS) $(MAIN_FILE)
	@echo "==> Running TEST environment (Version: $(VERSION))...."

run-dev:
	@echo "==> Running DEV - (TEST = FALSE) (SMTP = TUE) environment (Version: $(VERSION))...."
	APP_ENV=development \
	TEST_MODE=false \
	SMTP_ENABLED=true \
	PROTECTION_LEVEL=none \
	$(GO) run $(LDFLAGS) $(MAIN_FILE)
	@echo "==> Running TEST environment (Version: $(VERSION))...."

run:
	@echo "==> Running PROD main.go (Version: $(VERSION))..."
	APP_ENV=production \
	TEST_MODE=false \
	SMTP_ENABLED=true \
	PROTECTION_LEVEL=full \
	$(GO) run $(LDFLAGS) $(MAIN_FILE)

cleandb-storage:
	@echo "Clean DB and Storage files"
	cd ../testauto/backend/ && bash auto-test.sh --clean

## run: Automate the Hot Reload process thanks to the standard Air tool
## For Air, we pass : VERSION,COMMIT, BUILD_DATE as command-line arguments and we include them in the Air configuration file (.air.toml).
## cmd = "go build -ldflags=\"-X main.Version=$VERSION -X main.Commit=$COMMIT -X main.BuildDate=$BUILD_DATE\" -o ./tmp/main ./cmd/server"
air:
	@echo "==> Running Hot Reload (air) main.go (Version: $(VERSION))..."
	VERSION="$(VERSION)" \
	COMMIT="$(COMMIT)" \
	BUILD_DATE="$(BUILD_DATE)" \
	APP_ENV=production \
	TEST_MODE=false \
	SMTP_ENABLED=true \
	PROTECTION_LEVEL=full \
	air

## run: Automate the Hot Reload process thanks to the standard Air tool
## For Air, we pass : VERSION,COMMIT, BUILD_DATE as command-line arguments and we include them in the Air configuration file (.air.toml).
## cmd = "go build -ldflags=\"-X main.Version=$VERSION -X main.Commit=$COMMIT -X main.BuildDate=$BUILD_DATE\" -o ./tmp/main ./cmd/server"
air-test:
	@echo "==> Running Hot Reload (air) DEV - (TEST = TRUE Send Registration Token) (SMTP = FALSE) environment (Version: $(VERSION))...."
	VERSION="$(VERSION)" \
	COMMIT="$(COMMIT)" \
	BUILD_DATE="$(BUILD_DATE)" \
	APP_ENV=development \
	TEST_MODE=true \
	SMTP_ENABLED=false \
	PROTECTION_LEVEL=none \
	air

## run: Automate the Hot Reload process thanks to the standard Air tool
## For Air, we pass : VERSION,COMMIT, BUILD_DATE as command-line arguments and we include them in the Air configuration file (.air.toml).
## cmd = "go build -ldflags=\"-X main.Version=$VERSION -X main.Commit=$COMMIT -X main.BuildDate=$BUILD_DATE\" -o ./tmp/main ./cmd/server"
air-dev:
	@echo "==> Running Hot Reload (air) DEV - (TEST = FALSE) (SMTP = TRUE) environment (Version: $(VERSION))...."
	VERSION="$(VERSION)" \
	COMMIT="$(COMMIT)" \
	BUILD_DATE="$(BUILD_DATE)" \
	APP_ENV=development \
	TEST_MODE= false\
	SMTP_ENABLED=true \
	PROTECTION_LEVEL=none \
	air

## tidy: Organize and clean the go.mod file
tidy:
	@echo "==> Tidying modules..."
	$(GO) mod tidy

## clean: Remove the local binary
clean-build:
	@echo "==> Removing binary..."
	rm -f build/$(BINARY_NAME)

## reset: Clear module cache and re-download everything
reset:
	@echo "==> Complete module cache cleanup..."
	$(GO) clean -cache -modcache -testcache
	$(GO) mod tidy

## help: Show available commands
help:
	@echo "Available commands:"
	@echo "  make build       				: Compile the project with version injection"
	@echo "  make run         				: Run (Prod) with version injection"
	@echo "  make run-dev     				: Run (Dev) with version injection"
	@echo "  make debug-dev     		  : Debug (Dev) with version injection"
	@echo "  make run-test    				: Run (Test) with version injection"
	@echo "  make debug-test    			: Debug (Test) with version injection"
	@echo "  make cleandb-storage    	: Clean Database and Storage files"
	@echo "  make air         				: Run (Prod) with air allowing hot reload"
	@echo "  make air-dev     				: Run (Dev) with air in test mode"
	@echo "  make air-test    				: Run (Test) with air in test mode"
	@echo "  make version     				: Show the version to be injected"
	@echo "  make tidy        				: Clean up dependencies"
	@echo "  make reset       				: Clear cache and reinstall everything"
	@echo "  make clean       				: Remove the binary"
	@echo "  make help        				: Show this help message"
