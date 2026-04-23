#!/bin/bash
echo "--- Starting BroDoc Services ---"

# Start Celery worker
echo "Starting Celery worker (Queue: documents)..."
celery -A app.workers.celery_app worker --loglevel=info -Q documents -c 1 &

# Wait a second
sleep 2

# Start Uvicorn FastAPI server
echo "Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
