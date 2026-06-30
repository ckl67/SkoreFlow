# Principle

Roadmap for deploying SkoreFlow will use a Platform as a Service - PaaS

Currently choice : [Render](https://render.com/)

Domain name : skoreflow-app.comm

## Configuration

- [backend](./backend.md)
- [frontend](./frontend.md)
- [thumbnail service](./microservice/thumbnail.md)

### Directory Mapping

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
