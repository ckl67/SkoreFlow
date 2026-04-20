// Setup

```shell

ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="skoreflow"
TOKEN_ADMIN=$(curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${ADMIN_EMAIL}\",
    \"password\":\"${ADMIN_PASSWORD}\"
  }" | jq -r '.token')


curl -H "Authorization: Bearer $TOKEN_ADMIN" http://localhost:8080/api/admin/users | jq

TOKEN_USER2=$(curl -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2@test.com","password":"password123"}' | jq -r '.token')

echo "JWT Token: $TOKEN_USER2"

curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/me | jq

```

// Create a composer

```shell
curl -X POST "http://localhost:8080/api/composers/upload" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -H "Content-Type: application/json" \
  -d '{ \
    "name": "Beethoven",\
    "description": "Classical"\
    "uploadFile": "@resources/composers/Beethoven.png"\
  }'

curl -X POST http://localhost:8080/api/composers/upload \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "name=Beethoven" \
  -F "epoch=Classical" \
  -F "uploadFile=@resources/composers/Beethoven.png"

```

"avatar=@$AVATAR_FILE" |
