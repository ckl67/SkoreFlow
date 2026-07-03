# ESLint and Prettier Configuration Guide

[← back](../doc.md)

ESLint is a foundational tool used to ensure code quality, catch bugs early, and maintain a unified coding standard across all JavaScript and TypeScript packages.

## What is ESLint?

**ESLint** is a static code analysis tool (commonly called a **Linter**). It inspects your source code in real-time _without executing it_ (static analysis) to flag syntax errors, potential bugs, and deviations from bad practices.

While originally built strictly for JavaScript, our modern configuration extends full support to **TypeScript** as well.

### The 3 Core Pillars of ESLint

1. **Bug Prevention:** Identifies structural code issues before they hit runtime (e.g., using an undeclared variable, breaking logic flows, or forgetting to handle a Promise).
2. **Best Practices:** Warns you about dead or inefficient code (e.g., imports or variables that are declared but never used).
3. **Style Consistency:** Enforces team-wide code conventions (e.g., banning specific legacy keywords, controlling console log usage).

## ⚔️ ESLint vs. Prettier: Who Does What?

In this project, both tools run side-by-side but have completely separated responsibilities to maximize performance and avoid conflicts.

| Feature / Responsibility | 🧹 Prettier                                                                    | 🔍 ESLint                                                         |
| :----------------------- | :----------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Primary Role**         | **Code Formatter** (The Stylist)                                               | **Code Linter** (The Inspector)                                   |
| **Focus**                | Visual appearance and layout                                                   | Code quality, logic correctness, and safety                       |
| **Examples**             | Tabs vs. spaces, line length, trailing commas, single quotes vs. double quotes | Unused variables, unresolved symbols, dead code, syntax anomalies |
| **Execution**            | Rewrites and reformats your code structure on save                             | Highlights warnings/errors in your editor or CI pipeline          |

> ⚠️ **Important Architecture Note:** In our `.code-workspace` settings, ESLint formatting is explicitly disabled (`"eslint.format.enable": false`). We delegate **100% of formatting to Prettier** and keep **100% of quality inspection to ESLint**.

---

## 🛠️ Supported Environments & File Extensions

ESLint is isolated exclusively to the **JavaScript & TypeScript ecosystem**.
Thanks to our integration with `typescript-eslint`, it monitors the following extensions across our codebase:

- **Pure JavaScript:** `.js`, `.mjs`, `.cjs`
- **React JavaScript:** `.jsx`
- **Pure TypeScript:** `.ts`
- **React TypeScript:** `.tsx`

### Non-JS/TS Languages in the Monorepo

Other modern languages used in this project are decoupled from ESLint and rely on their own native ecosystems:

- **Go (`backend/`):** Governed by `golangci-lint` / `go fmt`.
- **Python (`testauto/`):** Governed by `Ruff`.

---

## 🏗️ Configuration File Architecture

We utilize the modern **ESLint Flat Config (v9+)** system.

1. **`config/eslint/base.mjs`:** The single source of truth. Contains all global ignores (`node_modules`, `dist`, `build`), recommended standard configurations, and custom overrides (e.g., warnings for unused variables, allowing console logs).
2. **`eslint.config.mjs` (Root):** A lightweight proxy file that imports and expands the base config array, ensuring your VS Code extension tracks files instantly across the entire Multi-Root Workspace.
3. **`eslint.config.mjs` (SubDirectory):** personalization of eslint
