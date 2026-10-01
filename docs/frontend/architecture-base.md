# SkoreFlow Frontend Architecture

[← back](../doc.md)

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

The FrontEnd test is performed through Vitest and Manual tests, perhaps later Playwright if necessary, in dedicated workspaces.

### Responsibilities

#### backend/

Remember backend contains the Go API.

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

```shell
shared/
├── types/
│   └── auth.ts
├── frontend/
│   └── enums/
└── backend/
```

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

## The 3 golden rules to help you find your way around

### React’s role: “The Signalman”

React doesn’t know what a PDF is. It can only do two things:

- Pass variables down the component tree (from the parent component to the child component via props).
- Trigger a refresh when a state (useState) changes or a URL parameter changes.

### The role of PDF.js: “The Painter”

PDF.js doesn’t know it’s part of a React application.

- It receives a .pdf file.
- It calculates the page sizes.
- It draws the pixels onto an HTML canvas (<canvas>).

Problem: As it draws asynchronously (it takes a few milliseconds), we need to keep track of its work (renderTasks) so that we can tell it to “stop writing” if the user leaves the page.

### The coordinate system: “The Map and the Zoom”

This is often the most abstract part.

PDF coordinates (The Map): The exact position of a city on Earth (e.g. latitude/longitude).
This never changes, regardless of the screen size.
The annotation saves this position in the database.

Viewport coordinates (The Screen): The position in pixels on the computer or phone screen.
If you zoom in or close the sidebar, the pixel position changes, but the town on the map remains in the same place.

- convertToPdfPoint converts a screen click into a “Map” position.
- convertToViewportPoint takes the “Map” position and calculates where to display the red circle on the screen.
