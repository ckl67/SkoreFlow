## VS Code Debugging Configuration (Backend / Frontend)

### Overview

SkoreFlow uses a multi-service architecture:

```txt
                 VS Code Debugger
                       |
        +--------------+--------------+
        |                             |
        v                             v
   Go Debugger                  Chrome Debugger
   (Delve)                      (JavaScript/TypeScript)

        |                             |
        v                             v

   Backend API                 React Frontend
   Go + Gin                    Vite + React + TypeScript
```

The services themselves are still started independently using the project scripts (`npm`, `make`, `concurrently`).

VS Code is only responsible for attaching debuggers to the running processes.

---

## Debugging Concepts: Launch vs Attach

VS Code supports two main debugging modes:

### Launch

`launch` means that VS Code starts the application itself.

Example:

```json
{
  "name": "Backend (Go)",
  "type": "go",
  "request": "launch",
  "mode": "debug",
  "program": "${workspaceFolder}/backend/cmd/server",
  "cwd": "${workspaceFolder}/backend"
}
```

Flow:

```txt
VS Code
   |
   v
Delve
   |
   v
Go application
```

VS Code starts:

1. Delve debugger
2. The Go program
3. The debugging session

Advantages:

- Simple for isolated debugging
- No manual startup required
- Good for small applications

Limitations:

- VS Code controls the application lifecycle
- Not ideal when several services must run together

---

### Attach

`attach` means that the application is already running and VS Code connects to it.

Example:

```json
{
  "name": "Attach Backend",
  "type": "go",
  "request": "attach",
  "mode": "remote",
  "host": "127.0.0.1",
  "port": 2345
}
```

Flow:

```txt
Terminal / Makefile

    make debug-dev

          |
          v

      Delve
      :2345

          |
          v

      VS Code Attach
```

The application lifecycle is controlled by the project scripts.

Advantages:

- Works well with micro-services
- Compatible with `make`, `npm`, `docker`, `concurrently`
- Allows debugging a complete running environment

This is the preferred approach for SkoreFlow.

---

## Backend Debugging (Go)

The backend uses Delve.

Example Makefile command:

```bash
make debug-dev
```

which runs:

```bash
dlv debug \
    -ldflags="-X main.Version=<version>" \
    ./cmd/server \
    --headless \
    --listen=:2345 \
    --api-version=2 \
    --accept-multiclient
```

Delve starts a debug server:

```txt
API server listening at: [::]:2345
```

VS Code attaches using:

```json
{
  "name": "Attach Backend",
  "type": "go",
  "request": "attach",
  "mode": "remote",
  "host": "127.0.0.1",
  "port": 2345
}
```

Important:

- Port `2345` is the debugger port.
- Port `8080` is the HTTP API port.
- They are completely independent.

Example:

```txt
Delve debugger
      |
      | 2345
      |
      v

Go application
      |
      | 8080
      |
      v

HTTP API
```

---

## Frontend Debugging (React + TypeScript + Vite)

Vite does not require a separate debugger.

The debugger is provided by Chrome.

Architecture:

```txt
VS Code
    |
    | Chrome DevTools Protocol
    |
Chrome
    |
    |
React application
    |
    |
TypeScript source maps
    |
    v
.ts / .tsx files
```

The Vite server is simply started normally:

```bash
npm run vm:frontend
```

Example output:

```txt
VITE ready

Local: http://localhost:5173/
```

Then VS Code launches Chrome:

```json
{
  "name": "Frontend (Chrome + Vite)",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/frontend"
}
```

The debugger can then stop on:

- React components
- Hooks
- TypeScript services
- API clients
- State management code

Example:

```tsx
export default function MainPage() {
  debugger;

  return <div>Main Page</div>;
}
```

The `debugger` statement is a useful test to verify that Chrome is correctly attached.

---

## Source Maps

Source maps allow the debugger to translate:

```txt
Browser JavaScript
        |
        v
Generated Vite bundle
        |
        v
Original TypeScript files
```

With Vite, normally this configuration is sufficient:

```json
{
  "webRoot": "${workspaceFolder}/frontend"
}
```

Additional `sourceMapPathOverrides` should only be added if breakpoints cannot be resolved.

---

## Full Stack Debugging

A complete debugging session can run:

```txt
Terminal

npm run debug

       |
       +----------------+
       |                |
       v                v

 Backend            Frontend
 Delve              Vite
 :2345              :5173

       |                |
       v                v

 VS Code           Chrome Debugger
 Attach            Launch
```

VS Code can combine several debug configurations using `compounds`.

Example:

```json
"compounds": [
    {
        "name": "Debug Full Stack",
        "configurations": [
            "Attach Backend",
            "Frontend (Chrome + Vite)"
        ]
    }
]
```

Then one action starts:

- Go backend debugging
- React frontend debugging

---

## Recommended SkoreFlow Workflow

### Start services

```bash
npm run debug
```

This starts:

```txt
Thumbnail service
Backend (Delve enabled)
Frontend (Vite)
```

### Attach debuggers

Use VS Code:

```txt
Debug Full Stack
```

or individually:

```txt
Attach Backend
Frontend (Chrome + Vite)
```

---

## Summary

| Component      | Debugger        | Mode           | Port |
| -------------- | --------------- | -------------- | ---- |
| Go Backend     | Delve           | Attach         | 2345 |
| HTTP API       | Gin             | Normal runtime | 8080 |
| React Frontend | Chrome Debugger | Launch         | 5173 |
| Vite           | None            | Normal runtime | 5173 |
| Vitest         | Node Debugger   | Launch         | -    |

The main principle:

**Services are started by the project tooling. VS Code only attaches the required debuggers.**

This approach keeps the development environment close to production and scales naturally when new services are added.
