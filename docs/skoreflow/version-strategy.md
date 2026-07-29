# Versioning Strategy for a Monorepo Architecture

This document explains how versioning, tagging, and deployment work across the SkoreFlow monorepo (backend, frontend, microservice).

## Versioning Standard (Semantic Versioning)

All microservices must strictly comply with Semantic Versioning (SemVer 2.0.0).

A version number is formatted as: **MAJOR.MINOR.PATCH**

- MAJOR: Incremented for incompatible API changes or breaking architectural shifts.
- MINOR: Incremented when adding backwards-compatible functionality (e.g., adding a new parameter or supporting a new image format like WebP).
- PATCH: Incremented for backwards-compatible bug fixes and minor adjustments.

## Core Principles

Managing a monorepo with multiple distinct modules requires a clear strategy to prevent build conflicts and versioning noise:

Independent Module Versioning: Each component (backend, frontend, thumbnail) evolves at its own pace.
Changing the frontend code does not require bumping the thumbnail service version.

Git Sub-Tags: Instead of a single global tag (e.g., v1.0.0), modules use domain-prefixed Git tags:

- backend/v2.0.1
- thumbnail/v1.1.0
- frontend/v1.0.4

No Committed Version Files: Generated version files (such as src/my_app/\_version.py) must never be committed to Git and should remain in .gitignore.
Version metadata is dynamically generated during the Build or Execution phase.

## Project Layout Overview

```Plaintext

SkoreFlow/ <-- Monorepo Root
  ├── backend/ <-- Go API (Receives version via Go -ldflags)
  ├── frontend/ <-- Vite/React (Receives version via vite.config.ts)
  └── microservice/
    └── thumbnail/ <-- Python/Flask (Receives version via \_version.py)
```

## End-to-End Workflow: Step-by-Step

Here is a complete scenario where you update the Backend and the Thumbnail Microservice simultaneously without modifying the Frontend.

### Step 1: Local Development

- Modify Go code in backend/.
- Modify Python code in microservice/thumbnail/.
- Test locally using the respective Makefile.
  - For Thumbnail, make run executes gen-version, creating `\_version.py` locally on the fly.
  - For Backend, Go injects the build flags at compile time.

### Step 2: Commit and Push

Save your changes in Git as a single atomic commit:

```Bash

# 1. Stage modified files
git add backend/ microservice/thumbnail/

# 2. Create the commit
git commit -m "feat: add webp support for thumbnail and update backend API"

# 3. Push to remote
git push origin main
```

At this stage, your commit has a unique Git Hash (e.g., a1b2c3d).

## Step 3: Tagging the Modules

Assign specific versions to the relevant modules for this commit:

```Bash

# Create a tag for the backend
git tag backend/v2.0.1

# Create a tag for the thumbnail service on the SAME commit
git tag thumbnail/v1.1.0

# Push tags to the remote repository
git push origin --tags
```

Git Internal Mechanics:

The commit a1b2c3d now carries two pointer labels: backend/v2.0.1 and thumbnail/v1.1.0.
The frontend/ directory remains pointing to its previous tag (e.g., frontend/v1.0.0).

### Step 4: Build and Deployment (CI/CD or Server)

During deployment or automated CI/CD pipelines, each service resolves its version metadata independently from the Git repository.

#### A. Backend Deployment (Go)

The deployment script executes:

```Bash

cd backend
make build
```

Inside the Go Makefile, the command git describe --tags --match "backend/\*" searches for the latest tag starting with backend/.
It resolves backend/v2.0.1.

- Go compiles the binary and embeds "v2.0.1" directly using -ldflags.
- Querying /version returns: {"version": "v2.0.1", "commit": "a1b2c3d"}.

#### B. Thumbnail Microservice Deployment (Python)

The deployment script executes:

```Bash

cd microservice/thumbnail
make gen-version
```

The Makefile dynamically generates src/my_app/\_version.py on the target machine:

```Python
**version** = "v1.1.0"
**commit** = "a1b2c3d"
**build_date** = "2026-07-29T13:00:00Z"
```

- Python boots up and reads \_version.py at runtime.
- Querying /version returns: {"version": "v1.1.0", "commit": "a1b2c3d"}.

#### C. Frontend Deployment (TypeScript / Vite)

The deployment script executes:

```Bash

cd frontend
npm run build

Vite executes git describe --tags --match "frontend/*".

```

Since no new frontend/\* tag was created for this commit, Git calculates the distance from the last tag, producing frontend/v1.0.0-1-ga1b2c3d (1 commit ahead of v1.0.0).

The static bundle is compiled with this metadata embedded in the environment variables.

## Key Benefits of This Architecture

- Zero Merge Conflicts: Generated files (\_version.py) are ignored by Git, eliminating version-related merge conflicts across branches.
- Granular Traceability: Every deployed service exposes its commit hash and version on its health/version endpoints, allowing developers to trace production errors back to the exact line of code in Git.
- Clean Release History: Component release logs remain isolated, clean, and meaningful.
