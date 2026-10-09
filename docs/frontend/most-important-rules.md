<!-- cspell:ignore Flexbox  Limites jamais écrasé    -->

# React and Javascript most important rules

## React Design rules

Anything that represents data whose change must trigger an update to the interface is a "state" triggering render

Or expressed in another way

If the data needs to be retained by React and any change to it must trigger a re-render, then it must be stored in state.

## React Core Concept: Effects vs. Renders in React

### Variables

In a useEffect example in `useComposers` hook, if we set `let totalPages = 0;` as variable, it is reset every time the component is rendered. The value assigned in `useEffect` is lost once the effect ends.

SO WE need to convert it to a React state (`useState`):

### Rules of rendering

If there should be one rule to understand, it would will this one !
A useEffect hook on its own NEVER TRIGGERS A RENDER.

If a useEffect performs background operations (e.g., data fetching, logging, storage sync, analytics) **WITHOUT** invoking a **setState**
👉 React will NEVER trigger a re-render — even if the dependency array value changes 1,000 times!

🧠 Why? The Fundamental Mechanics

What actually triggers a React render:

- State Updates: Direct calls to a state updater (setState).
- Prop Changes: Parent re-renders passing updated props.
- Context Updates: Changes in consumed React Context.
- Explicit Overrides: Calling forceUpdate().

useEffect plays ZERO role in initiating this process.
The true role of the dependency array ([page]):

```ts
  useEffect(() => {
    async function loadScores() {
      ...
    }

    loadScores();
  }, [page]);
  return {
    scores,
    isLoading,
    error,
    totalPages,
  };
  }

```

The [page] dependency array DOES NOT mean "render when page changes".

It strictly means: "AFTER a render has already occurred (because page was mutated via setPage), execute this side effect **if page differs from the previous render.**"

- Effects are passive subscribers to renders, not render producers.
- setState is the sole engine of re-renders.

### Important

useEffect is as a post-render reaction, not as something that directly triggers the render.

🖱 onClick
↓
📦 setPage(...)
↓
🔄 Render ScoresPage
↓
🔹 useScores(page)
↓
⚡ useEffect [page]
↓
⏳ await getScoresPage(...)
↓
📦 setScores(...)
📦 setTotalPages(...)
📦 setIsLoading(false)
↓
🔄 Render ScoresPage

IMPORTANT : The declaration of useState line does not trigger rendering;
`const [page, setPage] = useState<number>(1);`
--> will not render !!

### Routes

It is the route (/scores) that triggers the first render.
👉 The routing event initiates the rendering phase (Mounting).

- Navigation (/scores)
  - The user navigates to the route /scores.
  - React Router identifies the match `{ path: '/scores', element: <ScoresPage/> }`.
  - React Router instructs React to mount and execute the <ScoresPage/> component.
  - 👉 This routing event initiates the **rendering phase** (Mounting).

- What happens after during the rendering process
  - Once React starts executing the ScoresPage() function is called :
  - `const [page, setPage] = useState<number>(1);`
    - React initializes the component’s internal state with the value 1.
    - The useState line does not trigger rendering;
    - it runs within the rendering process that is already underway, and just reserve memory space.

## Integrating PDF.js with React

### Goal

### State Initialization (useState)

```TypeScript
const [pages, setPages] = useState<pdfjsLib.PDFPageProxy[]>([]);
```

A PDFPageProxy object represents an individual page of a PDF document
extracted using PDF.js.
It does not directly contain an HTML image, but provides methods
for interacting with that page:

- page.getViewport({ scale: 1.0 }):
  - calculates the size and dimensions of the page.
- page.render({ canvasContext, viewport }):
  - renders the page onto an HTML `<canvas>` element.
- page.getTextContent():
  - extracts the plain text from the page for searching or selection.

TypeScript Generics: indicates that this property will contain an array ([]) of objects of type PDFPageProxy (provided by the PDF.js library).

Calling setPages triggers a component re-render once PDF pages are loaded and ready to be displayed.

Managing Asynchronous Canvas Rendering (useRef + useCallback)

The Problem: PDF.js renders pages asynchronously onto HTML <canvas> elements. Rapid UI updates (window resizing, route changes, or page switching) cause React to unmount canvas nodes before PDF.js finishes drawing, leading to memory leaks and the error:

`Error: Canvas rendering page already in progress`

The Solution:

### useRef(renderTasks)

```TypeScript
  const renderTasks = useRef<Set<pdfjsLib.RenderTask>>(new Set());
```

useRef(renderTasks): Acts as a silent, mutable registry holding active pdfjsLib.RenderTask objects without triggering unnecessary React re-renders.

renderTasks useRef: Allows to keep a set of tasks in memory without triggering a React re-render. Every time a task is added or removed.
Set: A JavaScript collection of unique elements, ideal for adding (.add()) or removing (.delete()) active tasks.

### useCallback

```TypeScript
const onRenderTask = useCallback((task: pdfjsLib.RenderTask) => {
renderTasks.current.add(task);
}, []);
```

useCallback: Memoizes onRenderTask so child components receive a stable function reference across renders.

### Cleanup Lifecycle

During component unmounting or dependency changes, the cleanup function iterates through renderTasks.current and calls .cancel() on every pending task to abort canvas operations cleanly.

### Summary

What exactly does `onRenderTask` capture?

```typescript

        {page && (
          <ScoreViewerItem
            key={page.pageNumber}
            page={page}
            pageNumber={page.pageNumber}
            width={containerWidth}
            zoom={zoom}
            onRenderTask={onRenderTask}
          />
        )}
```

`onRenderTask` does NOT capture clicks on the Prev, Next or Zoom buttons.

This function serves as a top-down communication channel:

- You click on `nextPage`.
  - React updates `currentPage` → this triggers a React re-render.

- The child component `<ScoreViewerItem/>` runs with the new page.
  - Inside `<ScoreViewerItem/>`, the PDF.js library begins rendering the score onto an HTML `<canvas>` and generates a task:
    `const task = page.render(...)`.
- <ScoreViewerItem/> calls onRenderTask(task) to return the task to ScoreViewer so that it is stored in renderTasks.current.

👉 In summary:
onRenderTask only records ongoing Canvas drawing tasks.
It allows you to cancel pending drawings if you press Next or Zoom again whilst the previous page has not finished loading.

Why is this approach NOT applied to all React renders (such as ScoresPage)?

In ScoresPage, you have a simple standard React component (HTML / JSX). React already handles cancellation automatically (Virtual DOM)
React’s virtual DOM is ultra-fast and synchronous in memory: you don’t have to manage anything manually.

Why It is needed with PDF.js

PDF.js is an external graphics engine (Imperative Canvas API)
A `<canvas>` does not have a virtual DOM. When PDF.js renders a score:
It sends thousands of direct graphics instructions to the CPU/GPU.
Unless you explicitly call `task.cancel()`, it will continue rendering in the background even if the React component has disappeared from the screen,
which causes the browser to crash or throws errors.

### Key Architectural Takeaway

Connecting imperative DOM/Canvas libraries (like PDF.js) with React's declarative state model requires decoupling the render pipeline from side effects. Using useRef for side-effect registries and .cancel() inside useEffect cleanup functions is the standard industry pattern to ensure crash-free, high-performance rendering.

## Path

It is recommended to use an absolute path for resources in the ‘public/’ directory:

```javascript
src = '/images/linear-300x64.png'; // ✅ With / at the beginning
```

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

With React’s setPage accepts two types of arguments:

- Direct form:

```TypeScript
//You pass it the new value, calculated from the page variable, directly.
setPage(page + 1)
```

- Functional form (with a callback):
  It is React itself that will call this function when the update takes place and pass the current/previous value of the state variable to it as an argument.

```TypeScript
//Instead of passing a value, you provide React with a function.
setPage((prev) => prev + 1)

```

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
        <ScoreItem
          key={score.id}
          score={score}
          onSelect={() => navigate(`/scores/${score.id}`)}
        />
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
[
  <ScoreItem
    key="{101}"
    score="{...}"
  />,
  <ScoreItem
    key="{102}"
    score="{...}"
  />,
];
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

### flex

Enables Flexbox and defines the axis

flex-col, flex-row

- flex-col: children vertically (from top to bottom)
- flex-row : from left to right

### Size & Flex

- flex-1 : Use ALL the remaining space available in the parent box.
- flex-2 : Use the HALF of the remaining space available in the parent box.

- If two children have flex-1, they share the free space equally (50 per cent each).
- If one child has flex-1 and another has flex-2, the second child will take up twice as much free space as the first.

### shrink-0 (Crucial)

- shrink-0 = is never squeezed (jamais écrasé !)
- with `<header className="h-16 shrink-0">`
  - The browser locks the 64px width of the `<header>`.
  - It tells the section: “The top bar won’t move a millimeter.
  - If you’re too wide, it’s up to you to manage your own scrolling (overflow-auto) within the space you have left.”

By default, within a Flexbox container, children have `flex-shrink: 1`, which means that the browser attempts to shrink the element so that it fits on the screen. By setting `shrink-0` (`flex-shrink: 0`), you’re telling Flexbox: ‘Do not shrink this div; strictly maintain the width calculated by the viewport (`viewport.width`).’

### mx-auto

When combined with `items-center` on the parent, `mx-auto` forces automatic margins on the left and right. As soon as the width exceeds the edge of the window, the browser sets the left edge to `x=0` instead of pushing the content into the inaccessible negative area.

### Screen Size

- h-screen
  - the full height of the screen
- w-screen
  - the full width of the screen

- h-full
  - Takes up 100 per cent of the height of its PARENT element.
- w-full
  - Takes up 100 per cent of the width of its PARENT element.

- In child elements (such as ScoreViewer) set `h-full` to say Fill 100 per cent of the space allocated by the parent component.
- This is **Crucial** for unlocking the internal scroll

### overflow

overflow-hidden,
overflow-auto

By default, if a child element (for example, a large section or a zoomed-in canvas) exceeds the size of its parent container,
the browser either allows to create a scroll bar across the entire browser window.
With overflow-hidden sets a strict rule: Anything that extends beyond the physical boundaries of this <div> is hidden (clipped) -> NO Scroll BAR

Scrolling will only occur within the areas you have selected (overflow-auto).

The `overflow-auto` property only works if the browser knows the maximum height of the container.
Meaning that --> **h-full remains mandatory**

In other words
“Set the height to h-full (100% of the height of <main>), and IF your content exceeds this height, scroll (overflow-auto).”

### relative

The relative element acts as a geometric anchor (a reference point).
It is required whenever a child element located within it uses absolute positioning (position: absolute, or the Tailwind classes absolute, fixed, inset-0).

Relative positioning turns the parent element into a ‘magnet’ (a fixed reference point) for its children that use absolute positioning

### min-h-0

In Flexbox, by default, all elements have a hidden property: min-height: auto.
This means that the browser will not shrink an element below the minimum size of its text or image content.

`min-h-0` does not mean ‘set to 0 pixels’, but ‘remove the minimum height imposed by your content’.
To understand this, you need to recognize the trap that CSS sets for us by default.

When you write:

```Typescript
  <main className="flex-1 overflow-auto"> {/* WITHOUT min-h-0 */}
    <GrandePartition /> {/* Makes it 2000px high */}
  </main>
```

The browser secretly applies this rule: min-height: auto.
This `min-height: auto` means:
The absolute minimum height of this box must be AT LEAST equal to the height of its content (2000px).’

Result: Even though you’ve written `flex-1` to say ‘take up the remaining space on the screen’, the floor rule (`min-height: auto`) wins the battle!
The <main> stretches to 2000px, causes your screen to overflow (h-screen) and pushes your footer right to the bottom, out of view.

What min-h-0 REALLY does
When you add min-h-0 (min-height: 0px), you’re not telling the <main> to become invisible or to be 0px.

You’re simply telling it:
**“Remove that default minimum height. Don’t let your 2000px content force your hand. Your true minimum allowed height is 0px if necessary.”**

As soon as this minimum height is removed:

flex-1 takes control: The <main> adjusts exactly to the remaining height of the screen (e.g. 800px).

overflow-auto is triggered: As the container is 2000px but the <main> is restricted to 800px, the scroll bar finally appears within the <main>.
