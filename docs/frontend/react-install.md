# 1. React Installation Guide (Vite) for Skoreflow Monorepo

This part is just for knowledge and as remember.
This guide explains how to install and integrate a React frontend using Vite inside the existing Skoreflow monorepo.

## 1.1. Clone the Repository

```bash
git clone https://github.com/ckl67/skoreflow.git
cd skoreflow
```


---

## 1.2. Prerequisites

Make sure Node.js is installed using `nvm` (recommended):

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js LTS
nvm install 20
nvm use 20
nvm alias default 20

#Verify installation:

node -v
npm -v

```

## 1.3. Project Context (IMPORTANT)

This project uses a monorepo structure:

```shell
SkoreFlow/
├── node_modules/        ✅ unique
├── package.json        ✅ workspaces
├── frontend/
│   └── package.json
├── testauto/
│   ├── backend/
│   │   └── package.json
│   └── frontend/
│       └── package.json

```

## 1.4. Create React App (Vite)

Navigate to the frontend directory:

```shell
cd frontend

#Initialize Vite + React in the current folder:
npm create vite@latest . -- --template react

⚠️ The . is critical — it installs into the existing folder.

```

## 1.5. Install Dependencies

```shell
# from the root
 npm install
```

## 1.6. Add React Router

```shell
 npm install react-router-dom -w frontend
 npm install axios -w frontend

 npm install axios -w testauto/backend

```

## 1.7. Run Development Server

```shell
 run dev
```
