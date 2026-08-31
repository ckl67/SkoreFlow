# Setup Manual score tests

[← back](../../doc.md)

## Introduction

This document provides instructions for testing the score basic functionalities of the SkoreFlow backend.
These tests are essential to ensure curl testing before vitest !

## Basics

```shell
curl http://localhost:8080/api
```

## Login

```shell

TOKEN_USER2=$(curl -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2@test.com","password":"password123"}' | jq -r '.data.token')

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

# Beethoven Composer
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/composers/2 | jq
```

## Create score

```shell

NAME="Sonate au Clair de Lune"
COMPOSER="Ludwig Van Beethoven"
COMPOSER_ID=2
FILE_PATH="../testauto/backend/resources/scores/Ludwig Van Beethoven/Sonate No. 14 - Clair de lune.pdf"

curl -X POST "http://localhost:8080/api/scores" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "uploadFile=@$FILE_PATH" \
  -F "composerId=$COMPOSER_ID" \
  -F "scoreName=$NAME" \
  -F "releaseDate=1965-12-12T00:00:00Z" \
  -F "categories=Classical,Romantic" \
  -F "tags=Piano,Calm" \
  -F "informationText=Automated test file for $COMPOSER"

# ================================================
# Same result a second time with TOKEN_USER2
# ================================================

curl -i -X POST "http://localhost:8080/api/scores" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "uploadFile=@$FILE_PATH" \
  -F "composerId=$COMPOSER_ID" \
  -F "scoreName=$NAME" \
  -F "releaseDate=1965-12-12T00:00:00Z" \
  -F "categories=Classical,Romantic" \
  -F "tags=Piano,Calm" \
  -F "informationText=Automated test file for $COMPOSER"

```

## Some verifications

```shell
# ================================================
# composerId=9999 → composer does not exist
# ================================================
NAME="Sonate au Clair de Lune"
COMPOSER="Ludwig Van Beethoven"
COMPOSER_ID=9999
FILE_PATH="../testauto/backend/resources/scores/Ludwig Van Beethoven/Sonate No. 14 - Clair de lune.pdf"

# To display the body -i
curl -i -X POST "http://localhost:8080/api/scores" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "uploadFile=@$FILE_PATH" \
  -F "composerId=$COMPOSER_ID" \
  -F "scoreName=$NAME" \
  -F "releaseDate=1965-12-12T00:00:00Z" \
  -F "categories=Classical,Romantic" \
  -F "tags=Piano,Calm" \
  -F "informationText=Automated test file for $COMPOSER"




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
