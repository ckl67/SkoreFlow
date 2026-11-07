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

# Versioning via Git
# --tags: Look for tags
# --always: Fallback to commit hash if no tag is found
VERSION=$(shell git describe --tags --match "backend/*" --always)
COMMIT=$(shell git rev-parse --short HEAD)
BUILD_DATE=$(shell date -u +%Y-%m-%dT%H:%M:%SZ)
LDFLAGS=-ldflags="-X main.Version=$(VERSION) -X main.Commit=$(COMMIT) -X main.BuildDate=$(BUILD_DATE)"

# Makefile Rules
.PHONY: all version debug air run run-autotest build cleandb-storage tidy clean-build reset debug-test debug-dev doc help

## all: Clean, organize modules, and compile
all: tidy build

## version: Display the version detected by the Makefile (useful for debugging)
version:
	@echo "Detected Version: $(VERSION)"

debug:
	@echo "==> DEBUG main.go (Version: $(VERSION))...."
	$(DLV) debug $(LDFLAGS) $(MAIN_FILE) $(DLV_OPTION) $(DLV_OUTPUT)

air:
	@echo "==> Running Hot Reload (air) main.go (Version: $(VERSION))..."
	air

run:
	@echo "==> Running main.go (Version: $(VERSION))..."
	$(GO) run $(LDFLAGS) $(MAIN_FILE)

## build: Compile the project with version injection
build:
	@echo "==> Compiling binary (Version: $(VERSION))..."
	CGO_ENABLED=0 $(GO) build $(LDFLAGS) -o build/$(BINARY_NAME) $(MAIN_FILE)

run-autotest:
	@echo "==> Running TEST - (TEST = TRUE Send Registration Token) (SMTP = FALSE) environment (Version: $(VERSION))...."
	APP_ENV=development \
	SEED_DATA=true \
	EXPOSE_REGISTRATION_TOKEN=true \
	SMTP_ENABLED=false \
	PROTECTION_LEVEL=none \
	$(GO) run $(LDFLAGS) $(MAIN_FILE)
	@echo "==> Running TEST environment (Version: $(VERSION))...."

cleandb-storage:
	@echo "Clean DB and Storage files"
	cd ../testauto/backend/ && bash auto-test.sh --clean


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

doc:
	@echo "Génération de la documentation des services Go..."
	gomarkdoc ./internal/domain/... ./internal/services/... > ../docs/backend/backend-services.md

## help: Show available commands
help:
	@echo "Available commands:"
	@echo "  make build       				: Compile the project with version injection"
	@echo "  make run         				: Run (Prod) with version injection"
	@echo "  make air         				: Run (Prod) with air allowing hot reload"
	@echo "  make debugv     		  : Debug (Dev) with version injection"
	@echo "  make run-test    				: Run (Test) with version injection"
	@echo "  make cleandb-storage    	: Clean Database and Storage files"
	@echo "  make air-dev     				: Run (Dev) with air in test mode"
	@echo "  make air-test    				: Run (Test) with air in test mode"
	@echo "  make version     				: Show the version to be injected"
	@echo "  make tidy        				: Clean up dependencies"
	@echo "  make reset       				: Clear cache and reinstall everything"
	@echo "  make clean       				: Remove the binary"
	@echo "  make help        				: Show this help message"
