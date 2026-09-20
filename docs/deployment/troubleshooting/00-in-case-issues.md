<!-- cspell:ignore fuser -->

# In case of issue

## ovh server

```shell
https://skoreflow-app.com/api/v1/health

```

In case you want to test all the service like on Ubuntu machine without nginx !

```shell
ssh ubuntu@137.74.168.176

# Account Ubuntu
sudo systemctl stop skoreflow-thumbnail
sudo systemctl stop skoreflow-backend
sudo systemctl stop nginx

sudo systemctl status skoreflow-thumbnail
sudo systemctl status skoreflow-backend
sudo systemctl status nginx

# Kill the service if needed
sudo fuser -k 8080/tcp || true && sudo fuser -k 5001/tcp || true && sudo fuser -k 5173/tcp || true

# Account skoreflow
sudo su - skoreflow

  # ---------------------
  # ---- Microservice
  # ---------------------
  cd /opt/skoreflow/microservices/thumbnail
  make run
  curl http://localhost:5001/health
  curl http://localhost:5001/version

  # ---------------------
  # ---- Backend
  # ---------------------
  cd /opt/skoreflow/backend
  # check .env !
  make run
  curl http://localhost:8080/api/v1/health

  # ---------------------
  # ---- Frontend
  # ---------------------
  cd /opt/skoreflow/frontend
  # check .env !
  npm exec -w frontend -- vite

   ➜  Network: http://137.74.168.176:5173/

  # ---------------------
  # ---- Bypass Nginx
  # ---------------------
  # We can bypass Nginx entirely by accessing the Vite server directly:
  # http://137.74.168.176:5173/

  # frontend
  # To test the frontend without Nginx, temporarily replace the following to the frontend’s .env file:
  # Replace
  VITE_API_URL=/api/v1
  # with
  VITE_API_URL=http://137.74.168.176:8080/api/v1

  # backend
  # There is, however, a second point: CORS
  # The browser treats:
  # http://137.74.168.176:5173
  #  and:
  # http://137.74.168.176:8080
  # as two different origins because of the ports.
  # We therefore temporarily allow:
  CORS_ALLOWED_ORIGINS=http://137.74.168.176:5173

  # Back to te old configuration
  VITE_API_URL=/api/v1
  FRONTEND_ORIGIN=http://137.74.168.176
  CORS_ALLOWED_ORIGINS=https://skoreflow-app.com,http://137.74.168.176

```
