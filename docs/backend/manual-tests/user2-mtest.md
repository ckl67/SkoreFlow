# Tests

## Login

```shell

TOKEN_USER2=$(curl -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2@test.com","password":"password123"}' | jq -r '.data.token')

echo "JWT Token: $TOKEN_USER2"

curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/me | jq

curl -H "Authorization: Bearer $TOKEN_USER2" http://192.168.1.138:8080/api/me | jq



```

## Get

To Get avatar

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/me/avatar
curl -H "Authorization: Bearer $TOKEN_USER2" -o avatar.png http://localhost:8080/api/me/avatar
file avatar.png

# Header
curl -I -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/me/avatar

# Header in VM environnement
curl -I -H "Authorization: Bearer $TOKEN_USER2" http://192.168.1.138:8080/api/me/avatar


curl -H "Authorization: Bearer $TOKEN_USER2"   http://localhost:8080/api/me/avatar --output avatar.png
file avatar.png

```
