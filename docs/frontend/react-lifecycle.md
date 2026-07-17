# React Component Lifecycle

Understanding Render, State, Effects and Cleanup

## Introduction

One of the biggest challenges when learning React is understanding **when code is executed**.
Unlike a traditional imperative program, React continuously rebuilds the user interface whenever the application state changes.
A React component should therefore be seen as **a function that describes the UI for the current application state**.

## The Three Phases of a React Component

Every component repeatedly goes through three possible phases:

```text
Render
   │
   ▼
Effect
   │
   ▼
Cleanup (optional)
```

The component may repeat this cycle many times during its lifetime.

## 1. Render Phase

The Render phase is simply the execution of the component function.

Example:

```tsx
export default function AvatarMenu() {
  const avatarURL = useAvatar(user?.id);

  return <img src={avatarURL} />;
}
```

Every line of this function is executed.

Nothing is displayed yet.

React only computes **what should be displayed**.

## useState During Render

Consider:

```tsx
const [url, setURL] = useState<string | null>(null);
```

`useState()` creates a persistent value owned by React.

The variable itself is **not persistent**.

Instead, React remembers its value between renders.

```text
Render ##1

url = null
    ↓
setURL("new value")
    ↓
Render ##2

url = "new value"
```

Never modify a state variable directly.

Always use its setter function.

## After Render: useEffect

Once React has updated the DOM, it executes every matching effect.

Example:

```tsx
useEffect(() => {
  console.log('Loading avatar');
}, [userId]);
```

This effect runs **after rendering**, never during rendering.

## Dependency Array

The dependency array tells React when an effect should be executed.

```text
[]
```

Runs only once after the component is mounted.

```text
[userId]
```

Runs:

- after the first render
- every time userId changes

```text
No dependency array
```

Runs after every render.

## State Changes Trigger New Renders

Suppose the effect downloads an avatar.

```tsx
const blob = await getAvatar();

const objectURL = URL.createObjectURL(blob);

setURL(objectURL);
```

Calling

```tsx
setURL(...)
```

does **not** immediately modify `url`.

Instead it tells React:

> "The state has changed.
> Please render this component again."

React then performs another render.

## Complete Rendering Sequence

```text
      Render
        ↓
    url = null
        ↓
Component returns JSX
        ↓
  React updates DOM
        ↓
    useEffect()
        ↓
  Download avatar
        ↓
    setURL(...)
        ↓
React schedules another render
        ↓
  Render again
        ↓
  url = "blob:..."
        ↓
React updates only the image
```

## Why React Re-renders

A component re-renders whenever:

- a state changes
- a prop changes
- a parent component renders
- a context value changes

Example:

```text
  User logs in
      ↓
AuthContext changes
      ↓
AvatarMenu re-renders
      ↓
useAvatar(user.id)
      ↓
Avatar changes
```

## Cleanup Functions

Every effect may optionally return a cleanup function.

Example:

```tsx
useEffect(() => {
  const objectURL = URL.createObjectURL(blob);

  return () => {
    URL.revokeObjectURL(objectURL);
  };
}, [userId]);
```

The cleanup is executed:

- before the effect runs again
- when the component is removed

## Cleanup Timeline

```text
      Effect
        ↓
    Create Object URL
        ↓
    Display Image
        ↓
    User changes
        ↓
    Cleanup
        ↓
    Destroy previous Object URL
        ↓
    New Effect
        ↓
    Download new avatar
        ↓
    Create new Object URL
```

## Why Cleanup Matters

Some effects create resources outside React.

Examples:

- Blob URLs
- Timers
- WebSocket connections
- Event listeners
- Intervals
- Audio streams

If they are never cleaned up, the application slowly leaks memory.

Always release external resources.

## React Is Declarative

React is not told _how_ to modify the DOM.

Instead, we describe _what_ the UI should look like.

Example:

```tsx
return avatarURL ? <img src={avatarURL} /> : <DefaultAvatar />;
```

We never say:

```text
Replace the image.
```

Instead we say:

```text
If an avatar exists,
display an image.
Otherwise,
display the default avatar.
```

React compares the previous UI with the new one and performs the minimum DOM updates automatically.

## Custom Hooks

A custom hook extracts reusable logic.

```text
    AvatarMenu
        ↓
    useAvatar()
        ↓
    getAvatar()
        ↓
    apiBinaryRequest()
        ↓
    Backend
        ↓
    PNG file
```

The component does not know how the avatar is loaded.

It only receives a URL.

This separation makes components much simpler.

## Blob URL Lifecycle

```text
    Backend
      ↓
    PNG file
      ↓
    Blob
      ↓
URL.createObjectURL()
      ↓
blob:http://localhost/...
      ↓
 <img src="blob:...">
       ↓
   Cleanup
      ↓
URL.revokeObjectURL()
```

## React Strict Mode

In development mode, React intentionally mounts components twice.

Example:

```text
  Render
    ↓
  Effect
    ↓
  Cleanup
   ↓
  Render
   ↓
  Effect
```

This is normal.

Its purpose is to detect bugs caused by improperly written effects.

This behavior disappears in production builds.

Note: In development mode, React StrictMode may trigger the avatar request twice. This is expected behavior and does not occur in production builds.

## Mental Model

Think of a React component as a pure function.

```text
Current State
    ↓
Component
    ↓
  JSX
    ↓
  DOM
```

When the state changes:

```text
New State
    ↓
Component executes again
    ↓
New JSX
    ↓
React updates only what changed
```

## Key Takeaways

- Components are executed many times.
- State survives between renders.
- `setState()` schedules a new render.
- Effects run after rendering.
- Cleanup runs before the next effect or when the component is removed.
- Components describe the UI.
- React updates the DOM automatically.
- Custom hooks encapsulate reusable logic.
- Always clean up external resources such as Blob URLs, timers and subscriptions.
