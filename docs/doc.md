<!-- cspell:ignore gunicorn -->

# Home

## Welcome

Welcome to the SkoreFlow documentation !

This documentation provides comprehensive guides and documentation for contributing to the SkoreFlow project, including setup instructions for both the backend and frontend development environments.

It will also address the development environment, to cover the necessary tools, installation steps, and best practices to ensure a smooth contribution process.

Whether you're new to SkoreFlow or an experienced developer, this documentation will help you get started and contribute effectively to the project.

The document can also be consulted locally in 'visual studio code' via the integrated browser [SkoreFlow document](http://127.0.0.1:3000/docs/index.html#/) - For that, it is essential that the "Live Server" has been started before manually : `ctrl Shift p` --> `Live Premier Start Server`

## Table of Contents

### Foreword

- <span id="ref-foreword"></span>[Foreword](./environment/foreword.md)

### User Guide

- [User Guide](./user-guide/cover-page.md)

### visual studio code

- [Visual Studio Code settings](./environment/vscode.md)
- [Remote Development](./environment/remote-ports.md)
- [VSC Workspace](./environment/single-folder.md)
- [eslint, prettier cspell](./environment/formatting.md)

### SkoreFlow

- [Naming Conventions](./skoreflow/naming-conventions.md)
- [Version Strategy](./skoreflow/version-strategy.md)
- [Backend Frontend Responsibilities](./skoreflow/responsibilities.md)
- [Public vs Protected API](./skoreflow/public-protected-api.md)
- [Rest return](./skoreflow/rest-response.md)
- [VS Code Debugging Configuration (Backend / Frontend)](./skoreflow/debug.md)

### General

- [Linux useful commands](./general/linux-useful.md)
- [Go Language](./general/go.md)
- [Go Structure](./general/go-struct.md)
- [Go synchronous and asynchronous](./general/go-sync.md)
- [Python Imports, Root Folders](./general/python-Imports-rootfolder.md)
- [JWT](./general/jwt.md)
- [HTTP Status Codes](./general/http_status_codes.md)
- [API Response Standard](./backend/api-response.md)
- [Javascript - ecosystem](./general/javascript_ecosystem.md)
- [Javascript - some particularities](./general/javascript.md)
- [Type vs Interface in TypeScript](./general/type-vs-interface.md)
- [JSON Handling](./general/json.md)
- [MonoRepo](./general/monorepo.md)
- [Classroom](./general/classroom.md)

### Development Environment

- [Git Survival Guide](./general/git.md)
- [TypeScript Setup Requirements](./environment/vs-tools.md)
- [Mail Server](./environment/mail-server.md)

### Backend Guides

- [Architecture](./backend/architecture.md)
- [Public vs Controlled API Routes](./backend/public-vs-controlled-routes.md)
- [API Response Standard](./backend/api-response.md)
- [Some specificities - Architecture Diagram](./backend/architecture.dio)
  - _(To change the theme in drawio - Ctrl Shift P : "Drawio - Change Theme")_
- [cors explanation](./backend/cors.md) and [dom explanation](./backend/dom.md)
- [go and Docker paths](./backend/go.md)
- [Installation](./backend/install.md)
- [Database migration](./backend/database.md)
- [Automatic Code Reloading with Air](./backend/air.md)
- [Running the Backend](./backend/run.md)
- [Debugging](./backend/debug.md)
- [Backend Testing (curl)](./backend/test.md)
  - [smoke](./backend/manual-tests/smoke-mtest.md)
  - [register and login](./backend/manual-tests/user-mtest.md)
  - [composer](./backend/manual-tests/composer-mtest.md)
  - [score](./backend/manual-tests/score-mtest.md)

### Microservices

- [Microservices](./microservices/microservices.md)
- [gunicorn](./microservices/gunicorn.md)
  - [thumbnail](./microservices/thumbnail/installation.md)

### Frontend Guides

- [Architecture](./frontend/architecture-base.md)
- [Architecture - Handbook](./frontend/frontend-handbook.md)
- [Architecture - Flow](./frontend/architecture-mermaid.md)
- [React Installation](./frontend/react-install.md)
- [React Guideline](./frontend/react-guide.md)
- [Tailwind css](./frontend/tailwind.md)
- [Deployment Guide](./frontend/deployment-guide.md)
- [React DevTools](./frontend/react-devtools.md)

### End to End Test Guides

- [Manual Testing](./test-e2e/manual.md)
- [Playwright Testing](./test-e2e/playwright.md)

### Shared

- [Shared data](./shared/shared.md)

### Sandbox deployment

- [secret](./deployment/00-secret.md)
- [server inventory](./deployment/00-server-inventory.md)
- [server preparation](./deployment/01-server-preparation.md)
- [runtime installation](./deployment/02-runtime-installation.md)
- [skoreflow installation](./deployment/03-skoreflow-installation.md)
- [skoreflow update](./deployment/04-skoreflow-update.md)
- [system services](./deployment/05-system-services.md)
- [deployment](./deployment/06-deployment.md)
- [dns mail server](./deployment/07-dns-mailserver-lws.md)
- [nginx](./deployment/08-nginx.md)

### Contribution

- To contribute, please use **Feature Branches** and submit a **Pull Request**. Direct pushes to the main branch are not permitted.
- [github contribution](./general/fork.md)
