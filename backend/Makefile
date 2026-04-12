# Variables
BINARY_NAME=sf-backend
GO=go
MAIN_FILE=./cmd/server/main.go

# Versioning via Git
# --tags: Look for tags
# --always: Fallback to commit hash if no tag is found
# --dirty: Append "-dirty" if there are uncommitted changes
# Note: Ensure your repo has tags for this to work properly, otherwise only the hash will be shown.
# The displayed version is always based on the latest Tag created.
# Example:
#       git tag v0.1.0 -m "First stable version with version display"
VERSION=$(shell git describe --tags --always --dirty)

# Path to the version variable in main.go
# If your main.go is at the root, use main.Version
LDFLAGS=-ldflags="-X main.Version=$(VERSION)"

# Makefile Rules
.PHONY: all build run air clean tidy reset help version

## all: Clean, organize modules, and compile
all: tidy build

## version: Display the version detected by the Makefile (useful for debugging)
version:
	@echo "Detected Version: $(VERSION)"

## build: Compile the project with version injection
build:
	@echo "==> Compiling binary (Version: $(VERSION))..."
	CGO_ENABLED=0 $(GO) build $(LDFLAGS) -o build/$(BINARY_NAME) $(MAIN_FILE)

## run: Launch the program
run:
	@echo "==> Running main.go (Version: $(VERSION))..."
	$(GO) run $(LDFLAGS) $(MAIN_FILE)

## runHR: Automate the Hot Reload process thanks to the standard Air tool
air:
	@echo "==> Running Hot Reload (air) main.go (Version: $(VERSION))..."
	air

## tidy: Organize and clean the go.mod file
tidy:
	@echo "==> Tidying modules..."
	$(GO) mod tidy

## clean: Remove the local binary
clean:
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
	@echo "  make build       : Compile the project with version injection"
	@echo "  make run         : Run the project with version injection"
	@echo "  make air         : Run with air allowing hot reload"
	@echo "  make version     : Show the version to be injected"
	@echo "  make tidy        : Clean up dependencies"
	@echo "  make reset       : Clear cache and reinstall everything"
	@echo "  make clean       : Remove the binary"
	@echo "  make help        : Show this help message"
