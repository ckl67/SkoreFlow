# CONTRIBUTING

## Contributing to SkoreFlow

Thank you by willing to contribute to **SkoreFlow**! 🚀
This guide provides a complete Git workflow using **fork + pull request**.

There is a lot of stuff, and you can contribute to

```bash
.
├── backend/
├── frontend/
├── microservices/
├── testauto/
├── docs/

```

## Guide Line

You will find in the [local document section](./docs/index.md) or on same [github documentation](https://ckl67.github.io/SkoreFlow/) all the necessary information to simplify the installation process and the contribution process.
You can contribute to backend, frontend, microservices, test automation, or the documentation.

As the architecture is layered, you can contribute to the backend without touching the frontend, and vice versa.
All contribution are welcome !

---

## Git Workflow & Pull Request Policy

To maintain a clean and linear Git history on the main branch, please follow these guidelines:

### Local Configuration (Recommended)

Before starting, we recommend setting up Git to rebase automatically when pulling updates:

```Bash
git config pull.rebase true
# or manually
git pull --rebase
```

### Branching & Commits

Always create a dedicated branch for your feature or bug fix:

```Bash
git checkout -b feature/my-new-feature
```

Keep your feature branch updated with main using rebase instead of merge:

```Bash
git fetch origin
git rebase origin/main
```

### . Submitting a Pull Request

Open a Pull Request (PR) against the main branch once your code is ready and tested.

Ensure all discussions and code reviews are resolved before requesting a merge.
