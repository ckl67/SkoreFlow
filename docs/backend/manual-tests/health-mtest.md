# Smoke Testing

[← back](../../doc.md)

## Variable setting

```shell
API_VERSION="v1"
```

## Smoke Tests

These checks the health of the backend service. A successful response indicates that the service is running and responsive.

```shell
curl "http://localhost:8080/api/${API_VERSION}/health"
curl "http://localhost:8080/api/${API_VERSION}/version"
curl "http://localhost:8080/api/${API_VERSION}"
```
