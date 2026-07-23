# 🎼 SkoreFlow Backend

[← back](../doc.md)

## 🧱 Architecture

The project follows a **layered architecture with clear separation of concerns**, combining domain-driven structure and infrastructure isolation.

```text
Client
 → API Layer (routes)
   → Controller
     → Form Validation
       → Service (business logic)
         → Model (database)
         → Domain (business helpers)
         → Infrastructure (storage, DB, etc.)
 → Response
    → dto

```

## 📁 Project Structure

```bash
.
├── api/                # HTTP layer (bootstrap, router, server)
├── cmd/                # Entry points (server / CLI)
├── assets/             # Common assets to avoid unnecessary duplication (Read Only)
├── core/               # Business logic (domain-centric)
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── forms/
│   ├── dto/
│   ├── domain/         # Domain-specific logic (e.g. score processing)
│   └── apperrors/
│
├── infrastructure/     # Technical layers (external systems)
│   ├── database/
│   ├── logger/
│   └── config/
│
├── pkg/                # Shared utilities (pure, reusable)
│   ├── file/
│   ├── format/
│   ├── pdf/
│   ├── mail/
│   ├── security/
│   ├── responses/
│   └── misc/
│
├── middlewares/
├── auth/
├── build/
├── Makefile
├── go.mod
│

# and beside

storage/  #  Persistent runtime data (excluded from Git)
├── database.db
├── scores/
│   ├── uploaded-scores/
│   │   ├── Mozart/
│   │   │   └── Mozart.png
│   ├── thumbnails/
│   │   ├── Mozart/
│   │   │   └── Mozart.png
├── composers
│   ├── mozart
│   │       └── picture.png
│   │       └── thumbnail.png
│   └── bach
│   │       └── picture.png
│   │       └── thumbnail.png
├── users/
│   ├── user-1.png
│   ├── user-15.png
│   └── ...
│

```

## 🌐 API Design

### Base URL

```bash
/api
# Or if necessary
/api/v1
```

### Main Resources

```bash
/users
/scores
/composers
/files
/uploads
```

### 🔄 Example Flow: Upload Score

```text
POST /scores/upload

→ Route (api)
→ Controller
→ Form validation
→ Service (business logic)
→ Model (DB insert)
→ Domain logic (normalization, naming)
→ Infrastructure (file storage, thumbnail generation)
→ Data Output JSON (dto) Response
```

## 🧠 Core Concepts

### ✅ Domain-driven structure

Business logic is centralized inside `core/` and isolated from technical concerns.

### ✅ Infrastructure isolation

External systems (database, storage, logger) are grouped under `infrastructure/`.

### ✅ Clean utilities (`pkg/`)

Reusable helpers are separated from business logic.

### ✅ Score File processing pipeline

- Upload
- Normalize
- Store
- Generate thumbnails

## ⚙️ Tech Stack

- **Language**: Go (Golang)
- **Framework**: Gin
- **ORM**: GORM
- **Validation**: go-playground/validator

## 🔐 Authentication

- Token-based authentication (JWT) [see also](./architecure.dio)
- Middleware-based access control

## 📦 Storage Structure

```bash
├── storage/
│   ├── scores/
│   │   ├── uploaded-scores/
│   │   └── thumbnails/
│   ├── composers/
│   └── assets/

```

## Rule path for SkoreFlow

To avoid confusion and ensure consistency, we define a clear structure for our file storage in SkoreFlow, both in local development and within Docker containers.
We use environment variables to set the root path and data path

```go
//In local
PROJECT_ROOT=/home/<linux user>/SkoreFlow_Project/SkoreFlow/backend
DATA_ROOT=/var/storage

//In Docker
PROJECT_ROOT=/app
DATA_ROOT=storage
```

In database the data are stored relative to the **DataRoot=storage/**

See **path.go** for more details.

## 🧪 Testing (Planned)

- Auto test : Reference : /SkoreFlow/testauto/backend
- Manual tests (services/ domain / API routes / forms)

## 🚀 Getting Started

### Clone repository

```bash
git clone https://github.com/your-username/skoreflow-backend.git
cd backend
```

### Setup environment

```bash
cp .env.example .env
```

### Run server

```bash
go run cmd/server/main.go
```
