# Auto testing

This page provides instructions on how to run automated tests for the SkoreFlow backend.
Automated testing is crucial for ensuring the reliability and stability of the application as it evolves.

This part will also address some manual tests

In order to access the database, you can use sqlitebrowser, a graphical tool that allows you to interact with SQLite databases. It provides an intuitive interface for browsing, querying, and managing your SQLite databases without needing to use command-line tools.
For more information on how to install and use sqlitebrowser, please refer to the [sqlitebrowser guide](./sqlite.md).

## Running Tests

To run the automated tests, you can use the following command from the root of the backend project:

```bash
cd auto-test
bash auto-test.sh --help
```

This command will execute the test suite, which includes various test cases designed to validate the functionality of the backend.
All the tests must pass successfully for the backend to be considered stable.

## Manual Testing

In addition to automated tests, you can also perform manual testing to verify specific functionalities or to debug issues.
Manual testing involves executing specific API calls or actions and observing the results to ensure they meet the expected outcomes.

```bash
# In Bash, variables inside single quotes '...' are not interpolated (expanded).
# Solution: Always use double quotes "... to include variables.
```

### Smoke Testing

These checks the health of the backend service. A successful response indicates that the service is running and responsive.

```shell
curl "http://localhost:8080/health"
curl "http://localhost:8080/version"
curl "http://localhost:8080/api"
```

### Variables in API Calls

For the authentification tests

- regitration
- login
- password reset
  we will use the following variables below

```shell
# Variable setting
DB_PATH="./backend/storage/database.db"
EMAIL="christian.klugesherz@gmail.com"
ADMIN_EMAIL="admin@admin.com"
```

### registration

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

### login

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
curl -X POST http://localhost:8080/api/me/avatar \
 -H "Authorization: Bearer $TOKEN_USER" \
 -F "avatar=@/avatars/avatar-ckl.png" | jq
```
