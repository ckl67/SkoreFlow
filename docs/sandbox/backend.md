# Backend

## Service

For Go Backend: Select "Web Services" on the PaaS

```text
Web Services — Dynamic web app. Ideal for full-stack apps, API servers, and mobile backends.
```

```shell

Set the root directory as backend

```

### Compilation and Build

### Approach

Compilation and Build are the same approach between dev server and PaaS

```shell

## locally : directory /backen
go build             -ldflags="...  " -o build/sf-backend ./cmd/server/main.go
## run
build/sf-backend

## Render.com : directory /backen
go build -tags netgo -ldflags '-s -w' -o app              ./cmd/server/main.go
app/app

go build -tags netgo -ldflags '-s -w' -o app ./cmd/server/main.go

```

### Debug

Following command can help

```shell

pwd && ls -la && find . -maxdepth 3 -type f | sed -n '1,200p'

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
# You can copy file .env.render
```

### Limitation

Render.com service use the free (Hobby) plan and will have the 15-minute idle timeout.
Message : **_Your free instance will spin down with inactivity, which can delay requests by 50 seconds or more._**
