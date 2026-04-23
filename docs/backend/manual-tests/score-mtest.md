# Setup Manual score tests

## List of all users

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

## Create score

```shell

NAME="Sonate au Clair de Lune"
COMPOSER="Ludwig Van Beethoven"
FILE_PATH="resources/scores/Ludwig Van Beethoven/Sonate No. 14 - Clair de lune.pdf"

COMPOSER="Beethoven"

curl -X POST "http://localhost:8080/api/scores/upload" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "scoreName=$NAME" \
  -F "composer=$COMPOSER" \
  -F "releaseDate=1965-12-12T00:00:00Z" \
  -F "categories=Classical,Romantic" \
  -F "tags=Piano,Calm" \
  -F "informationText=Automated test file for $COMPOSER" \
  -F "uploadFile=@$FILE_PATH"

```

## List score

curl -X GET "http://localhost:8080/api/scores" \
