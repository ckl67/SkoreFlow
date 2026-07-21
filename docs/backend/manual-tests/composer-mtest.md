# Setup Manual composer tests

[← back](./../../doc.md)

## Introduction

This document provides instructions for testing the composers functionalities of the SkoreFlow backend.
These tests are essential to ensure curl testing before vitest !

## Prerequisite

User Login to get token

```shell

TOKEN_USER2=$(curl -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2@test.com","password":"password123"}' | jq -r '.data.token')

echo "JWT Token: $TOKEN_USER2"

curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/me | jq

```

## Create of a composer

```shell
curl -X POST "http://localhost:8080/api/composers" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "name=Beethoven 2" \
  -F "epoch=Classical" \
  -F "externalURL=" \
  -F "isVerified=true" \
  -F "uploadFile=@../testauto/backend/resources/composers/Beethoven.png"

```

### Composer listing

To list all composers

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/composers | jq
```

To list 1 composer

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/composers/1 | jq
```

### Get Picture

```shell

# Header in VM environnement
curl -I -H "Authorization: Bearer $TOKEN_USER2" http://192.168.1.138:8080/api/composers/1/picture

curl -H "Authorization: Bearer $TOKEN_USER2" -o avatar.png http://localhost:8080/api/me/avatar
file avatar.png

```
