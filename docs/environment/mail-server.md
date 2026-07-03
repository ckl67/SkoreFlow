# SMTP Server

[← back](../doc.md)

## MailPit Overview (Development Email Server)

[Mailpit](https://mailpit.axllent.org/) is a lightweight local SMTP server designed for development and testing purposes.
It captures outgoing emails sent by an application and provides a web interface to inspect them without delivering them to real recipients.

### How It Works

Instead of sending emails over the internet, the application is configured to send emails to a local SMTP server (MailPit).
MailPit intercepts these emails and stores them in memory, making them accessible through a web UI.

Application (Backend)
↓ SMTP
MailPit Server
↓
Web Interface (Email Viewer)

It allows developers to manually or automatically verify email content and interaction flows without relying on real email providers.

### Key Features

Captures all outgoing SMTP emails locally
Provides a web UI to view email content (HTML and plain text)
Allows inspection of headers, recipients, and links
No real email delivery to external providers
No authentication or TLS required
Ideal for development and testing environments

## Mailpit Accessibility in VS Code Remote SSH

### Issue

When running Mailpit in a Docker container on a remote Linux VM, the web UI (`localhost:8025`) was initially inaccessible from the host machine's browser, even though other services (like React/Vite on port `5173`) were automatically forwarded.

### Root Cause

1. **Docker Binding:** By default, Docker port mapping might not always bind explicitly to all interfaces in a way that VS Code's background listener instantly registers.
2. **Missing SSH Tunnel:** VS Code Remote SSH did not automatically catch the container's startup event, meaning the port was active on the VM but not tunnelled to the host's `localhost`.

### Solution

The issue was resolved by explicitly binding the ports to all interfaces (`0.0.0.0`) and recreating the container. This allowed VS Code to trigger its **Auto Forwarded** mechanism.

```bash
# Stop and remove the existing container
sudo docker stop mailpit
sudo docker rm mailpit

# Run with explicit 0.0.0.0 binding
sudo docker run -d \
  --name mailpit \
  -p 0.0.0.0:1025:1025 \
  -p 0.0.0.0:8025:8025 \
  axllent/mailpit
```

## MailPit Installation

As it is a general tools, it will be installed at the root of the linux machine

```shell

cd ~
sudo docker stop mailpit
sudo docker rm mailpit
sudo docker run -d --name mailpit -p 0.0.0.0:1025:1025 -p 0.0.0.0:8025:8025 axllent/mailpit

```

In PORTS you should see Origin : **Auto Forwarded**

### Default Configuration

MailPit typically runs locally with the following endpoints:

```shell
SMTP server: localhost:1025
Web interface: http://localhost:8025

#Example Backend Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@yourapp.local
SMTP_USERNAME=
SMTP_PASSWORD=
```

## Backend Test Mode

For running test with a SMTP server you have to run

```Bash
  make run-dev
  # or better
  make air-dev
```

## Remember

Frontend React : localhost:5173
Backend Go : localhost:8080
Backend MicroService : localhost:5010
MailPit SMTP : localhost:1025
Interface Mail : localhost:8025

## Debug

```shell
# Checking
sudo docker ps
[sudo] Mot de passe de christian :
CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES
441ff155b363 axllent/mailpit "/mailpit" About an hour ago Up About an hour (healthy) 0.0.0.0:1025->1025/tcp, [::]:1025->1025/tcp, 0.0.0.0:8025->8025/tcp, [::]:8025->8025/tcp, 1110/tcp mailpit
christian@christian-virtual-machine:~$

nc localhost 1025
220 441ff155b363 Mailpit ESMTP Service ready

```
