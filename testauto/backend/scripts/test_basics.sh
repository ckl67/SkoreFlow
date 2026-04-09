#!/bin/bash

# ---------------------------------------------------------------------------------------------------------------
# API TESTING FRAMEWORK (HELPERS)
# ---------------------------------------------------------------------------------------------------------------

# validate_api: Executes an HTTP command and validates the response code.
# Usage: validate_api "Description" Expected_HTTP_Code "Curl_Command"
# Example: validate_api "User Creation" 201 "$cmd"
validate_api() {
	local label=$1
	local expected=$2
	local cmd=$3
	local response
	local http_code
	local body

	# Execute the command and capture both body and HTTP status code
	# The tail -n1 / head -n1 logic works because curl is called with -w '\n%{http_code}'
	response=$(eval "$cmd")
	http_code=$(echo "$response" | tail -n1)

	# Extract the body by removing the last line (the http_code)
	# Using 'sed' is safer than 'head -n1' if the JSON body contains multiple lines
	body=$(echo "$response" | sed '$d')

	if [ "$http_code" -eq "$expected" ]; then
		echo -e "✅ [PASS] $label (Status: $http_code)"

		# Check if the body is valid JSON (starts with { or [)
		if [[ "$body" == \{* ]] || [[ "$body" == \[* ]]; then
			# We use jq for pretty-printing.
			# Note: You can pipe to a custom jq filter if you want to truncate long lists
			echo "$body" | jq .
		elif [ -n "$body" ]; then
			echo "   Response: $body"
		fi
	else
		echo -e "❌ [FAIL] $label"
		echo -e "   Expected: $expected | Received: $http_code"

		# Try to format the error message if it's JSON (e.g., GORM or Gin errors)
		if [[ "$body" == \{* ]]; then
			echo "   Error Details:"
			echo "$body" | jq .
		else
			echo "   Response Body: $body"
		fi

		# Critical failure: Stop the entire test suite to prevent cascading errors
		echo "🛑 Aborting tests due to failure in: $label"
		exit 1
	fi
}

# ---------------------------------------------------------------------------------------------------------------
# BASIC SMOKE TESTS
# ---------------------------------------------------------------------------------------------------------------

# test_basics: Performs initial connectivity and health checks.
# Ensures the server is responding before running complex business logic.
run_basic_tests() {
	echo -e "\n--- [MODULE: BASICS / SMOKE TESTS] ---"

	# 1. Health Check
	# Verifies the DB connection and general server heartbeat
	local cmd_health="curl -s -w '\n%{http_code}' http://localhost:8080/health"
	validate_api "Server Health Check" 200 "$cmd_health"

	# 2. Version Check
	# Verifies that the versioning endpoint is reachable
	local cmd_version="curl -s -w '\n%{http_code}' http://localhost:8080/version"
	validate_api "Server Version Info" 200 "$cmd_version"

	# 3. API Root Check
	# Verifies the base API routing is functional
	local cmd_api="curl -s -w '\n%{http_code}' http://localhost:8080/api"
	validate_api "API Base Endpoint" 200 "$cmd_api"

	echo "✨ Basics verified. Environment is healthy."
}
