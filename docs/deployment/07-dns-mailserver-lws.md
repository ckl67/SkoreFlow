<!-- cspell:ignore  webmail DMARC domainkey lwsdns lwsdns  SASL  STARTTLS  lwspanel     -->

[← back](../doc.md)

# SkoreFlow Infrastructure: DNS and Email Configuration

## Objective this Document

This document describes the DNS and email configuration required for SkoreFlow production deployment.

## Reminder

Email :

- **Transport** protocols (which route email from one mailbox to another)
- **Retrieval** protocols (which allow a user to read their email).

### Sending - Transfer email - Transport

- SMTP: Simple Mail Transfer Protocol (SMTP) is the standard protocol used to **transmit** emails.
  - from one client or server to another
    - from outlook - Gmail to LWS,
    - from LWS to Google, or
    - from OVH backend to LWS.
  - It is used to send and route emails.

- SMTP Ports **(Transport)**
  - Port 25: SMTP direct transfers between servers (unencrypted).
  - Port 465: SMTP encapsulated in SSL/TLS (connection starts encrypted).
  - Port 587: STARTTLS - connection starts unencrypted, then upgrades

- SPF, DKIM, DMARC **(Authentication)**
  - Are DNS records that define who is authorized to send emails on behalf of this domain and how to prove that the message is legitimate.

### Receiving emails - Retrieval - Consultation

IMAP and POP are two protocols for receiving emails.
They determine how your emails are stored and accessed.
Once an email has arrived and been stored on the final server (at LWS Orange, or Google), your desktop client (Thunderbird, mobile app) or Webmail service uses IMAP to access, sort or delete it.

- IMAP protocol
  - With IMAP, emails remain stored on the mail server.
  - Email clients simply display a synchronized copy of the inbox.
  - If an action is carried out on one device (deletion, moving, reading), it is reflected on all other devices.
- POP protocol
  - With POP, emails are downloaded to the device that retrieves the email.
  - In most cases, messages are stored locally on the device.

## Skoreflow infrastructure overview

SkoreFlow uses two separate infrastructures :

- OVH : which hosts the web application on a VPS
- LWS : which provide the domain and email hosting.

The domain therefore has two independent roles:

```text
                   skoreflow.fr
                         |
        +----------------+----------------+
        |                                 |
        v                                 v
    Web traffic                     Email services
       VPS                               LWS
  137.74.168.176                  mail.skoreflow.fr
       |                                  |
     Nginx                              SMTP
       |
   Frontend
    Backend
    ......
```

- nginx : _`("engine x")`_ is an HTTP web server, reverse proxy, content cache, load balancer,
- OVH (Backend) instructs LWS to send the email via SMTP to the recipient (Gmail, Outlook, etc.).

LWS Email can be consulted on `https://mail65.lwspanel.com`

## Configuration on LWS

Summary of the configuration on LWS

- Section : Zone DNS
  - Type A Name @ : `137.74.168.176` = @IP of OVH VPS
- Section : Emails
  - Create a new entry : `noreply@skoreflow.fr`
    - This entry will provide SMTP configuration to add in **.env file**
      - username: `noreply@skoreflow.fr`
      - password: Use the password for your email account.
      - Outgoing server: mail65.lwspanel.com
      - SMTP port: 465 (SSL) / 587 (Other)

## DNS configuration

Overview of the DNS parameters

| Type      | Name              | Value / Target                                                            | Purpose                                       |
| :-------- | :---------------- | :------------------------------------------------------------------------ | :-------------------------------------------- |
| **A**     | `@`               | `137.74.168.176`                                                          | Points the web application to the VPS         |
| **CNAME** | `www`             | `@`                                                                       | Aliases `www` to the root domain              |
| **A**     | `mail`            | `213.255.195.65`                                                          | Points to the mail server (LWS)               |
| **MX**    | `@`               | `10 mail.skoreflow.fr.`                                                   | Directs incoming mail to LWS                  |
| **TXT**   | `@`               | `v=spf1 mx:skoreflow.fr a:mail.skoreflow.fr include:lws-hosting.com ~all` | **SPF**: Authorizes sending servers           |
| **TXT**   | `dkim._domainkey` | `v=DKIM1; k=rsa; p=<public-key>`                                          | **DKIM**: Signs emails cryptographically      |
| **TXT**   | `_dmarc`          | `v=DMARC1; p=none`                                                        | **DMARC**: Defines handling for failed checks |

# Email Authentication - Security

Modern email delivery relies on three complementary mechanisms.

## SPF

Param : **Sender Policy Framework**

The SPF (Who is authorized to send?)
It informs email servers worldwide that only LWS’s servers are authorized to send emails on behalf of skoreflow.fr

## DKIM

Param : **DomainKeys Identified Mail**

DKIM (Cryptographic signature) proves that the email has not been modified during the transit.

- DKIM uses asymmetric cryptography.
  - The mail server signs outgoing messages with a private key.
  - The public key is published in DNS:
  - Receiving servers verify the signature.

## DMARC

Param : **Domain-based Message Authentication, Reporting and Conformance**

DMARC defines the policy applied when SPF or DKIM checks fail.
It explains what to do if SPF or DKIM fails. To start with, we begin with simple monitoring (p=none) so as not to block your own emails if a setting is configured incorrectly.
