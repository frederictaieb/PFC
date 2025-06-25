# backend/app/routes/master.py
from fastapi import APIRouter, HTTPException
from app.core.userPool import user_pool
from app.utils.logger import logger_init
from pydantic import BaseModel
from typing import List
import logging

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class SendXRPRequest(BaseModel):
    winners: List[str]
    amount: float

@router.get("/register_master")
async def register_master():
    if user_pool.username_exists("master"):
        return {"message": "Master already exists"}
    await user_pool.create_user("master")
    logger.info("Master created")
    return {"message": "Master registered"}

@router.get("/get_master_balance")
async def get_master_balance():
    balance = await user_pool.get_master_balance()
    return {"balance": balance}

@router.get("/get_master_wallet")
def get_master_wallet():
    wallet = user_pool.get_master_wallet()
    return {"wallet": wallet}



