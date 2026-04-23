from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "brodoc_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(

    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    timezone="UTC",
    enable_utc=True,

    task_acks_late=True,

    task_reject_on_worker_lost=True,

    task_soft_time_limit=600,    
    task_time_limit=660,         

    result_expires=3600,

    worker_concurrency=2,

    task_default_queue="documents",

    include=["app.workers.tasks"],

    broker_connection_retry_on_startup=True,
)

@celery_app.task(name="health_check")
def health_check():
    
    return "pong"