# 1. Visual Studio Tools

## 1.1. Monorepo Rules (IMPORTANT)

### 1.1.1. Install shared tools (root only)

Example :

```bash
npm install --save-dev prettier eslint @eslint/js typescript
```

### 1.1.2. Install dependencies

Example :

```bash
npm install react-router-dom -w frontend
npm install axios -w testauto/backend
```

---

### 1.1.3. ❌ Do NOT do this

```bash
cd frontend
npm install
```

👉 This breaks the monorepo (creates local node_modules)

---

### 1.1.4. Key Rules

- Always run commands from the root
- Always use `-w <workspace>`
- Only one `node_modules/` at root

---

## 1.2. Formatting & Linting

### 1.2.1. Formatting

- Prettier is the **only formatter**
- Runs automatically on save

### 1.2.2. Linting

- ESLint is used for **code quality only**
- No formatting rules inside ESLint

### 1.2.3. Vitest

- Tests run via Vitest

### 1.2.4. Markdown

- Markdown is formatted consistently

---

## 1.3. Backend (Go)

- Uses `gofumpt` for formatting

```bash
go install mvdan.cc/gofumpt@latest
```

---

## 1.4. Shell Tools (Optional)

```bash
sudo snap install shellcheck
go install mvdan.cc/sh/v3/cmd/shfmt@latest
```

---

## 1.5. TypeScript Setup (Tests & Scripts)

This project uses **TypeScript** mainly for test automation (`testauto/`) and scripting.

From the root:

```bash
npm install --save-dev typescript ts-node @types/node typescript-eslint
```

- `typescript` → compiler
- `ts-node` → run `.ts` files directly
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

---

## 1.6. Initialize Configuration

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

---

## 1.7. Run TypeScript

Instead of:

```bash
node script.js
```

Use:

```bash
npx ts-node script.ts
```

---

## 1.8. Types for Libraries

Some libraries require type definitions:

```bash
npm install --save-dev @types/form-data
```

👉 Note: Axios already includes its own types.

---

## 1.9. Project Usage

TypeScript is mainly used in:

```text
testauto/backend/
testauto/frontend/
```

Each workspace can have its own `tsconfig.json` if needed.

---

## 1.10. Summary

- Monorepo with shared tooling
- Single root workspace (no multi-root)
- One formatter (Prettier)
- Clean separation of concerns
- All tools : Prettier - ESLint - .. based on npm (vsc will first use local npm, and if not present will use integrated vsc tools )
- TypeScript is used for tests and scripts
- Runs with `ts-node` (no build step)
- Strict mode enabled for safety

---
