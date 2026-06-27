# SkoreFlow Frontend Architecture

## Overview

The SkoreFlow frontend is a React + TypeScript application built with Vite.

The primary objective is not only to create a modern user interface but also to keep the frontend architecture simple, maintainable, and understandable for developers.

The frontend follows the same philosophy as the Go backend:

- Strong typing
- Explicit data structures
- Clear separation of responsibilities
- Predictable API communication
- Progressive implementation

The project is developed incrementally, route by route, rather than relying on large AI-generated codebases.

## Technology Stack

### Core

- React
- TypeScript
- Vite
- React Router
- Axios

### Development

- ESLint
- Prettier

### Testing

The FrontEnd test is performed through Vitest and Playwright in dedicated workspaces.

### Responsibilities

#### backend/

Remember contains the Go API.

Responsible for:

- Business logic
- Authentication
- Database access
- File storage
- Email workflows

#### frontend/

Contains the React application.

Responsible for:

- User interface
- Routing
- API consumption
- Session management

#### shared/

Contains TypeScript resources shared between frontend and automated tests.

Examples:

```text
shared/
├── types/
│   └── auth.ts
├── frontend/
│   └── enums/
└── backend/
```

## Routing Strategy

Routing is managed using React Router.

Example:

```tsx
createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/me',
    element: (
      <ProtectedRoute>
        <Me />
      </ProtectedRoute>
    ),
  },
]);
```

## API Response Model

The frontend mirrors the backend API contract.

### Backend Response

```ts
interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}
```

Examples:

Success:

```json
{
  "success": true,
  "data": {
    "token": "...",
    "user": {}
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials"
  }
}
```

## Shared DTO Philosophy

The frontend reuses DTOs stored inside: shared/types/
Benefits:

- Single source of truth
- No duplicated TypeScript definitions
- Consistent contracts between tests and frontend

## Authentication Strategy

Authentication is JWT based.

The backend returns:

```json
{
  "token": "...",
  "user": {}
}
```

after a successful login.
