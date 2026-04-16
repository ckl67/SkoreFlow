#!/bin/bash

set -e

API_URL="http://localhost:8080/api"
DB_PATH="../../backend/storage/database.db"

# ---------------------------------------------------------------------------------------------------------------
# AUTH HELPERS
# ---------------------------------------------------------------------------------------------------------------

login_user() {
	local email=$1
	local pass=$2

	local response
	response=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/login" \
		-H 'Content-Type: application/json' \
		-d "{\"email\":\"$email\",\"password\":\"$pass\"}")

	http_code=$(echo "$response" | tail -n1)
	body=$(echo "$response" | sed '$d')

	if [ "$http_code" -eq 200 ]; then
		echo "$body" | jq -r '.token'
	else
		echo "ERROR"
	fi
}

# ---------------------------------------------------------------------------------------------------------------
# ADMIN HELPERS
# ---------------------------------------------------------------------------------------------------------------

create_user() {
	local email=$1
	local pass=$2
	local token=$3

	# Extract username from email
	local username="${email%@*}"

	local cmd="curl -s -w '\n%{http_code}' -X POST $API_URL/admin/createuser \
		-H 'Authorization: Bearer $token' \
		-H 'Content-Type: application/json' \
		-d '{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$pass\"}'"

	validate_api "Create User: $email" 201 "$cmd"
}

# ---------------------------------------------------------------------------------------------------------------
# UPDATE ROLE FROM ADMIN
# ---------------------------------------------------------------------------------------------------------------

update_user_role() {
	local user_id=$1
	local username=$2
	local role=$3
	local verified=$4
	local token=$5

	local json
	json=$(printf '{"username":"%s","role":%s,"isVerified":%s}' \
		"$username" "$role" "$verified")

	local cmd="curl -s -X PUT -w '\n%{http_code}' \
		-H \"Authorization: Bearer $token\" \
		-H \"Content-Type: application/json\" \
		-d '$json' \
		$API_URL/admin/users/$user_id"

	validate_api "Update User Role (ID: $user_id)" 200 "$cmd"
}

# ---------------------------------------------------------------------------------------------------------------
# GET ID FROM EMAIL
# ---------------------------------------------------------------------------------------------------------------

get_user_id_by_email() {
	local email=$1
	local token=$2

	local response
	response=$(curl -s -H "Authorization: Bearer $token" \
		"$API_URL/admin/users")

	local user_id
	user_id=$(echo "$response" | jq -r ".[] | select(.email==\"$email\") | .id")

	# Handle not found
	if [ -z "$user_id" ] || [ "$user_id" = "null" ]; then
		echo "ERROR"
	else
		echo "$user_id"
	fi
}

# ---------------------------------------------------------------------------------------------------------------
# MAIN TEST SUITE
# ---------------------------------------------------------------------------------------------------------------

run_user_tests() {

	echo -e "\n=============================="
	echo "🚀 STARTING USER'S API TEST SUITE"
	echo "=============================="

	# ----------------------------------------------------------------------------
	# ADMIN LOGIN
	# ----------------------------------------------------------------------------
	TOKEN_ADMIN=$(login_user "admin@admin.com" "skoreflow")
	[ "$TOKEN_ADMIN" = "ERROR" ] && echo "❌ Admin login failed" && exit 1
	echo "✅ Admin logged in"

	# ----------------------------------------------------------------------------
	# CREATE USERS
	# ----------------------------------------------------------------------------
	echo -e "\n-----------------------------------"
	echo -e "--- Creating users + Give Acces ---"
	echo -e "-----------------------------------"

	# ---
	EMAIL="user1@test.com"
	create_user "$EMAIL" "password123" "$TOKEN_ADMIN"
	USER_ID=$(get_user_id_by_email "$EMAIL" "$TOKEN_ADMIN")
	if [ "$USER_ID" = "ERROR" ]; then
		echo "❌ User not found: $EMAIL"
		exit 1
	fi
	update_user_role "$USER_ID" "${EMAIL%@*}" 0 true "$TOKEN_ADMIN"
	# ---

	# ---
	EMAIL="user2@test.com"
	create_user "$EMAIL" "password123" "$TOKEN_ADMIN"
	USER_ID=$(get_user_id_by_email "$EMAIL" "$TOKEN_ADMIN")
	if [ "$USER_ID" = "ERROR" ]; then
		echo "❌ User not found: $EMAIL"
		exit 1
	fi
	update_user_role "$USER_ID" "${EMAIL%@*}" "$ROLE_MODERATOR" true "$TOKEN_ADMIN"
	# ---

	# ---
	EMAIL="user3@test.com"
	create_user "$EMAIL" "password123" "$TOKEN_ADMIN"
	USER_ID=$(get_user_id_by_email "$EMAIL" "$TOKEN_ADMIN")
	if [ "$USER_ID" = "ERROR" ]; then
		echo "❌ User not found: $EMAIL"
		exit 1
	fi
	update_user_role "$USER_ID" "${EMAIL%@*}" 0 false "$TOKEN_ADMIN"
	# ---

	# ----------------------------------------------------------------------------
	# ADMIN LIST USERS
	# ----------------------------------------------------------------------------
	echo -e "\n------------------------"
	echo -e "--- Admin list users ---"
	echo -e "------------------------"

	validate_api "List Users" 200 \
		"curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_ADMIN\" $API_URL/admin/users"

	# ----------------------------------------------------------------------------
	# SECURITY TESTS
	# ----------------------------------------------------------------------------
	echo -e "\n-----------------------"
	echo -e "--- Security tests ---"
	echo -e "-----------------------"

	validate_api "Admin without token" 401 \
		"curl -s -w '\n%{http_code}' $API_URL/admin/users"

	# login normal user
	TOKEN_USER1=$(login_user "user1@test.com" "password123")

	validate_api "User accessing admin route" 403 \
		"curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_USER1\" $API_URL/admin/users"

	# ----------------------------------------------------------------------------
	# PROFILE TESTS
	# ----------------------------------------------------------------------------
	echo -e "\n---------------------"
	echo -e "--- Profile tests ---"
	echo -e "---------------------"

	validate_api "Get Profile" 200 \
		"curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_USER1\" $API_URL/me"

	validate_api "Update Profile" 200 \
		"curl -s -X PUT -w '\n%{http_code}' \
		-H \"Authorization: Bearer $TOKEN_USER1\" \
		-H \"Content-Type: application/json\" \
		-d '{\"username\":\"UpdatedUser1\"}' \
		$API_URL/me"

	# ----------------------------------------------------------------------------
	# AVATAR TEST
	# ----------------------------------------------------------------------------
	echo -e "\n-----------------------"
	echo -e "--- Avatar upload ---"
	echo -e "-----------------------"

	TEST_AVATAR="$SCRIPT_DIR/avatars/user.png"

	validate_api "Upload Avatar" 200 \
		"curl -s -X POST -w '\n%{http_code}' \
		-H \"Authorization: Bearer $TOKEN_USER1\" \
		-F \"avatar=@$TEST_AVATAR\" \
		$API_URL/me/avatar"

	# ----------------------------------------------------------------------------
	# ADMIN USER OPERATIONS
	# ----------------------------------------------------------------------------
	echo -e "\n-----------------------------"
	echo -e "--- Admin user operations ---"
	echo -e "-----------------------------"

	# get first user ID dynamically
	USER_ID=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" \
		$API_URL/admin/users | jq '.[0].id')
	echo "First user ID: $USER_ID"

	validate_api "Get User" 200 \
		"curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_ADMIN\" $API_URL/admin/users/$USER_ID"

	validate_api "Update User" 200 \
		"curl -s -X PUT -w '\n%{http_code}' \
		-H \"Authorization: Bearer $TOKEN_ADMIN\" \
		-H \"Content-Type: application/json\" \
		-d '{\"username\":\"AdminUpdated\"}' \
		$API_URL/admin/users/$USER_ID"

	validate_api "Delete User" 400 \
		"curl -s -X DELETE -w '\n%{http_code}' \
		-H \"Authorization: Bearer $TOKEN_ADMIN\" \
		$API_URL/admin/users/$USER_ID"

	echo -e "\n--- Create user without verified ---"
	EMAIL="user4@test.com"
	create_user "$EMAIL" "password123" "$TOKEN_ADMIN"
	USER_ID=$(get_user_id_by_email "$EMAIL" "$TOKEN_ADMIN")
	if [ "$USER_ID" = "ERROR" ]; then
		echo "❌ User not found: $EMAIL"
		exit 1
	fi
	update_user_role "$USER_ID" "${EMAIL%@*}" 0 false "$TOKEN_ADMIN"

	echo -e "\n--- Try to delete unverified user ---"
	validate_api "Delete User" 200 \
		"curl -s -X DELETE -w '\n%{http_code}' \
		-H \"Authorization: Bearer $TOKEN_ADMIN\" \
		$API_URL/admin/users/$USER_ID"

	# ----------------------------------------------------------------------------
	# PASSWORD RESET
	# ----------------------------------------------------------------------------
	echo -e "\n--- Password reset ---"

	EMAIL_RESET="user2@test.com"

	validate_api "Password forgot" 200 \
		"curl -s -X POST -w '\n%{http_code}' \
		-H 'Content-Type: application/json' \
		-d '{\"email\":\"$EMAIL_RESET\"}' \
		$API_URL/password/forgot"

	TOKEN_SQL=$(sqlite3 "$DB_PATH" "SELECT password_reset FROM users WHERE email='$EMAIL_RESET';")

	validate_api "Password reset" 200 \
		"curl -s -X POST -w '\n%{http_code}' \
		-H 'Content-Type: application/json' \
		-d '{\"token\":\"$TOKEN_SQL\",\"password\":\"NewPassword123!\"}' \
		$API_URL/password/reset"

	# ----------------------------------------------------------------------------
	# REGISTER FLOW
	# ----------------------------------------------------------------------------
	echo -e "\n--- Register flow ---"

	EMAIL_REGISTER="register@test.com"

	validate_api "Register" 201 \
		"curl -s -X POST -w '\n%{http_code}' \
		-H 'Content-Type: application/json' \
		-d '{\"username\":\"register\",\"email\":\"$EMAIL_REGISTER\",\"password\":\"password123\"}' \
		$API_URL/register"

	TOKEN_REGISTER=$(sqlite3 "$DB_PATH" "SELECT password_reset FROM users WHERE email='$EMAIL_REGISTER';")

	validate_api "Confirm Register" 200 \
		"curl -s -X POST -w '\n%{http_code}' \
		-H 'Content-Type: application/json' \
		-d '{\"token\":\"$TOKEN_REGISTER\"}' \
		$API_URL/register/confirm"

	validate_api "Request Confirm again" 200 \
		"curl -s -X POST -w '\n%{http_code}' \
		-H 'Content-Type: application/json' \
		-d '{\"email\":\"$EMAIL_REGISTER\"}' \
		$API_URL/register/rqconfirm"

	echo -e "\n=============================="
	echo "✅ ALL TESTS COMPLETED"
	echo "=============================="
}
