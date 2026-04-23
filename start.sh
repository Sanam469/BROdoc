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
  echo "🚀 Starting Celery Worker..."
  cd backend
  # Start the Celery worker for the 'documents' queue
  celery -A app.workers.celery_app worker -Q documents --loglevel=info

else
  echo "❌ Error: Invalid SERVICE_TYPE '$SERVICE_TYPE'."
  echo "Valid values: 'frontend', 'backend', 'worker'."
  exit 1
fi
