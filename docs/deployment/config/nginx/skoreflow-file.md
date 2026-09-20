```bash
sudo nano /etc/nginx/sites-available/skoreflow
```

Insert the following configuration:

```shell
server {

    listen 80;
    server_name skoreflow-app.com;

    root /opt/skoreflow/frontend/dist;
    index index.html;


    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }


    # Frontend React
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
