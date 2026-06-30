# Vite Environment Variables & Deployment Guide

[← back](./../index.md)

## 1. Overview

Vite supports environment variables that are injected at **build time**.
These variables are used to configure the application depending on the environment:

- Development (local machine)
- Test environment
- Production (e.g. Render, Vercel, etc.)

## 2. Naming Convention

Only variables prefixed with : **VITE\_** are exposed to the frontend code.

Example:

```env
VITE_API_URL=http://localhost:8080/api
VITE_TEST_MODE=true
```

## 3. How Vite loads environment files

Vite automatically loads environment files based on the selected mode:

| Mode                     | Loaded files           |
| ------------------------ | ---------------------- |
| development              | .env, .env.development |
| production               | .env, .env.production  |
| custom mode (`--mode X`) | .env.X                 |

Example : .env.render
You must run Vite with: vite build --mode render

## Strings only

All env variables are strings:

```vite
VITE_TEST_MODE="true" // string, not boolean
```

Convert manually if needed:

const testMode = import.meta.env.VITE_TEST_MODE === "true";
