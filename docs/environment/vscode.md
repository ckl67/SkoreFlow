# 1. VS Code Setup Guide for Skoreflow (Linux)

This guide explains how to install and configure Visual Studio Code for the Skoreflow monorepo using a consistent development setup across backend, frontend, and test environments.

#1. Install Visual Studio Code on Ubuntu
Using Snap (recommended)

```bash
sudo snap install code --classic
```

Launch VS Code:

# 2. Install Required Extensions

Open VS Code and install the following extensions.

🧠 Core Development
-Go (official Go extension)
-Prettier
-ESLint
-Vitest extension (test runner integration)
-npm IntelliSense
-Error Lens

⚛️ Frontend (React / TypeScript)

- ES7+ React/Redux Snippets
- GitHub Copilot (optional AI assistant)

🐍 Python (optional / legacy tools)

- Pylance (Python language server)
- Python extension (if Python is used in tooling)

📝 Documentation

- Markdown All in One
- Code Spell Checker

🔧 System / Shell

- ShellCheck
- shfmt

📊 Git tools

- GitLens (recommended replacement for gitgraph)
- GitHub Pull Requests & Issues

# 3. Install Required System Tools

```shell
Go formatting (gofumpt)
go install mvdan.cc/gofumpt@latest

```

Ensure Go binaries are in PATH:

```shell

export PATH=$PATH:$(go env GOPATH)/bin
```

Shell tools

```shell
sudo snap install shellcheck -y
go install mvdan.cc/sh/v3/cmd/shfmt@latest

# Move shfmt if needed:

sudo mv ~/go/bin/shfmt /usr/local/bin/

# Verify:

shfmt --version
shellcheck --version
```

# 4 . Project Structure (IMPORTANT)

This project is a multi-root workspace (monorepo):

SkoreFlow/
├── backend/
├── frontend/
├── testauto/
├── docs/
├── .vscode/
├── package.json (root)

👉 You MUST open the workspace file:

SkoreFlow.code-workspace
Why this matters

Opening only a subfolder breaks:

- npm scripts visibility
- workspace-wide search
- debugging context
- monorepo tooling

# 5. VS Code Workspace Setup

In VS Code:

File → Open Workspace from File...

Use:

SkoreFlow.code-workspace

Recommended workspace structure:

```json
{
  "folders": [
    { "path": "." },
    { "path": "backend" },
    { "path": "frontend" },
    { "path": "testauto/backend", "name": "tests-backend" },
    { "path": "testauto/frontend", "name": "tests-frontend" },
    { "path": "docs" }
  ]
}
```

# 6. Editor Configuration Philosophy

This project enforces a strict separation of responsibilities:

🎨 Formatting

- Prettier is the ONLY formatter
- Format on save enabled globally
  🧹 Linting
- ESLint is used only for code quality
- No formatting rules in ESLint
  🧪 Testing
- Vitest handles all JavaScript/TypeScript tests

# 7. Expected Behavior

Once correctly configured:

Code is formatted automatically on save (Prettier)
ESLint shows only logic issues (no formatting conflicts)
Imports are clean (Go + TS)
Tests run consistently via Vitest
Shell scripts are formatted with shfmt
Errors are highlighted inline (Error Lens)

# 8. Backend (Go)

Strict formatting with gofumpt
Automatic import organization
Clean compilation rules

# 9. Frontend (React / TypeScript)

Prettier for formatting
ESLint for code validation
Emmet enabled for JSX productivity

# 10. Shell Scripts

shfmt formats scripts
ShellCheck validates correctness

# 11. Configuration Principle

🔴 One tool = one responsibility

Concern Tool
Format Prettier
Lint ESLint
Test Vitest
Shell format shfmt
Shell lint ShellCheck

# 12. Monorepo Architecture

This setup ensures a consistent, scalable, and conflict-free development environment for the Skoreflow monorepo.

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

End of Guide
