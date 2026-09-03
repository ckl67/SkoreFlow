<!-- cspell:ignore gofumpt  -->

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

## Project Structure

This project is a **monorepo** with a single root:

```shell
SkoreFlow/
├── backend/        # Go API
├── frontend/       # React (Vite)
├── testauto/       # Tests (Vitest)
├── microservices/   # Python and others
├── docs/           # Documentation
├── package.json    # Root config
```

👉 vscode tools are configured at the **root level**
