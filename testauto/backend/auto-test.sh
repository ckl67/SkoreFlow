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

bash auto-test.sh --kill	: Kill The process to be sure that there is no Background process - Useful to run the server manually or for Air
bash auto-test.sh --clean	: Clean the Database and Storage before running tests (Use with --scores or --composers to have a full clean)

bash auto-test.sh --all		: Run everything (Smoke, Users, Scores, Composers) without including SMTP/Google password reset tests

Otherwise Can be combined with:
bash auto-test.sh --users	: Run Smoke tests + User tests
bash auto-test.sh --scores	: Run Smoke tests + Score tests
bash auto-test.sh --composers	: Run Smoke tests + Composer tests
bash auto-test.sh --pwreset	: Include SMTP/Google password reset tests

bash auto-test.sh --help	: Help

"

# --- GLOBAL VARIABLES ---
export TEST_PASSWORD_RESET=false

export RUN_USERS=false
export RUN_SCORES=false
export RUN_COMPOSERS=false

export KILL_PROCESS=false

export CLEAN_DB_FILES=false

export ROLE_USER=0
export ROLE_MODERATOR=1
export ROLE_ADMINISTRATOR=2

# --- ARGUMENT PARSING ---
for arg in "$@"; do
	case $arg in
	--pwreset) export TEST_PASSWORD_RESET=true ;;
	--clean) export CLEAN_DB_FILES=true ;;
	--users) export RUN_USERS=true ;;
	--scores) export RUN_SCORES=true ;;
	--composers) export RUN_COMPOSERS=true ;;
	--kill) export KILL_PROCESS=true ;;
	--all)
		export RUN_USERS=true
		export RUN_COMPOSERS=true
		export RUN_SCORES=true
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
sleep 2

if [ "$KILL_PROCESS" = true ]; then
	exit 1
fi

SCRIPT_DIR=$(pwd)
BACKEND_DIR="../../backend"

if [ "$CLEAN_DB_FILES" = true ]; then

	echo "Physical cleanup of Database and Storage"

	# Physical cleanup of Database and Storage
	rm -f "$BACKEND_DIR/storage/database.db"
	rm -rf "$BACKEND_DIR/storage/users/"*
	rm -rf "$BACKEND_DIR/storage/scores/uploaded-scores/"*
	rm -rf "$BACKEND_DIR/storage/scores/thumbnails/"*
	rm -rf "$BACKEND_DIR/storage/composers/"*

	# Ensure directory structure exists
	mkdir -p "$BACKEND_DIR/storage/users"
	mkdir -p "$BACKEND_DIR/storage/scores/uploaded-scores"
	mkdir -p "$BACKEND_DIR/storage/scores/thumbnails"
	mkdir -p "$BACKEND_DIR/storage/composers"

	# Restore default assets for composers (portraits)
	if [ -d "$BACKEND_DIR/storage/assets" ]; then
		cp -r "$BACKEND_DIR/storage/assets/avatars/admin.png" "$BACKEND_DIR/storage/users"
		cp -r "$BACKEND_DIR/storage/assets/avatars/default.png" "$BACKEND_DIR/storage/users"
		cp -r "$BACKEND_DIR/storage/assets/avatars/composer.png" "$BACKEND_DIR/storage/composers/default.png"
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
echo "Running basic tests (Node.js TypeScript)..."
npx tsx tests/basic.test.ts || exit 1 # Exit immediately if basic tests fail, as they indicate fundamental issues with the server setup

# 2. User Management (MANDATORY: Generates tokens for other tests)
if [ "$RUN_USERS" = true ]; then
	echo "Running user tests (Node.js TypeScript)..."
	npx tsx tests/user.test.ts || exit 1 # Exit immediately if user tests fail, since they are critical for subsequent tests
else
	echo "⏩ Skipping User tests (use --users or --all to include)"
fi

# 3. Conditional: Score Management
if [ "$RUN_SCORES" = true ]; then
	npx tsx tests/score.test.js || exit 1
else
	echo "⏩ Skipping Score tests (use --scores or --all to include)"
fi

# 4. Conditional: Composer Management
if [ "$RUN_COMPOSERS" = true ]; then
	npx tsx tests/composer.test.js || exit 1
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
if [ "$CLEAN_DB_FILES" = true ]; then
	echo "  ---> We have now a NEW Database and Storage Files !!"
else
	echo "  ---> We Keep the FORMER Database and Storage Files !!"
	# Wait for background server process
	wait $BACKEND_PID
fi
echo "########################################################"

