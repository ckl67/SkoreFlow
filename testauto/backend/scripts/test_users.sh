#!/bin/bash

# ---------------------------------------------------------------------------------------------------------------
# LOGIN HELPERS
# ---------------------------------------------------------------------------------------------------------------

# login_user: Authenticates a user and returns their JWT token.
# Returns: String (Token) or "ERROR"
login_user() {
	local email=$1
	local pass=$2
	local response
	local http_code
	local body

	local cmd="curl -s -w '\n%{http_code}' -X POST http://localhost:8080/api/login \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"$email\",\"password\":\"$pass\"}'"

	response=$(eval "$cmd")
	http_code=$(echo "$response" | tail -n1)
	body=$(echo "$response" | sed '$d')

	if [ "$http_code" -eq 200 ]; then
		echo "$body" | jq -r '.token'
	else
		echo "ERROR"
	fi
}

# ---------------------------------------------------------------------------------------------------------------
# CREATION HELPERS
# ---------------------------------------------------------------------------------------------------------------

# create_user: Creates a new user account (Admin privileges required).
create_user() {
	local email=$1
	local pass=$2
	local admin_token=$3

	local cmd="curl -s -w '\n%{http_code}' -X POST http://localhost:8080/api/users \
        -H 'Authorization: Bearer $admin_token' \
        -H 'Content-Type: application/json' \
        -d '{\"email\":\"$email\",\"password\":\"$pass\"}'"

	validate_api "User Creation: $email" 201 "$cmd"
}

# ---------------------------------------------------------------------------------------------------------------
# USER MODULE TESTS
# ---------------------------------------------------------------------------------------------------------------

run_user_tests() {
	echo -e "\n--- [MODULE: USERS] ---"

	# --- 1. ADMIN AUTHENTICATION ---
	TOKEN_ADMIN=$(login_user "admin@admin.com" "sheetflow")
	if [ "$TOKEN_ADMIN" = "ERROR" ]; then
		echo "❌ Admin Login failed. Aborting."
		kill "$BACKEND_PID"
		exit 1
	fi
	echo "✅ Admin logged in."

	# --- 2. ACCOUNT CREATION ---
	echo "Creating test users..."
	create_user "user1@test.com" "password123" "$TOKEN_ADMIN"
	create_user "user2@test.com" "password123" "$TOKEN_ADMIN"
	create_user "christian.klugesherz@gmail.com" "password123" "$TOKEN_ADMIN"
	create_user "user3@test.com" "password123" "$TOKEN_ADMIN"
	create_user "user4@test.com" "password123" "$TOKEN_ADMIN"
	create_user "user5@test.com" "password123" "$TOKEN_ADMIN"

	# --- 3. FETCH USER LIST ---
	echo -e "\n--- User Listing ---"
	local list_cmd="curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_ADMIN\" http://localhost:8080/api/users"
	validate_api "List All Users" 200 "$list_cmd"

	# --- 4. INDIVIDUAL PROFILE ACCESS ---
	echo -e "\n--- Profile Testing (User 1) ---"
	TOKEN_USER1=$(login_user "user1@test.com" "password123")
	if [ "$TOKEN_USER1" = "ERROR" ]; then
		echo "❌ User1 Login failed."
		kill "$BACKEND_PID"
		exit 1
	fi

	local profile_cmd="curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_USER1\" http://localhost:8080/api/me"
	validate_api "Access Self Profile" 200 "$profile_cmd"

	# --- 5. GET SPECIFIC USER DETAILS (ADMIN) ---
	USER_ID_TEST=2
	echo -e "\n--- Fetching Details for User ID $USER_ID_TEST ---"
	local get_user_cmd="curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_ADMIN\" http://localhost:8080/api/users/$USER_ID_TEST"
	validate_api "Admin: Get User Details" 200 "$get_user_cmd"

	# --- 6. USER DELETION (USER 5) ---
	USER_ID_TO_DELETE=7
	echo -e "\n--- Deleting User ID $USER_ID_TO_DELETE ---"
	local del_cmd="curl -s -X DELETE -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_ADMIN\" http://localhost:8080/api/users/$USER_ID_TO_DELETE"
	validate_api "Admin: Delete User" 200 "$del_cmd"

	local check_del_cmd="curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_ADMIN\" http://localhost:8080/api/users/$USER_ID_TO_DELETE"
	validate_api "Verify User Deletion (404 expected)" 404 "$check_del_cmd"

	# --- 7. USER UPDATE & PROMOTION (USER 2) ---
	USER_ID_TO_UPDATE=3
	UPDATE_DATA='{"email":"user2.updated@test.com","role":'$ROLE_MODERATOR'}'
	echo -e "\n--- Updating User ID $USER_ID_TO_UPDATE ---"
	local update_cmd="curl -s -X PUT -w '\n%{http_code}' \
        -H \"Authorization: Bearer $TOKEN_ADMIN\" \
        -H \"Content-Type: application/json\" \
        -d '$UPDATE_DATA' \
        http://localhost:8080/api/users/$USER_ID_TO_UPDATE"
	validate_api "Admin: Update/Promote User" 200 "$update_cmd"

	# Re-login User 2 with updated email
	TOKEN_USER2=$(login_user "user2.updated@test.com" "password123")
	if [ "$TOKEN_USER2" = "ERROR" ]; then
		echo "❌ Login failed for updated user2."
		kill "$BACKEND_PID"
		exit 1
	fi

	# --- 8. PASSWORD RESET FLOW ---
	if [ "$TEST_PASSWORD_RESET" = true ]; then
		echo -e "\n--- Password Reset Flow ---"

		EMAIL_RESET="christian.klugesherz@gmail.com"
		DB_PATH="../../backend/storage/database.db"

		# Step 1: Request Reset Token
		local req_reset_cmd="curl -s -X POST -w '\n%{http_code}' \
            -H 'Content-Type: application/json' \
            -d '{\"email\":\"$EMAIL_RESET\"}' \
            http://localhost:8080/api/password/forgot"
		validate_api "Password Reset Request" 200 "$req_reset_cmd"

		# Step 2: Extract Token from DB
		TOKEN_SQL=$(sqlite3 "$DB_PATH" "SELECT password_reset FROM users WHERE email='$EMAIL_RESET';")
		if [ -z "$TOKEN_SQL" ]; then
			echo "❌ Reset token not found in DB."
		else
			echo "✅ Token captured: ${TOKEN_SQL:0:10}..."

			# Step 3: Submit New Password
			local JSON_DATA=$(printf '{"token":"%s","password":"NewPassword123!"}' "$TOKEN_SQL")
			local reset_pwd_cmd="curl -s -X POST -w '\n%{http_code}' \
                -H 'Content-Type: application/json' \
                -d '$JSON_DATA' \
                http://localhost:8080/api/password/reset"
			validate_api "Apply New Password" 200 "$reset_pwd_cmd"

			# Step 4: Verify token cleared
			TOKEN_CLEAN=$(sqlite3 "$DB_PATH" "SELECT password_reset FROM users WHERE email='$EMAIL_RESET';")
			if [ -z "$TOKEN_CLEAN" ]; then
				echo "✅ Reset token cleared from DB."
			fi

			# Step 5: Final login verification
			TOKEN_CKL=$(login_user "$EMAIL_RESET" "NewPassword123!")
			if [ "$TOKEN_CKL" = "ERROR" ]; then
				echo "❌ Login failed with new password."
				exit 1
			fi
			echo "✅ Login verified with new password."
		fi
	else
		echo "ℹ️ Skipping Password Reset tests."
		TOKEN_CKL=$(login_user "christian.klugesherz@gmail.com" "password123")
	fi

	# --- 2bis. PUBLIC REGISTER FLOW ---
	echo -e "\n--- Public Register Flow ---"

	EMAIL_REGISTER="register@test.com"
	DB_PATH="../../backend/storage/database.db"

	# Step 1: Register user
	local register_cmd="curl -s -X POST -w '\n%{http_code}' \
        -H 'Content-Type: application/json' \
        -d '{\"username\":\"registerUser\",\"email\":\"$EMAIL_REGISTER\",\"password\":\"password123\"}' \
        http://localhost:8080/api/register"

	validate_api "Register User (public)" 201 "$register_cmd"

	# Step 2: Extract confirmation token from DB
	TOKEN_REGISTER=$(sqlite3 "$DB_PATH" "SELECT password_reset FROM users WHERE email='$EMAIL_REGISTER';")

	if [ -z "$TOKEN_REGISTER" ]; then
		echo "❌ Register token not found in DB."
	else
		echo "✅ Register token captured: ${TOKEN_REGISTER:0:10}..."

		# Step 3: Confirm registration
		local confirm_cmd="curl -s -X POST -w '\n%{http_code}' \
            -H 'Content-Type: application/json' \
            -d '{\"token\":\"$TOKEN_REGISTER\"}' \
            http://localhost:8080/api/register/confirm"

		validate_api "Confirm Registration" 200 "$confirm_cmd"

		# Step 4: Verify login works
		TOKEN_REGISTER_USER=$(login_user "$EMAIL_REGISTER" "password123")
		if [ "$TOKEN_REGISTER_USER" = "ERROR" ]; then
			echo "❌ Login failed after registration confirmation."
			exit 1
		fi
		echo "✅ Register flow validated."
	fi
}
