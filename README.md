# 🎼 SkoreFlow

> **From upload to structured music data — cleanly processed.**

SkoreFlow is a backend and frontend application designed to manage, process, and serve musical scores through a clean, scalable, and layered architecture.
SkoreFlow is the result of several iterations on earlier experimental projects, redesigned with a focus on clean architecture, scalability, and maintainability.

So welcome to SkoreFlow 🎉

---

## 🚀 Overview

SkoreFlow provides a structured pipeline to:

- Upload and manage score music files
- Organize scores, composers, and users
- Process files (storage, thumbnails, normalization, score annotations)
- Expose a robust REST API for frontend and integrations

---

## 🚧 Project Status

SkoreFlow is actively under development.

- Backend: ✅ Mostly ready
  - currently finalizing and working on backend auto test
- Frontend: 🚧 not yet started (React)
- Features: evolving

Contributions and feedback are welcome.

---

## 📁 Project Structure

```bash
.
├── backend/
├── frontend/
├── testauto/
├── docs/

```

⚠️ Important (VS Code users)

This project uses a multi-folder setup.
To properly access development tools (especially test scripts and task runners), you must open the workspace file:

```bash
my-project.code-workspace
```

Opening only a subfolder (e.g. backend/ or testauto/backend/) will prevent:

- NPM scripts from appearing in the sidebar
- Task configurations from working correctly
- Proper multi-project navigation

👉 In VS Code:
File → Open Workspace from File...

## 📦 Monorepo Architecture

This project uses a **npm workspaces monorepo**.

All JavaScript/TypeScript dependencies are managed **centrally at the root level**, using a single `node_modules` directory.

### Key Principles

- A **single root `node_modules/`**
- Multiple isolated projects (workspaces)
- Shared tooling (TypeScript, ESLint, Prettier, Vitest)

### Workspaces

```bash

SkoreFlow/
├── node_modules/ ✅ unique
├── package.json ✅ workspaces
├── backend/              # Go backend
├── frontend/             # React (Vite)
│ └── package.json
├── testauto/
│ ├── backend/
│ │ └── package.json
│ └── frontend/
│ └── package.json
├── docs/

```

### ✅ Correct Usage

- Install a dependency in a workspace:

```bash
npm install react-router-dom -w frontend
npm install axios -w testauto/backend
```

- Install common tools on root

```bash
npm install --save-dev prettier eslint @eslint/js typescript
```

- Incorrect Usage

Do NOT run npm install inside subfolders without **_ -w _**

```bash
cd frontend
npm install   #  This will break the monorepo setup ❌

```

📌 Rules to Follow

- Always run npm install from the root
- Always specify the workspace using -w
- Never create a local node_modules/ inside subprojects !
- Common tools must be installed on the root
  - Prettier / ESLint → root
  - Vitest → testauto/backend
  - React → frontend

## 🚀 Getting Started

### Clone repository

```bash
git clone https://github.com/ckl67/skoreflow.git
cd skoreflow
```

```

### Documentation

- The [Detailed Documentation](https://ckl67.github.io/SkoreFlow/) will cover architecture, API, and development guidelines.

## 📌 Future Improvements or Bug detection

- Improvements or highlighting a BUG can be done via [Github Issue](https://github.com/ckl67/SkoreFlow/issues)

---

## 🌿 Contributions

- To contribute, please use **Feature Branches** and submit a **Pull Request**. Direct pushes to the main branch are not permitted.
- See [CONTRIBUTING](./CONTRIBUTING.md) or [CONTRIBUTING (more details)](./docs/general/fork.md)

## 📄 License

- See [LICENSE](./LICENSE.md)

## ✅ Code of Conduct

- See [CODE_OF_CONDUCT](./CODE_OF_CONDUCT.md)
```
