# 1. Visual Studio Tools

[← back](../doc.md)

## 1.3. Formatting & Linting

### 1.3.1. Formatting

- Prettier is the **only formatter**
- Runs automatically on save

### 1.3.2. Linting

- ESLint is used for **code quality only**
- It is a foundational tool used to ensure code quality, catch bugs early, and maintain a unified coding standard across all JavaScript and TypeScript packages.
- No formatting rules inside ESLint

### 1.3.3. Vitest

- Tests run via Vitest

### 1.3.4. Markdown

- Markdown is formatted consistently

## 1.4. Backend (Go)

- Uses `gofumpt` for formatting

```bash
go install mvdan.cc/gofumpt@latest
```

## 1.5. Shell Tools (Optional)

```bash
sudo snap install shellcheck
go install mvdan.cc/sh/v3/cmd/shfmt@latest
```

## 1.6. TypeScript Setup (Tests & Scripts)

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

## 1.7. Initialize Configuration

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

## 1.8. Run TypeScript

Use:

```bash
# If installed
npx tsx script.ts
# Or better
npx vitest run tests/stress.test.ts
```

Vitest handles the execution and on-the-fly compilation of the .ts files directly

## 1.9. Types for Libraries

Some libraries require type definitions:

```bash
npm install --save-dev @types/form-data
```

👉 Note: Axios already includes its own types.

## 1.10. Project Usage

TypeScript is mainly used in:

```text
testauto/backend/
```

Each workspace can have its own `tsconfig.json` if needed.

## 1.11. Summary

- Monorepo with shared tooling
- Single root workspace (no multi-root)
- One formatter (Prettier)
- Clean separation of concerns
- All tools : Prettier - ESLint - .. based on npm (vsc will first use local npm, and if not present will use integrated vsc tools )
- TypeScript is used for tests and scripts
- Strict mode enabled for safety
