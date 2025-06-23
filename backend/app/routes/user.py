from fastapi import APIRouter, HTTPException
from app.models.user import User
from app.core.userPool import user_pool
from app.services.xrp.wallet import get_xrp_balance
from typing import List

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

    address = session.user.wallet.classic_address

    # Même si c'est un seul appel, on peut l'harmoniser :
    [balance] = await asyncio.gather(get_xrp_balance(address))

    return UserInfo(
        username=session.user.username,
        wallet=WalletInfo(
            address=address,
            public_key=session.user.wallet.public_key,
            balance=balance
        ),
        connected=session.is_connected(),
        ipfs_images=session.user.get_all_images()
    )

@router.get("/get_users", response_model=List[UserInfo])
async def get_users():
    sessions = list(user_pool.sessions.values())

    # Étape 1 : préparer les adresses
    addresses = [s.user.wallet.classic_address for s in sessions]

    # Étape 2 : récupérer toutes les balances en parallèle
    balances = await asyncio.gather(*[
        get_xrp_balance(address) for address in addresses
    ])

    # Étape 3 : construire la réponse
    result = []

    for session, balance in zip(sessions, balances):
        result.append(UserInfo(
            username=session.user.username,
            wallet=WalletInfo(
                address=session.user.wallet.classic_address,
                public_key=session.user.wallet.public_key,
                balance=balance
            ),
            connected=session.is_connected(),
            ipfs_images=session.user.get_all_images()
        ))

    return result