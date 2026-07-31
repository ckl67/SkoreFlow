# Runtime installation

## Objective

This document installs all software required to build and run SkoreFlow.

At the end of this step, the server will provide:

- Go
- Python
- pip
- SQLite
- Poppler utilities
- Git

The application itself is not installed yet.

---

## Installed components

| Component | Purpose                         |
| --------- | ------------------------------- |
| Go        | Build and run the backend       |
| Python    | Run the thumbnail service       |
| pip       | Install Python packages         |
| SQLite    | Application database            |
| Poppler   | PDF thumbnail generation        |
| Git       | Clone and update the repository |

---

## Step 1 — Install Go

SkoreFlow backend is written in Go.
To ensure reproducible builds, the production server uses the same Go version as the development environment.
At the time of writing: Go 1.25.0

### Remove previous installations

If Go was previously installed, remove it before installing a new version.

```bash
sudo apt remove golang-go golang -y || true
sudo rm -rf /usr/local/go
```

---

### Download Go

```bash
cd /tmp
wget https://go.dev/dl/go1.25.0.linux-amd64.tar.gz
```

Verify the downloaded archive:

```bash
ls -lh go1.25.0.linux-amd64.tar.gz
```

---

### Install Go

```bash
sudo tar -C /usr/local -xzf go1.25.0.linux-amd64.tar.gz
```

---

### Configure PATH

Create a profile script:

```bash
sudo nano /etc/profile.d/go.sh
```

Content:

```bash
export PATH=$PATH:/usr/local/go/bin
```

Reload the environment:

```bash
source /etc/profile.d/go.sh
```

Alternatively, reconnect to the server.

---

### Verify installation

```bash
go version
```

Expected output:

```text
go version go1.25.0 linux/amd64
```

## Step 2 — Install Node.js

The SkoreFlow frontend is built with:

- React
- TypeScript
- Vite
- npm packages

Node.js and npm are required to install dependencies and generate the production frontend build.

The server uses the Node.js LTS release.

### Install Node.js LTS

Install the NodeSource repository:

```shell
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
```

Install Node.js:

```shell
sudo apt install -y nodejs
```

Verify installation

```shell
# Check Node.js:
node -v

# Expected output: v22.x.x

#Check npm:

npm -v
# Expected output:10.x.x
```

## Step 3 — Install Python tools

The thumbnail service is written in Python.

Ubuntu already provides Python 3, but additional packages are required to install Python dependencies and create isolated virtual environments.

---

### Install Python packages

```bash
sudo apt update

sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv
```

---

### Verify the installation Python

```bash
python3 --version

pip3 --version
```

Expected output:

```text
Python 3.x.x
pip x.x.x
```

The exact version may vary depending on the Ubuntu release.

## Step 4 — Install SQLite

SkoreFlow stores its data in an SQLite database.

Although the application manages the database automatically, the SQLite command-line utility is extremely useful for:

- inspecting the database;
- troubleshooting;
- exporting data;
- creating backups.

---

### Install SQLite

```bash
sudo apt install -y sqlite3
```

---

### Verify the installation SQLite

```bash
sqlite3 --version
```

## Step 5 — Install Poppler

The thumbnail service converts PDF pages into images.

This conversion relies on the Poppler utilities, especially:

- pdftoppm
- pdfinfo

These binaries are required by the Python package `pdf2image`.

---

### Install Poppler

```bash
sudo apt install -y poppler-utils
```

---

### Verify the installation

```bash
pdftoppm -v

pdfinfo -v
```

## Step 6 — Install Git

Git is used to clone and update the SkoreFlow repository.

---

### Install Git

```bash
sudo apt install -y git
```

---

### Verify the installation Git

```bash
git --version
```

## Installation summary

| Component | Status      |
| --------- | ----------- |
| Go        | ✓ Installed |
| Node.js   | ✓ Installed |
| npm       | ✓ Installed |
| Python    | ✓ Installed |
| pip       | ✓ Installed |
| SQLite    | ✓ Installed |
| Poppler   | ✓ Installed |
| Git       | ✓ Installed |

The server is now ready for the SkoreFlow installation.
