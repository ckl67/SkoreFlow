# VS Code Setup Guide – SkoreFlow (Linux)

[← back](../doc.md)

This guide explains how to configure a clean and consistent development environment for the **SkoreFlow monorepo**.

## Install Visual Studio Code

```bash
sudo snap install code --classic
```

Launch VS Code and open the project:

```text
File → Open Folder → SkoreFlow/
```

👉 Always open the **root folder**, never subfolders.

## Required Extensions (Minimal)

Install only what is necessary.
The needed extensions are declared in file "./vscode/extensions.json"

### Core

- Prettier (formatter)
- ESLint (code quality)
- Emmet (web-developer’s toolkit)
- Vitest Explorer (tests)
- npm IntelliSense
- Error Lens

### System / Shell

- ShellCheck
- shfmt

### Backend

- Go (official Go extension)
- `gofumpt` for formatting see below
- Python

### Frontend (React)

- ES7+ React Snippets

### Documentation

- Markdown All in One
- Markdown lint
- Code Spell Checker

### Git

- Git Graph or GitLens
- GitHub Pull Requests & Issues

### Optional

- Python (Pylance)
- GitHub Copilot

## Project Structure

This project is a **monorepo** with a single root:

```shell
SkoreFlow/
├── backend/        # Go API
├── frontend/       # React (Vite)
├── testauto/       # Tests (Vitest)
├── microservice/   # Python and others
├── docs/           # Documentation
├── package.json    # Root config
```

👉 vscode tools are only configured at the **root level**
