<<!--cspell:ignore supertramp >>

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


TOKEN_MODERATOR=$(curl -X POST http://localhost:8080/api/${API_VERSION}/login \
 -H "Content-Type: application/json" \
 -d '{"email":"moderator1@test.com","password":"password123"}' | jq -r '.data.token')


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

- To list all composers belonging to the logged user

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers?used=true | jq

curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/${API_VERSION}/composers?used=true&page=1&limit=5" | jq

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
curl -I -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers/1/picture

# Header in VM environnement
curl -I -H "Authorization: Bearer $TOKEN_USER2" http://192.168.1.138:8080/api/${API_VERSION}/composers/1/picture

curl -H "Authorization: Bearer $TOKEN_USER2" -o avatar.png http://localhost:8080/api/${API_VERSION}/me/avatar
file avatar.png
```

### Case 1

We suppose that the image is not present !

```shell
    {
        "id": 6,
        "name": "Supertramp",
        "picture": "composers/supertramp/picture.png",
        "external_url": "https://fr.wikipedia.org/wiki/Supertramp",
        "epoch": "Rock gradual, Pop, Art Rock, Blues-rock",
        "isVerified": true,
        "isDemo": false
      },
```

Modification of storage file :
storage/composers/supertramp/picture.png
to
storage/composers/supertramp/picture-modification.png

### Case 2

We remove the picture file in the data base

```shell
{
"id": 6,
"name": "Supertramp",
"picture": "",
"external_url": "https://fr.wikipedia.org/wiki/Supertramp",
"epoch": "Rock gradual, Pop, Art Rock, Blues-rock",
"isVerified": true,
"isDemo": false
},
```

### Result of case 1 and 2

````shell

curl -i -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers/6/picture

HTTP/1.1 404 Not Found
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Expires: 0
Pragma: no-cache
Vary: Authorization
Date: Wed, 25 Nov 2026 10:53:14 GMT
Content-Length: 66

{"success":false,"error":{"message":"composer picture not found"}}
```shell

## Extra

### With Search form

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" http://localhost:8080/api/${API_VERSION}/composers?name=Beethoven | jq

curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/${API_VERSION}/composers?name=Beethoven&searchMode=exact" | jq

# Starting with a letter
curl -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/${API_VERSION}/composers?name=b" | jq


````

### Get Picture Clarifications

```shell

curl -H "Authorization: Bearer $TOKEN_MODERATOR" http://localhost:8080/api/${API_VERSION}/composers/17 | jq


curl -i -H "Authorization: Bearer $TOKEN_MODERATOR" http://localhost:8080/api/${API_VERSION}/composers/17/picture

# ----------

curl -H "Authorization: Bearer $TOKEN_MODERATOR" http://localhost:8080/api/${API_VERSION}/composers/999 | jq


curl -i -H "Authorization: Bearer $TOKEN_MODERATOR" http://localhost:8080/api/${API_VERSION}/composers/999/picture

```
