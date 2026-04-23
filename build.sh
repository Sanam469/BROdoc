#!/bin/bash
set -e

# ==============================================================================
# BroDoc Build Script
# ==============================================================================
# This script handles the build process for both Frontend and Backend.
# In your Render Build Settings, set:
#
# Build Command:
#   bash build.sh
# ==============================================================================

if [ -z "$SERVICE_TYPE" ]; then
  echo "❌ Error: SERVICE_TYPE environment variable is not set."
  echo "Please set SERVICE_TYPE to 'frontend', 'backend', 'worker' or 'combo' in Render settings."
  exit 1
fi

if [ "$SERVICE_TYPE" = "frontend" ]; then
  echo "📦 Building Next.js Frontend..."
  cd frontend
  npm install
  npm run build

elif [ "$SERVICE_TYPE" = "backend" ] || [ "$SERVICE_TYPE" = "worker" ] || [ "$SERVICE_TYPE" = "combo" ]; then
  echo "📦 Building Python Backend..."
  cd backend
  # Install dependencies from the backend folder
  pip install -r requirements.txt

else
  echo "❌ Error: Invalid SERVICE_TYPE '$SERVICE_TYPE'."
  echo "Valid values: 'frontend', 'backend', 'worker', 'combo'."
  exit 1
fi
