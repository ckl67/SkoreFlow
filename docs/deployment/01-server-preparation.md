<!-- cspell:ignore adduser  fallocate swapfile  swapon -->

# Server preparation

[← back](../doc.md)

## Step 1 — Install base system packages

Objective

Install the minimal tools required to manage and build SkoreFlow.
At this stage, we do not install Go, Node.js or Nginx yet.
We only prepare the operating system.

With `ubuntu` account

### curl

Used for downloading resources and testing HTTP endpoints.
We will use it later for:

- checking backend health;
- testing APIs;
- downloading installers.

### wget

Used for downloading external archives (for example Go releases).

### build-essential

Provides:

- gcc
- make
- standard compilation tools
  Some Go dependencies or Python packages may require a compiler.

### software-properties-common

Useful for managing Ubuntu repositories.

- ca-certificates
- Important for HTTPS downloads.
  Without it, tools may fail with certificate errors.

### unzip

Required for extracting some archives.

### tree

Useful for inspecting the server filesystem.

## Installation

Execute:

```shell
sudo apt update

sudo apt install -y \
 curl \
 wget \
 build-essential \
 software-properties-common \
 ca-certificates \
 unzip \
 tree
```

## Step 2 — Create the SkoreFlow application user

Objective

SkoreFlow does not run under root.

A dedicated system user named `skoreflow` is used for:

- backend service;
- thumbnail service;
- application files.

Create a dedicated Linux user for running SkoreFlow services.

```text
ubuntu
 |
 |-- system administration
 |
skoreflow
 |
 |-- Go backend
 |-- Python thumbnail service
 |-- application files
 |-- runtime logs
```

```shell
sudo adduser --system \
    --group \
    --home /home/skoreflow \
    --shell /bin/bash \
    skoreflow
```

Explanation

- system : Creates a system service account. The UID will be in the system range.
  - When creating a system user with `adduser --system`, Linux applies a special procedure: it does not copy any default environment configuration files from the `/etc/skel/` directory (the template directory normally used for standard user accounts).
- group : Creates a matching group:
- home : Defines the home directory:
- shell : Allows us to use a shell when necessary.

```shell
# 1. Copy the default environment files
sudo cp /etc/skel/.bashrc /home/skoreflow/.bashrc
sudo cp /etc/skel/.profile /home/skoreflow/.profile

# 2. Assign ownership of the files to skoreflow
sudo chown skoreflow:skoreflow /home/skoreflow/.bashrc /home/skoreflow/.profile
```

## Step 3 Add administration directory

We will reserve a place for future operational scripts.

```shell
# Create:
sudo mkdir -p /opt/skoreflow

# Then assign ownership:
sudo chown skoreflow:skoreflow /opt/skoreflow
```

```text
VPS
│
├── ubuntu
│   └── administration
│
├── skoreflow
│   ├── /home/skoreflow
│   │
│   └── application owner
│
└── /opt/skoreflow
    └── future SkoreFlow installation

```

## Step 4 Memory configuration

A 2 GB swap file is configured to prevent unexpected process termination
during memory-intensive operations such as:

- PDF thumbnail generation
- Image processing
- Application builds

Configuration:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
```

## Verify the swap configuration

Check that the swap file is active:

```bash
free -h
```

Expected output:

```text
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       442Mi       2.8Gi       1.9Mi       772Mi       3.3Gi
Swap:          2.0Gi          0B       2.0Gi
```

The swap usage should initially be **0 B**, which is perfectly normal.
The system will automatically start using swap only if physical memory becomes insufficient.
