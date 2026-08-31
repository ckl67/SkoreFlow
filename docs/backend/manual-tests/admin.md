```shell
# Variable setting
ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="skoreflow"
```

```shell
curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${ADMIN_EMAIL}\",
    \"password\":\"${ADMIN_PASSWORD}\"
  }" | jq

TOKEN_ADMIN=$(curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${ADMIN_EMAIL}\",
    \"password\":\"${ADMIN_PASSWORD}\"
  }" | jq -r '.data.token')

echo "JWT Token: $TOKEN_ADMIN"

```

```shell
curl -X POST http://localhost:8080/api/admin/test/auth/smtp/enable \
 -H "Content-Type: application/json" \
  -d "{
    \"token\":\"${TOKEN_ADMIN}\",
}" | jq

```
