### Smoke Testing

These checks the health of the backend service. A successful response indicates that the service is running and responsive.

```shell
curl "http://localhost:8080/health"
curl "http://localhost:8080/version"
curl "http://localhost:8080/api"
```
