<!-- cspell:ignore DMARC domainkey lwsdns lwsdns  SASL  STARTTLS  lwspanel     -->

[← back](../doc.md)

# SkoreFlow Infrastructure: DNS Setup & SMTP Configuration Guide

This document provides a comprehensive overview of the domain resolution layer (DNS) and the transaction email architecture (SMTP) configured for `skoreflow-app.com`.

---

## Part 1: Domain Name System (DNS) Architecture

### 1. Fundamental Principles

The **Domain Name System (DNS)** serves as the internet's directory service. It translates human-readable domain names (e.g., `skoreflow-app.com`) into computer-routable IP addresses (e.g., IPv4 `137.74.168.176`).

When a client initiates a request to your application, the operating system queries authoritative Name Servers (NS) to resolve where traffic should be routed.

### 2. Record Types Reference

| Record Type | Designation         | Function & Behavior                                                                                   |
| :---------- | :------------------ | :---------------------------------------------------------------------------------------------------- |
| **A**       | Address Record      | Maps a hostname directly to a 32-bit **IPv4 address**.                                                |
| **AAAA**    | IPv6 Address Record | Maps a hostname directly to a 128-bit **IPv6 address**.                                               |
| **CNAME**   | Canonical Name      | Creates an **alias** pointing one domain name to another domain name (does not take an IP directly).  |
| **NS**      | Name Server         | Specifies the **authoritative servers** responsible for serving DNS records for the domain.           |
| **MX**      | Mail Exchange       | Directs inbound emails sent to your domain (`@skoreflow-app.com`) to the designated mail server.      |
| **TXT**     | Text Record         | Holds arbitrary text; primarily utilized for email security protocols (**SPF**, **DKIM**, **DMARC**). |

---

### 3. Production Zone DNS Configuration

To route web traffic to your VPS while preserving email delivery capabilities through LWS, the active DNS table must be configured as follows:

```text
# --- WEB TRAFFIC (VPS Router) ---
A       @                 137.74.168.176          # Directs root domain to VPS IP
CNAME   www               @                       # Aliases [www.skoreflow-app.com](https://www.skoreflow-app.com) to root

# --- MAIL SERVICES (LWS Infrastructure) ---
A       mail              213.255.195.65          # LWS mail server IP
MX      @                 10 mail.skoreflow-app.com. # Inbound mail delivery target
TXT     @                 v=spf1 mx:skoreflow-app.com a:mail.skoreflow-app.com include:lws-hosting.com ~all
TXT     dkim._domainkey   v=DKIM1; k=rsa; p=MIGf... # Outbound email signature verification

# --- AUTHORITATIVE NAME SERVERS ---
NS      @                 ns21.lwsdns.com.
NS      @                 ns22.lwsdns.com.
NS      @                 ns23.lwsdns.com.
NS      @                 ns24.lwsdns.com.
```

## Part 2: Mail Server (SMTP) Integration & Go Implementation

### Architectural Challenge: Port 587 (STARTTLS) vs. Port 465 (Direct SSL)

When connecting a Go backend to an enterprise SMTP server like LWS (mail93.lwspanel.com), two primary connection mechanisms exist:

- Port 587 (STARTTLS): The connection opens as plain unencrypted TCP, and then issues a STARTTLS command to upgrade the socket to TLS.
- Port 465 (Implicit SSL/TLS): The connection establishes an immediate TLS handshake upon connecting, before any SMTP negotiation or SASL authentication begins.

Standard Go library implementations (smtp.SendMail) assume Port 587 with STARTTLS. Because modern shared mail clusters enforce immediate TLS on dedicated ports, initiating a plain TCP connection often results in authentication failures (535 5.7.8 Error: authentication failed). 2. Technical Workflow of the Dual-Layer Test

### Technical Workflow of the Dual-Layer Test

The Go test handles secure email delivery through a dual-strategy implementation:

```text

+--------------------------------+
                  |  Initiate TestSMTPServerLWS()  |
                  +--------------------------------+
                                   |
                                   v
                  +--------------------------------+
                  |  Attempt 1: Port 465 (SSL)     |
                  |  Call sendMailTLS()            |
                  +--------------------------------+
                                   |
                         +---------+---------+
                         |                   |
                     [Success]            [Failure]
                         |                   |
                         v                   v
                 +---------------+   +--------------------------------+
                 |  Pass Test    |   |  Attempt 2: Port 587           |
                 +---------------+   |  Fallback smtp.SendMail()      |
                                     +--------------------------------+
                                                     |
                                           +---------+---------+
                                           |                   |
                                       [Success]            [Failure]
                                           |                   |
                                           v                   v
                                   +---------------+   +---------------+
                                   |  Pass Test    |   |  Fail Test    |
                                   +---------------+   +---------------+
```

### Key Components of the Go Helper Function

The custom sendMailTLS function bypasses smtp.SendMail limitations by establishing an implicit TLS connection:

- tls.Dial("tcp", addr, config): Connects to mail93.lwspanel.com:465 with full SSL encryption enabled from byte zero.
- smtp.NewClient(conn, serverName): Instantiates an SMTP protocol wrapper over the established encrypted TLS stream.
- client.Auth(auth): Transmits PLAIN SASL authentication credentials securely over TLS.
- client.Mail() / client.Rcpt() / client.Data(): Executes standard RFC 5321 envelope and payload transaction.

### Email Security Protocols Breakdown

- SPF (Sender Policy Framework): A TXT record listing IP addresses authorized to send emails on behalf of @skoreflow-app.com. Prevents IP spoofing.
- DKIM (DomainKeys Identified Mail): A cryptographic public key stored in DNS (dkim.\_domainkey). The mail server signs outgoing headers with the corresponding private key to guarantee mail integrity during transport.
- DMARC: Specifies how receiving servers (Gmail, Outlook) should handle emails that fail SPF or DKIM checks.
