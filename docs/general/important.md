# JS / TypeScript Ecosystem --- Mental Model Guide

## 1. Overview

The JavaScript ecosystem is composed of multiple independent layers:

    +---------------------------+
    |        Your Code          |
    |  (TS / JS / TSX files)    |
    +-------------+-------------+
                  |
                  v
    +---------------------------+
    |     Tooling Layer         |
    | ESLint | Vitest | tsx     |
    +---------------------------+
                  |
                  v
    +---------------------------+
    |   TypeScript Compiler     |
    |   (types only, no runtime)|
    +---------------------------+
                  |
                  v
    +---------------------------+
    |      Runtime Layer        |
    |   Node.js / Browser       |
    +---------------------------+
                  |
                  v
    +---------------------------+
    |   Module Resolution       |
    | Node / Node16 / Bundler   |
    +---------------------------+

---

## 2. Core Concepts

### JavaScript (JS)

- Native runtime language of Node and browsers
- No static types
- Executed directly

### TypeScript (TS)

- Superset of JavaScript
- Adds static types
- Compiled to JavaScript before execution

---

## 3. Execution vs Compilation

### Important Distinction

Layer Responsibility

---

TypeScript Type checking only
tsx Executes TS directly (dev tool)
Node.js Executes JavaScript
Vitest Runs test environment
ESLint Static analysis only

---

## 4. Module Systems

### CommonJS (legacy Node)

```js
const fs = require('fs');
module.exports = {};
```

### ES Modules (modern standard)

```js
import fs from 'fs';
export function read() {}
```

---

## 5. moduleResolution (TypeScript)

Defines how imports are resolved.

Mode Description Strictness

---

Node Legacy Node behavior Low
Node16 Node 16 ESM/CJS aware Medium
NodeNext Strict Node ESM simulation High
Bundler Vite/Webpack behavior Flexible

---

## 6. tsx Role

tsx is a development tool that:

- Transpiles TypeScript on the fly
- Executes without build step
- Simplifies module complexity
- Ignores strict Node ESM constraints

---

## 7. Vitest Role

Vitest is a test runner that:

- Executes tests in Node environment
- Provides `describe`, `it`, `expect`
- Can use Node or Vite-like resolution

---

## 8. ESLint Role

ESLint only:

- Analyzes code statically
- Does NOT execute code
- Does NOT affect runtime
- Requires TypeScript parser for TS support

---

## 9. Mental Model Summary

    TypeScript → compiled → JavaScript → executed by Node/tsx
                        ↑
                  ESLint analyzes only
                        ↑
                  Vitest runs tests

---

## 10. Key Rule

The most important principle:

> The more you rely on tsx, the less strict your Node module
> configuration should be.
