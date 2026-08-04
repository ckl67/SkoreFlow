<!-- cspell:ignore  -->

# SkoreFlow installation

[← back](../doc.md)

## Objective

This document installs the SkoreFlow application on a prepared server.

The following components will be installed:

- Go backend
- React frontend
- Python thumbnail service
- Application directory structure

At the end of this step, the application files will be installed but no services will be running yet.

## Step 1 — Clone the repository

The `ubuntu` user is only used for server administration.

The application user is responsible for:

- downloading application sources;
- building the backend;
- installing frontend dependencies;
- running application services.

Create the application directory structure, and Clone the repository

```bash
sudo mkdir -p /opt

sudo git clone https://github.com/ckl67/skoreflow.git

```

Assign ownership to the application user:

```bash
sudo chown -R skoreflow:skoreflow /opt/skoreflow
```

The repository already contains the required application directory structure.
Only the ownership must be assigned to the dedicated application user.

## Storage organization

The `storage` directory contains all persistent application data.

```text
/opt/skoreflow
│
├── backend
├── frontend
├── microservices
│   └── thumbnail
└── storage
    ├── database.db
    ├── users
    ├── composers
    └── scores


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
