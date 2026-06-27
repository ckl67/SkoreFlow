# Sandbox

Roadmap for deploying SkoreFlow will use a Platform as a Service - PaaS

Currently choice : [Render](https://render.com/)

Domain name : skoreflow-app.comm

## Backend

## Service

For Go Backend: Select "Web Services" on the PaaS

```text
Web Services — Dynamic web app. Ideal for full-stack apps, API servers, and mobile backends.
```

### Prerequisite pdftoppm

We have seen that pdftoppm is a prerequisite for micro-service.
pdftoppm is the tool that pdf2image calls in the background to convert PDF pages into PNG/JPEG images.
pdftoppm is normally installed on Linux, and the PaaS - Render server - (unprivileged container): To prevent malicious code from damaging their servers, they do not allow to use `sudo` or modify the operating system.

Add Poppler directly to Render

- Go to your Render dashboard, under your Web Service.
- Click on the Environment tab.
- In the Environment Variables section (not Secret Files, but the standard variables), click Add Environment Variable.
  - Add this special variable that Render uses to install Linux packages:
    - Key: RENDER_NATIVE_PACKAGES
    - Value: poppler-utils
- Click Save Changes.

### Compilation and Build

### Approach

Compilation and Build are the same approach between dev server and PaaS

Basics

```shell

## locally : directory /backen
make build
go build             -ldflags="...  " -o build/sf-backend ./cmd/server/main.go
## run
build/sf-backend

## Render.com : directory /backen
go build -tags netgo -ldflags '-s -w' -o app              ./cmd/server/main.go
## run
app/app
```

### Directory Mapping

backend is working with an absolute path !
On Render, the word ‘project’ in the path /opt/render/project/... is a fixed system keyword, used universally for all applications hosted on their platform. It is not the name of your repository or your application that is inserted in this place.

```text

/ (Root of the Linux Render server)
└── opt/
    └── render/
        └── project/
            └── src/              <-- This is the root of your Git repository (SkoreFlow)
                ├── frontend/
                └── backend/      <-- This is your “Root Directory” configured on Render
```

### Environnement variables

Instead of creating 20 “Key/Value” variables, Render allows to create a virtual .env file directly, which will be injected into the backend folder on start-up.

- Go to Render dashboard and click on your Web Service.
- Click on the Environment tab on the left.
- Look for the Secret Files section (just below the Environment variables).
- Click on Add Secret File.
- Fill in the fields:
  - Filename: .env
  - Contents: Copy and paste the entire contents of your local .env file. (See below)
- Click Save.

Render will create this file securely and invisibly on their servers

```shell

####################
# GENERAL SETTINGS #
####################

# Set to ‘development’ for now to keep the debug logs in your sandbox or switch it to ‘production’ later.
APP_ENV=development

# For running tests, with test-specific configurations and optimizations.
# Will automatically seed test users on server startup for testing purposes.
# will authorize all requests without smtp authentication for easier testing of protected routes.
TEST_MODE=true

####################
# LOGIN            #
####################

ADMIN_PASSWORD=skoreflow # ⚠️ weak default
API_SECRET=sheetcomposer_secret_key

#############
# DATABASES #
#############

DB_DRIVER=sqlite

####################
# PATH             #
####################
# All paths are relative to the root of the project : APP_ROOT
# so they can be used in both development and production without modification.

# (On Render the project runs in the configured root directory).
APP_ROOT=/opt/render/project/src/backend
STORAGE_PATH=storage

####################
# MICROSERVICE     #
####################
# Location of microservices, used for inter-service communication and orchestration.
MS_ROOT=micro-service

#################
# SMTP SETTINGS #
#################

# On Render, localhost:1025 for Mailpit does not exist.
# If you leave it set to true, your backend may crash on start-up or as soon as it tries to send an email
SMTP_ENABLED=false

```

### Limitation

Render.com service use the free (Hobby) plan and will have the 15-minute idle timeout.
Message : **_Your free instance will spin down with inactivity, which can delay requests by 50 seconds or more._**

## Frontend

For your React frontend: Select "Static Sites"

Static Sites — Static content served over a global CDN. Ideal for frontend, blogs, and content sites.
