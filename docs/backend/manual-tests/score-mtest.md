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

## List of Composers

```shell
# All Composers
curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/composers?page=1&limit=5" | jq

# Verified
curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/composers?isVerified=true&page=1&limit=5&" | jq

# Not Verified
curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/composers?isVerified=false&page=1&limit=5&" | jq

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

COMPOSER="Beethoven"

```

## List of Scores

```shell

curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/scores?page=1&limit=5" | jq

```

## List of a specific score

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/scores/1" | jq


```

## Merge composer

```shell
curl -X PUT \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -H "Content-Type: application/json" \
  -d '{"source_id":2,"target_id":1}' \
  http://localhost:8080/api/composers/merge | jq


```
