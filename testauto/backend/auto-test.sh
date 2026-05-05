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

# ---------------------------------------------------------------------------------------------------------------
# OPEN QUESTIONS
# ---------------------------------------------------------------------------------------------------------------
# Should write the orchestration in javascript or Go to have better control over processes, signals, and parallelism?
# Answer is no ! =>
#		Shell scripting is sufficient for our needs and keeps the setup simple without adding extra dependencies or complexity.
# 	We can manage processes, signals, and parallelism effectively with bash, especially since our testing workflow is mostly sequential
#		and doesn't require complex orchestration features that a full programming language might offer.
#
#		bash = orchestration system
# 	Vitest = tests
# 	npm = overview

# --------- HELP ---------

HelpTXT="
Usage:
 bash
  ./auto-test.sh                Run smoke tests only - We Keep the FORMER Database and Storage
  ./auto-test.sh --all          Run all tests (Smoke, Users, Composers, Scores)
  ./auto-test.sh --users        Include user tests
  ./auto-test.sh --scores       Include score tests
  ./auto-test.sh --composers    Include composer tests

 Options
  --kill                        Kill The process to be sure that there is no Background process
  --clean                       Clean DB and Storage files before running
  --pwreset                     Include SMTP/Google password reset tests
  --nbg                         Stop server after script

  --help                        Help

"

# --- BACKEND ENVIRONNEMENT VARIABLES ---

export APP_ENV=test
export SMTP_ENABLED=false

# --- SHELL GLOBAL VARIABLES ---

export RUN_USERS=false
export RUN_SCORES=false
export RUN_COMPOSERS=false

export KILL_PROCESS=false

export CLEAN_DB_FILES=false
export FORCE_BACKGROUND=true

export ROLE_USER=0
export ROLE_MODERATOR=1
export ROLE_ADMINISTRATOR=2

# --- ARGUMENT PARSING ---
for arg in "$@"; do
	case $arg in
	--pwreset) export SMTP_ENABLED=true ;;
	--clean) export CLEAN_DB_FILES=true ;;
	--users) export RUN_USERS=true ;;
	--scores) export RUN_SCORES=true ;;
	--composers) export RUN_COMPOSERS=true ;;
	--nbg) export FORCE_BACKGROUND=false ;;
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
# Externalize  the running "npx tsx" or vitest
# ---------------------------------------------------------------------------------------------------------------

# 1. Basic Health and Sanity tests
echo "Running smoke tests..."
# npx tsx tests/basic.test.ts || exit 1
npm run test:smoke || exit 1

# 2. User Management (MANDATORY: Generates tokens for other tests)
if [ "$RUN_USERS" = true ]; then
	echo "Running user tests..."
	# npx tsx tests/user.test.ts || exit 1
	npm run test:users || exit 1
else
	echo "⏩ Skipping User tests"
fi

# 3. Conditional: Composer Management
if [ "$RUN_COMPOSERS" = true ]; then
	echo "Running composer tests..."
	# npx tsx tests/composers.tst.ts
	npm run test:composers || exit 1
else
	echo "⏩ Skipping Composer tests"
fi

# 4. Conditional: Score Management
if [ "$RUN_SCORES" = true ]; then
	echo "Running score tests..."
	# npx tsx tests/score.test.js || exit 1
	npm run test:scores || exit 1

else
	echo "⏩ Skipping Score tests"
fi

# ---------------------------------------------------------------------------------------------------------------
# EXIT & CLEANUP
# ---------------------------------------------------------------------------------------------------------------

echo " "
echo "########################################################"
echo "  TEST SUITE FINISHED"
echo "########################################################"

if [ "$CLEAN_DB_FILES" = true ]; then
	echo "  ---> We have now a NEW Database and Storage Files !!"
else
	echo "  ---> We Keep the FORMER Database and Storage Files !!"
fi
echo "########################################################"

if [ "$FORCE_BACKGROUND" = true ]; then
	echo "  ---> Running in Background !!"
	echo "  Backend PID: $BACKEND_PID"
	echo "  Environment is ready for manual testing."
	echo "  Press Ctrl+C to stop the server."
	wait $BACKEND_PID
else
	echo " Process - Exit"
fi

echo "########################################################"
