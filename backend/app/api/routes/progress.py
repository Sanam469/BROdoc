import json
import asyncio
import logging
from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.job_service import get_job_by_id
from app.models.document import JobStatus
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

def format_sse(data: dict) -> str:
    
    return f"data: {json.dumps(data)}\n\n"

@router.get(
    "/jobs/{job_id}/progress",
    summary="Stream live progress events via SSE",
    description="Opens an SSE connection and streams Redis PubSub progress events to the browser.",
    response_class=StreamingResponse,
)
async def stream_progress(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    job = await get_job_by_id(db, job_id, user_id=str(current_user.id))

    async def event_generator():

        if job.status in (JobStatus.COMPLETED, JobStatus.FINALIZED, JobStatus.FAILED):
            final_stage = "job_completed" if job.status in (
                JobStatus.COMPLETED, JobStatus.FINALIZED
            ) else "job_failed"

            yield format_sse({
                "job_id":    job_id,
                "stage":     final_stage,
                "status":    job.status.value,
                "message":   f"Job already {job.status.value}.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            return

        channel = f"{settings.REDIS_PUBSUB_CHANNEL}:{job_id}"
        redis_conn = aioredis.from_url(settings.REDIS_URL, decode_responses=True, ssl_cert_reqs="none")
        pubsub = redis_conn.pubsub()

        try:
            await pubsub.subscribe(channel)
            logger.info(f"[SSE] Subscribed to channel: {channel}")

            yield format_sse({
                "job_id":    job_id,
                "stage":     job.current_stage or "job_queued",
                "status":    "connected",
                "message":   "Connected to progress stream. Waiting for updates...",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            timeout_seconds = 120
            elapsed = 0

            while elapsed < timeout_seconds:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0,    
                )

                if message and message["type"] == "message":
                    try:
                        event_data = json.loads(message["data"])
                        logger.info(f"[SSE] Event RECEIVED for {job_id}: {event_data.get('stage')} ({event_data.get('status')})")
                        yield format_sse(event_data)

                        if event_data.get("stage") in ("job_completed", "job_failed"):
                            logger.info(f"[SSE] Terminal stage received. Closing stream for {job_id}")
                            break
                    except json.JSONDecodeError:
                        logger.error(f"[SSE] Invalid JSON received on channel {channel}: {message['data']}")

                else:

                    yield ": heartbeat\n\n"
                    elapsed += 1
                    await asyncio.sleep(1)  

        except asyncio.CancelledError:

            logger.info(f"[SSE] Client disconnected from {job_id}")
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.aclose()
            await redis_conn.aclose()
            logger.info(f"[SSE] Cleaned up Redis connection for {job_id}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={

            "Cache-Control":  "no-cache",
            "X-Accel-Buffering": "no",   
            "Connection":     "keep-alive",
        },
    )