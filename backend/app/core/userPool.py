from fastapi import WebSocket
from app.core.userSession import UserSession
from app.models.user import User
from app.utils.logger import logger_init
from app.services.xrp.wallet import get_xrp_balance
from app.services.xrp.transaction import send_xrp
import logging
from dotenv import load_dotenv
import os
from typing import List
from app.models.user import UserInfo

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class UserPool:
    def __init__(self):
        self.sessions: dict[str, UserSession] = {}
        self.anonymous_sockets: list[WebSocket] = []

    def username_exists(self, username: str) -> bool:
        return username in self.sessions

    async def create_user(self, username: str) -> UserSession:
        if self.username_exists(username):
            raise ValueError(f"Username '{username}' is already taken")
        user = await User.create(username)
        session = UserSession(user)
        self.sessions[username] = session
        logger.info(f"Created session for {username}")
        return session

    def get(self, username: str) -> UserSession | None:
        return self.sessions.get(username)

    def add_anonymous(self, websocket: WebSocket):
        self.anonymous_sockets.append(websocket)

    def remove_anonymous(self, websocket: WebSocket):
        if websocket in self.anonymous_sockets:
            self.anonymous_sockets.remove(websocket)

    async def broadcast(self, message: dict, include_anonymous: bool = True):
        for session in self.sessions.values():
            if session.websocket:
                await session.send(message)
        if include_anonymous:
            for ws in self.anonymous_sockets:
                try:
                    await ws.send_json(message)
                except:
                    logger.warning("Failed to send to anonymous socket")
        logger.info(f"Broadcast {message} sent to {len(self.sessions)} users and {len(self.anonymous_sockets)} anonymous sockets")

    async def create_master(self):
        await self.create_user("master")
    
    def get_master(self) -> UserSession | None:
        return self.sessions.get("master")
    
    async def get_master_balance(self) -> float:
        session = self.sessions.get("master")
        if session is None or session.user is None:
            raise ValueError("Master session not found or not initialized")
        balance = await session.user.get_balance()
        return balance
    
    def get_master_wallet(self) -> str:
        session = self.sessions.get("master")
        if session is None or session.user is None:
            raise ValueError("Master session not found or not initialized")
        return session.user.wallet
    
    def eliminate_user(self, username: str):
        if username in self.sessions:
            session = self.sessions.get(username)
            if session.user.is_still_playing:
                session.user.is_still_playing = False
                logger.info(f"User {username} eliminated")
            else:
                logger.warning(f"User {username} is not playing")
        else:
            logger.warning(f"User {username} not found")

    def get_losers(self) -> List[User]:
        losers = []
        for username, session in self.sessions.items():
            if username == "master":
                continue  # ⛔️ on ignore l'utilisateur master
            if not session.user.is_still_playing:
                losers.append(session.user)
        return losers

    async def collect_pool_xrp(self):
        losers = self.get_losers()
        master = self.get("master")
        if master is None or master.user is None:
            raise ValueError("Master wallet not initialized")
        
        master_wallet_address = master.user.wallet.address
        total_xrp = 0.0

        for loser in losers:
            tx_ids=[]
            amount = await loser.get_balance() or 0
            if amount > 0:
                logger.info(f"Collecting {amount} XRP from {loser.username}")
                tx_ids.append(await loser.send_xrp(
                    destination=master_wallet_address,
                    amount=amount - 0.000010
                ))
                total_xrp += amount

        return {"message": "XRP collected", "total_xrp": total_xrp, "tx_ids": tx_ids}


    def get_winners(self) -> List[User]:
        winners = []
        for username, session in self.sessions.items():
            if username == "master":
                continue  # ⛔️ on ignore l'utilisateur master
            if session.user.is_still_playing:
                winners.append(session.user)
        return winners

    async def send_xrp_to_winner(self, winner: str, amount: float):
        session_winner = self.sessions.get(winner)
        if session_winner is None or session_winner.user is None:
            raise ValueError("Winner session not found or not initialized")
        session_master = self.sessions.get("master")
        if session_master is None or session_master.user is None:
            raise ValueError("Master session not found or not initialized")

        await send_xrp(
            session_master.user.wallet, 
            session_winner.user.wallet.address, 
            amount)

user_pool = UserPool()