# 🤝 How to Contribute to SkoreFlow

## 👥 Mode Collaboration (Direct Access)

Use this if you are a member of the core team.

```bash
# Clone the repository
git clone https://github.com/ckl67/SkoreFlow.git
cd SkoreFlow
```

🌿 2. Create a branch

```bash
git checkout -b <github-login>/dev
```

🔄 3. Workflow

```mermaid
flowchart LR
    A[Clone] --> B[Branch]
    B --> C[Commit]
    C --> D[Push]
    D --> E[Pull Request]
    E --> F[Code Review / Tests]
    F --> G[Merge to Main]
```

# Mode Fork

Use this if you want to propose a change without direct write access.

## 🍴 1. Fork the repository

```bash
git clone https://github.com/ckl67/SkoreFlow.git
cd SkoreFlow
```

Add upstream:

```bash
git remote add upstream https://github.com/ckl67/SkoreFlow.git
git remote -v
```

---

## 🌿 2. Create a branch

```bash
git checkout -b <github-login>/dev
```

Examples:

```bash
git checkout -b christian/dev
git checkout -b loic/fix/login-error
```

---

## 🔄 3. Workflow

```mermaid
flowchart LR
    A[Fork] --> B[Clone]
    B --> C[Branch]
    C --> D[Commit]
    D --> E[Push]
    E --> F[Pull Request]
    F --> G[Merge]
```

---

## 💻 4. Development

```bash

git status
git add .
git commit -m "feat: add PDF export"
```

---

## 🔁 5. Sync with upstream

```bash
# Update your local main
git fetch upstream
git checkout main
git merge upstream/main

# Rebase your feature branch
git checkout <your-branch>
git rebase main
```

---

## 🚀 6. Push

```bash
git push origin <your-branch>
# Then open a PR on GitHub
```

---

## 🔀 7. Pull Request

- Open PR on GitHub
- Explain what, why, how

---

## 🧪 8. Testing

See directory : /autotest

```bash
./auto-test.sh
```

All tests must pass.

---

## ✅ Checklist

- [ ] Builds
- [ ] Tests pass (./auto-test.sh is green).
- [ ] Up to date
- [ ] Clean commits
- [ ] PR documented
