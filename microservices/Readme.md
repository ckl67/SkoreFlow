# Introduction

This directory will contain all microservices running on specific ports

## Multi-Module Version Isolation (Monorepo Strategy)

In a multi-module environment (containing `backend/`, `frontend/`, and `microservices/*`), components must evolve independently without forcing version bumps on untouched code.

### The Problem with Single Global Tags

Using a single global tag (e.g., `v1.2.0`) for the entire repository forces all microservices to share the same version number. If you modify only the `frontend/`, tagging the entire repository as `v1.3.0` falsely implies that the `backend/` and `thumbnail/` microservices received updates, creating unnecessary build steps and confusing deployment histories.

### The Solution: Service-Scoped Tags

By scoping tags with the service path (e.g., `thumbnail/v1.1.0`), each service maintains its own isolated release history:

```text
Commit Hash  | Target Files Changed                  | Applied Tags
--------------------------------------------------------------------------------------
8f3a12d      | frontend/src/components/Button.tsx    | frontend/v1.0.1
b4c90e1      | microservices/thumbnail/src/app.py    | thumbnail/v1.1.0
a1b2c3d      | backend/cmd/main.go & thumbnail/      | backend/v2.0.1 , thumbnail/v1.2.0
```

Consult the document [Versioning Strategy for a Monorepo Architecture](./../docs/skoreflow/version-strategy.md))
