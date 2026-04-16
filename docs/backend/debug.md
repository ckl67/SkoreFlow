# SkoreFlow Debug Setup Guide (Go + VS Code)

## Overview

This document explains how to properly configure and use debugging for the SkoreFlow backend using VS Code and Delve (dlv).

It covers:

- Default VS Code behavior
- Proper configuration for SkoreFlow
- CLI debugging vs Server debugging
- Use of launch.json
- Difference between `${fileDirname}` and `${workspaceFolder}`

---

## 1. Prerequisites

- Go installed
- Delve debugger installed:

```bash
go install github.com/go-delve/delve/cmd/dlv@latest
```

- VS Code with Go extension

---

## 2. Project Structure (Important)

SkoreFlow uses a **Go module inside the backend folder**:

```
SkoreFlow/
└── backend/
    ├── go.mod
    ├── cmd/
    │   ├── server/
    │   └── cli/
```

⚠️ This is critical:

- The Go module is **NOT at the root**
- All debug/run operations must target `/backend`

---

## 3. Default VS Code Debug Configuration

VS Code often generates this automatically:

```json
{
  "name": "Launch Package",
  "type": "go",
  "request": "launch",
  "mode": "auto",
  "program": "${fileDirname}"
}
```

### Behavior

- Runs the Go package located in the directory of the currently opened file
- Automatically decides how to run (build/test/run)

### Limitations

- Depends on which file is open
- Can execute the wrong entrypoint
- May fail if not inside a Go module
- Not suitable for multi-entrypoint projects like SkoreFlow

---

## 4. Why SkoreFlow Needs Custom Configuration

SkoreFlow has multiple entrypoints:

- Server: `cmd/server`
- CLI: `cmd/cli`

Therefore, debugging must be **explicit and deterministic**.

---

## 5. Understanding VS Code Variables

### `${workspaceFolder}`

- Root folder opened in VS Code

Example:

```
/home/christian/SkoreFlow_Project/SkoreFlow
```

---

### `${fileDirname}`

- Directory of the currently opened file

Example:

If editing:

```
backend/cmd/cli/main.go
```

Then:

```
${fileDirname} = backend/cmd/cli
```

---

## 6. Key Difference

| Variable             | Behavior               | Stability  |
| -------------------- | ---------------------- | ---------- |
| `${fileDirname}`     | Depends on active file | ❌ Fragile |
| `${workspaceFolder}` | Fixed project root     | ✅ Stable  |

---

## 7. Recommended launch.json for SkoreFlow

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/backend/cmd/server",
      "cwd": "${workspaceFolder}/backend"
    },

    {
      "name": "Debug CLI (no args)",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/backend/cmd/cli",
      "cwd": "${workspaceFolder}/backend"
    },

    {
      "name": "Debug CLI (list users)",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/backend/cmd/cli",
      "cwd": "${workspaceFolder}/backend",
      "args": ["-list-users"]
    }
  ]
}
```

---

## 8. Why `cwd` is Critical

```json
"cwd": "${workspaceFolder}/backend"
```

Ensures:

- `go.mod` is found
- `.env` is loaded correctly
- database path is correct
- storage paths are consistent

Without it, Go may:

- fail to find module
- create a new empty database
- break configuration loading

---

## 9. CLI Debugging vs Server Debugging

### Server Debug

- Long-running process
- Starts HTTP API
- Uses full application stack

### CLI Debug

- Short-lived execution
- Runs specific commands
- Often uses flags (e.g. `-list-users`)

---

## 10. Running Without Debugger

Equivalent commands:

```bash
cd backend

# Server
go run cmd/server/main.go

# CLI
go run cmd/cli/main.go -list-users
```
