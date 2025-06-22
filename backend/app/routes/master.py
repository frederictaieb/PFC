# backend/app/routes/master.py
from fastapi import APIRouter, HTTPException
from app.core.userPool import user_pool
from app.utils.logger import logger_init
import logging

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/register_master")
async def register_master():
    if user_pool.username_exists("master"):
        return {"message": "Master already exists"}
    await user_pool.create_user("master")
    logger.info("Master created")
    return {"message": "Master registered"}

