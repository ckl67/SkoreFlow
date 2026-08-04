<!-- cspell:ignore Certbot -->

# Nginx configuration

## Objective

Nginx is a high-performance web server, reverse proxy and load balancer.
Nginx is the public entry point of the SkoreFlow application.

It is responsible for:

- serving the React frontend;
- forwarding API requests to the Go backend;
- acting as a reverse proxy;
- providing a single HTTP entry point for clients.

At this stage, HTTPS is not configured yet.
TLS certificates will be installed in the next document.

---

## Architecture

```text
                 Internet
                     │
                     ▼
                 Port 80
                     │
                 +---------+
                 |  Nginx  |
                 +---------+
                  │       │
        ----------       ----------
        │                          │
        ▼                          ▼
Frontend (dist/)            Go Backend
Static files                localhost:8080
```

---

## Step 1 — Install Nginx

Install the Nginx web server.

```bash
sudo apt update

sudo apt install -y nginx
```

Verify the installation:

```bash
nginx -v
```

Example:

```text
nginx version: nginx/1.24.x
```

---

## Step 2 — Verify the service

Check that Nginx is running.

```bash
sudo systemctl status nginx
```

If necessary:

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

Verify that the service starts automatically:

```bash
sudo systemctl is-enabled nginx
```

Expected:

```text
enabled
```

---

## Step 3 — Remove the default site

Ubuntu installs a default website.

Remove it before configuring SkoreFlow.

```bash
sudo rm /etc/nginx/sites-enabled/default
```

The default configuration remains available in:

```text
/etc/nginx/sites-available/default
```

---

## Step 4 — Create the SkoreFlow site

Create a new configuration file.

```bash
sudo nano /etc/nginx/sites-available/skoreflow
```

Insert the following configuration:

```nginx
server {

    listen 80;

    server_name _;

    root /opt/skoreflow/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {

        proxy_pass http://127.0.0.1:8080/;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}
```

### Focus on the configuration

```shell
    listen 80;        # Listening on the standard HTTP port (80)

    server_name _;    # Responds to any domain name or IP address

    root /opt/skoreflow/frontend/dist;
    index index.html;

    # Crucial for SPAs: Nginx first looks for the file ($uri),
    # then the directory ($uri/). If it cannot find it, it always returns /index.html.
    # This allows the JavaScript router (React Router, Vue Router, etc.) to handle front-end URLs.
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {

        proxy_pass http://127.0.0.1:8080/;  # Redirects /api/ requests to the backend on port 8080.
                                            # The trailing slash '/' removes the '/api/' prefix from the request sent to the backend.

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

### Focus on the headers

When Nginx acts as a proxy, it creates a new HTTP request to the backend.
By default, certain original information (such as the client’s IP address) would be lost and replaced by Nginx’s own details (127.0.0.1).

These headers (proxy_set_header) allow the user’s original context to be passed to the backend:

1. proxy_set_header Host $host;
   - Passes the original domain name (or IP address) that the user typed into their browser to the backend.
   - Why it’s important: If your backend needs to generate absolute URLs, handle CORS, or validate the origin domain, it needs to know the original Host.
2. proxy_set_header X-Real-IP $remote_addr;
   - Sends the actual IP address of the user visiting the site.
   - Why this is important: Without this line, your backend (on port 8080) would always see 127.0.0.1 as the source IP. This is essential for security, backend logging or IP blocking.
3. proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   - Maintains an ordered list of all the IP addresses through which the request has passed (Client_IP, Proxy1_IP, Proxy2_IP...).
   - Why it’s important: If the client passes through several proxies or firewalls (e.g. Cloudflare → Nginx → Backend), this string allows the backend to trace the entire network path of the request.
4. proxy_set_header X-Forwarded-Proto $scheme;
   - Passes on the protocol used by the client (http or https).
   - Why this is important: If you add SSL/HTTPS to Nginx at a later stage, the Nginx $\rightarrow$ Backend connection will often remain as plain HTTP on the local machine. This header informs the backend that the end user is communicating securely via HTTPS (useful for creating secure cookies).

---

## Step 5 — Enable the site

Create the symbolic link.

```bash
sudo ln -s \
/etc/nginx/sites-available/skoreflow \
/etc/nginx/sites-enabled/
```

---

## Step 6 — Validate the configuration

Always validate the configuration before reloading Nginx.

```bash
sudo nginx -t
```

Expected:

```text
syntax is ok
test is successful
```

---

## Step 7 — Reload Nginx

Apply the new configuration.

```bash
sudo systemctl reload nginx
```

If Nginx was not running:

```bash
sudo systemctl restart nginx
```

---

## Step 8 — Verify the deployment

Check the frontend:

```text
http://<server-ip>/
```

The React application should load.

---

Verify the backend:

```text
http://<server-ip>/version
```

(or any available API endpoint)

The request should be forwarded to the Go backend.

---

## Result

The production architecture is now:

```text
                     Internet
                          │
                          ▼
                     HTTP :80
                          │
                    +------------+
                    |   Nginx    |
                    +------------+
                     │         │
                     │         │
                     ▼         ▼
          React Frontend   Go Backend
      /frontend/dist       localhost:8080
```

Nginx now serves the frontend and forwards API requests to the backend.

The next document covers HTTPS configuration using Let's Encrypt and Certbot.
