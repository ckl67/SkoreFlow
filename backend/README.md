# 🎼 SkoreFlow Backend

> **From upload to structured music data — cleanly processed.**

SkoreFlow is a backend service designed to manage, process, and serve musical scores through a clean, scalable, and layered architecture.
SkoreFlow let you store all your personnal scores, and annotate them.
SkoreFlow is based on an original idea proposed with [SheetAble](hhttps://github.com/SheetAble/SheetAble).
However SkoreFlow is completely different, and has been designed with a full new modern REST architecture with much more features, and possibility of cool enhancements.

---

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
```

---

## 📁 Project Structure

```bash
.
├── api/                # HTTP layer (bootstrap, router, server)
├── cmd/                # Entry points (server / CLI)
├── core/               # Business logic (domain-centric)
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── forms/
│   ├── domain/         # Domain-specific logic (e.g. sheet processing)
│   └── errors/
│
├── infrastructure/     # Technical layers (external systems)
│   ├── database/
│   ├── storage/
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
├── micro-service/      # Specific backend services
│   ├── thumbnail-service/

```

---

## 🌐 API Design

### Base URL

```bash
/api
# Or if nesserary
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

---

## 🔄 Example Flow: Upload Score

```text
POST /scores/upload

→ Route (api)
→ Controller
→ Form validation
→ Service (business logic)
→ Model (DB insert)
→ Domain logic (normalization, naming)
→ Infrastructure (file storage, thumbnail generation)
→ JSON Response
```

---

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

---

## ⚙️ Tech Stack

- **Language**: Go (Golang)
- **Framework**: Gin
- **ORM**: GORM
- **Validation**: go-playground/validator

---

## 🔐 Authentication

- Token-based authentication (JWT)
- Middleware-based access control

---

## 📦 Storage Structure

```bash
infrastructure/storage/
├── sheets/
│   ├── uploaded-sheets/
│   └── thumbnails/
├── composers/
└── assets/
```

---

## 🧪 Testing (Planned)

- Auto test : Reference : /SkoreFlow/testauto/backend
- Manual tests (services/ domain / API routes / forms)

---

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

---
