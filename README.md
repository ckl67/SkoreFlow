# 🎼 SkoreFlow

> **From upload to structured music data — cleanly processed.**

SkoreFlow is a backend and frontend application designed to manage, process, and serve musical scores through a clean, scalable, and layered architecture.
SkoreFlow is the result of several iterations on earlier experimental projects, redesigned with a focus on clean architecture, scalability, and maintainability.

Welcome to SkoreFlow 🎉

---

## 🚀 Overview

SkoreFlow provides a structured pipeline to:

- Upload and manage score music files
- Organize scores, composers, and users
- Process files (storage, thumbnails, normalization, score annotations)
- Expose a robust REST API for frontend and integrations

## 🧪 Sandbox

Skoreflow can currently be tested in a [Sandbox](https://skoreflow-frontend.onrender.com/)

---

## 🚧 Project Status

SkoreFlow is actively under development and improvement on

- Backend:
- Microservice:
- Frontend:
- Features:
- Documentation:

Contributions and feedback are welcome.

---

## 📁 Project Structure

```bash
.

├── backend
├── config
├── docs
├── frontend
├── microservice
├── node_modules
├── shared
├── testauto


```

## 📦 Monorepo Architecture

This project uses a **npm workspaces monorepo**.

All JavaScript/TypeScript dependencies are managed **centrally at the root level**, using a single `node_modules` directory.

### Key Principles

- A **single root `node_modules/`**
- Multiple isolated projects (workspaces) declared in package.json
- Shared tooling (TypeScript, ESLint, Prettier, Vitest)

### Workspaces

```bash

SkoreFlow/
├── node_modules/ ✅ unique
├── package.json ✅ workspaces
├── backend/              # Go backend
├── frontend/             # React (Vite)
│ └── package.json
├── microservice/         # Python or other
├── testauto/
│ ├── backend/
├── docs/

```

📌 Rules to Follow

- Always run npm install from the root
- Always specify the workspace using -w
- Never create a local node_modules inside subprojects !
- Common tools must be installed on the root
  - Prettier / ESLint → root
  - Vitest → testauto/backend
  - React → frontend

## Local Services

- Backend Go : localhost:8080
- MicroService thumbnail : localhost:5010
- Frontend React : localhost:5173
- MailPit SMTP : localhost:1025
- Interface Mail : localhost:8025

## 🚀 Getting Started

### Clone repository

```bash
git clone https://github.com/ckl67/skoreflow.git
cd skoreflow
```

### visual studio code

Open visual code, and open file `.code-workspace`

### Documentation

- The [Detailed Documentation](https://ckl67.github.io/SkoreFlow/) will cover architecture, API, and development guidelines.

## 📌 Future Improvements or Bug detection

- Improvements or highlighting a BUG can be done via [Github Issue](https://github.com/ckl67/SkoreFlow/issues)

---

## 🌿 Contributions

- To contribute, please use your **Own Branches** or **Feature Branches** and submit a **Pull Request**. Direct pushes to the main branch are not permitted.
- See [CONTRIBUTING](./CONTRIBUTING.md) or [CONTRIBUTING (more details)](./docs/general/fork.md)

## 📄 License

- See [LICENSE](./LICENSE.md)

## ✅ Code of Conduct

- See [CODE_OF_CONDUCT](./CODE_OF_CONDUCT.md)
