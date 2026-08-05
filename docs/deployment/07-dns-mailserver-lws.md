<!-- cspell:ignore DMARC domainkey lwsdns lwsdns  SASL  STARTTLS  lwspanel     -->

[← back](../doc.md)

# SkoreFlow Infrastructure: DNS and Email Configuration

## Objective

This document describes the DNS and email infrastructure configuration required for SkoreFlow production deployment.

The objectives are:

- expose the web application through the public domain;
- keep email services managed by the external mail provider;
- configure the DNS records required for reliable email delivery;
- prepare the infrastructure required by the backend email service.

The application code responsible for sending emails is documented separately in the backend documentation.

---

# Part 1 — DNS Architecture

## 1. DNS fundamentals

The **Domain Name System (DNS)** is the mechanism that translates human-readable domain names into network addresses.

Example:

```text
skoreflow-app.com
        |
        v
137.74.168.176
        |
        v
SkoreFlow VPS
```

When a user accesses:

```text
https://skoreflow-app.com
```

the browser first resolves the domain through DNS, then connects to the server hosting the application.

---

# 2. DNS record types

| Record | Name                | Purpose                                                  |
| ------ | ------------------- | -------------------------------------------------------- |
| A      | Address record      | Maps a hostname to an IPv4 address                       |
| AAAA   | IPv6 address record | Maps a hostname to an IPv6 address                       |
| CNAME  | Canonical name      | Creates an alias to another hostname                     |
| MX     | Mail exchange       | Defines the mail server responsible for receiving emails |
| TXT    | Text record         | Stores configuration data such as SPF, DKIM and DMARC    |
| NS     | Name server         | Defines the authoritative DNS servers                    |

---

# 3. Production DNS architecture

SkoreFlow uses two separate infrastructures:

- the VPS hosts the web application;
- LWS continues to provide email hosting.

The domain therefore has two independent roles:

```text
                 skoreflow-app.com

                         |
        +----------------+----------------+
        |                                 |
        v                                 v

    Web traffic                      Email services

       VPS                              LWS
137.74.168.176                 mail.skoreflow-app.com
       |                                 |
    Nginx                              SMTP
       |
 React + Go Backend
```

---

# 4. DNS records

Example production configuration:

```text
# ------------------------------------------------
# WEB APPLICATION
# ------------------------------------------------

A       @                 137.74.168.176

CNAME   www               @


# ------------------------------------------------
# EMAIL SERVICE (LWS)
# ------------------------------------------------

A       mail              213.255.195.65

MX      @                 10 mail.skoreflow-app.com.


# ------------------------------------------------
# EMAIL SECURITY
# ------------------------------------------------

TXT     @

v=spf1 mx:skoreflow-app.com a:mail.skoreflow-app.com include:lws-hosting.com ~all


TXT     dkim._domainkey

v=DKIM1; k=rsa; p=<public-key>


TXT     _dmarc

v=DMARC1; p=none
```

The exact values depend on the email provider configuration.

---

# Part 2 — Email Security

Modern email delivery relies on three complementary mechanisms.

## SPF

**Sender Policy Framework**

SPF defines which servers are allowed to send emails for a domain.

Example:

```text
skoreflow-app.com
        |
        |
        +-- authorized SMTP servers
```

Receiving servers check the sender IP against the SPF record.

Purpose:

- prevent domain spoofing;
- improve email reputation.

---

## DKIM

**DomainKeys Identified Mail**

DKIM uses asymmetric cryptography.

The mail server signs outgoing messages with a private key.

The public key is published in DNS:

```text
dkim._domainkey.skoreflow-app.com
```

Receiving servers verify the signature.

Purpose:

- guarantee message integrity;
- prove that the email was sent by an authorized server.

---

## DMARC

**Domain-based Message Authentication, Reporting and Conformance**

DMARC defines the policy applied when SPF or DKIM checks fail.

Example:

```text
SPF failed
        +
DKIM failed
        |
        v
DMARC policy applied
```

Possible policies:

| Policy     | Meaning             |
| ---------- | ------------------- |
| none       | Monitoring only     |
| quarantine | Treat as suspicious |
| reject     | Reject the message  |

During initial deployment, `p=none` is often recommended to monitor before enforcing stricter rules.

---

# Part 3 — SMTP configuration

SkoreFlow uses an external SMTP provider.

The backend connects to the SMTP server to send:

- account confirmation emails;
- password reset emails;
- notification emails.

The SMTP configuration is stored in backend environment variables.

Example:

```env
SMTP_HOST=mail.provider.com
SMTP_PORT=465
SMTP_USER=<account>
SMTP_PASSWORD=<password>
SMTP_FROM=no-reply@skoreflow-app.com
```

Credentials must never be stored in the source repository.

---

# SMTP ports

Two common SMTP submission modes exist.

## Port 465 — Implicit TLS

Connection starts directly with encryption.

```text
Client
   |
   | TLS handshake
   |
SMTP server
```

This is commonly used by hosted mail providers.

---

## Port 587 — STARTTLS

Connection starts unencrypted, then upgrades to TLS.

```text
Client
   |
   | SMTP connection
   |
   | STARTTLS command
   |
   | TLS encryption
   |
SMTP server
```

The correct mode depends on the SMTP provider.

---

# Deployment checklist

Before enabling email functionality:

- [ ] MX record configured
- [ ] SPF record configured
- [ ] DKIM record configured
- [ ] SMTP credentials created
- [ ] Backend environment variables configured
- [ ] Test email successfully delivered

---

# Conclusion

The production email architecture is now separated from the application hosting architecture.

The VPS is responsible for:

- web hosting;
- API hosting;
- application execution.

The mail provider is responsible for:

- mailbox hosting;
- SMTP delivery;
- email reputation management.

The backend only acts as an SMTP client.
