<!-- cspell:ignore journalctl -->

# System services

[← back](../doc.md)

## Objective

This document configures SkoreFlow to run as Linux services using **systemd**.

At the end of this step:

- the backend starts automatically when the server boots;
- the thumbnail service starts automatically;
- both services are automatically restarted if they unexpectedly stop;
- application logs are available through `journalctl`.
  - f: Follows the log in real time (follow).
  - u skoreflow-backend: Filters only events from the skoreflow-backend.service unit.
    The reverse proxy (Nginx) and HTTPS configuration are covered in the next document.

## With `ubuntu` account

## Step 1 — Backend service

Create the backend service definition.

```bash
sudo nano /etc/systemd/system/skoreflow-backend.service
```

Contents:

```ini
[Unit]
Description=SkoreFlow Backend
After=network.target

[Service]
Type=simple

User=skoreflow
Group=skoreflow

WorkingDirectory=/opt/skoreflow/backend

ExecStart=/opt/skoreflow/backend/bin/server

Restart=always
RestartSec=5

Environment=APP_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## Step 2 — Thumbnail service

Create the thumbnail service definition.

```bash
sudo nano /etc/systemd/system/skoreflow-thumbnail.service
```

Contents:

```ini
[Unit]
Description=SkoreFlow Thumbnail Service
After=network.target

[Service]
Type=simple

User=skoreflow
Group=skoreflow

WorkingDirectory=/opt/skoreflow/microservices/thumbnail

ExecStart=/usr/bin/make run

Restart=always
RestartSec=5

Environment="PATH=/opt/skoreflow/microservices/thumbnail/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"

[Install]
WantedBy=multi-user.target
```

---

## Step 3 — Reload systemd

Whenever a new service file is created or modified, reload the systemd configuration.

```bash
sudo systemctl daemon-reload
```

---

## Step 4 — Enable automatic startup

Enable both services so they automatically start during system boot.

```bash
sudo systemctl enable skoreflow-backend

sudo systemctl enable skoreflow-thumbnail
```

---

## Step 5 — Start the services

Start both services.

```bash
sudo systemctl start skoreflow-backend

sudo systemctl start skoreflow-thumbnail
```

---

## Step 6 — Verify service status

Check that both services are running.

Backend:

```bash
sudo systemctl status skoreflow-backend
```

Thumbnail service:

```bash
sudo systemctl status skoreflow-thumbnail
```

Expected status:

```text
Active: active (running)
```

---

## Step 7 — View service logs

Display backend logs:

```bash
sudo journalctl -u skoreflow-backend
```

Display thumbnail service logs:

```bash
sudo journalctl -u skoreflow-thumbnail
```

Follow logs in real time:

```bash
sudo journalctl -fu skoreflow-backend
```

```bash
sudo journalctl -fu skoreflow-thumbnail
```

Show the latest 100 log entries:

```bash
sudo journalctl -u skoreflow-backend -n 100
```

---

## Step 8 — Service management

Restart a service:

```bash
sudo systemctl restart skoreflow-backend
```

```bash
sudo systemctl restart skoreflow-thumbnail
```

Stop a service:

```bash
sudo systemctl stop skoreflow-backend
```

```bash
sudo systemctl stop skoreflow-thumbnail
```

Start a stopped service:

```bash
sudo systemctl start skoreflow-backend
```

```bash
sudo systemctl start skoreflow-thumbnail
```

Disable automatic startup:

```bash
sudo systemctl disable skoreflow-backend
```

```bash
sudo systemctl disable skoreflow-thumbnail
```

---

## Step 9 — Verify automatic startup

Reboot the server.

```bash
sudo reboot
```

Reconnect after the reboot and verify both services.

```bash
systemctl status skoreflow-backend
```

```bash
systemctl status skoreflow-thumbnail
```

Both services should report:

```text
Active: active (running)
```

---

## Installation summary

At this stage:

- ✓ Backend service installed
- ✓ Thumbnail service installed
- ✓ Automatic startup enabled
- ✓ Automatic restart configured
- ✓ Logging available through `journalctl`

The SkoreFlow application is now running as managed Linux services.

The next document covers the reverse proxy configuration with Nginx and HTTPS.

## Checking

Check the thumbnail health endpoint.

```bash
curl http://localhost:5001/health
```

Check the backend health endpoint.

```bash
curl http://localhost:8080/api/v1/health
```
