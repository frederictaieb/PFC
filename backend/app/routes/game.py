from fastapi import APIRouter
from fastapi import Request
from app.core.userPool import user_pool
import asyncio

from app.utils.logger import logger_init
import logging

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter()

@router.get("/status")
def get_game_status(request: Request):
    logger.info(f"Getting game status: {request.app.state.game_started}")
    return {"game_started": request.app.state.game_started}

@router.post("/start")
async def start_game(request: Request):
    logger.info("Starting game countdown...")

    for i in reversed(range(1, 4)):
        await user_pool.broadcast(
            {"type": "countdown", "value": str(i)}, include_anonymous=True
        )
        await asyncio.sleep(1)

    await user_pool.broadcast(
        {"type": "countdown", "value": "GO"}, include_anonymous=True
    )

    request.app.state.game_started = True

    await user_pool.broadcast(
        {"type": "info", "value": "Game started!"}, include_anonymous=True
    )

    return {"message": "Game started!"}
