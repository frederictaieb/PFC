from fastapi import APIRouter, HTTPException
from app.models.player import Player
from app.core.playerPool import player_pool
from app.services.xrp.wallet import get_xrp_balance
from typing import List

import asyncio

from pydantic import BaseModel
from app.models.player import PlayerInfo, WalletInfo

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

@router.post("/register_player")
async def register_player(payload: RegisterPayload):
    username = payload.username
    await player_pool.create_player(username)
    logger.info(f"Player {username} created")
    return {"message": "Player registered", "player": username}

@router.get("/get_player", response_model=PlayerInfo)
async def get_player(username: str):
    session = player_pool.get(username)
    if not session:
        raise HTTPException(status_code=404, detail="Player not found")

    address = session.player.wallet.classic_address

    # Même si c’est un seul appel, on peut l’harmoniser :
    [balance] = await asyncio.gather(get_xrp_balance(address))

    return PlayerInfo(
        username=session.player.username,
        wallet=WalletInfo(
            address=address,
            public_key=session.player.wallet.public_key,
            balance=balance
        ),
        connected=session.is_connected(),
        ipfs_images=session.player.get_all_images()
    )

@router.get("/get_players", response_model=List[PlayerInfo])
async def get_players():
    sessions = list(player_pool.sessions.values())

    # Étape 1 : préparer les adresses
    addresses = [s.player.wallet.classic_address for s in sessions]

    # Étape 2 : récupérer toutes les balances en parallèle
    balances = await asyncio.gather(*[
        get_xrp_balance(address) for address in addresses
    ])

    # Étape 3 : construire la réponse
    result = []

    for session, balance in zip(sessions, balances):
        result.append(PlayerInfo(
            username=session.player.username,
            wallet=WalletInfo(
                address=session.player.wallet.classic_address,
                public_key=session.player.wallet.public_key,
                balance=balance
            ),
            connected=session.is_connected(),
            ipfs_images=session.player.get_all_images()
        ))

    return result