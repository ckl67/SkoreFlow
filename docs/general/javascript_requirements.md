# Javascript Setup Requirements

## verview

```text
├── backend/ (code Go)
├── frontend/ (React with propre tsconfig and eslint)
├── testauto/ (scripts Typescript and Javascript)
│    └───backend
│            ├── tsconfig.json <-- Specific to thes tests
│            └── eslint.config.mjs
└── .gitignore

```

## TypeScript Setup Requirements

To transition a JavaScript project to a TypeScript (TS) environment capable of running automated tests and preparing for React, you need the following configuration.

### Core Packages (npm)

Install the essential dependencies for development:

```Bash

npm install --save-dev typescript ts-node @types/node

# typescript: The core compiler that transforms .ts files into executable .js.
# ts-node: An execution engine that allows you to run .ts files directly in the terminal without manual compilation.
# @types/node: Type definitions for Node.js built-ins (like fs, path, and process).
```

### Library Type Definitions

If you use third-party libraries, TypeScript needs to know their "shape."

- Axios: No extra installation needed (types are built-in).
- Other Libraries: Some require specific type packages.

```Bash
npm install --save-dev @types/form-data

```

### Configuration (tsconfig.json)

Initialize the TypeScript configuration file:

```Bash
npx tsc --init
```

For a typical Node.js backend/test environment, ensure these settings are active in tsconfig.json:

- "target": "ESNext": Support for modern JS features.
- "module": "CommonJS": Best for standard Node.js execution.
- "strict": true: Enables the highest level of type safety (highly recommended).
- "esModuleInterop": true: Ensures compatibility with libraries like Axios.

## ESLint defaut

ESLint must have a eslint.config.mjs to know the rules

Create : eslint.config.mjs à the root

```js
import js from "@eslint/js";

export default [
  js.configs.recommended, // Active les règles de base (dont no-undef)
  {
    rules: {
      "no-undef": "error", // Interdit l'usage de variables non définies 💥
      "no-unused-vars": "warn", // Alerte si tu déclares une variable sans l'utiliser
      "no-console": "off", // Autorise console.log (utile pour tes tests)
    },
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },
];
```
