# Visual Studio Tools

[← back](../doc.md)

<!-- cspell:ignore golangci -->

## ESLint and Prettier Configuration Guide

[← back](../doc.md)

### What is ESLint?

ESLint is a foundational tool used to ensure code quality, catch bugs early, and maintain a unified coding standard across all JavaScript and TypeScript packages.

**ESLint** is a static code analysis tool (commonly called a **Linter**). It inspects your source code in real-time _without executing it_ (static analysis) to flag syntax errors, potential bugs, and deviations from bad practices.

While originally built strictly for JavaScript, our modern configuration extends full support to **TypeScript** as well.

#### The 3 Core Pillars of ESLint

1. **Bug Prevention:** Identifies structural code issues before they hit runtime (e.g., using an undeclared variable, breaking logic flows, or forgetting to handle a Promise).
2. **Best Practices:** Warns you about dead or inefficient code (e.g., imports or variables that are declared but never used).
3. **Style Consistency:** Enforces team-wide code conventions (e.g., banning specific legacy keywords, controlling console log usage).

### ESLint vs. Prettier: Who Does What?

In this project, both tools run side-by-side but have completely separated responsibilities to maximize performance and avoid conflicts.

| Feature / Responsibility | 🧹 Prettier                                                                    | 🔍 ESLint                                                         |
| :----------------------- | :----------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Primary Role**         | **Code Formatter** (The Stylist)                                               | **Code Linter** (The Inspector)                                   |
| **Focus**                | Visual appearance and layout                                                   | Code quality, logic correctness, and safety                       |
| **Examples**             | Tabs vs. spaces, line length, trailing commas, single quotes vs. double quotes | Unused variables, unresolved symbols, dead code, syntax anomalies |
| **Execution**            | Rewrites and reformats your code structure on save                             | Highlights warnings/errors in your editor or CI pipeline          |

⚠️ In our `settings.json`, ESLint formatting is explicitly disabled (`"eslint.format.enable": false`).

- We delegate 100% of formatting to Prettier and
- keep 100% of quality inspection to ESLint.

---

## Supported Environments & File Extensions

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

## Prettier (Code Formatter)

While **ESLint** focuses on code quality, potential bugs, and logic practices, **Prettier** is an opinionated code formatter that handles all visual presentation. It automatically formats your code on save or via CLI to ensure consistent spacing, indentation, quotes, and line lengths across the entire codebase.

### Commands

Format all supported files across the repository:

```bash
# See package.json
npm run format
```

## CSpell (Spell Checking)

To maintain clean documentation, variable names, and inline comments, we use CSpell as a static spell checker tailored for codebases.

Project-wide Script

```shell
# Tu be used as command line
npm install --save-dev cspell

```

CSpell is integrated into our package.json scripts:

```JSON
{
  "scripts": {
    "cspell": "cspell"
  }
}
```

Run the standalone check manually using:

```Bash
npm run cspell
```

### Configuration (.cspell.json)

Project-specific dictionary terms, custom jargon, and framework keywords are configured in `.cspell.json` at the root of the repository:

```json
 "ignorePaths": [
    "node_modules/**",
    ".cspell/custom-dictionary.txt",
    "*.mod",
    ..
```

```txt
* matches any sequence of characters in a file name (e.g. *.mod).
** matches any depth of subfolders (e.g. vendor/** targets everything inside the vendor folder).
```

### Inline directives

```shell

# =======================
# For Markdown files
# =======================
# Ignore specific words in a file:
<!-- cspell:ignore customTerm legacyKeyword -->

# Disable / Enable spell checking for a block:
<!-- cspell:disable -->
Unchecked text or raw logs go here...
<!-- cspell:enable -->

# =======================
# For Go
# =======================
//cspell:ignore datatypes

```

## Formatting & Linting

### Formatting

- Prettier is the **only formatter**
- Runs automatically on save

### Linting

- ESLint is used for **code quality only**
- It is a foundational tool used to ensure code quality, catch bugs early, and maintain a unified coding standard across all JavaScript and TypeScript packages.
- No formatting rules inside ESLint

### Vitest

- Tests run via Vitest

### Markdown

- Markdown is formatted consistently

## Backend (Go)

- Uses `gofumpt` for formatting

```bash
go install mvdan.cc/gofumpt@latest
```

## Shell Tools (Optional)

```bash
sudo snap install shellcheck
go install mvdan.cc/sh/v3/cmd/shfmt@latest
```

## TypeScript Setup (Tests & Scripts)

This project uses **TypeScript** mainly for test automation (`testauto/`) and scripting.
Furthermore, by 2026, ts-node is obsolete for running TypeScript directly in Node.js.

From the root:

```bash
## Finally tsx not use because of usage of integrated vitest !
npm install --save-dev typescript tsx @types/node typescript-eslint

```

- `typescript` → compiler
- `tsx` → run .ts files directly (fast, support ESM)
- `@types/node` → Node.js types

typescript-eslint contents :

- parser (@typescript-eslint/parser)
- plugin (@typescript-eslint/eslint-plugin)
- configs (recommended, etc.)

In each directory we can specify the packages which are needed

```json
// example : tsconfig.json
{
  "extends": "../../config/typescript/tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["**/*.ts"]
}
```

## Initialize Configuration

Just for information

```bash
npx tsc --init
```

Minimal recommended config:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## Run TypeScript

Use:

```bash
# If installed
npx tsx script.ts
# Or better
npx vitest run tests/stress.test.ts
```

Vitest handles the execution and on-the-fly compilation of the .ts files directly

## Types for Libraries

Some libraries require type definitions:

```bash
npm install --save-dev @types/form-data
```

👉 Note: Axios already includes its own types.

## Project Usage

TypeScript is mainly used in:

```text
testauto/backend/
```

Each workspace can have its own `tsconfig.json` if needed.

## Summary

- Monorepo with shared tooling
- Single root workspace (no multi-root)
- One formatter (Prettier)
- Clean separation of concerns
- All tools : Prettier - ESLint - .. based on npm (vsc will first use local npm, and if not present will use integrated vsc tools )
- TypeScript is used for tests and scripts
- Strict mode enabled for safety
