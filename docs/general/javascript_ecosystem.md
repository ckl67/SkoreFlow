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

# TypeScript Setup Requirements

To transition a JavaScript project to a TypeScript (TS) environment capable of running automated tests and preparing for React, you need the following configuration.

## Core Packages (npm)

Install the essential dependencies for development:

```Bash
npm install --save-dev typescript ts-node @types/node

# typescript: The core compiler that transforms .ts files into executable .js.
# ts-node: An execution engine that allows you to run .ts files directly in the terminal without manual compilation.
# @types/node: Type definitions for Node.js built-ins (like fs, path, and process).
```

## Library Type Definitions

If you use third-party libraries, TypeScript needs to know their "shape."

- Axios: No extra installation needed (types are built-in).
- Other Libraries: Some require specific type packages.

```Bash
npm install --save-dev @types/form-data
```

3. Configuration (tsconfig.json)

Initialize the TypeScript configuration file:
Bash

npx tsc --init

For a typical Node.js backend/test environment, ensure these settings are active in tsconfig.json:

    "target": "ESNext": Support for modern JS features.

    "module": "CommonJS": Best for standard Node.js execution.

    "strict": true: Enables the highest level of type safety (highly recommended).

    "esModuleInterop": true: Ensures compatibility with libraries like Axios.

4.  Environment & Tooling
    Visual Studio Code Extensions

        ESLint: Connects TS rules to your editor UI.

        Error Lens: Highlights errors directly at the end of the line (saves time).

Execution Flow

Instead of using the standard node command, your automation scripts (Bash) should now use:
Old Command (JS) New Command (TS)
node script.js npx ts-node script.ts 5. Quick Migration Summary

    Rename: Change .js files to .ts.

    Import/Export: Swap require() for import and module.exports for export.

    Define Interfaces: Create interface structures for your API objects to prevent "undefined" variable errors.

    Run: Update your Bash scripts to use ts-node.
