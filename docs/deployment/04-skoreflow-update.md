# SkoreFlow update

## Objective

This document describes how to update an existing SkoreFlow installation.

It assumes that the application has already been installed and that all required runtimes are available.

## Step 1 Switch to the application user

For application installation tasks, switch to the SkoreFlow user:

```shell
sudo su - skoreflow
# to revert back tu ubuntu
exit
```

The `skoreflow` account owns all application files.

It is used to:

- update the source code;
- build the backend;
- install frontend dependencies;
- build the frontend;
- run the application services.

It is **not** intended for SSH administration.

Administrative tasks should always be performed using the server administrator account (for example `ubuntu`), then switch to the application user when required.

## Step 2 — Update the source code

Synchronize the local repository with GitHub.

The production server should never contain local modifications.

```shell
git fetch origin
git reset --hard origin/main
git clean -fd
```

## ## Step 3 — Build the backend

Backend dependencies with SkoreFlow user:

```shell
cd /opt/skoreflow/backend
# During the first installation:
make reset
# For subsequent updates:
make build
```

## Step 4 — Build the frontend

The frontend dependencies are installed using npm.

Switch to the application user:

```bash
cd /opt/skoreflow/frontend
# During the first installation:
npm install
# For subsequent updates:
npm run build
```

## Step 5 — Build thumbnail service

```shell
# During the first installation:
make reinstall
# For subsequent updates:
make run
```

## Step 6 — Configure the environment

- backend .env
- frontend .env.production
- thumbnail config

## Step 7 — Verify the installation

At this point, the application has been fully updated but no services have been restarted yet.

- the backend source code is installed;
- the frontend dependencies are installed;
- the frontend production build has been generated;
- the thumbnail service dependencies are installed.

The application is now ready to be configured and managed by system services.

Verify the installation:

```bash
cd /opt/skoreflow
tree -I 'node_modules' -L2
```

Expected layout:

```text
/opt/skoreflow
├── backend
├── frontend
├── microservices
│   └── thumbnail
└── storage
```

The next document covers service management and automatic startup.

## Production update policy

The production server should never be modified manually.

Dependency updates (`npm audit fix`, package upgrades, dependency changes, etc.) must always be performed in the development environment, validated, committed to Git, and then deployed to the server.

The production server should only:

- retrieve the latest committed sources;
- build the application;
- restart the services.

This guarantees that production always runs the exact version that has been tested and validated.

## Deployment script

For server deployment all the command above will be included in a shell file `deploy.sh`
