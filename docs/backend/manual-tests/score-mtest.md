# Setup Manual score tests

[← back](../../doc.md)

## Introduction

This document provides instructions for testing the score basic functionalities of the SkoreFlow backend.
These tests are essential to ensure curl testing before vitest !

## Variable setting

```shell
API_VERSION="v1"
```

## Basics

```shell
curl http://localhost:8080/api/${API_VERSION}
```

## public - demo

## private

### Prerequisite

#### Login

```shell

TOKEN_USER2=$(curl -X POST http://localhost:8080/api/${API_VERSION}/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2@test.com","password":"password123"}' | jq -r '.data.token')

echo "JWT Token: $TOKEN_USER2"

curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/me | jq

```

### List of Composers

```shell
# All Composers
curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/${API_VERSION}/composers?page=1&limit=5" | jq

# Verified
curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/${API_VERSION}/composers?isVerified=true&page=1&limit=5&" | jq

# Not Verified
curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/${API_VERSION}/composers?isVerified=false&page=1&limit=5&" | jq

# Beethoven Composer
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers?name=Ludwig%20Van %20Beethoven| jq
```

### Create score

```shell

NAME="Sonate au Clair de Lune - Perfect Version"
COMPOSER="Ludwig Van Beethoven"
COMPOSER_ID=2
FILE_PATH="../testauto/backend/resources/scores/Ludwig Van Beethoven/Sonate No. 14 - Clair de lune.pdf"

# To run in /backend
curl -X POST "http://localhost:8080/api/${API_VERSION}/scores" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "uploadFile=@$FILE_PATH" \
  -F "composerId=$COMPOSER_ID" \
  -F "scoreName=$NAME" \
  -F "releaseDate=1965-12-12T00:00:00Z" \
  -F "categories=Classical,Romantic" \
  -F "tags=Piano,Calm" \
  -F "informationText=Automated test file for $COMPOSER"

# ================================================
# Should reject a second time with TOKEN_USER2
# ================================================

curl -i -X POST "http://localhost:8080/api/${API_VERSION}/scores" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "uploadFile=@$FILE_PATH" \
  -F "composerId=$COMPOSER_ID" \
  -F "scoreName=$NAME" \
  -F "releaseDate=1965-12-12T00:00:00Z" \
  -F "categories=Classical,Romantic" \
  -F "tags=Piano,Calm" \
  -F "informationText=Automated test file for $COMPOSER"

```

### List of Scores

```shell

curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/${API_VERSION}/scores?page=1&limit=5" | jq

```

### Pagination

```shell

curl -H "Authorization: Bearer $TOKEN_USER2" \
"http://localhost:8080/api/${API_VERSION}/scores?page=1&limit=2" | jq


curl -H "Authorization: Bearer $TOKEN_USER2" \
"http://localhost:8080/api/${API_VERSION}/scores?page=2&limit=2" | jq

```

### Search

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" \
"http://localhost:8080/api/${API_VERSION}/scores?search=Adagio" | jq
```

### Filter Compo

```shell

curl -H "Authorization: Bearer $TOKEN_USER2" \
"http://localhost:8080/api/${API_VERSION}/scores?composer=Beethoven" | jq
```

### Filter Tag

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" \
"http://localhost:8080/api/${API_VERSION}/scores?tag=Piano" | jq
```

### Filter Category

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" \
"http://localhost:8080/api/${API_VERSION}/scores?category=Classical" | jq
```

### To list 1 score

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/scores/11 | jq
```
