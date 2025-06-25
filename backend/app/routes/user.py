from fastapi import APIRouter, HTTPException
from app.models.user import User
from app.core.userPool import user_pool
from app.services.xrp.wallet import get_xrp_balance
from typing import List
from app.models.user import LeaderboardEntry
from app.models.user import HasPlayedRequest


import asyncio

from pydantic import BaseModel
from app.models.user import UserInfo, WalletInfo

from app.utils.logger import logger_init
import logging

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/api/helloworld")
async def helloworld():
    return {"message": "Hello from FastAPI!"}

class RegisterPayload(BaseModel):
    username: str

class EliminateUserPayload(BaseModel):
    username: str

@router.post("/register_user")
async def register_user(payload: RegisterPayload):
    username = payload.username
    session = await user_pool.create_user(username)
    logger.info(f"User {username} created")
    
    # Create a proper UserInfo object
    user_info = UserInfo(
        username=session.user.username,
        wallet=WalletInfo(
            address=session.user.wallet.classic_address,
            public_key=session.user.wallet.public_key,
            balance=None  # We'll get the balance later when needed
        ),
        connected=session.is_connected(),
        ipfs_images=session.user.get_all_images()
    )
    
    return {
        "success": True,
        "user": user_info.dict(),
        "message": "User registered"
    }

@router.get("/get_user", response_model=UserInfo)
async def get_user(username: str):
    session = user_pool.get(username)
    if not session:
        raise HTTPException(status_code=404, detail="User not found")

    #address = session.user.wallet.classic_address

    # Même si c’est un seul appel, on peut l’harmoniser :
    #[balance] = await asyncio.gather(get_xrp_balance(address))

    return await session.user.to_user_info()

@router.get("/get_users", response_model=List[UserInfo])
async def get_users():
    sessions = list(user_pool.sessions.values())

    # ✅ Utilise gather pour appeler to_user_info() en parallèle
    user_infos = await asyncio.gather(*[
        session.user.to_user_info() for session in sessions
    ])

    return user_infos

@router.post("/eliminate_user")
async def eliminate_user(payload: EliminateUserPayload):
    username = payload.username
    user_pool.eliminate_user(username)
    logger.info(f"User {username} eliminated")
    return {"message": "User eliminated", "user": username}

@router.post("/has_played")
async def has_played(payload: HasPlayedRequest):
    session = user_pool.get(payload.username)
    if not session:
        raise HTTPException(status_code=404, detail="User not found")

    session.user.has_played(
        payload.result,
        payload.round_number,
        payload.image_path,
        payload.thumbnail_path,
        payload.is_still_playing
    )

    return {"success": True}
