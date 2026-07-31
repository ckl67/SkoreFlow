# SkoreFlow installation

## Objective

This document installs the SkoreFlow application on a prepared server.

The following components will be installed:

- Go backend
- React frontend
- Python thumbnail service
- Application directory structure

At the end of this step, the application files will be installed but no services will be running yet.

Service management and reverse proxy configuration are covered in the following documents.

## Step 1 — Create the application directories

Create the application directory structure, and Clone the repository

```bash
sudo mkdir -p /opt
sudo git clone https://github.com/ckl67/skoreflow.git

```

Assign ownership to the application user:

```bash
sudo chown -R skoreflow:skoreflow /opt/skoreflow
```

## Storage organization

The `storage` directory contains all persistent application data.

```text
storage/
│
├── database.db
│
├── scores/
│   ├── uploaded-scores/
│   │   └── <composer>/
│   │       └── <score files>
│   │
│   └── thumbnails/
│       └── <composer>/
│           └── <generated thumbnails>
│
├── composers/
│   └── <composer>/
│       ├── picture.png
│       └── thumbnail.png
│
└── users/
    ├── user-1.png
    ├── user-2.png
    └── ...
```

This separation provides several advantages:

- the database remains independent from media files;
- uploaded scores are separated from generated thumbnails;
- each composer owns an isolated directory;
- user avatars are stored independently;
- backups and maintenance operations are simplified.

## Step 2 skoreflow user

For application installation tasks, switch to the SkoreFlow user:

```shell
sudo su - skoreflow
# to revert back tu ubuntu
exit
```

Note :
**The skoreflow user is a dedicated system account intended to run the application and perform build operations.It is not intended for direct SSH login. Server administration should always be performed using the administrative account (for example ubuntu), then switch to the application user when needed:**

The SkoreFlow application files are owned by the dedicated `skoreflow` system user.

The `ubuntu` user is only used for server administration.

The application user is responsible for:

- downloading application sources;
- building the backend;
- installing frontend dependencies;
- running application services.

## Step 2 Create the .env files

- backend/.env
- frontend/.env

## Step 3 Install backend

Backend dependencies with SkoreFlow user:

```shell
cd backend
make reset
make build
```

## Step 4 — Install frontend

The frontend dependencies are installed using npm.

Switch to the application user:

```bash
cd /opt/skoreflow/frontend
npm install
npm audit
```

Security fixes should be reviewed before applying forced updates:

Security fixes should be reviewed before applying forced updates:

```bash
npm audit fix

# Avoid using:

npm audit fix --force
```

during production deployment without checking possible major version upgrades.
After installing frontend dependencies:
npm may report vulnerabilities in transitive dependencies.
Security updates must be reviewed before applying:
Forced fixes can introduce major version upgrades and should not be applied automatically on production systems.

```bash
npm run build
```

## Step 5 — Install thumbnail service

```shell
make reinstall
make run
```

## Step 6 — Configure environment files

- backend .env
- frontend .env.production
- thumbnail config

## Step 7 — Verify the installation

At this stage:

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
