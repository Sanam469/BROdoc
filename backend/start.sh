#!/bin/bash
# Start Celery worker with 1 concurrency to save RAM, listening specifically to 'documents' queue
celery -A app.workers.celery_app worker --loglevel=info -Q documents -c 1 &

# Start Uvicorn FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
