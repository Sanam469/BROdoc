from app.workers.base import celery_app
import app.workers.tasks

# The worker entry point
# This file is used by the celery command line: celery -A app.workers.celery_app worker

celery_app.conf.update(
    include=["app.workers.tasks"]
)

@celery_app.task(name="health_check")
def health_check():
    return "pong"