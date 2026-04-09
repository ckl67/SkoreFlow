#!/bin/bash

# ===============================================================================================================
# HELPERS SECTION
# ===============================================================================================================

# -------------------------------------------------------------------
# CURL FORM-DATA WARNING
# -------------------------------------------------------------------
# In curl -F (form-data), the semicolon (;) is a reserved character used to specify
# additional options (like type=image/png).
# Example: curl -F "tags=Pop;Rock" will NOT send "Pop;Rock".
# It sends "Pop" and treats ";Rock" as an invalid option for the "tags" field.
# Use commas or URL encoding if you need to pass multiple values within a single field.

# -------------------------------------------------------------------
# UPLOAD HELPER
# -------------------------------------------------------------------
# Uploads a sheet using multipart/form-data.
# -F (or --form) is mandatory for file uploads as it sets 'enctype="multipart/form-data"'.
# The '@' prefix tells curl to read the content of the file at the specified path.
upload_sheet() {
	local name=$1
	local composer=$2
	local file_path=$3
	local token=$4

	local cmd="curl -s -w '\n%{http_code}' -X POST http://localhost:8080/api/sheet/upload \
        -H 'Authorization: Bearer $token' \
        -F 'sheetName=$name' \
        -F 'composer=$composer' \
        -F 'releaseDate=1965-12-12T00:00:00Z' \
        -F 'categories=Classical,Romantic' \
        -F 'tags=Piano,Doux' \
        -F 'informationText=Automated test file for $composer ' \
        -F 'uploadFile=@$file_path'"

	#echo "DEBUG CMD: $cmd"
	validate_api "Upload: $name ($composer)" 202 "$cmd"
}

# -------------------------------------------------------------------
# PHYSICAL STORAGE CHECK
# Verifies if PDF and Thumbnail exist in the expected backend paths.
# -------------------------------------------------------------------
check_files_on_disk() {
	local user_folder=$1 # e.g., "user-1"
	local comp_safe=$2   # e.g., "ludwig-van-beethoven"
	local sheet_safe=$3  # e.g., "moonlight-sonata"

	local max_attempts=5
	local attempt=1

	local pdf_path="$BACKEND_DIR/infrastructure/storage/sheets/uploaded-sheets/$user_folder/$comp_safe/$sheet_safe.pdf"
	local thumb_path="$BACKEND_DIR/infrastructure/storage/sheets/thumbnails/$user_folder/$comp_safe/$sheet_safe.png"

	echo -n "🔍 Checking storage ($sheet_safe)... "

	while [ "$attempt" -le "$max_attempts" ]; do
		if [[ -f "$pdf_path" && -f "$thumb_path" ]]; then
			echo -e "✅ Files Found (Attempt $attempt)"
			return 0
		fi
		sleep 1
		((attempt++))
	done

	echo -e "\n❌ CRITICAL ERROR: Files not found after ${max_attempts}s"
	echo "   Expected PDF: $pdf_path"
	echo "   Expected PNG: $thumb_path"
	return 1
}

# -------------------------------------------------------------------
# UPDATE HELPER (via ID)
# -------------------------------------------------------------------
update_sheet() {
	local OPTIND=1
	local token="" id="" file="" title="" date="" tags="" cats="" info=""

	while getopts "t:i:f:s:d:g:c:x:" opt; do
		case $opt in
		t) token=$OPTARG ;;
		i) id=$OPTARG ;;
		f) file=$OPTARG ;;
		s) title=$OPTARG ;;
		d) date=$OPTARG ;;
		g) tags=$OPTARG ;;
		c) cats=$OPTARG ;;
		x) info=$OPTARG ;;
		*)
			echo "Invalid option"
			return 1
			;;
		esac
	done

	local cmd="curl -s -w '\n%{http_code}' -X PUT http://localhost:8080/api/sheet/$id \
        -H 'Authorization: Bearer $token'"

	[[ -n "$file" ]] && cmd="$cmd -F 'uploadFile=@$file'"
	[[ -n "$title" ]] && cmd="$cmd -F 'sheetName=$title'"
	[[ -n "$date" ]] && cmd="$cmd -F 'releaseDate=$date'"
	[[ -n "$tags" ]] && cmd="$cmd -F 'tags=$tags'"
	[[ -n "$cats" ]] && cmd="$cmd -F 'categories=$cats'"
	[[ -n "$info" ]] && cmd="$cmd -F 'informationText=$info'"

	validate_api "Update Sheet ID: $id" 200 "$cmd"
}

# -------------------------------------------------------------------
# DETAILS HELPER (GET by ID)
# -------------------------------------------------------------------
get_sheet_details() {
	local token=$1
	local id=$2

	local cmd="curl -s -w '\n%{http_code}' -X GET http://localhost:8080/api/sheet/$id \
        -H 'Authorization: Bearer $token'"

	validate_api "Get Details ID: $id" 200 "$cmd"
}

# -------------------------------------------------------------------
# DELETE HELPER
# -------------------------------------------------------------------
delete_sheet() {
	local token=$1
	local id=$2

	local cmd="curl -s -w '\n%{http_code}' -X DELETE http://localhost:8080/api/sheet/$id \
        -H 'Authorization: Bearer $token'"

	validate_api "Delete Sheet ID: $id" 200 "$cmd"
}

# -------------------------------------------------------------------
# LIST HELPER (GET Method)
# -------------------------------------------------------------------
list_sheets_get() {
	local token="" page=1 limit=10 sort="" composer="" tag="" category="" search=""
	local OPTIND
	while getopts "t:p:l:o:c:g:y:q:" opt; do
		case $opt in
		t) token=$OPTARG ;;
		p) page=$OPTARG ;;
		l) limit=$OPTARG ;;
		o) sort=$OPTARG ;;
		c) composer=$OPTARG ;;
		g) tag=$OPTARG ;;
		y) category=$OPTARG ;;
		q) search=$OPTARG ;;
		*)
			echo "Invalid option"
			return 1
			;;
		esac
	done

	local url="http://localhost:8080/api/sheets?page=$page&limit=$limit"

	# Dynamic filter addition with basic space encoding
	[[ -n "$sort" ]] && url="${url}&sort=${sort// /%20}"
	[[ -n "$composer" ]] && url="${url}&composer=${composer// /%20}"
	[[ -n "$tag" ]] && url="${url}&tag=${tag// /%20}"
	[[ -n "$category" ]] && url="${url}&category=${category// /%20}"
	[[ -n "$search" ]] && url="${url}&search=${search// /%20}"

	local cmd="curl -s -w '\n%{http_code}' -X GET '$url' \
        -H 'Authorization: Bearer $token'"

	validate_api "List GET [Search: $search | Sort: $sort]" 200 "$cmd"
}

# -------------------------------------------------------------------
# LIST HELPER (POST Method)
# -------------------------------------------------------------------
list_sheets_post() {
	local token="" page=1 limit=10 sort="" composer="" tag="" category="" search=""
	local OPTIND
	while getopts "t:p:l:o:c:g:y:q:" opt; do
		case $opt in
		t) token=$OPTARG ;;
		p) page=$OPTARG ;;
		l) limit=$OPTARG ;;
		o) sort=$OPTARG ;;
		c) composer=$OPTARG ;;
		g) tag=$OPTARG ;;
		y) category=$OPTARG ;;
		q) search=$OPTARG ;;
		*)
			echo "Invalid option"
			return 1
			;;
		esac
	done

	# Generate JSON body using jq to ensure correct typing and escaping
	local json_body
	json_body=$(jq -n \
		--arg p "$page" --arg l "$limit" --arg o "$sort" \
		--arg c "$composer" --arg g "$tag" --arg y "$category" --arg q "$search" \
		'{
            page: ($p|tonumber),
            limit: ($l|tonumber),
            sort: $o,
            composer: $c,
            tag: $g,
            category: $y,
            search: $q
        } | with_entries(select(.value != "" and .value != 0))')

	local cmd="curl -s -w '\n%{http_code}' -X POST http://localhost:8080/api/sheets/search \
        -H 'Authorization: Bearer $token' \
        -H 'Content-Type: application/json' \
        -d '$json_body'"

	validate_api "List POST [Search: $search | Sort: $sort]" 200 "$cmd"
}

# ===============================================================================================================
# MAIN TEST SUITE
# ===============================================================================================================

run_sheet_tests() {
	TEST_ASSETS_DIR="sheets"

	echo -e "\n--- [MODULE: SHEETS] ---"

	# --- 1. LOGIN & PREPARATION ---
	TOKEN_USER1=$(login_user "user1@test.com" "password123")
	if [ "$TOKEN_USER1" = "ERROR" ]; then
		echo "❌ Login User1 failed"
		exit 1
	fi

	echo "--- Uploading User 1 Scores ---"
	COMP="Ludwig Van Beethoven"
	COMP_SAFE="ludwig-van-beethoven"
	# TEST_ASSETS_DIR="sheets"
	DIR="$TEST_ASSETS_DIR/$COMP"
	REF_USER="user-2"

	upload_sheet "Sonate au Clair de Lune" "$COMP" "$DIR/Sonate No. 14 - Clair de lune.pdf" "$TOKEN_USER1"
	check_files_on_disk "$REF_USER" "$COMP_SAFE" "sonate-au-clair-de-lune" || exit 1

	upload_sheet "La Lettre à Elise" "$COMP" "$DIR/La Lettre à Elise.pdf" "$TOKEN_USER1"
	check_files_on_disk "$REF_USER" "$COMP_SAFE" "la-lettre-a-elise" || exit 1

	upload_sheet "Adagio Pathétique" "$COMP" "$DIR/Adagio Pathétique.pdf" "$TOKEN_USER1"
	check_files_on_disk "$REF_USER" "$COMP_SAFE" "adagio-pathetique" || exit 1

	# Mozart & Chopin for User 1
	upload_sheet "La Marche Turque" "Amadeus Mozart" "$TEST_ASSETS_DIR/Amadeus Mozart/La Marche Turque.pdf" "$TOKEN_USER1"
	upload_sheet "Valse favorite" "Amadeus Mozart" "$TEST_ASSETS_DIR/Amadeus Mozart/Valse favorite.pdf" "$TOKEN_USER1"
	upload_sheet "Nocturne Opus 9 N2" "Frédéric Chopin" "$TEST_ASSETS_DIR/Frédéric Chopin/Nocturne Opus 9 N°2.pdf" "$TOKEN_USER1"

	# --- 2. UPLOADS FOR USER 2 ---
	TOKEN_USER2=$(login_user "user2.updated@test.com" "password123")
	if [ "$TOKEN_USER2" = "ERROR" ]; then
		echo "❌ Login User2 failed"
		exit 1
	fi

	echo "--- Uploading User 2 Scores ---"
	upload_sheet "Balade Pour Adeline" "Paul de Senneville" "$TEST_ASSETS_DIR/Paul de Senneville/Balade Pour Adeline.pdf" "$TOKEN_USER2"
	upload_sheet "Logical Song" "Supertramp" "$TEST_ASSETS_DIR/Supertramp/Logical Song.pdf" "$TOKEN_USER2"
	upload_sheet "School" "Supertramp" "$TEST_ASSETS_DIR/Supertramp/School.pdf" "$TOKEN_USER2"
	upload_sheet "Sonate au Clair de Lune" "Ludwig Van Beethoven" "$TEST_ASSETS_DIR/Ludwig Van Beethoven/Sonate No. 14 - Clair de lune.pdf" "$TOKEN_USER2"
	upload_sheet "Nocturne Opus 9 N2" "Frédéric Chopin" "$TEST_ASSETS_DIR/Frédéric Chopin/Nocturne Opus 9 N°2.pdf" "$TOKEN_USER2"

	# Temporary files for deletion test
	upload_sheet "Logical Song" "SupertrampToDelete" "$TEST_ASSETS_DIR/Supertramp/Logical Song.pdf" "$TOKEN_USER2"
	upload_sheet "School" "SupertrampToDelete" "$TEST_ASSETS_DIR/Supertramp/School.pdf" "$TOKEN_USER2"

	# --- 3. GET METHOD FILTERS & SORTING ---
	echo -e "\n--- [SECTION: GET] Testing Retrieval Logic ---"
	list_sheets_get -t "$TOKEN_USER1" -p 1 -l 5
	list_sheets_get -t "$TOKEN_USER1" -o "sheet_name asc"
	list_sheets_get -t "$TOKEN_USER1" -o "created_at desc"
	list_sheets_get -t "$TOKEN_USER1" -c "Mozart" -o "sheet_name asc"
	list_sheets_get -t "$TOKEN_USER1" -o "release_date asc"
	list_sheets_get -t "$TOKEN_USER1" -g "Piano"
	list_sheets_get -t "$TOKEN_USER1" -y "Classical"
	list_sheets_get -t "$TOKEN_USER1" -q "Nocturne"

	# --- 4. POST METHOD FILTERS & SORTING ---
	echo -e "\n--- [SECTION: POST] Testing Search Logic ---"
	list_sheets_post -t "$TOKEN_USER1" -o "sheet_name asc"
	list_sheets_post -t "$TOKEN_USER1" -o "composer asc"
	list_sheets_post -t "$TOKEN_USER1" -o "created_at desc"
	list_sheets_post -t "$TOKEN_USER1" -o "release_date desc"
	list_sheets_post -t "$TOKEN_USER1" -c "Ludwig Van Beethoven" -o "sheet_name asc"
	list_sheets_post -t "$TOKEN_USER1" -c "Frédéric Chopin" -g "Piano" -o "sheet_name asc"
	list_sheets_post -t "$TOKEN_USER1" -y "Romantic" -o "created_at desc"
	list_sheets_post -t "$TOKEN_USER1" -y "Classical" -g "Doux" -q "Sonate" -o "release_date asc"

	echo -e "\n--- [VERIFICATION] GET vs POST Consistency ---"
	list_sheets_get -t "$TOKEN_USER1" -c "Mozart" -o "sheet_name asc"
	list_sheets_post -t "$TOKEN_USER1" -c "Mozart" -o "sheet_name asc"

	# --- 5. INDIVIDUAL SHEET RETRIEVAL (ID) ---
	echo -e "\n--- [SECTION: GET BY ID] Testing Robustness ---"
	SAMPLE_ID=$(curl -s -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?limit=1" | jq -r '.rows[0].id')

	if [ "$SAMPLE_ID" != "null" ] && [ -n "$SAMPLE_ID" ]; then
		get_sheet_details "$TOKEN_USER1" "$SAMPLE_ID"
	else
		echo "❌ Critical Error: No sheets found to test GetByID"
		exit 1
	fi

	# Error handling tests
	validate_api "Invalid ID format (abc)" 400 "curl -s -w '\n%{http_code}' -X GET http://localhost:8080/api/sheet/abc -H 'Authorization: Bearer $TOKEN_USER1'"
	validate_api "Non-existent ID (9999)" 404 "curl -s -w '\n%{http_code}' -X GET http://localhost:8080/api/sheet/999999 -H 'Authorization: Bearer $TOKEN_USER1'"

	# --- 6. UPDATE SCENARIOS ---
	# We have to find the first Logical Song sheet. So we have to select the first one
	# Meaning we have to sort by id ascendant
	echo -e "\n--- [SECTION: UPDATE] Metadata & File Refresh ---"
	LOGICAL_ID=$(curl -s -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/sheets?search=Logical&composer=Supertramp&sort=id%20asc" | jq -r '.rows[0].id')

	echo "Scenario 1: PDF Replacement"
	update_sheet -t "$TOKEN_USER2" -i "$LOGICAL_ID" -f "$TEST_ASSETS_DIR/Supertramp/Logical Song New.pdf"

	echo "Scenario 2: Metadata Update (Title, Tags, Cats)"
	update_sheet -t "$TOKEN_USER2" -i "$LOGICAL_ID" -s "The Logical Song (Remastered)" -g "Pop,Rock,80s" -c "Rock,Legend" -x "Saxophone annotations included."

	# Verify physical file update
	FILE_PATH_DB=$(curl -s -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/sheet/$LOGICAL_ID" | jq -r '.file_path')
	echo "DEBUG - $FILE_PATH_DB"

	FULL_PATH="$BACKEND_DIR/infrastructure/storage/$FILE_PATH_DB"
	LAST_MOD=$(stat -c %Y "$FULL_PATH")
	NOW=$(date +%s)
	AGE=$((NOW - LAST_MOD))
	if [ "$AGE" -lt 120 ]; then echo "✅ File refresh verified ($AGE seconds old)"; else
		echo "❌ File too old ($AGE s)"
		exit 1
	fi

	# --- 7. DELETION & DISK CLEANUP ---
	echo -e "\n--- [SECTION: DELETE] Cleanup & Storage Integrity ---"
	COMP_DEL="supertramptodelete"
	ID_USER_DEL="user-3"
	TARGET_DIR="$BACKEND_DIR/infrastructure/storage/sheets/uploaded-sheets/$ID_USER_DEL/$COMP_DEL"

	ID_SCHOOL=$(curl -s -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/sheets?composer=$COMP_DEL&search=school" | jq -r '.rows[0].id')
	ID_LOGICAL=$(curl -s -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/sheets?composer=$COMP_DEL&search=logical-song" | jq -r '.rows[0].id')

	echo "Deleting first sheet (Folder should remain)..."
	delete_sheet "$TOKEN_USER2" "$ID_SCHOOL"
	[ -d "$TARGET_DIR" ] || {
		echo "❌ Directory deleted too early"
		exit 1
	}

	echo "Deleting second sheet (Folder should be removed)..."
	delete_sheet "$TOKEN_USER2" "$ID_LOGICAL"
	if [ ! -d "$TARGET_DIR" ]; then
		echo "✅ Artist folder cleaned up"
	else
		echo "❌ Zombie folder remains"
		exit 1
	fi

	# --- 8. ANNOTATIONS (PATCH) ---
	echo -e "\n--- [SECTION: ANNOTATIONS] Testing JSON Persistence ---"
	ID_ANN=$(curl -s -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/sheets?search=school" | jq -r '.rows[0].id')
	ANN_JSON='{"annotations": "[{\"type\":\"circle\",\"x\":150,\"y\":200,\"radius\":20,\"color\":\"red\"},{\"type\":\"text\",\"content\":\"3\",\"x\":155,\"y\":195,\"color\":\"blue\"}]"}'

	# Perform PATCH and capture result
	RESPONSE_RAW=$(curl -s -w "HTTP_CODE:%{http_code}" -X PATCH "http://localhost:8080/api/sheet/$ID_ANN/annotations" \
		-H "Authorization: Bearer $TOKEN_USER2" \
		-H "Content-Type: application/json" \
		-d "$ANN_JSON")

	HTTP_STATUS=$(echo "$RESPONSE_RAW" | grep -oE "HTTP_CODE:[0-9]{3}" | cut -d':' -f2)
	if [ "$HTTP_STATUS" -eq 200 ]; then
		echo "✅ PATCH Annotations Success (200)"
	else
		echo "❌ PATCH failed: $HTTP_STATUS"
		exit 1
	fi

	# Verify persistence
	VERIF_ANN=$(curl -s -H "Authorization: Bearer $TOKEN_USER2" "http://localhost:8080/api/sheet/$ID_ANN" | jq -r '.annotations')
	if [[ "$VERIF_ANN" == *"circle"* && "$VERIF_ANN" == *"3"* ]]; then
		echo "✅ Data persistence verified in database."
	else
		echo "❌ Persistence mismatch!"
		exit 1
	fi
}
