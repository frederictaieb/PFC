from fastapi import APIRouter
from fastapi import Request
from app.core.playerPool import user_pool


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
def start_game(request: Request):
    request.app.state.game_started = True
    user_pool.broadcast({"message": "Game started!"})
    logger.info(f"Game started: {request.app.state.game_started}")
    return {"message": "Game started!"}