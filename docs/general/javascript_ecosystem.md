# JS Ecosystem : From Vanilla to React

This guide summarizes the evolution of JavaScript technologies and their syntax styles.
In SkoreFlow project we will privilige TS and JSX

## Core Technologies

| Technology                           | Purpose                                  | Key Characteristic                           |
| :----------------------------------- | :--------------------------------------- | :------------------------------------------- |
| JavaScript (JS)                      | The standard language of the web.        | Dynamic, loosely typed, runs everywhere.     |
| TypeScript (TS)                      | A superset of JS that adds static types. | Catches errors during development (like Go). |
| JSX Syntax extension for JavaScript. | Allows writing HTML-like                 | code inside JS.                              |
| React                                | A UI Library.                            | Uses Components to build user interfaces.    |

### Evolution of Syntax Styles

A. JavaScript (CommonJS) - Older / Node.js style

Uses require and module.exports.

```JavaScript

const axios = require("axios");

function greet(name) {
return "Hello " + name;
}

module.exports = { greet };

```

### TypeScript (ES Modules) - Modern / Rigorous (ECMAScript Modules)

Uses import, export, and explicit Type Definitions.

```TypeScript

import axios from "axios";
import { addition } from './math.js';

interface User {
name: string;
}

export function greet(user: User): string {
return `Hello ${user.name}`;
}
```

### React with TSX (TypeScript + JSX) - The Standard

Files end in .tsx. It combines logic, types, and UI structure.

```TypeScript

interface GreetProps {
name: string;
}

// A React Component
export const Greeting = ({ name }: GreetProps) => {
return (
    <div className="card">
      <h1>Hello, {name}!</h1>
    </div>
  );
};
```

## Comparison: Logic vs. UI

- The "Logic" (TS)
  - Focus: Data processing, API calls, Math.
  - Extension: .ts
  - Analogy to Go:

- The "UI" (TSX)
  - Focus: Visual layout, User events (clicks), State.
  - Extension: .tsx
  - Analogy to Go: Like a combination of a template engine and a controller.
