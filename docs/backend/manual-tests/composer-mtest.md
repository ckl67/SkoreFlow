# Setup Manual composer tests

[← back](./../../doc.md)

## Introduction

This document provides instructions for testing the composers functionalities of the SkoreFlow backend.
These tests are essential to ensure curl testing before vitest !

But at first

### Variable setting

```shell
API_VERSION="v1"
```

## Public

```shell
curl http://localhost:8080/api/${API_VERSION}/demo/composers | jq

curl -I http://192.168.1.138:8080/api/${API_VERSION}/demo/composers/1/picture
curl -I http://192.168.1.138:8080/api/${API_VERSION}/demo/composers/1/thumbnail


```

## Prerequisite

User Login to get token

```shell
TOKEN_USER2=$(curl -X POST http://localhost:8080/api/${API_VERSION}/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2@test.com","password":"password123"}' | jq -r '.data.token')

echo "JWT Token: $TOKEN_USER2"

curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/me | jq

```

## Create of a composer

```shell
# To run in /backend

curl -X POST "http://localhost:8080//${API_VERSION}api/composers" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -F "name=Beethoven 2" \
  -F "epoch=Classical" \
  -F "externalURL=" \
  -F "isVerified=true" \
  -F "uploadFile=@../testauto/backend/resources/composers/Beethoven.png"

```

### Composer listing

- To list all composers

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers | jq

curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/${API_VERSION}/composers?page=1&limit=50" | jq

```

- To list 1 specific composer

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers?name=NightWish | jq

# {"Wolfgang Amadeus Mozart", "Classical period", "https://fr.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart", "Mozart.png"},


curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers?name=Wolfgang%20Amadeus%20Mozart | jq


```

- To list 1 composer

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers/1 | jq
```

### Get Picture

```shell

# Header in VM environnement
curl -I -H "Authorization: Bearer $TOKEN_USER2" http://192.168.1.138:8080/api/${API_VERSION}/composers/1/picture

curl -H "Authorization: Bearer $TOKEN_USER2" -o avatar.png http://localhost:8080/api/${API_VERSION}/me/avatar
file avatar.png

```
