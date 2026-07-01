# VS Code Workspace Decision (Monorepo Setup)

[← back](./../index.md)

This project uses a **single-folder VS Code setup (Open Folder mode)** instead of a multi-root `.code-workspace`.
The main reason after several attempt is that something will always missing in a specific `.code-workspace`, and we risk
to switch from one workspace to another workspace !!

## Why this choice was made

- Multi-root workspaces introduce unnecessary complexity for monorepos.
- VS Code `files.exclude` is **global across all workspace roots**, which can cause unexpected side effects and hidden files.
  "files.exclude": {
  // Hides these folders ONLY in the root folder to avoid visual duplicates
  // --- STRICT masking at the root only (with ./) ---
  "backend": true,
  "frontend": true,
  "shared": true,
  "microservice": true,
  "testauto": true,
  "docs": true,
- Using a `.code-workspace` file does not provide real architectural benefits for this type of monorepo.
- It can lead to duplicate folder views and confusing Explorer behavior.

## Current decision

- Open project via: **File → Open Folder (repo root)**
- Do NOT use `.code-workspace`
- Keep configuration in: `.vscode/settings.json`

## Benefits of this approach

- Predictable Explorer structure
- No duplicated folders
- No workspace scope confusion
- Simpler debugging and tooling behavior
- Standard industry practice for monorepos (frontend/backend/shared/services)

## Reminder

If you feel tempted to switch back to a multi-workspace setup:

> This project is intentionally kept simple.
> The complexity cost of `.code-workspace` was evaluated and rejected for this architecture.
