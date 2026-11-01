<!-- cspell:ignore Certbot  nslookup    -->

# HTTPS configuration (Let's Encrypt)

## Objective

This document secures the SkoreFlow web server using HTTPS.
A TLS certificate is obtained from **Let's Encrypt** and automatically renewed.

At the end of this step:

- HTTP requests are automatically redirected to HTTPS;
- all communications between the browser and the server are encrypted;
- certificate renewal is fully automatic.

## How HTTPS works

HTTPS relies on a trusted third party called a **Certificate Authority (CA)**.

The Certificate Authority verifies that a server really owns a domain name and issues a signed TLS certificate.

When a browser connects to:

```text
https://skoreflow.fr
```

the following sequence occurs:

```text
Browser
    │
    │ 1. Connect to skoreflow.fr
    ▼
Nginx
    │
    │ 2. Presents its TLS certificate
    ▼
Certificate provided by Let's Encrypt
    │
    │ 3. Browser verifies the certificate
    ▼
Encrypted HTTPS connection established
```

Since Let's Encrypt is trusted by all modern operating systems and browsers, users automatically trust the certificate without installing anything.

## Why Let's Encrypt?

Let's Encrypt provides:

- free TLS certificates;
- automatic renewal;
- support by all modern browsers;
- industry-standard security.

Certificates are valid for **90 days**, but are automatically renewed before expiration.

## Install Certbot

Update the package index:

```bash
sudo apt update
```

Install Certbot and the Nginx plugin:

```bash
sudo apt install certbot python3-certbot-nginx
```

Verify the installation:

```bash
certbot --version
```

## Verify DNS

Before requesting a certificate, verify that the domain points to the server.

```bash
nslookup skoreflow.fr
```

The returned IP address must match your VPS public IP.

## Request the certificate

Run:

```bash
sudo certbot --nginx
```

`sudo certbot --nginx` will check the existing Nginx configuration files and identify `server_name` (which contained `skoreflow.fr`).
It therefore used this to determine which certificate to create.
In case the domain name is modified, it is mandatory to edit Nginx configuration file (/etc/nginx/sites-available/skoreflow) to include server_name skoreflow.fr, then simply run `sudo certbot --nginx`

Certbot will:

- detect the Nginx configuration;
- contact Let's Encrypt;
- prove ownership of the domain;
- install the certificate;
- optionally configure automatic HTTP → HTTPS redirection.

## Verify the installation

Open:

```text
https://skoreflow.fr
```

The browser should display:

- the padlock icon;
- a valid certificate;
- no security warnings.

You can also verify the certificate:

```bash
openssl s_client -connect skoreflow.fr:443
```

## Automatic renewal

A systemd timer is installed automatically.

Verify it:

```bash
systemctl list-timers | grep certbot
```

You can simulate a renewal:

```bash
sudo certbot renew --dry-run
```

No changes are made during this test.

## Final architecture

```text
                    HTTPS
                (TLS encrypted)
                       │
                       ▼
            https://skoreflow.fr
                       │
                       ▼
                   Nginx
              ┌────────┴────────┐
              │                 │
              │                 │
              │                 │
              ▼                 ▼
          React Frontend   Go Backend
      /frontend/dist       localhost:8080
```

The browser communicates only with Nginx.

Internal communications between Nginx and the backend services remain on the local machine and therefore do not require TLS.
