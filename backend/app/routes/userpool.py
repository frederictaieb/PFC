
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

@router.get("/get_losers", response_model=List[UserInfo])
async def get_losers():
    losers = user_pool.get_losers()
    return [await loser.to_user_info() for loser in losers]

@router.get("/get_winners", response_model=List[UserInfo])
async def get_winners():
    winners = user_pool.get_winners()
    return [await winner.to_user_info() for winner in winners]

@router.get("/collect_pool_xrp")
async def collect_pool_xrp():
    return await user_pool.collect_pool_xrp()

@router.get("/dispatch_pool_xrp")
async def dispatch_pool_xrp():
    return await user_pool.dispatch_pool_xrp()

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
        last_photo = last_image.image_cid if last_image else ""
        last_thumbnail = last_image.thumbnail_cid if last_image else ""

        results.append(LeaderboardEntry(
            username=user_info.username,
            result=last_result,
            last_evi=last_evi,
            last_photo=last_photo,
            last_thumbnail=last_thumbnail,
            balance=float(user_info.wallet.balance or 0),
        ))

    return results
