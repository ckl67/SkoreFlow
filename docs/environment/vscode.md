# 1. VS Code Setup Guide – SkoreFlow (Linux)

This guide explains how to configure a clean and consistent development environment for the **SkoreFlow monorepo**.

---

## 2. Install Visual Studio Code

```bash
sudo snap install code --classic
```

Launch VS Code and open the project:

```text
File → Open Folder → SkoreFlow/
```

👉 Always open the **root folder**, never subfolders.

---

## 3. Required Extensions (Minimal)

Install only what is necessary.

### 3.0.1. Core

- Prettier (formatter)
- ESLint (code quality)
- Vitest Explorer (tests)
- npm IntelliSense
- Error Lens

### 3.0.2. System / Shell

- ShellCheck (Optional)
- shfmt (Optional)

### 3.0.3. Backend

- Go (official Go extension)
- `gofumpt` for formatting see below
- Python

### 3.0.4. Frontend (React)

- ES7+ React Snippets

### 3.0.5. Documentation

- Markdown All in One
- Markdown lint
- Code Spell Checker

### 3.0.6. Git

- Git Graph or GitLens
- GitHub Pull Requests & Issues

### 3.0.7. Optional

- Python (Pylance)
- GitHub Copilot

---

## 4. Project Structure

This project is a **monorepo** with a single root:

```shell
SkoreFlow/
├── backend/        # Go API
├── frontend/       # React (Vite)
├── testauto/       # Tests (Vitest)
├── docs/           # Documentation
├── package.json    # Root config
```

👉 All tools are configured at the **root level**.
