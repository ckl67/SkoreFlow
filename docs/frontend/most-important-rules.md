<!-- cspell:ignore Flexbox     -->

# React and Javascript most important rules

## JavaScript Equality Operators: `==` vs `===`

### Core Difference

- **`==` (Loose / Abstract Equality):** Compares values **after performing type conversion** (coercion) if the types differ.
- **`===` (Strict Equality):** Compares **both value and type** without converting anything.

### Comparison Matrix & Examples

| Comparison           | Result  | Why?                                                      |
| :------------------- | :------ | :-------------------------------------------------------- |
| `5 === 5`            | `true`  | Same type (number), same value.                           |
| `5 === '5'`          | `false` | Different types (`number` vs `string`).                   |
| `5 == '5'`           | `true`  | String `'5'` is converted to number `5` before comparing. |
| `0 == false`         | `true`  | `false` is coerced to `0`.                                |
| `0 === false`        | `false` | Different types (`number` vs `boolean`).                  |
| `null == undefined`  | `true`  | Special rule: they loosely equal each other.              |
| `null === undefined` | `false` | Different types.                                          |

### Why `page === 1` is Best Practice in React

In React and TypeScript, state values often come as numbers or strings.

Using strict equality (`page === 1`) protects your UI logic from unexpected bugs:

```typescript
// If page is accidentally stored as a string "1":
page === 1; // false (Prevents unwanted logic branches)
page == 1; // true  (Hides the underlying type bug)
```

## Arrow function

### Principle

Arrow Functions `() => {return x }` or `() => x` or `() => (x)`

Introduced in ES6, **arrow functions** provide a concise syntax for writing anonymous functions in JavaScript.

### Syntax Comparison

```javascript
// Standard function
function add(a, b) {
  return a + b;
}

// Arrow function (explicit return)
const add = (a, b) => {
  return a + b;
};

// Arrow function (implicit return - single expression)
// const add = (a, b) => (a + b);
// or
const add = (a, b) => a + b;
```

```javascript
//On a single line (no need for brackets):
const renderItem = (score) => <ScoreItem score={score} />;

// Across several lines (brackets come in very handy):
const renderItem = (score) => (
  <div className="card">
    <h2>{score.name}</h2>
    <ScoreItem score={score} />
  </div>
);
```

## JavaScript Closures & Returning Object Methods

A function in JavaScript can **only return a single value**.
When a function seems to provide multiple actions, it is actually returning **one single Object** that wraps multiple functions (methods) inside it.

```javascript
// The function returns ONE object (a "toolbox")
return {
  connect() { ... },   // Method 1
  disconnect() { ... } // Method 2
};
```

### What is a Closure?

A closure happens when an inner function "remembers" and keeps access to variables from its parent (outer) function, even after the parent function has finished executing.

- Without Closures: Local variables are destroyed as soon as the function finishes.
- With Closures: The returned inner methods carry the outer variables with them in memory.

### Classical function Example

A classic example: A function that returns a single value

```JavaScript
function calculatePriceInclTax(prixHT) {
const tva = 0.20;
return prixHT * (1 + tva); // <--- Returns a SINGLE number
}

const prixFinal = calculatePriceInclTax(100); // prixFinal= 120
```

### Closure Practical Example

This classic example demonstrates how a single returned object uses a closure to maintain state.

```javascript
function createCounter() {
  let count = 0; // Private state variable captured by the closure

  // Returns ONE object containing two methods
  return {
    increment() {
      count++;
      console.log('Count:', count);
    },
    decrement() {
      count--;
      console.log('Count:', count);
    },
    // a method that displays the value
    current() {
      console.log('Current count:', count);
    },
    // Or (even more convenient) a method that RETURNS the value
    getCount() {
      return count;
    },
  };
}

// 1. Call the function: it returns ONE object : toolbox
const myCounter = createCounter();

// 2. Use the methods attached to that object:
myCounter.increment(); // Count: 1
myCounter.increment(); // Count: 2
myCounter.decrement(); // Count: 1
myCounter.current(); // Current count: 1
const value = myCounter.getCount(); // value = 1
```

A closure is: **A function + Its scope (its variables)**
It is not what the return : **it is what the returned function retains in memory.**

## Hook : useState

useState is a React Hook that lets you add a state variable to your component.

`const [state, setState] = useState(initialState)`

Call useState at the top level of your component to declare one or more state variables.

```ts
import { useState } from 'react';

function MyComponent() {
  const [age, setAge] = useState(42);
  const [name, setName] = useState('Taylor');
  // ...
```

The convention is to name state variables like [something, setSomething] using array destructuring.

useState returns an array with exactly two items:

- The current state of this state variable, initially set to the initial state you provided.
- The set function that lets you change it to any other value in response to interaction.

To update what’s on the screen, call the set function with some next state:

```ts
function handleClick() {
  setName('Robin');
}
```

React will store the next state, render your component again with the new values, and update the UI.

## Hook : useEffect

useEffect is a React Hook that lets you synchronize a component with an external system.

### The golden rule

React was designed with a very simple rule for useEffect,useLayoutEffect function
It interpret the **return statement of the function as a clean-up instruction**
if your setup function returns a function, React stores that function in its memory.

React does NOT execute the **return** straight away. It stores it, thinking:
_“OK, the developer has given me a clean-up function. I’ll keep it safe and execute it later, when the current connection is no longer needed.”_

### setting

useEffect takes two arguments: `useEffect(function, [dependencies])`

- The function to be executed
  - This is the code you want to run. React executes it after updating the screen.
- The array of dependencies [count]
  - This is the list of variables to watch:
    - [count]: “Run this effect only if count has changed.”
    - [] (empty array): “Run this effect ONCE, when the component loads (like an application start-up).”
    - No array at all: “Execute this effect EVERY time the component is re-rendered." (To be avoided 99 per cent of the time).

### cleanup

Try to write every Effect as an independent process and think about a single setup/cleanup cycle at a time. It shouldn’t matter whether your component is mounting, updating, or unmounting. When your cleanup logic correctly “mirrors” the setup logic, your Effect is resilient to running setup and cleanup as often as needed.

### Example

```ts
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();
  return () => {
    connection.disconnect();
  };
}, [roomId, serverUrl]);
```

- useEffect(...) returns undefined
  - you cannot write x = useEffect(...)
- setup is an arrow function.
  - React executes setup() when the component is mounted or when "roomId" / "serverUrl" changes.
  - At that point, setup() establishes the connection and calls connection.connect().
  - If your `setup` function returns a function, React stores that function in its memory.
    - return () => { connection.disconnect(); };

### Process

- Step 1: You open the “general” chat room
  - React calls setup().
  - A connection to “general” is established: connection.connect().
  - setup() completes and returns a small function () => connection.disconnect() to React.
  - React keeps this in reserve.
- Step 2: You click on the menu and select “travel”
  - Before the user can be connected to the “travel” chat room, the “general” chat room must be closed.
  - React knows that the dependencies have changed (“general” → “travel”). It will therefore perform two consecutive actions:
    - First, it takes the function it had kept in reserve in Step 1 and executes it:
    - → connection.disconnect() is called (disconnecting from “general”).
    - Next, it re-executes setup() for the new chat room:
      - → A new connection is created to “travel”, and React keeps the new clean-up function in reserve.

## JavaScript try...catch...finally & Execution Flow

### Role of finally

The `finally` block **always executes**, regardless of whether the `try` succeeded or an error was caught in `catch`.

It is primary used for **cleanup code** (e.g., hiding loading spinners, closing network connections, or releasing file handles) to prevent memory leaks and stuck state UI.

```javascript
try {
  setIsLoading(true);
  const data = await fetchData();
  setData(data);
} catch (err) {
  setError('Failed to load data');
} finally {
  // Guaranteed to run in ALL cases (success or error)
  setIsLoading(false);
}
```

### Interaction with return Statements

Execution Order

If a return statement is reached inside try or catch, JavaScript pauses the return, executes the finally block, and then completes the function exit.

```javascript
function getData() {
  try {
    return 'Data';
  } finally {
    console.log('Cleanup complete!'); // Runs BEFORE the function returns "Data"
  }
}
```

⚠️ Pitfall: Never return inside finally

```javascript
// BAD PRACTICE
function badExample() {
  try {
    throw new Error('Something broke!');
  } finally {
    return 'All good!'; // ❌ Silence/overwrites the caught error completely!
  }
}
```

## JavaScript `.map()` in React

### Core Concept

The `.map()` method creates a **new array** populated with the results of calling a provided function on **every element** in the calling array.
In React, it is the standard way to transform an array of data objects into an array of UI components (JSX elements).

### Syntax & Breakdown

```javascript
{
  !isLoading && !error && (
    <ul>
      {scores.map((score) => (
        <ScoreItem key={score.id} score={score} onSelect={() => navigate(`/scores/${score.id}`)} />
      ))}
    </ul>
  );
}
```

### Key Elements

- scores: The source array (e.g., ScorePublicResponse[]).
- (score) => (...): The callback function executed for each item in the array.
- key={score.id}: Mandatory in React lists. Helps React identify which items have changed, been added, or removed for efficient DOM re-rendering.
- Implicit Return () => (...): Using parentheses () instead of curly braces {} implicitly returns the JSX element without needing the return keyword.

### How React Renders It

Given an array of 3 scores:

```javascript
// Input Data
[
  { id: 101, name: 'Symphony No. 5' },
  { id: 102, name: 'Moonlight Sonata' },
];

// .map() transforms it behind the scenes into: Resulting JSX Array
[<ScoreItem key="{101}" score="{...}" />, <ScoreItem key="{102}" score="{...}" />];
```

## React Router `useParams`

### Concept

`useParams` is a hook from React Router that returns an object of key/value pairs of dynamic params from the current URL that were matched by the `<Route path>`.

### Example Flow

1. Route definition: `/scores/:id`
2. Current URL: `/scores/42`
3. `useParams()` output: `{ id: "42" }`

Curly brackets < ... > are used to pass a type to a TypeScript function (known as a generic function).

```typescript
// Destructure 'id' from params and types it as string in TypeScript
// With : useParams<{ id: string }>()
// We are telling useParams: “that we will return an object with an id property of type string”.
// will return { id: "42" }
const params = useParams<{ id: string }>();
const id = params.id;

// or in 1 line
const { id } = useParams<{ id: string }>();

// Converts string "42" to number 42 for API calls/hooks
const scoreId = Number(id);
```

## Handling Async PDF Render Tasks in React

### Purpose

`renderTasks.current.add(task)` registers active PDF.js `RenderTask` instances inside a `useRef<Set<RenderTask>>`.

### Workflow

1. **Registration:** `<PdfPage />` starts rendering and notifies `<PdfViewer />` via `onRenderTask(task)`.
2. **Cancellation:** When the component unmounts or `fileURL` updates, `usePdfLoader` iterates over `renderTasks` and calls `.cancel()` on each.

### Benefits

- Prevents race conditions when re-rendering pages on window resize.
- Eliminates memory leaks and console errors (`Rendering cancelled`) on unmount.

## Hooks and Components?

- A React Component: This is a function that takes props and returns JSX (virtual HTML). Its sole purpose is to describe what should be displayed on screen.

- A Custom Hook: This is a function that begins with `use...` and manages state and `useEffect`. It does NOT return JSX, but rather data or references.

## Hook

90 per cent of custom hooks that read data from a server (API) follow exactly the same basic structure:

```javascript
export function useScore(id: number) {
  const [score, setScore] = useState<GetScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;
    let cancelled = false;
    async function load() {
      try {
        // React immediately applies the pending changes (isLoading = true and error = null)
        // and performs the first re-render (to display the spinner, for example).
        setIsLoading(true);
        setError(null);
        // ! The server will for example take example, 300 milliseconds to respond.
        // But React will not block and continue on a other place
        const res = await getScore(id);
        // Once res got a answer
        // We will update the state ONLY if the component is still mounted
        if (!cancelled) {
          // This will render with the new score
          // "Hey React! The asynchronous request that ran for 300 ms has just finished!
          // Here’s the result, res.
          // Add it to the score state and trigger a new re-render so that
          // the screen finally displays the sheet music!"
          setScore(res);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('score', '[useScore] Failed to load scoreId:', id, 'err:', error);
          setError('Unable to load the partition information.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    // Clean-up function: executed if the ID changes or if the component is unmounted
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { score, isLoading, error };
}


```

1. Three states: [data, setData] | [isLoading, setIsLoading] | [error, setError]
2. A useEffect: Triggered by the dependency (e.g. [id] or [page])
3. A function: async function load() { ... await ... setData(res) }
4. A return value: { data, isLoading, error }

## Tailwind

```javascript
className = 'relative mx-auto shrink-0';
```

### shrink-0 (Crucial)

By default, within a Flexbox container, children have `flex-shrink: 1`, which means that the browser attempts to shrink the element so that it fits on the screen. By setting `shrink-0` (`flex-shrink: 0`), you’re telling Flexbox: ‘Do not shrink this div; strictly maintain the width calculated by the viewport (`viewport.width`).’

### mx-auto

When combined with `items-center` on the parent, `mx-auto` forces automatic margins on the left and right. As soon as the width exceeds the edge of the window, the browser sets the left edge to `x=0` instead of pushing the content into the inaccessible negative area.
