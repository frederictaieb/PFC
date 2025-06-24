from fastapi import APIRouter, HTTPException
from app.models.user import User
from app.core.userPool import user_pool
from app.services.xrp.wallet import get_xrp_balance
from typing import List
from app.models.user import LeaderboardEntry

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
    await user_pool.create_user(username)
    logger.info(f"User {username} created")
    return {"message": "User registered", "user": username}

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

@router.get("/to_results", response_model=List[LeaderboardEntry])
async def to_results():
    results: List[LeaderboardEntry] = []

    for session in user_pool.sessions.values():
        # 🎯 On ignore "master"
        if session.user.username == "master":
            continue

        # 🎯 On ignore ceux qui ne jouent plus
        if not session.user.is_still_playing:
            continue

        user_info: UserInfo = await session.user.to_user_info()

        last_round = user_info.last_round if user_info.last_round is not None else -1
        last_result = user_info.last_result if user_info.last_result is not None else 0

        last_image = next(
            (img for img in reversed(user_info.ipfs_images) if img.round == last_round),
            None
        )

        last_evi = float(last_image.evi) if last_image and last_image.evi is not None else 0.0
        last_photo = last_image.ipfs_cid if last_image else ""

        results.append(LeaderboardEntry(
            username=user_info.username,
            result=last_result,
            last_evi=last_evi,
            last_photo=last_photo,
            balance=float(user_info.wallet.balance or 0),
        ))

    return results
