# What is JWT

## Introduction

JWT = **JSON Web Token** is a **secure token** that contains information (claims) which you can transmit between a client and your server.
A JWT has three parts:

**HEADER.PAYLOAD.SIGNATURE**

- **Header** → specifies the signature algorithm (e.g. `HS256`).
- **Payload** → contains the claims: data such as `user_id`, `exp` (expiry), `authorized`, etc.
- **Signature** → an HMAC signature using your secret key (`apiSecret`) to ensure that nobody can tamper with the token.

A practical example:

```go
claims := jwt.MapClaims{}
claims["authorized"] = true
claims["user_id"] = user_id
claims["exp"] = time.Now().Add(time.Hour * 168).Unix() // expiry: 1 week
```

We then create the token:

```go
token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
signedToken, err := token.SignedString([]byte(apiSecret))
```

The result is a **long string** which the client stores (often in the `Authorization: Bearer <token>` header).

## Decoding of the token: PAYLOAD

```shell
echo "eyJhdXRob3JpemVkIjp0cnVlLCJleHAiOjE3NzI2NDI2MDMsInJvbGUiOjAsInVzZXJfaWQiOjF9" | base64 -d

{"authorized":true,"exp":1772642603,"role":0,"user_id":1}
```
