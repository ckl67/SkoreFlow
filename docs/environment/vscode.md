# VS Code Setup Guide for Skoreflow (Linux)

This guide walks you through installing Visual Studio Code on Linux and configuring it to match the development standards used in the Skoreflow project.

---

## 1. Install Visual Studio Code on Ubuntu

### Using Snap (recommended)

```bash
sudo snap install code --classic
```

Launch VS Code:

```bash
code
```

---

## 2. Install Required Extensions

Open VS Code and install the following extensions:

### Core Extensions

- Go (official Go extension)
- Prettier - Code formatter
- ESLint
- ShellCheck
- shfmt (Martin Kühl)
- ES7+ React/Redux Snippets
- github.copilot (optional, for AI code suggestions)
- EditorConfig for VS Code (optional, for cross-editor consistency)
- gitgraph (for visualizing git history)
- github pull requests and issues (for managing PRs directly from VS Code)
- Makefile Tools (optional, for better Makefile support)
- Python (for Python scripts in the project)
- Pylance (for Python linting and analysis)
- Markdown All in One (for editing markdown files)

- npm IntelliSense for javascript
- Auto Import, auto generate the javascript require
- Error Lens: Highlights errors directly at the end of the line (saves time).

## 3. Install Required System Tools

### Go formatter (gofumpt)

In VS Code, theire is a Go fallback to gofmt **_(installed with Go)_**
However it is better to use gofumpt for stricter formatting.

```bash
go install mvdan.cc/gofumpt@latest
```

Ensure Go binaries are in your PATH:
(Go tools are typically installed in $GOPATH/bin, which is often ~/go/bin)

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

---

### Shell formatting tools

shfmt is a shell formatter written in Go.
In this project, we install it using go install to ensure consistent versions across contributors and avoid relying on outdated system packages

```bash
sudo snap install shellcheck -y

go install mvdan.cc/sh/v3/cmd/shfmt@latest
```

```bash
sudo mv ~/go/bin/shfmt /usr/local/bin/
```

Verify:

```bash
shfmt --version
shellcheck --version
```

---

## 4. Project VS Code Configuration

These settings are intentionally not versioned to allow flexibility per developer
However, contributors are strongly encouraged to follow this setup to maintain consistency

These files are NOT committed to the repository by default. You must create them locally.

### Create the folder:

On the root of the project, create the `.vscode` folder if it doesn't exist:

```text
SkoreFlow/
├── backend/
├── frontend/
├── testauto/
├── docs/
├── .vscode/
```

```bash
mkdir -p .vscode
```

---

## 5. Configure Debugging (launch.json)

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/backend/cmd/server",
      "cwd": "${workspaceFolder}/backend"
    },

    {
      "name": "Debug CLI (no args)",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/backend/cmd/cli",
      "cwd": "${workspaceFolder}/backend"
    },

    {
      "name": "Debug CLI (list users)",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/backend/cmd/cli",
      "cwd": "${workspaceFolder}/backend",
      "args": ["-list-users"]
    },

    {
      "name": "Debug JS Test Auto",
      "type": "node",
      "request": "launch",
      "program": "${file}",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Explanation

- Launches the current Go package
- Automatically detects execution mode
- Useful for quickly debugging API or services

---

## 6. Configure Editor Settings (settings.json)

Create `.vscode/settings.json`:

```json
{
  // --- GÉNÉRAL ---
  // Internal VSC Javascript motor correction
  // checkJs not used
  // we will use eslint.config.mjs (ESLint) and tsconfig.json (TypeScript)
  "js/ts.implicitProjectConfig.checkJs": false,

  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "editor.detectIndentation": false,
  "editor.snippetSuggestions": "top",
  "files.autoSave": "onFocusChange",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  // --- EMMET & REACT ---
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "emmet.triggerExpansionOnTab": true,

  // --- FORMATTING DEFAULT(PRETTIER) ---
  "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[javascriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[markdown]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },

  // --- GO ---
  "[go]": {
    "editor.defaultFormatter": "golang.go",
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    }
  },
  "go.formatTool": "gofumpt",
  "go.lintTool": "golangci-lint",

  // --- PYTHON (Ruff) ---
  "[python]": {
    "editor.defaultFormatter": "ms-python.python",
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    }
  },

  // --- SHELL ---
  "shellcheck.enable": true,
  "[shellscript]": {
    "editor.defaultFormatter": "mkhl.shfmt",
    "editor.tabSize": 4
  },
  "shfmt.flags": ["-i", "4", "-ci"],

  // --- LINTERS & ACTIONS ---
  "eslint.enable": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

## 7. Configuration Philosophy

### Backend (Go)

- Strict formatting with `gofumpt`
- Automatic import cleanup
- Clean and consistent codebase

### Frontend (React / TypeScript)

- Prettier for formatting
- ESLint for code quality
- Emmet enabled for faster JSX writing

### Shell Scripts

- `shfmt` for formatting
- `ShellCheck` for linting

---

## 8. Expected Behavior

Once configured:

- Code is automatically formatted on save
- Imports are cleaned automatically (Go)
- Linting runs on save (ESLint)
- Shell scripts are formatted consistently
- Indentation is enforced (2 spaces globally, 4 for shell)

---

## 9. Notes

- Any deviation may result in formatting conflicts in pull requests

---

## 10. Optional Improvements

You may also:

- Enable GitHub Copilot or inline suggestions
- Configure workspace-specific settings instead of global ones
- Add `.editorconfig` for cross-editor consistency

---

End of guide.
