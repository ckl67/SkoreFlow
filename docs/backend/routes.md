<!-- cspell:ignore  -->

# Route Execution Flow

## Principle

The main routing file api/routes.go instantiates controllers and initializes versioned base groups:

- /api/v1
- /api/v2

The version orchestrator (`api/routes/v1/routes.go`) accepts the /api/v1 group and delegates route registration to domain-specific functions (RegisterUserRoutes, RegisterScoreRoutes, etc.).

Each domain file (user.go, auth.go) defines its own middlewares and endpoints independently.

## API Versioning Strategy (V1 to V2)

When updating a specific domain _(e.g., changing the data model or upload strategy in score.go)_, create a dedicated file under V2: `api/routes/v2/scores.go`.

In `api/routes/v2/routes.go`:

- Register the new implementation via v2.RegisterScoreRoutes.
- Reuse unchanged V1 modules directly (v1.RegisterUserRoutes, v1.RegisterAuthRoutes).

This approach ensures modular separation, avoids code duplication, and enables progressive API updates.

```text

api/
├── routes.go              # Global orchestrator (/api/v1, /api/v2)
└── routes/
    ├── v1/
    │   ├── routes.go      # V1 orchestrator
    │   ├── health.go
    │   ├── auth.go
    │   ├── user.go
    │   ├── scores.go
    │   └── composers.go
    └── v2/
        ├── routes.go      # V2 orchestrator
        └── scores.go      # V2 overrides only
```

## Frontend Integration Strategies

To consume versioned API endpoints from the frontend, use one of the following deployment patterns:

### Feature Flags / User Settings

Toggle API versions dynamically within the application settings (e.g., "Enable V2 Preview").

- Disabled: HTTP client targets /api/v1.
- Enabled: HTTP client targets /api/v2.

### Separate Environments / Subdomains

Deploy distinct frontend builds pointing to specific API versions:

- Production (app.skoreflow.com) --> Consumes /api/v1.
- Beta/Dev (beta.skoreflow.com) --> Consumes /api/v2

### Progressive Migration

Migrate individual features incrementally without altering global configuration:

- Legacy features continue calling /api/v1/
- New features target /api/v2/
- Once migration is complete, update the base API path to /api/v2 and deprecate V1.
