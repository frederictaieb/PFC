from fastapi import WebSocket
from app.core.userSession import UserSession
from app.models.user import User
from app.utils.logger import logger_init
from app.services.xrp.wallet import get_xrp_balance
from app.services.xrp.transaction import send_xrp
import logging

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        return await session.user.get_balance()
    
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