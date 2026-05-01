# JS Ecosystem : From Vanilla to React

This guide summarizes the evolution of JavaScript technologies and their syntax styles.
In SkoreFlow project we will privilege TS and JSX

## Core Technologies

| Technology                           | Purpose                                  | Key Characteristic                           |
| :----------------------------------- | :--------------------------------------- | :------------------------------------------- |
| JavaScript (JS)                      | The standard language of the web.        | Dynamic, loosely typed, runs everywhere.     |
| TypeScript (TS)                      | A superset of JS that adds static types. | Catches errors during development (like Go). |
| JSX Syntax extension for JavaScript. | Allows writing HTML-like                 | code inside JS.                              |
| React                                | A UI Library.                            | Uses Components to build user interfaces.    |

## compilation

There is not only one Typescript !
There are different modes to compile TS → JS

These modes are controlled by :

- module
  - define how to handle javascript
- moduleResolution
  - define how to find the import
- runtime (Node / bundler / tsx)

| module   | moduleResolution | usage                   |
| -------- | ---------------- | ----------------------- |
| CommonJS | Node             | Old                     |
| ESNext   | Bundler          | frontend (Vite/Webpack) |
| Node16   | Node16           | Node moderne strict     |
| NodeNext | NodeNext         | Node ESM pur strict     |

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

## JS / TypeScript Ecosystem — Mental Model Guide

We are using:

- tsx → runtime execution
- Node.js → backend environment
- Vitest → tests
- ESLint → linting

Therefore we DO NOT need:

- NodeNext strict mode
  -Complex ESM configuration
- Bundler-style resolution 13. Golden Rule

The more you rely on tsx, the less you should try to mimic strict Node.js module behavior.
