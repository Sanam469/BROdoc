#!/bin/bash
# Start Celery worker in the background
celery -A app.workers.celery_app worker --loglevel=info &

# Start Uvicorn FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
