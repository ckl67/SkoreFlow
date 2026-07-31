# Server Inventory

## Objective

This document records the initial state of the production server before any software installation or configuration.

Keeping this inventory allows us to:

- reproduce the deployment process;
- understand the original environment;
- simplify troubleshooting;
- compare future changes after upgrades.

## Server Information

| Property         | Value                      |
| ---------------- | -------------------------- |
| Provider         | OVHcloud                   |
| Hostname         | `vps-d36ed37e.vps.ovh.net` |
| Operating System | Ubuntu 26.04 LTS           |
| Kernel           | Linux 7.0.0-28-generic     |
| Architecture     | x86_64                     |
| Virtualization   | KVM                        |
| Public IPv4      | 137.74.168.176             |
| Public IPv6      | 2001:41d0:305:2100::1:4206 |

Connection

```shell
ssh ubuntu@137.74.168.176
```

Note :
**_The skoreflow user is a dedicated system account intended to run the application and perform build operations. It is not intended for direct SSH login. Server administration should always be performed using the administrative account (for example ubuntu), then switch to the application user when needed:_**

## Hardware

| Resource             | Value     |
| -------------------- | --------- |
| CPU                  | 2 vCPU    |
| Memory               | 3.7 GB    |
| Disk                 | 38 GB SSD |
| Available Disk Space | ~36 GB    |

## Installed Software

| Software | Version |
| -------- | ------- |
| Git      | 2.53.0  |
| Python   | 3.14.4  |

The following software is **not** installed yet:

- Go
- Node.js
- npm
- SQLite
- pip
- Nginx

## Verification

The following commands were used to collect the information:

```bash
hostnamectl
df -h
free -h
lscpu

git --version
python3 --version

systemctl --type=service --state=running
sudo ss -tulpn
```

## User accounts

SkoreFlow follows the principle of least privilege.

Each Linux account has a specific responsibility and should only be used for the tasks it was designed for.

This separation improves both security and maintainability.

| User        | Purpose              | Typical tasks                                                     | Uses `sudo`    |
| ----------- | -------------------- | ----------------------------------------------------------------- | -------------- |
| `root`      | Linux superuser      | Full system administration                                        | Not applicable |
| `ubuntu`    | Server administrator | Install packages, configure services, manage the operating system | Yes            |
| `skoreflow` | Application owner    | Build and run the SkoreFlow application                           | No             |

---

## The `root` account

The `root` account has unrestricted access to the entire operating system.

It can:

- modify any file;
- install or remove software;
- manage users;
- configure services;
- change system security settings.

For security reasons, direct login as `root` is generally disabled on Ubuntu servers.

Administrative operations should instead be performed using `sudo`.

---

## The `ubuntu` account

The `ubuntu` account is the administrative user provided by the operating system.

Although it is **not** the `root` user, it belongs to the `sudo` group and can temporarily obtain administrator privileges.

Typical responsibilities include:

- installing system packages;
- configuring Nginx;
- creating system services;
- managing firewall rules;
- updating the operating system;
- switching to the application user when required.

Examples:

```bash
sudo apt update

sudo systemctl restart nginx

sudo systemctl daemon-reload

sudo su - skoreflow
```

The `ubuntu` account should **not** own or execute the application.

---

## The `skoreflow` account

Will be created in the next chapter.

The `skoreflow` account is a dedicated system user responsible for the application itself.

It owns the entire application directory:

```text
/opt/skoreflow
```

Typical responsibilities include:

- building the Go backend;
- installing frontend dependencies;
- generating the frontend production build;
- installing Python dependencies;
- running the backend service;
- running the thumbnail service.

Examples:

```bash
cd /opt/skoreflow/backend
make build

cd /opt/skoreflow/frontend
npm install
npm run build

cd /opt/skoreflow/microservices/thumbnail
make reinstall
```

The `skoreflow` user is intentionally **not** allowed to execute administrative commands with `sudo`.

If the application were ever compromised, it would not automatically gain administrator privileges.

---

## Ownership model

The deployment follows a clear ownership model.

```text
                    root
                      │
                      │
                 (via sudo)
                      │
                 ubuntu
          System administration
                      │
          sudo su - skoreflow
                      │
                      ▼
                 skoreflow
             Application owner
                      │
      /opt/skoreflow
      ├── backend
      ├── frontend
      ├── microservices
      └── storage
```

This separation ensures that:

- system administration remains isolated from the application;
- application files are not modified by the administrator account;
- the running services have only the permissions they actually require;
- the overall attack surface is reduced.
