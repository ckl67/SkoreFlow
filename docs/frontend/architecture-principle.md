# Design Principle

## Target Architecture

1. UI
2. Routing
3. State
4. Hooks
5. Services
   Then
   Backend API

## Logical Architecture

1. UI Layer
   Pages + Components + Layouts
   👉 Responsibility:
   Display data and retrieve user actions.
   Trigger actions

   - LoginPage
   - RegisterPage
   - TopNavbar
   - AvatarMenu
   - MainLayout

2. Routing Layer
   👉 Responsibility:
   Decide which page to display.
   Protect routes (ProtectedRoute)

   - router.tsx
   - ProtectedRoute.tsx

3. State Layer
   AuthProvider + useAuth
   👉 Responsibility:
   Maintain the overall state of the application.

   - user
   - token
   - theme
   - language
   - notifications
   - login/logout
   - refresh session

4. Hooks Layer (very important)
   👉 Responsibility:
   - Orchestration service and state
   - logic frontend
     - useLogin()
     - useRegister()

       LoginPage
       ↓
       useLogin

5. Services Layer
   👉 Responsibility:
   - Call API
   - No UI logic
     - authService.ts
     - userService.ts

       authService.login()
       ↓
       apiRequest('POST', '/login')

```text

┌─────────────────────┐
│        UI           │
│ Pages Components    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│      Routing        │
│ router.tsx          │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│       State         │
│ AuthProvider        │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│       Hooks         │
│ useLogin            │
│ useRegister         │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│      Services       │
│ authService         │
│ userService         │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│        API          │
│ apiRequest          │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│      Backend        │
└─────────────────────┘

```
