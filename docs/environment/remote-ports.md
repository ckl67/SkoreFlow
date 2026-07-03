# Remote Development, Ports, and VPN (Host ↔ VM) — Practical Model

[← back](../doc.md)

This document explains what is happening when you develop inside a remote Ubuntu VM from VS Code on a Windows host, and why networking issues (localhost, ports, CORS, curl failures) occur.

## 🧠 Basic Mental Model

Two different machines:

```text
[ Windows Host (VS Code + Browser) ]
            |
            |  (network / VPN / bridged adapter)
            |
[ Ubuntu VM (backend, services, Docker, etc.) ]
```

Even if VS Code “feels local”, backend is running in the VM.

## 🔌 What is a “Port” in this context?

A port is not global — it is always scoped to a machine.

| Machine | Address        | Meaning          |
| ------- | -------------- | ---------------- |
| Windows | localhost:8080 | Windows itself   |
| VM      | localhost:8080 | Ubuntu VM itself |

👉 These are completely different services

❌ Common mistake

From Windows:

```shell
curl http://localhost:8080
```

This tries to reach:

Windows machine → port 8080

If backend runs in VM → ❌ connection fails

✅ Correct approach

Target the VM IP:

```shell
curl http://192.168.1.138:8080
```

## 🌐 Network connection between Host and VM

You are likely using one of these:

### Option A — NAT (default VM mode)

- VM is isolated
- Host cannot directly access VM services
- Requires port forwarding

### Option B — Bridged Network (Preferred case)

- VM is on same LAN as host
- VM gets IP like 192.168.1.138
- Host can directly access VM services

✔ This is why setup works with:

```shell
http://192.168.1.138:8080
```

## 🔐 VPN impact (important)

With VPN (corporate / Fortinet / etc.)

A VPN can:

🟡 Modify routing

- Redirect traffic
- Block local LAN access
- Split traffic (split tunneling)
  🟡 Create “fake local networks”
- Windows may see different subnet
- VM remains on physical LAN
  ⚠️ Symptom observed
  Windows: curl localhost:8080 → FAIL
  VM: curl localhost:8080 → OK
  Windows: curl 192.168.1.138:8080 → OK

👉 This confirms:

VPN does NOT expose VM services via localhost
Only LAN IP works

## VS Code “Ports” Window (Remote Development) — Explanation

The Ports panel in VS Code (especially with Remote SSH / Dev Containers / WSL) is a helper UI that shows and manages network ports opened on the remote machine.

### What the Ports panel actually shows

When you run a server on a remote machine (e.g. Ubuntu VM), VS Code can detect it:

- localhost:8080 (Go backend)
- localhost:5173 (Vite frontend)
- localhost:5001 (Python microservice)

In the Ports tab, VS Code lists:

-Port number (8080, 5173, etc.)

- Process using the port (if detectable)
- Whether it is “Forwarded” or not
- Accessibility state 2. What “Forwarded Port” means

### What A forwarded port means

VS Code creates a tunnel from your local machine (Windows) → remote machine (Ubuntu VM)

So you can access:

```shell
http://localhost:8080 (Windows browser)
```

even though the service is actually running on:

Ubuntu VM:8080

### Two types of access

A. Without port forwarding

You must use the VM IP:

```shell
http://192.168.1.138:8080
```

B. With port forwarding (VS Code Ports tab)

VS Code creates a tunnel:
Windows localhost:8080 → Ubuntu VM:8080

So you can use:

```shell
http://localhost:8080
```

on Windows directly.

### Why VS Code shows “Forwarded” or “User Forwarded”

When you see:

- Forwarded
- User Forwarded

It means:

The port is intentionally exposed from remote → local machine
This is NOT automatic for all ports; it depends on:

- VS Code settings
- Clicking “Forward Port”
- Auto-detection behavior

### Important limitation

Port forwarding in VS Code:

- Only affects your local development machine
- Does NOT expose the service to your network
- Does NOT replace proper networking configuration

So:

| Scenario                                 | Works |
| ---------------------------------------- | ----- |
| Windows browser → forwarded port         | ✔     |
| Another device on Wi-Fi → forwarded port | ❌    |
| Render / production usage                | ❌    |

## 🔥 VS Code Remote does NOT change networking

VS Code Remote:

only moves terminal/editor execution
does NOT unify networking

So:

| Action              | Runs where |
| ------------------- | ---------- |
| Go backend          | VM         |
| Flask service       | VM         |
| curl in VM terminal | VM         |
| browser             | Windows    |

## 🌍 CORS in this architecture

CORS depends on browser origin only

Example:

```shell
Frontend: http://localhost:5173 (Windows browser)
Backend: http://192.168.1.138:8080 (VM)
```

Request flow:

```shell
Browser → OPTIONS preflight → VM backend
```

Backend must allow:

```shell
AllowOrigins: [
"http://localhost:5173",
"http://192.168.1.141:5173"
]
```

✔ This is correct

## ⚙️ Required configuration rules

### Backend (Go / VM)

- Bind address MUST be:
- 0.0.0.0:8080

Why:

- 127.0.0.1 → VM-only access
- 0.0.0.0 → accessible from host

### Frontend (Windows browser)

```shell
VITE_API_URL=http://192.168.1.138:8080/api
```

Never use:

- localhost → ❌ wrong in VM setups

```shell
CORS backend
FRONTEND_ORIGIN=http://localhost:5173
```

or

```shell
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.141:5173 8. 🧪 Debug checklist
```

## 🧭 Summary

- VS Code remote ≠ shared network
- VM has its own localhost
- Windows must use VM IP
- VPN can modify routing but not change machine boundaries
- CORS must match browser origin, not backend host
