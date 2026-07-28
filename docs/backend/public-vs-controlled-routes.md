# Public vs Controlled API Routes

## Background

In order to facilitates the api, an approach was to create a Protected or Public routes (Optional authenticated users only)

- If token present then protected
- If No token the public for demo
  Thanks to a resources with an `OptionalAuthMiddleware`.

```go
  controlled := api.Group("/")
  controlled.Use(middlewares.OptionalAuthMiddleware())
  {
    controlled.GET("/composers", composerCtrl.GetComposersPage) // vitest
    controlled.GET("/composers/:id", composerCtrl.GetComposer)  // vitest

    controlled.GET("/composers/:id/picture", composerCtrl.GetComposerPicture)
  }

  protected := api.Group("/")
  protected.Use(middlewares.AuthMiddleware())
```

The idea was simple:

- anonymous users could access public data,
- authenticated users would automatically receive additional capabilities.

Example:

```Shell
GET /api/composers/:id/picture
```

The middleware detected whether a JWT token was present and populated the user
context when available.

## Problem

Although technically correct, this approach introduced unexpected behavior.

When authenticated and anonymous requests targeted the same URL, browsers could
reuse cached responses inconsistently, especially for image resources using
`Cache-Control: public`.

This resulted in intermittent CORS failures depending on browser cache state.

The issue was difficult to reproduce because it depended on browser cache,
authentication state and request history.

## Decision

Public and authenticated resources will be exposed through different endpoints.

Examples:

```shell
GET /api/public/composers/:id/picture
GET /api/composers/:id/picture
```

Public endpoints never require authentication.

Authenticated endpoints always require authentication.

## Benefits

- Clear API semantics.
- Simpler routing.
- No OptionalAuth middleware.
- Independent cache entries.
- Predictable browser behavior.
- Easier debugging.

## Conclusion

Although this duplicates a small number of routes, the resulting architecture
is simpler and more robust.
