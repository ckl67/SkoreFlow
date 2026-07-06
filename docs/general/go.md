# Go — Summary Notes

## Introduction

Go is an expressive, concise programming language. Its concurrency model makes it easy to write programs that take full advantage of multi-core machines and networked systems. Go compiles quickly to machine code.

## Documentation

[Official Go documentation](https://go.dev/doc/)

## Building - Running

- `go run main.go` — compiles and runs the program immediately without leaving a binary behind. Convenient for development.
- `go build` — produces the final binary for distribution or production.

For simplicity see also Makefile un backend directory

```bash
make help
```

## The role of `go.mod`

The `go.mod` file in the project tells Go: “Here is the module, here is my version of Go, and here are my dependencies.”
Even when running locally, Go refers to this file to resolve imports and check package versions.
The corresponding file is mod.sum

The command:

```bash
go mod tidy
```

does two main things:

1. **Adds missing dependencies**
   - If an external package (e.g. `github.com/gin-gonic/gin`) is not in `go.mod`, `tidy` adds it automatically.
2. **Removes unused dependencies**
   - If `go.mod` contains packages that are no longer imported into the code, `tidy` removes them.

## Packages

### Installation

```shell
go get <package>
```

### Deletion

```shell
go get <package>@none
```

The @none suffix is a special instruction for the Go tool. It means: "Completely remove this dependency from my project."

```shell
go get github.com/jinzhu/gorm@none
```

## Update

The order:

```shell
go get -u
```

- updates all dependencies of the current module, including:
- direct dependencies
- indirect dependencies (// indirect)
- transitive dependencies (dependencies of dependencies)

Go then attempts to resolve the entire dependency graph using the latest compatible versions.

### Why this is not recommended for backend projects

In a stable backend project:

- Dependencies must be locked in place
- The build must be reproducible
- Updates must be controlled

it may:

- Introduce breaking changes
- Update indirect dependencies that are not under your control
- Require a newer version of Go
- Make significant changes to go.mod and go.sum

It is therefore a risky command outside the context of planned maintenance.

### Best practices to follow

- Never use `go get -u` globally in production., or do it with conscientiously
- Update one dependency at a time.
- Always version `go.mod` and `go.sum`.
- Use `go mod tidy` to clean up, not to update.

## Visibility (encapsulation)

- A name starting with an **uppercase** letter (`User`) is exported (public).
- A name starting with a **lowercase** letter (`user`) is private to the package.

## Static binaries and CGO

By default, Go sometimes relies on C libraries (via cgo) for certain features, such as DNS resolution or X.509 certificate handling.

The problem: if you compile your program on a machine with a specific version of the C library (glibc), your binary might fail to start on a different machine.

Setting:

```bash
CGO_ENABLED=0
```

disables cgo and forces Go to produce a purely static binary:

- **Full self-containment**: the binary carries everything it needs and depends on no external `.so`/`.dll` files.
- **Maximum portability**: you can copy the binary to any Linux system, regardless of distribution, and it will run without dependency errors.
- **Reduced attack surface**: avoids linking potentially vulnerable system libraries.

This is the standard approach for building lightweight Docker images:

```bash
CGO_ENABLED=0 GOOS=linux go build -o main .
```

## GORM

GORM is a third-party ORM (Object-Relational Mapping) library.
ORMs exist in many languages:

- Java → Hibernate
- Python → Django ORM / SQLAlchemy
- PHP → Eloquent

### Plain Go (without GORM)

You write raw SQL queries and handle scanning and errors manually:

```go
row := db.QueryRow("SELECT id, email FROM users WHERE email = ?", email)
row.Scan(&user.ID, &user.Email)
```

### Go with GORM

```go
db.Where("email = ?", email).First(&user)
```

## Gin

Gin is an HTTP framework for Go, built on top of `net/http`.

- Routes: `r.GET()`, `r.POST()`, `r.PUT()`, `r.DELETE()`
- Middleware:

```go
  r.Use(AuthMiddleware())
```

- Typical architecture:
  `Client → Gin → Services → GORM → Database`

## Binding Requests: Bind, ShouldBind, BindJSON, ShouldBindWith

Gin's binding system parses incoming request data (JSON, XML, form, query string, URI params, etc.) directly into a Go struct, using struct tags. There are two families of binding methods, which only differ in **how they handle errors**.

- Under the hood, these call `ShouldBindWith`.
- If binding fails, they **only return the error** — Gin does not touch the HTTP response.
- You decide what to do: log it, return a custom error format, use a different status code, etc.
- **Recommended in production.**

```go
if err := c.ShouldBindJSON(&obj); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
}
```

### `Bind` / `ShouldBind` vs `BindJSON` / `ShouldBindJSON`

- `Bind` and `ShouldBind` **infer** the parser to use from the request's `Content-Type` header (JSON, form, XML...).
- `BindJSON` and `ShouldBindJSON` **force** JSON parsing, regardless of `Content-Type`.

### Rule of thumb

Prefer the `Should...` methods in production. They give you full control over error handling and response formatting, instead of letting Gin decide for you.
