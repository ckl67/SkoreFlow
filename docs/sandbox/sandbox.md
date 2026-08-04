# Principle

[← back](../doc.md)

Roadmap for deploying SkoreFlow will use a Platform as a Service - PaaS

Currently choice : [Render](https://render.com/)

Domain name : skoreflow-app.comm

## Remember

Render build command is : `npm install && npm run build`
In package.json this corresponds to : `vite build`

```javascript
  "scripts": {
    ...
    "build": "vite build",
    ...
  },
```

So `npm install && npm run build` could be replaced by `npm install && npm vite build`
however, with `npm run build` npm automatically adds node_modules/.bin

Below the order of precedence of configuration : From lowest to highest:

```text
    .env
      ↓
    .env.local
        ↓
    .env.<mode>
         ↓
    .env.<mode>.local
            ↓
    System environment variables
```

When Vite starts with : `vite build` it will merge **_(automatically)_** `import.meta.env.VITE_API_URL` during the build.
Vite just replace before build.

vite also integrates the possibility to read `.env` file thanks to mode

```text
vite --mode test

Will load in order :
  .env
  .env.local
  .env.test
  .env.test.local
```

## Configuration

- [backend](./backend.md)
- [frontend](./frontend.md)
- [thumbnail service](./microservices/thumbnail.md)

### Directory Mapping

On Render, the word ‘project’ in the path /opt/render/project/... is a fixed system keyword, used universally for all applications hosted on their platform. It is not the name of your repository or your application that is inserted in this place.

```text
/opt/skoreflow
│
├── backend
├── frontend
├── microservices
│   └── thumbnail
└── storage
    ├── database.db
    ├── users
    ├── composers
    └── scores


```

## Summary view

```text

Backend
========
  # Frontend Address

  - FRONTEND_ORIGIN       = http://localhost:5173
  - FRONTEND_ORIGIN       = https://skoreflow-frontend.onrender.com
  - CORS_ALLOWED_ORIGINS  = https://skoreflow-frontend.onrender.com

Frontend
========
  # Backend address
  - VITE_API_URL          = http://localhost:8080/api
  - VITE_API_URL          = https://skoreflow-backend.onrender.com/api

```
