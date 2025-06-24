from fastapi import APIRouter
from fastapi import Request
from app.core.userPool import user_pool
import asyncio
import random
from app.utils.logger import logger_init
import logging


logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter()

@router.get("/round")
def get_round(request: Request):
    return {"round": request.app.state.round_number}

@router.post("/round/increment")
def increment_round(request: Request):
    request.app.state.round_number += 1
    return {"round": request.app.state.round_number}

@router.post("/round/reset")
def reset_round(request: Request):
    request.app.state.round_number = 1
    return {"round": request.app.state.round_number}

@router.get("/status")
def get_game_status(request: Request):
    logger.info(f"Getting game status: {request.app.state.game_started}")
    return {"game_started": request.app.state.game_started}

@router.post("/startGame")
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

@router.post("/startRound")
async def start_round(request: Request):
    logger.info("Starting game countdown...")

    for i in range(1, 4):
        await user_pool.broadcast(
            {"type": "countdown", "value": str(i)}, include_anonymous=True
        )
        await asyncio.sleep(1)

    result = random.randint(0, 2)
    logger.info(f"Result: {result}")

    await user_pool.broadcast(
        {"type": "result", "value": result}, include_anonymous=True
    )

    return {"result": "Round started!"}
 