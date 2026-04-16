#!/bin/bash

# ---------------------------------------------------------------------------------------------------------------
# EXECUTION GUIDE
# ---------------------------------------------------------------------------------------------------------------
#  bash auto-test.sh --help 	 : Help
# ---------------------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------------------
# TECHNICAL REMINDERS
# ---------------------------------------------------------------------------------------------------------------
# 1. Use 'bash': Standard 'sh' might fail with long JWT strings in comparison tests.
# 2. Ctrl+C (SIGINT): Sends the signal to the entire Process Group. Both this script and the
#    background 'go run' process will receive the signal and terminate.
# 3. HTTP Codes:
#    - 200 (OK): Request succeeded.
#    - 201 (Created): New resource successfully created (standard for POST).
#    - 202 (Accepted): Valid request, but background processing (like thumbnails) is still running.
# 4. Quoting: Always use echo "$variable" to preserve newlines and indentation in JSON responses.
# ---------------------------------------------------------------------------------------------------------------

# --------- HELP ---------

HelpTXT="
bash auto-test.sh		: Standard Run - We Keep the FORMER Database and Storage - No cleaning just smoke tests - Afterwards Server is Running

bash auto-test.sh --kill	: Kill The process to be sure that there is no Background process - Usefull to run the server manually or for Air
bash auto-test.sh --all		: Run everything (Smoke, Users, Sheets, Composers) without including SMTP/Google password reset tests
bash auto-test.sh --sheets	: Run Smoke tests + User tests + Sheet tests
bash auto-test.sh --composers	: Run Smoke tests + User tests + Composer tests
bash auto-test.sh --pwreset	: Include SMTP/Google password reset tests
bash auto-test.sh --help	: Help

"

# --- GLOBAL VARIABLES ---
export TEST_PASSWORD_RESET=false
export RUN_SHEETS=false
export RUN_COMPOSERS=false
export KILL_PROCESS=false

export ROLE_USER=0
export ROLE_MODERATOR=1
export ROLE_ADMINISTRATOR=2

# Tokens will be populated by run_user_tests
export TOKEN_USER1
export TOKEN_USER2
export TOKEN_CKL

# --- ARGUMENT PARSING ---
for arg in "$@"; do
	case $arg in
	--pwreset) export TEST_PASSWORD_RESET=true ;;
	--sheets) export RUN_SHEETS=true ;;
	--composers) export RUN_COMPOSERS=true ;;
	--kill) export KILL_PROCESS=true ;;
	--all)
		export RUN_SHEETS=true
		export RUN_COMPOSERS=true
		export TEST_PASSWORD_RESET=false
		;;
	--help)
		echo "$HelpTXT"
		exit 1
		;;
	*)
		echo "❌ Unknown option: $arg"
		echo "$HelpTXT"
		exit 1
		;;
	esac
done

# ---------------------------------------------------------------------------------------------------------------
# ENVIRONMENT SETUP
# ---------------------------------------------------------------------------------------------------------------

echo "Cleaning environment..."

# Kill any lingering processes on backend ports (Go: 8080, Flask Microservice: 5010)
if fuser 8080/tcp >/dev/null 2>&1; then
	fuser -k 8080/tcp
fi

if fuser 5010/tcp >/dev/null 2>&1; then
	fuser -k 5010/tcp
fi

# Wait for OS to release file handles
sleep 1

if [ "$KILL_PROCESS" = true ]; then
	exit 1
fi

SCRIPT_DIR=$(pwd)
BACKEND_DIR="../../backend"

if [ "$RUN_SHEETS" = true ] || [ "$RUN_COMPOSERS" = true ]; then

	echo "Physical cleanup of Database and Storage"

	# Physical cleanup of Database and Storage
	rm -f "$BACKEND_DIR/storage/database.db"
	rm -rf "$BACKEND_DIR/storage/users/"*
	rm -rf "$BACKEND_DIR/storage/sheets/uploaded-sheets/"*
	rm -rf "$BACKEND_DIR/storage/sheets/thumbnails/"*
	rm -rf "$BACKEND_DIR/storage/composers/"*

	# Ensure directory structure exists
	mkdir -p "$BACKEND_DIR/storage/users"
	mkdir -p "$BACKEND_DIR/storage/sheets/uploaded-sheets"
	mkdir -p "$BACKEND_DIR/storage/sheets/thumbnails"
	mkdir -p "$BACKEND_DIR/storage/composers"

	# Restore default assets for composers (portraits)
	if [ -d "$BACKEND_DIR/storage/assets" ]; then
		cp -r "$BACKEND_DIR/storage/assets/avatars/admin.png" "$BACKEND_DIR/storage/users"
	fi
else
	echo "-->> NO Physical cleanup of Database and Storage"
fi

# ---------------------------------------------------------------------------------------------------------------
# SERVER LAUNCH
# ---------------------------------------------------------------------------------------------------------------

echo "Starting Backend Server..."

# Switch to backend directory to handle relative paths in Go (microservices, etc.)
# Main MUST BE RUN FROM THE ROOT PROJECT !!!
cd "$BACKEND_DIR" || exit
echo "Must be RUN FROM THE Project Root Directory !!! (Check it below !!!)"
pwd
go run ./cmd/server/main.go &
BACKEND_PID=$!
echo " "
echo " "

# Health check loop
echo "Waiting for server to be ready..."
until curl -s http://localhost:8080/health >/dev/null; do
	sleep 1.0
	echo -n "."
done
echo -e "\n✅ Server is UP and running!"

# Return to script directory for relative file paths in tests
cd "$SCRIPT_DIR" || exit

# ---------------------------------------------------------------------------------------------------------------
# MODULE EXECUTION
# ---------------------------------------------------------------------------------------------------------------

# 1. Basic Health and Sanity tests
echo "Running basic tests (Node.js)..."
node tests/basic.test.js

# 2. User Management (MANDATORY: Generates tokens for other tests)
if [ "$RUN_SHEETS" = true ] || [ "$RUN_COMPOSERS" = true ]; then
	echo "Running user tests (Node.js)..."
	node tests/user.test.js
else
	echo "⏩ Skipping User tests (use --sheets or --composer or --all to include)"
fi

# 3. Conditional: Sheet Management
if [ "$RUN_SHEETS" = true ]; then
	node tests/sheet.test.js
else
	echo "⏩ Skipping Sheet tests (use --sheets or --all to include)"
fi

# 4. Conditional: Composer Management
if [ "$RUN_COMPOSERS" = true ]; then
	node tests/composer.test.js
else
	echo "⏩ Skipping Composer tests (use --composers or --all to include)"
fi

# ---------------------------------------------------------------------------------------------------------------
# EXIT & CLEANUP
# ---------------------------------------------------------------------------------------------------------------

echo " "
echo "########################################################"
echo "  TEST SUITE FINISHED"
echo "  Backend PID: $BACKEND_PID"
echo "  Environment is ready for manual testing."
echo "  Press Ctrl+C to stop the server."
if [ "$RUN_SHEETS" = true ] || [ "$RUN_COMPOSERS" = true ]; then
	echo "  ---> We have now a NEW Database and Storage Files !!"
else
	echo "  ---> We Keep the FORMER Database and Storage Files !!"
fi
echo "########################################################"

# Wait for background server process
wait $BACKEND_PID
