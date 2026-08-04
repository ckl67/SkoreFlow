<!-- cspell:ignore journalctl -->

# Deployment

## Objective

This document describes the standard deployment procedure for updating a production SkoreFlow server.

The deployment process consists of two distinct phases:

1. **Application deployment** (performed as the `skoreflow` user)
2. **Service restart** (performed as the `ubuntu` administrative user)

This separation follows the security model introduced in the previous documents:

- `ubuntu` administers the server;
- `skoreflow` owns and builds the application.

---

## Deployment workflow

```text
Developer
    │
    │ git push
    ▼
GitHub
    │
    ▼
Production server
    │
    ├── ubuntu
    │      │
    │      └── switch to skoreflow
    │
    ▼
skoreflow
    │
    ├── Update repository
    ├── Install dependencies
    ├── Build backend
    ├── Build frontend
    ├── Install thumbnail service
    │
    ▼
ubuntu
    │
    └── Restart services
```

---

## Step 1 — Connect to the server

Connect using the administrative account.

```bash
ssh ubuntu@<server-ip>
```

---

## Step 2 — Switch to the application user

```bash
sudo su - skoreflow
```

---

## Step 3 — Run the deployment script

Move to the application directory.

```bash
cd /opt/skoreflow
```

Run the deployment script.

```bash
./scripts/deploy.sh
```

The deployment script is responsible for:

- updating the Git repository;
- installing or updating Python dependencies;
- building the Go backend;
- installing frontend dependencies;
- generating the production frontend build;
- performing deployment checks.

No system service is restarted during this phase.

---

## Step 4 — Return to the administrative account

```bash
exit
```

---

## Step 5 — Restart the services

Restart the application services.

```bash
sudo systemctl restart skoreflow-thumbnail

sudo systemctl restart skoreflow-backend
```

Reload Nginx if necessary.

```bash
sudo systemctl reload nginx
```

---

## Step 6 — Verify the deployment

Verify that all services are running correctly.

```bash
sudo systemctl status skoreflow-backend

sudo systemctl status skoreflow-thumbnail
```

Check the services

```bash
# -f: Follows the log in real time (follow).
# -u skoreflow-backend: Filters only events from the skoreflow-backend.service unit.

sudo journalctl -fu skoreflow-thumbnail
sudo journalctl -fu skoreflow-backend

curl http://localhost:5001/health
curl http://localhost:8080/api/health
```

If the frontend is served through Nginx, open the application in a browser and verify that:

- the frontend loads correctly;
- authentication works;
- uploaded scores are accessible;
- thumbnail generation is operational.

---

## Summary

The complete deployment procedure is intentionally simple.

```text
ssh ubuntu@server

↓

sudo su - skoreflow

↓

cd /opt/skoreflow

↓

./scripts/deploy.sh

↓

exit

↓

sudo systemctl restart skoreflow-thumbnail

↓

sudo systemctl restart skoreflow-backend

↓

sudo systemctl reload nginx
```

This approach clearly separates server administration from application deployment while keeping the deployment process simple, repeatable, and secure.
