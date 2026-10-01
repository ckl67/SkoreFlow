#!/bin/bash

# File : /opt/skoreflow/.scripts/deploy.sh

export PATH="/usr/local/go/bin:/usr/bin:/bin:$PATH"

####################################################
# Deployment procedure for production server
####################################################

set -euo pipefail

# By default, Git changes are fetched
FETCH_GIT=true

# Parsing des arguments
while [[ $# -gt 0 ]]; do
	case "$1" in
	-n | --no-fetch | --local)
		FETCH_GIT=false
		shift
		;;
	-h | --help)
		echo "Usage: $0 [-n|--no-fetch|--local]"
		echo "  -n, --no-fetch, --local   Does not fetch the latest Git version (retains local modifications))"
		exit 0
		;;
	*)
		echo "Unknown option : $1"
		echo "Use $0 --help to view the options."
		exit 1
		;;
	esac
done

echo "=============================="
echo "Updating SkoreFlow"
echo "=============================="

PROJECT=/opt/skoreflow

cd "$PROJECT"

echo
if [ "$FETCH_GIT" = true ]; then
	echo "Updating repository from Git..."
	git fetch origin
	git reset --hard origin/main
	git clean -fd
else
	echo "Skipping Git update (local mode active)..."
fi

####################################################
# Thumbnail service
####################################################

echo
echo "Installing thumbnail service..."

cd microservices/thumbnail

if [ ! -d "venv" ]; then
	echo "First installation"
	make reinstall
else
	echo "Updating dependencies"
	make install
fi

####################################################
# Backend
####################################################

echo
echo "Building backend..."

cd ../../backend

make build

####################################################
# Frontend
####################################################

echo
echo "Building frontend..."

cd ../frontend

npm install

npm run build

####################################################
# Restart services
####################################################

echo "Deployment completed."

echo "Restart services as ubuntu:"

echo "sudo systemctl restart skoreflow-thumbnail"
echo "sudo systemctl restart skoreflow-backend"
echo "sudo systemctl reload nginx"

####################################################
# CHECK CONFIGURATION
####################################################

echo "=========================================="
echo " Check your configuration files"
echo "=========================================="
echo " - backend .env file : backend/.env "
