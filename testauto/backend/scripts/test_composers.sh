#!/bin/bash

# ===============================================================================================================
# HELPERS SECTION
# ===============================================================================================================

# -------------------------------------------------------------------
# CREATE COMPOSER
# -------------------------------------------------------------------
# Usage: create_composer "Token" "Name" "Epoch" "Image_Path" "External_URL"
create_composer() {
	local token=$1
	local name=$2
	local epoch=$3
	local image_path=$4
	local url=$5

	# Check if local file exists before trying to upload
	if [[ ! -f "$image_path" ]]; then
		echo -e "❌ LOCAL ERROR: Image not found at $image_path"
		return 1
	fi

	local cmd="curl -s -w '\n%{http_code}' -X POST http://localhost:8080/api/composer/upload \
        -H 'Authorization: Bearer $token' \
        -F 'name=$name' \
        -F 'epoch=$epoch' \
        -F 'externalURL=$url' \
        -F 'uploadFile=@$image_path'"

	# We use 202 because your backend likely uses a worker for image processing
	validate_api "Create Composer: $name" 202 "$cmd"
}

# -------------------------------------------------------------------
# VERIFY COMPOSER STORAGE
# -------------------------------------------------------------------
check_composer_storage() {
	local safe_name=$1
	local ext=$2 # e.g., "png" or "jpg"
	local target_path="$BACKEND_DIR/infrastructure/storage/composers/$safe_name.$ext"

	echo -n "🔍 Checking storage ($safe_name.$ext)... "
	if [[ -f "$target_path" ]]; then
		echo -e "✅ File present."
		return 0
	else
		echo -e "❌ ERROR: File missing at $target_path"
		return 1
	fi
}

# -------------------------------------------------------------------
# GET COMPOSER BY ID
# -------------------------------------------------------------------
get_composer() {
	local token=$1
	local id=$2

	local cmd="curl -s -w '\n%{http_code}' \
        -H 'Authorization: Bearer $token' \
        http://localhost:8080/api/composer/$id"

	validate_api "Get Composer ID=$id" 200 "$cmd"
}

# -------------------------------------------------------------------
# UPDATE COMPOSER
# -------------------------------------------------------------------
update_composer() {
	local token=$1
	local id=$2
	local name=$3
	local image_path=$4

	local cmd="curl -s -w '\n%{http_code}' -X PUT http://localhost:8080/api/composer/$id \
        -H 'Authorization: Bearer $token' \
        -F 'name=$name'"

	if [[ -n "$image_path" ]]; then
		cmd="$cmd -F 'uploadFile=@$image_path'"
	fi

	validate_api "Update Composer ID=$id" 200 "$cmd"
}

# -------------------------------------------------------------------
# DELETE COMPOSER
# -------------------------------------------------------------------
delete_composer() {
	local token=$1
	local id=$2

	local cmd="curl -s -w '\n%{http_code}' -X DELETE \
        -H 'Authorization: Bearer $token' \
        http://localhost:8080/api/composer/$id"

	validate_api "Delete Composer ID=$id" 200 "$cmd"
}

# -------------------------------------------------------------------
# LIST GET
# -------------------------------------------------------------------
list_composers_get() {
	local token=$1
	local search=$2

	local url="http://localhost:8080/api/composers"
	[[ -n "$search" ]] && url="$url?search=${search// /%20}"

	local cmd="curl -s -w '\n%{http_code}' \
        -H 'Authorization: Bearer $token' \
        $url"

	validate_api "List GET [search=$search]" 200 "$cmd"
}

# -------------------------------------------------------------------
# LIST POST (SEARCH)
# -------------------------------------------------------------------
list_composers_post() {
	local token=$1
	local search=$2

	local json
	json=$(jq -n --arg q "$search" '{search: $q}')

	local cmd="curl -s -w '\n%{http_code}' -X POST \
        http://localhost:8080/api/composers/search \
        -H 'Authorization: Bearer $token' \
        -H 'Content-Type: application/json' \
        -d '$json'"

	validate_api "List POST [search=$search]" 200 "$cmd"
}

# -------------------------------------------------------------------
# UPDATE COMPOSER VERIFIED FLAG
# -------------------------------------------------------------------
update_composer_verified() {
	local token=$1
	local id=$2
	local value=$3 # true / false

	local cmd="curl -s -w '\n%{http_code}' -X PUT \
        http://localhost:8080/api/composer/$id \
        -H 'Authorization: Bearer $token' \
        -F 'isVerified=$value'"

	validate_api "Update Composer Verified=$value (ID=$id)" 200 "$cmd"
}

# ===============================================================================================================
# MAIN TEST SUITE
# ===============================================================================================================

run_composer_tests() {
	echo -e "\n--- [MODULE: COMPOSER] ---"

	local SRC_DIR="./Composers"

	# --------------------------------------------------------------------------------
	# 1. CREATE
	# --------------------------------------------------------------------------------
	echo "--- CREATE ---"

	# echo " DEBUG TOKEN : $TOKEN_USER2"
	# echo "second part of token" | base64 -d
	# to get : {"authorized":true,"exp":1775306121,"role":1,"user_id":3}

	# Beethoven (User 2)
	create_composer "$TOKEN_USER2" "Ludwig van Beethoven" "Classic/Romantic" "$SRC_DIR/Beethoven.png" "https://en.wikipedia.org/wiki/Ludwig_van_Beethoven"
	check_composer_storage "ludwig-van-beethoven" "png" || exit 1

	# Mozart (Admin)
	create_composer "$TOKEN_ADMIN" "Amadeus Mozart" "Classic" "$SRC_DIR/Mozart.png" "https://en.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart"
	check_composer_storage "amadeus-mozart" "png" || exit 1

	# Pink Floyd (User 1 - JPEG test) NOT ALLOWED !!
	# Variables
	name="Pink Floyd"
	epoch="Modern"
	image_path="$SRC_DIR/Pink Floyd.jpeg"
	url="https://en.wikipedia.org/wiki/Pink_Floyd"

	# Exécution du POST avec curl, capture du code HTTP
	HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/composer/upload \
		-H "Authorization: Bearer $TOKEN_USER1" \
		-F "name=$name" \
		-F "epoch=$epoch" \
		-F "externalURL=$url" \
		-F "uploadFile=@$image_path")

	# Vérification
	if [[ "$HTTP_CODE" -eq 403 ]]; then
		echo "✅ Access correctly forbidden for $name (HTTP 403)"
	else
		echo "❌ Unexpected HTTP code $HTTP_CODE for $name"
		exit 1
	fi

	# Pink Floyd (User 2 - JPEG test)
	create_composer "$TOKEN_USER2" "Pink Floyd" "Modern" "$SRC_DIR/Pink Floyd.jpeg" "https://en.wikipedia.org/wiki/Pink_Floyd"
	check_composer_storage "pink-floyd" "jpeg" || exit 1

	create_composer "$TOKEN_ADMIN" "Beethoven" "Classic" "$SRC_DIR/Beethoven.png" ""
	check_composer_storage "ludwig-van-beethoven" "png" || exit 1

	# 2. CONFLICT TEST (Duplicate Name)
	echo -n "🧪 Testing Conflict (Duplicate Mozart)... "
	local status
	status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:8080/api/composer/upload" \
		-H "Authorization: Bearer $TOKEN_USER2" \
		-F "name=Amadeus Mozart" \
		-F "uploadFile=@$SRC_DIR/Mozart.png")

	if [[ "$status" -eq 409 ]]; then
		echo "✅ Correctly rejected (409 Conflict)"
	else
		echo "❌ Error: Duplicate accepted or wrong code ($status)"
		exit 1
	fi

	# 3. INVALID FILE TEST (Robustness)
	echo -n "🧪 Testing Invalid File (Text file instead of Image)... "
	touch "$SRC_DIR/fake.txt"

	local status_invalid
	status_invalid=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:8080/api/composer/upload" \
		-H "Authorization: Bearer $TOKEN_USER2" \
		-F "name=Fake Composer" \
		-F "uploadFile=@$SRC_DIR/fake.txt")

	echo "$status_invalid"

	if [[ "$status_invalid" -eq 400 ]]; then
		echo "✅ Correctly rejected (400 Bad Request)"
	else
		echo "⚠️ Warning: Server responded with $status_invalid for invalid file type."
	fi
	rm "$SRC_DIR/fake.txt"

	# 4. API LISTING VERIFICATION (GET)
	echo -n "🔍 API Verification (GET Search)... "
	local api_check
	api_check=$(curl -s -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/composers?search=Beethoven")

	if [[ "$api_check" == *"ludwig-van-beethoven"* ]]; then
		echo "✅ Data found in JSON response."
	else
		echo "❌ Data missing from API listing."
		echo "Response: $api_check"
		exit 1
	fi

	# 5. ACCESS CONTROL (Guest access test)
	echo -n "🧪 Testing Unauthorized access (No Token)... "
	local guest_status
	guest_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:8080/api/composers")
	if [[ "$guest_status" -eq 401 ]]; then
		echo "✅ Access denied as expected."
	else
		echo "❌ Security Flaw: Composers list accessible without token ($guest_status)"
		exit 1
	fi

	# --------------------------------------------------------------------------------
	# 2. LIST
	# --------------------------------------------------------------------------------
	echo "--- LIST ---"

	list_composers_get "$TOKEN_USER1" "Beethoven"
	list_composers_post "$TOKEN_USER1" "Mozart"

	# --------------------------------------------------------------------------------
	# 3. GET BY ID
	# --------------------------------------------------------------------------------
	echo "--- GET BY ID ---"

	get_composer "$TOKEN_USER1" 1

	echo -n "🧪 Get invalid ID... "
	status=$(curl -s -o /dev/null -w "%{http_code}" \
		-H "Authorization: Bearer $TOKEN_USER1" \
		http://localhost:8080/api/composer/9999)

	if [[ "$status" -eq 404 ]]; then
		echo "✅ OK"
	else
		echo "❌ FAIL"
		exit 1
	fi

	# --------------------------------------------------------------------------------
	# 4. UPDATE
	# --------------------------------------------------------------------------------
	echo "--- UPDATE ---"

	update_composer "$TOKEN_ADMIN" 1 "Beethoven Updated" "$SRC_DIR/Beethoven.png"

	# Unauthorized update
	echo -n "🧪 Unauthorized update... "
	status=$(curl -s -o /dev/null -w "%{http_code}" \
		-X PUT http://localhost:8080/api/composer/1 \
		-H "Authorization: Bearer $TOKEN_USER1" \
		-F "name=Hack")

	if [[ "$status" -eq 403 ]]; then
		echo "✅ OK"
	else
		echo "❌ FAIL"
		exit 1
	fi

	# --------------------------------------------------------------------------------
	# 4B. UPDATE IsVerified
	# --------------------------------------------------------------------------------
	echo "--- UPDATE IsVerified ---"

	# 1. Set TRUE
	update_composer_verified "$TOKEN_ADMIN" 1 "true"

	echo -n "🔍 Verify isVerified=true... "
	result=$(curl -s -H "Authorization: Bearer $TOKEN_USER1" \
		http://localhost:8080/api/composer/1)

	if [[ "$result" == *'"is_verified":true'* ]]; then
		echo "✅ OK"
	else
		echo "❌ FAIL (expected true)"
		echo "$result"
		exit 1
	fi

	# 2. Set FALSE
	update_composer_verified "$TOKEN_ADMIN" 1 "false"

	echo -n "🔍 Verify isVerified=false... "
	result=$(curl -s -H "Authorization: Bearer $TOKEN_USER1" \
		http://localhost:8080/api/composer/1)

	if [[ "$result" == *'"is_verified":false'* ]]; then
		echo "✅ OK"
	else
		echo "❌ FAIL (expected false)"
		echo "$result"
		exit 1
	fi

	# 3. NO VALUE (should NOT change)
	echo -n "🧪 Update WITHOUT isVerified (no change expected)... "

	# First set TRUE
	update_composer_verified "$TOKEN_ADMIN" 1 "true"

	# Then update name only
	curl -s -o /dev/null -w "%{http_code}" \
		-X PUT http://localhost:8080/api/composer/1 \
		-H "Authorization: Bearer $TOKEN_ADMIN" \
		-F "name=Beethoven No Change"

	# Check still TRUE
	result=$(curl -s -H "Authorization: Bearer $TOKEN_USER1" \
		http://localhost:8080/api/composer/1)

	if [[ "$result" == *'"is_verified":true'* ]]; then
		echo "✅ OK (unchanged)"
	else
		echo "❌ FAIL (value changed unexpectedly)"
		echo "$result"
		exit 1
	fi

	# --------------------------------------------------------------------------------
	# 5. DELETE
	# --------------------------------------------------------------------------------
	echo "--- DELETE ---"

	delete_composer "$TOKEN_ADMIN" 2

	echo -n "🧪 Delete already deleted... "
	status=$(curl -s -o /dev/null -w "%{http_code}" \
		-X DELETE http://localhost:8080/api/composer/2 \
		-H "Authorization: Bearer $TOKEN_ADMIN")

	if [[ "$status" -eq 404 ]]; then
		echo "✅ OK"
	else
		echo "❌ FAIL"
		exit 1
	fi

	# Unauthorized delete
	echo -n "🧪 Unauthorized delete... "
	status=$(curl -s -o /dev/null -w "%{http_code}" \
		-X DELETE http://localhost:8080/api/composer/1 \
		-H "Authorization: Bearer $TOKEN_USER1")

	if [[ "$status" -eq 403 ]]; then
		echo "✅ OK"
	else
		echo "❌ FAIL"
		exit 1
	fi

	# --------------------------------------------------------------------------------
	# 6. SECURITY
	# --------------------------------------------------------------------------------
	echo "--- SECURITY ---"

	echo -n "🧪 No token access... "
	status=$(curl -s -o /dev/null -w "%{http_code}" \
		http://localhost:8080/api/composers)

	if [[ "$status" -eq 401 ]]; then
		echo "✅ OK"
	else
		echo "❌ FAIL"
		exit 1
	fi

	echo -e "\n✨ ALL COMPOSER TESTS PASSED"
}
