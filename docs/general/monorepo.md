# 1. Monorepo

[← back](../doc.md)

## 1.1. Monorepo Rules (IMPORTANT)

### 1.1.1. Install shared tools (root only)

from the project root

Example :

```bash
npm install --save-dev prettier eslint @eslint/js typescript
```

### 1.1.2. Install dependencies

from the project root too !

Example :

```bash
npm install react-router-dom -w frontend
npm install axios -w testauto/backend

npm install better-sqlite3 -w testauto/backend
npm install -D @types/better-sqlite3 -w testauto/backend
```

-> by specifying -w "target" **we will modify the package.json in the target workspace**

### 1.1.3. ❌ Do NOT do this

```bash
cd frontend
npm install
```

👉 This breaks the monorepo (creates local node_modules)

### 1.1.4. Key Rules

- Always run commands from the root
- Always use `-w <workspace>`
- Only one `node_modules/` at root

## 1.2. npm update

In some case, you can upgrade node packet manager

```shell

npm install -g npm@11

rm -rf node_modules package-lock.json
npm install

```

## 1.3. List of dependencies

From the project root run

```shell
npm ls -ws

```

## 1.4. Rules to Follow

- Always run npm install from the root
- Always specify the workspace using -w
- Never create a local node_modules inside subprojects !
- Common tools must be installed on the root
  - Prettier / ESLint → root
  - Vitest → testauto/backend
  - React → frontend

## npm in case of issue

In cas of issue, you can reinstall the full packages

```shell
# For root project
rm -rf node_modules
rm -rf package-lock.json
npm install

```

## Delete

In case of wrong installation

```shell
# Error example
npm install -D @testing-library/react @testing-library/dom @testing-library/user-event

# Correction
npm uninstall @testing-library/react @testing-library/dom @testing-library/user-event
npm install -D @testing-library/react @testing-library/dom @testing-library/user-event -w frontend

```

### Control

```shell
npm ls --depth=0
npm ls --depth=0 -w frontend
```

frontend@0.0.0 -> ./frontend

Le -> ./frontend means that npm has well the link to workspace.
