# Tests

## Login

```shell

TOKEN_USER2=$(curl -X POST http://localhost:8080/api/${API_VERSION}/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2@test.com","password":"password123"}' | jq -r '.data.token')

echo "JWT Token: $TOKEN_USER2"

curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/me | jq

curl -H "Authorization: Bearer $TOKEN_USER2" http://192.168.1.138:8080/api/${API_VERSION}/me | jq
```

## Get avatar

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/me/avatar
curl -H "Authorization: Bearer $TOKEN_USER2" -o avatar.png http://localhost:8080/api/${API_VERSION}/me/avatar
file avatar.png

# Header
curl -I -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/me/avatar

# Header in VM environnement
curl -I -H "Authorization: Bearer $TOKEN_USER2" http://192.168.1.138:8080/api/${API_VERSION}/me/avatar


curl -H "Authorization: Bearer $TOKEN_USER2"   http://localhost:8080/api/${API_VERSION}/me/avatar --output avatar.png
file avatar.png

```
