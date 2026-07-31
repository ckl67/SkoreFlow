# ESLint and Prettier Configuration Guide

[← back](../doc.md)

## What is ESLint?

ESLint is a foundational tool used to ensure code quality, catch bugs early, and maintain a unified coding standard across all JavaScript and TypeScript packages.

**ESLint** is a static code analysis tool (commonly called a **Linter**). It inspects your source code in real-time _without executing it_ (static analysis) to flag syntax errors, potential bugs, and deviations from bad practices.

While originally built strictly for JavaScript, our modern configuration extends full support to **TypeScript** as well.

### The 3 Core Pillars of ESLint

1. **Bug Prevention:** Identifies structural code issues before they hit runtime (e.g., using an undeclared variable, breaking logic flows, or forgetting to handle a Promise).
2. **Best Practices:** Warns you about dead or inefficient code (e.g., imports or variables that are declared but never used).
3. **Style Consistency:** Enforces team-wide code conventions (e.g., banning specific legacy keywords, controlling console log usage).

## ESLint vs. Prettier: Who Does What?

In this project, both tools run side-by-side but have completely separated responsibilities to maximize performance and avoid conflicts.

| Feature / Responsibility | 🧹 Prettier                                                                    | 🔍 ESLint                                                         |
| :----------------------- | :----------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Primary Role**         | **Code Formatter** (The Stylist)                                               | **Code Linter** (The Inspector)                                   |
| **Focus**                | Visual appearance and layout                                                   | Code quality, logic correctness, and safety                       |
| **Examples**             | Tabs vs. spaces, line length, trailing commas, single quotes vs. double quotes | Unused variables, unresolved symbols, dead code, syntax anomalies |
| **Execution**            | Rewrites and reformats your code structure on save                             | Highlights warnings/errors in your editor or CI pipeline          |

> ⚠️ **Important Architecture Note:** In our `.code-workspace` settings, ESLint formatting is explicitly disabled (`"eslint.format.enable": false`). We delegate **100% of formatting to Prettier** and keep **100% of quality inspection to ESLint**.

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

### Key Distinction

- **ESLint**: Catches code logic issues, unused variables, anti-patterns, and type safety errors.
- **Prettier**: Enforces aesthetic code formatting (e.g., single vs. double quotes, trailing commas, tab width).

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

For Markdown files or temporary code blocks containing specific jargon, brand names, or technical acronyms, inline directives can be added directly in HTML comments:

```shell
# Ignore specific words in a file:
<!-- cspell:ignore customTerm legacyKeyword -->

# Disable / Enable spell checking for a block:
<!-- cspell:disable -->
Unchecked text or raw logs go here...
<!-- cspell:enable -->
```
