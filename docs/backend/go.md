# Go language

[Go language](https://go.dev/) is an expressive and concise programming language.
Its concurrency mechanisms make it easy to write programs that get the most out of multi-core and networked machines.
Go compiles quickly into machine code.
It is a compiled, statically typed, and fast language, yet it remains simple and pleasant to use, much like an interpreted language.

# Go Project Architecture & Module Management

## The go.mod File: The Project Heart

The go.mod file is the core of a Go project (the Module).
It defines the module's identity, its path, and manages all external dependencies.

### Module Initialization

This file is generated using the go mod init command followed by the Module Path.

Convention: For projects intended for GitHub, the URL is typically used:

```shell
    go mod init github.com/ckl67/skoreflow
```

### Local Autonomy

For this project, to maintain autonomy and avoid external publishing constraints, a local name is used:

```go
  module backend
  go 1.24
```

# Working Directory, Module Root, and Configuration (Go + Docker)

## Working Directory

In Go, the **Current Working Directory (CWD)** is where the process runs.
The standard library function `os.Getwd()` returns the absolute path of the current directory.
Any relative file paths in your code (e.g. `“users/user-1.png”`) are resolved **against this CWD**.

## Root Directory

In module-enabled Go (Go 1.16+), the **module root** is defined as the directory containing the `go.mod` file.

When you run `go build`, `go run`, etc., the Go tool searches upward from your CWD to find the nearest `go.mod`;
That directory becomes the module root (the “project root”).
In practice, this means you should run Go commands **inside or below** the directory with `go.mod`, not above it !

## Relative Paths

Any path literal like `fmt.Sprintf("users/user-%d.png", uid)` is relative to the process’s CWD. In code you might write:
Remember: a **relative path in Go always depends on the execution context (the CWD)**

# Rule path for SkoreFlow and Docker Containers

To avoid confusion and ensure consistency, we define a clear structure for our file storage in SkoreFlow, both in local development and within Docker containers.
We use environment variables to set the root path and storage path, and we construct absolute paths using Go's `filepath.Join` to ensure portability across different environments.

```go
//In local
APP_ROOT=/home/<linuxuser>/SkoreFlow_Project/SkoreFlow/backend
STORAGE_PATH=storage

//In Docker
APP_ROOT=/app
STORAGE_PATH=storage
```

For example, in your Dockerfile:

```dockerfile
FROM golang:1.20
WORKDIR /app

ENV APP_ROOT=/app
ENV STORAGE_PATH=storage

COPY . .
RUN go build -o main .
CMD ["./main"]
```
