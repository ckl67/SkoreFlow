# Automatic Code Reloading with Air

Go is a compiled language. By default, this means you need to stop, rebuild, and restart the application manually.
To automate this process (commonly called "Hot Reload"), the standard tool is Air.

## 1. Installing Air

Open your terminal and install it using go install:

Make sure that your $GOPATH/bin directory is included in your PATH so you can run the air command from anywhere.
See [backend installation guide](install.md) for instructions on how to add Go binaries to your PATH.


```shell
go install github.com/air-verse/air@latest
```
## 2. Configuration

Navigate to the root of your backend project and initialize Air:

```shell
air init
```

This will create a .air.toml file.
This file tells Air: "Watch all .go files, and whenever one changes, run go build and restart the binary."

## 3. Usage

Instead of running:

```shell
go run ./cmd/server/main.go

# Simply use:

air
```