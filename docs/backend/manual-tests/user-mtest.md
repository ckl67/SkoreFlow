# Registration, Login, and Password Reset Tests

This document provides instructions for testing the registration, login, and password reset functionalities of the SkoreFlow backend. These tests are essential to ensure that the authentication system is working correctly and securely.
2 approach to testing:

- From the User perspective
- From the Admin perspective

```shell
# Variable setting
EMAIL="christian.klugesherz@gmail.com"
DB_PATH="./storage/database.db"
AVATAR_FILE="/home/christian/SkoreFlow_Project/SkoreFlow/testauto/backend/avatars/avatar-ckl.png"
ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="skoreflow"
```

⚠️ Be care, the commande below must be run in the backend directory, otherwise the DB_PATH variable will not be correct.

# From the User perspective

from the user perspective, we will test the following functionalities:

- Registration
- Login
- Password Reset
- Profile
- Avatar

## Variables in API Calls

## Registration

User POSTs /register {username, email, password}

- creates user with IsVerified=false
- backend sends confirmation email with frontend link: https://frontend/register/confirm?token=abc123
  User clicks frontend link
- frontend calls POST /register/confirm {token}
- backend validates token and sets IsVerified=true

```shell
# Register a new user
curl -s -X POST "http://localhost:8080/api/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"ItsMe\",
    \"email\": \"${EMAIL}\",
    \"password\": \"password123\"
  }" | jq

# After registration, the user will receive a confirmation email with a link to confirm their registration. The link will contain a token that is stored in the database. To simulate the user clicking the confirmation link, you can retrieve the token from the database and use it to confirm the registration.
```

```shell
# Simulating the user clicking the confirmation link in the email by retrieving the token from the database.
TOKEN_SQL=$(sqlite3 "$DB_PATH" "SELECT password_reset FROM users WHERE email='$EMAIL';")

# To confirm the registration using the token, you can use the following command:
curl -X POST http://localhost:8080/api/register/confirm \
 -H "Content-Type: application/json" \
 -d "{
    \"token\":\"${TOKEN_SQL}\"
    }" | jq
```

```shell
# To request a password reset, you can use the following command:
curl -X POST http://localhost:8080/api/register/rqconfirm \
 -H "Content-Type: application/json" \
 -d "{
  \"email\":\"${EMAIL}\"
  }" | jq
```

## Login

To log in and obtain a JWT token for authenticated requests, you can use the following command:

```shell
curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${EMAIL}\",
    \"password\":\"password123\"
  }" | jq


TOKEN_USER=$(curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${EMAIL}\",
    \"password\":\"password123\"
  }" | jq -r '.token')

echo "JWT Token: $TOKEN_USER"
```

JWT (JSON Web Token) is a compact, URL-safe means of representing claims to be transferred between two parties. It consists of three parts: the header, the payload, and the signature. Each part is Base64URL encoded and separated by dots : **HEADER.PAYLOAD.SIGNATURE**

To decode the payload of a JWT token, you can use the following command:

```shell
echo "$TOKEN_USER" | cut -d '.' -f2 | base64 -d 2>/dev/null | jq
```

## Password Reset

To request a password reset, you can use the following command:

```shell
curl -X POST http://localhost:8080/api/password/forgot \
 -H "Content-Type: application/json" \
 -d "{
  \"email\":\"${EMAIL}\"
  }" | jq

# After requesting a password reset, the user will receive an email with a link to reset their password. The link will contain a token that is stored in the database. To simulate the user clicking the password reset link, you can retrieve the token from the database and use it to reset the password.
```

```shell
# Simulating the user clicking the confirmation link in the email by retrieving the token from the database.
TOKEN_SQL=$(sqlite3 "$DB_PATH" "SELECT password_reset FROM users WHERE email='$EMAIL';")
echo "Token for password reset: $TOKEN_SQL"
```

The link will open a frontend page where the user can enter a new password. The frontend will then call the following API to reset the password:
You have 1 hour to reset the password, after that the token will expire and you will need to request a new password reset.

```shell
curl -X POST http://localhost:8080/api/password/reset \
 -H "Content-Type: application/json" \
 -d "{
    \"token\":\"${TOKEN_SQL}\",
    \"password\":\"newpassword123\"
    }" | jq
```

New login with the new password:

```shell
TOKEN_USER=$(curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${EMAIL}\",
    \"password\":\"newpassword123\"
  }" | jq -r '.token')
echo "JWT Token: $TOKEN_USER"
```

## Profile

To access the user's profile information, you can use the following command with the JWT token obtained from the login step:

```shell
curl -H "Authorization: Bearer $TOKEN_USER" http://localhost:8080/api/me | jq
```

## Avatar

To upload an avatar for the user, you can use the following command:

```shell

ls -l "$AVATAR_FILE"

curl -X POST http://localhost:8080/api/me/avatar \
 -H "Authorization: Bearer $TOKEN_USER" \
 -F "avatar=@$AVATAR_FILE" | jq
```

# From the Admin perscpective

from the admin perspective, you can log in with the following

```shell
curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${ADMIN_EMAIL}\",
    \"password\":\"${ADMIN_PASSWORD}\"
  }" | jq

TOKEN_ADMIN=$(curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d "{
    \"email\":\"${ADMIN_EMAIL}\",
    \"password\":\"${ADMIN_PASSWORD}\"
  }" | jq -r '.token')

echo "JWT Token: $TOKEN_ADMIN"

```

# User creation by admin

To create a new user as an admin, you can use the following command:

```shell
curl -i -X POST http://localhost:8080/api/admin/createuser \
 -H "Authorization: Bearer $TOKEN_ADMIN" \
 -H "Content-Type: application/json" \
 -d '{
  "username":"NewUser1",
  "email":"user1@test.com",
  "password":"password123"
}'

curl -i -X POST http://localhost:8080/api/admin/createuser \
 -H "Authorization: Bearer $TOKEN_ADMIN" \
 -H "Content-Type: application/json" \
 -d '{
  "username":"NewUser2",
  "email":"user2@test.com",
  "password":"password123"
}' | jq

```
