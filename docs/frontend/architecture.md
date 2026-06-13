# SkoreFlow Frontend Architecture

## Overview

The SkoreFlow frontend is a React + TypeScript application built with Vite.

The primary objective is not only to create a modern user interface but also to keep the frontend architecture simple, maintainable, and understandable for developers coming from a backend-oriented background.

The frontend follows the same philosophy as the Go backend:

- Strong typing
- Explicit data structures
- Clear separation of responsibilities
- Predictable API communication
- Progressive implementation

The project is developed incrementally, route by route, rather than relying on large AI-generated codebases.

---

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

### Testing (planned)

Frontend tests will eventually be added independently from backend tests.

Current backend testing is performed through Vitest and Playwright in dedicated workspaces.

---

## Monorepo Structure

```text
SkoreFlow/
├── backend/
├── frontend/
├── shared/
├── testauto/
└── package.json
```

### Responsibilities

#### backend/

Contains the Go API.

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

#### testauto/

Contains:

- Backend integration tests
- End-to-end tests
- Playwright scenarios

---

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

### Philosophy

Each backend route should eventually have a corresponding frontend page.

Examples:

| Backend Route       | Frontend Page |
| ------------------- | ------------- |
| POST /login         | Login         |
| POST /auth/register | Register      |
| GET /me             | Me            |
| PUT /me/profile     | Profile       |
| GET /admin/users    | Admin Users   |

---

## API Layer

All HTTP communication is centralized inside:

```text
src/api/client.ts
```

---

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

Error:

```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials"
  }
}
```

---

## Shared DTO Philosophy

The frontend reuses DTOs stored inside:

```text
shared/types/
```

Example:

```ts
LoginRequest;
LoginResponse;

RegisterRequest;
RegisterResponse;

UserPublicResponse;
```

Benefits:

- Single source of truth
- No duplicated TypeScript definitions
- Consistent contracts between tests and frontend

---

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

---

## AuthContext

Authentication state is managed globally using React Context.

File:

```text
src/auth/AuthContext.tsx
```

Responsibilities:

- Store current user
- Store current token
- Login
- Logout
- Refresh current user
- Expose authentication state

---

## Token Persistence

The token is stored inside:

```js
localStorage;
```

Example:

```js
localStorage.setItem('token', token);
```

The user object is also cached:

```js
localStorage.setItem('user', JSON.stringify(user));
```

This allows session restoration after a page refresh.

---

## Protected Routes

Protected pages are wrapped inside:

```tsx
<ProtectedRoute>
  <Me />
</ProtectedRoute>
```

Responsibilities:

- Verify authentication
- Redirect unauthenticated users
- Prevent access to private pages

---

## React Component Philosophy

Every page follows the same structure.

## 1. State

```tsx
const [email, setEmail] = useState('');
```

State represents mutable UI data.

---

### 2. Handlers

```tsx
async function handleLogin() {}
```

Handlers define user actions.

Examples:

- Login
- Register
- Save profile
- Upload avatar

---

### 3. Render

```tsx
return <div>...</div>;
```

Render describes the UI.

When state changes:

```tsx
setEmail(...)
```

React automatically re-renders the component.

---

## Context Usage

Instead of passing user information through many components:

```tsx
const { login } = useAuth();
```

Components can access shared authentication data directly.

Benefits:

- Cleaner code
- No prop drilling
- Centralized authentication logic
- ...

## Design Principles

The frontend follows the same principles as the backend:

- Explicit over magic
- Type-safe contracts
- Shared DTOs
- Single responsibility
- Progressive complexity
- Testable architecture
- Backend-first design

The objective is for a backend-oriented developer to understand every layer of the frontend without relying on hidden framework behavior.
