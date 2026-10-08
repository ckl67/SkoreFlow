# SkoreFlow Frontend Handbook

[← back](../doc.md)

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
`await` cannot be used directly within a React component
Example

```tsx
const res1 = await GetComposersPage();
```

A React component is not asynchronous.
We must use `useEffect()`.

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
