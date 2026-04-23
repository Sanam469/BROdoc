#!/bin/bash
set -e

# ==============================================================================
# BroDoc Deployment Startup Script
# ==============================================================================
# This script handles starting the appropriate service on Render.
# In your Render Service Settings, set the following:
#
# Environment Variable:
#   SERVICE_TYPE = "frontend" | "backend" | "worker"
#
# Start Command:
#   bash start.sh
# ==============================================================================

if [ -z "$SERVICE_TYPE" ]; then
  echo "❌ Error: SERVICE_TYPE environment variable is not set."
  echo "Please set SERVICE_TYPE to 'frontend', 'backend', or 'worker' in Render settings."
  exit 1
fi

if [ "$SERVICE_TYPE" = "frontend" ]; then
  echo "🚀 Starting Next.js Frontend..."
  cd frontend
  # Ensure we are in the frontend directory and start the production server
  npm start

elif [ "$SERVICE_TYPE" = "backend" ]; then
  echo "🚀 Starting FastAPI Backend..."
  cd backend
  # Start FastAPI with uvicorn. Render provides the $PORT environment variable.
  python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

elif [ "$SERVICE_TYPE" = "worker" ]; then
  echo "🚀 Starting Celery Worker with dummy port listener..."
  cd backend
  # Start the Celery worker in the background
  celery -A app.workers.celery_app worker -Q documents --loglevel=info &
  # Start a dummy server to satisfy Render's port check for free web services
  echo "📡 Starting dummy health check on port ${PORT:-8080}..."
  python -m http.server ${PORT:-8080}

elif [ "$SERVICE_TYPE" = "combo" ]; then
  echo "🚀 Starting COMBO (Backend + Worker) Service..."
  cd backend
  # Start Celery in the background
  celery -A app.workers.celery_app worker -Q documents --loglevel=info &
  # Start FastAPI in the foreground
  python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

else
  echo "❌ Error: Invalid SERVICE_TYPE '$SERVICE_TYPE'."
  echo "Valid values: 'frontend', 'backend', 'worker', 'combo'."
  exit 1
fi
