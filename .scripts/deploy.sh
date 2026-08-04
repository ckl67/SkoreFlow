#!/bin/bash

export PATH="/usr/local/go/bin:/usr/bin:/bin:$PATH"

####################################################
# Deployment procedure for production server
####################################################

set -euo pipefail

echo "=============================="
echo "Updating SkoreFlow"
echo "=============================="

PROJECT=/opt/skoreflow

cd "$PROJECT"

echo
echo "Updating repository..."
git fetch origin
git reset --hard origin/main
git clean -fd

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
echo " Check you configuration files"
echo "=========================================="
echo " - backend .env file : backend/.env "
