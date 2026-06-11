# 1. Some specifications about tests

## 1.1. Backend

### 1.1.1. More information

Tests are based on vitest, for more information [see](../docs/backend/test.md)

### 1.1.2. Installation vitest

In monorepo, the dependencies have to be installed as following

```shell
# from root
npm install --save-dev vitest -w testauto/backend
npm install --save-dev prettier eslint @eslint/js -w testauto/backend
```

## 1.2. Frontend

No tests foreseen for now.
A attempt has been tested via [Mock Service Worker (MSW)](https://mswjs.io/)
The aim being to emulates the backend and test the frontend without backend
Aim be tested later if necessary

## 1.3. E2E - End To End - Backend to Frontend

### 1.3.1. Introduction

Based on [playwright](https://playwright.dev/) for more information [see](../docs/e2e/test.md)

### 1.3.2. Installation playwright

```shell
# playwright using backend and frontend, has to be installed at the root, and not workspace
npm init playwright@latest

# Installation
#   Initializing project in '.'
#   ✔ Do you want to use TypeScript or JavaScript? · TypeScript
#   ✔ Where to put your end-to-end tests? · ./testauto/e2e
#   ✔ Add a GitHub Actions workflow? (Y/n) · false
#   ✔ Install Playwright browsers (can be done manually via 'npx playwright install')? (Y/n) · true
#   ✔ Install Playwright operating system dependencies (requires sudo / root - can be done manually via 'sudo npx playwright install-deps')? (y/N) · false
```

Result

This will generate:

- playwright.config.ts at the root of the project
- E2E tests located in ./testauto/e2e
- Playwright configured for full application testing (frontend + backend)

I recommend NOT to install Playwright inside a workspace: "npm init playwright@latest -w testauto/e2e"
Playwright is a system-level testing tool and should remain installed at the root of the monorepo.

### 1.3.3. Dependencies

[WebKit](https://webkit.org/) is mandatory, and ca be installed afterwards

```shell
npx playwright install-deps
```
