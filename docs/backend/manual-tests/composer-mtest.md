# Setup Manual composer tests

[← back](./../../doc.md)

```shell



TOKEN_USER2=$(curl -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2@test.com","password":"password123"}' | jq -r '.data.token')

echo "JWT Token: $TOKEN_USER2"

curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/me | jq

```

## Create a composer

```shell
curl -X POST "http://localhost:8080/api/composers/upload" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -H "Content-Type: application/json" \
  -d '{ \
    "name": "Beethoven",\
    "description": "Classical"\
    "uploadFile": "@resources/composers/Beethoven.png"\
  }'

```
