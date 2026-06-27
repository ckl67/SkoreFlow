# SkoreFlow Frontend Handbook

From React Fundamentals to Production Architecture

## Purpose

This handbook explains the architecture adopted for SkoreFlow's frontend.

Its goal is not only to explain _what_ to write, but _why_ each layer exists and how all layers work together.

This document should become the main reference when implementing future modules such as:

- Authentication
- Composer
- Scores
- Administration
- Settings
- User Profiles

---

## Convention

| Type                           | Convention              |
| ------------------------------ | ----------------------- |
| Component React                | PascalCase              |
| Hook                           | camelCase with `use`    |
| Function                       | camelCase               |
| Utility Files                  | camelCase               |
| Entry Point of the application | low case (Ex: main.tsx) |

---

## Part 1 - React Fundamentals

### What is React?

React is a UI library based on components.

Instead of manually manipulating the DOM, we describe the interface using components and React updates the UI when state changes.

### Traditional DOM

```text
User action
    ↓
JavaScript
    ↓
Manual DOM manipulation
```

### React

```text
User action
    ↓
State change
    ↓
React rerender
    ↓
DOM update
```

---

### Components

A component is a **Personal** function that returns JSX.
Objective to be used in React rendering part like html tags

```tsx
function LoginPage() {
  return <h1>Login</h1>;
}
```

Components should start with PascalCase.

Good:

```tsx
LoginPage;
AvatarMenu;
AuthProvider;
```

Bad:

```tsx
loginPage;
avatarMenu;
```

---

### Props

Props allow a parent component to pass data to a child component.

```tsx
<FormInput label="Email" />
```

The child receives:

```tsx
function FormInput({ label }) {
  ...
}
```

Think:

Parent → Props → Child

---

### State

State is data owned by a component.

```tsx
const [email, setEmail] = useState('');
```

React remembers the value between renders.

Flow:

```text
User types
    ↓
onChange
    ↓
setEmail()
    ↓
State updated
    ↓
Rerender
```

---

### Hooks

Hooks are special React functions.

Examples:

```tsx
useState();
useEffect();
useContext();
```

Custom hooks:

```tsx
useAuth();
useLogin();
useRegister();
```

A custom hook is used to encapsulate logic that can be reused.

---

## Part 2 - Routing

### Router

SkoreFlow uses React Router.

Entry point:

```tsx
<RouterProvider router={router} />
```

---

### Link

For visual navigation:

```tsx
<Link to="/login">Login</Link>
```

Use Link whenever the user clicks a visible navigation element.

---

### useNavigate

Used when navigation is triggered by code.

Example:

```tsx
navigate('/me');
```

after a successful login.

---

### Outlet

Outlet represents the page selected by the router.

```text
MainLayout
 ├── TopNavbar
 ├── SideNavbar
 └── Outlet
```

If route = /composers

```text
Outlet = ComposersPage
```

If route = /me

```text
Outlet = MePage
```

---

## Part 3 - Context and Global State

### The Problem

Many components need authentication information.

Without Context:

```text
App
 ↓
Navbar
 ↓
Menu
 ↓
Avatar
```

The user would have to be passed through props.
From component App(...prop) --> Navbar(...props) and so one !

This becomes painful.

---

### AuthContext

AuthContext stores authentication state globally.

Examples:

```ts
user;
token;
isAuthenticated;
```

---

### AuthProvider

AuthProvider owns the authentication state.

Responsibilities:

- Store user
- Store token
- Login
- Logout
- Refresh profile
- Persist localStorage

Architecture:

```text
AuthProvider
 ├── user
 ├── token
 ├── login()
 ├── logout()
 └── refreshMe()
```

---

### useAuth

Instead of:

```tsx
useContext(AuthContext);
```

we use:

```tsx
const { user } = useAuth();
```

Benefits:

- Cleaner code
- Centralized validation
- Easier maintenance

---

## Part 4 - Layered Architecture

### Why Use Layers?

A common beginner page:

```text
LoginPage
 ├─ UI
 ├─ API
 ├─ Auth
 ├─ Navigation
 └─ Storage
```

Works initially.

Becomes difficult later.

---

### SkoreFlow Architecture

```text
UI Layer
 ↓
Hook Layer
 ↓
Service Layer
 ↓
API Layer
 ↓
Backend
```

Each layer has one responsibility.

---

## UI Layer

Folders:

```text
pages/
components/
layouts/
```

Responsibility:

Display information.

Should not know API details.

Examples:

```text
LoginPage
RegisterPage
TopNavbar
AvatarMenu
```

---

## Hook Layer

Folder:

```text
hooks/
```

Responsibility:

Represent a user action.

Examples:

```text
useLogin
useRegister
useScores
useComposer
```

Question answered:

"What does the user want to do?"

---

## Service Layer

Folder:

```text
services/
```

Responsibility:

Talk to backend endpoints.

Example:

```ts
authService.login();
```

Question answered:

"Which endpoint must be called?"

---

## API Layer

Folder:

```text
api/
```

Responsibility:

HTTP mechanics.

Examples:

- Axios
- Headers
- Authorization
- Error handling

Question answered:

"How is the request executed?"

---

## State Layer

Folder:

```text
auth/
```

Responsibility:

Global application state.

Question answered:

"What is the current application state?"

---

## Part 5 - Login Deep Dive

### LoginPage

Responsibilities:

- Display form
- Collect email/password
- Call hook

Nothing more.

---

### useLogin

Responsibilities:

- Execute login use case
- Coordinate service and state

---

### authService

Responsibilities:

- Call POST /login

---

### apiRequest

Responsibilities:

- Execute HTTP request
- Attach JWT token
- Handle errors

---

### AuthProvider Detail

Responsibilities:

- Store token
- Store user
- Update localStorage

---

### Complete Flow

```text
User
 ↓
LoginPage
 ↓
useLogin
 ↓
authService.login
 ↓
apiRequest
 ↓
Backend

Backend Response
 ↓
AuthProvider.login
 ↓
State Updated
 ↓
navigate('/')
```

---

## Part 6 - Decision Tree

Before writing code, ask:

### Is it UI?

Place in:

```text
pages/
components/
```

---

### Is it a user action?

Place in:

```text
hooks/
```

---

### Is it a backend call?

Place in:

```text
services/
```

---

### Is it HTTP infrastructure?

Place in:

```text
api/
```

---

### Is it global state?

Place in:

```text
auth/
context/
```

---

## Part 7 - Future SkoreFlow Modules

### Authentication

```text
LoginPage
 ↓
useLogin
 ↓
authService
```

### Composer

```text
ComposerPage
 ↓
useComposer
 ↓
composerService
```

### Scores

```text
ScoresPage
 ↓
useScores
 ↓
scoreService
```

### Administration

```text
AdminPage
 ↓
useAdmin
 ↓
adminService
```

Same pattern everywhere.

---

## Part 8 - Common Mistakes

### Mistake 1

Putting API calls inside components.

---

### Mistake 2

Putting business logic inside UI.

---

### Mistake 3

Creating hooks for simple links.

Bad:

```tsx
useGoHome();
```

Good:

```tsx
<Link to="/" />
```

---

### Mistake 4

Confusing local state and global state.

Local:

```tsx
email;
password;
menuOpen;
```

Global:

```tsx
user;
token;
isAuthenticated;
```

---

## Part 9 - Mental Model

Remember:

UI Layer
→ What does the user see?

Hook Layer
→ What does the user want to do?

Service Layer
→ Which endpoint should be called?

API Layer
→ How is the request executed?

State Layer
→ What is the current application state?

---

## Final Conclusion

The objective is not to create more files.

The objective is to separate responsibilities.

Benefits:

- Easier maintenance
- Easier testing
- Better readability
- Better scalability
- Cleaner architecture

The same architecture can be reused for every future SkoreFlow module.
