from fastapi import WebSocket
from app.core.userSession import UserSession
from app.models.user import User
from app.utils.logger import logger_init
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

user_pool = UserPool()