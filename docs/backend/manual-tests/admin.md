```shell
# Variable setting
ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="skoreflow"
API_VERSION="v1"
```

```shell
curl -s -X POST http://localhost:8080/api/${API_VERSION}/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${ADMIN_EMAIL}\",
    \"password\":\"${ADMIN_PASSWORD}\"
  }" | jq

TOKEN_ADMIN=$(curl -s -X POST http://localhost:8080/api/${API_VERSION}/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${ADMIN_EMAIL}\",
    \"password\":\"${ADMIN_PASSWORD}\"
  }" | jq -r '.data.token')

echo "JWT Token: $TOKEN_ADMIN"

```

```shell
# The middleware expects the JWT token to be in the HTTP header of the request, not in the JSON body.
# Passing the token in the JSON via -d '{"token": ...}' is not working

curl -s -X POST "http://localhost:8080/api/${API_VERSION}/admin/test/auth/smtp/enable" \
  -H "Authorization: Bearer ${TOKEN_ADMIN}" \
  -H "Content-Type: application/json" | jq


```
