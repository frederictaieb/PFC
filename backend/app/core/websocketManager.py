from fastapi import WebSocket
import logging
from app.utils.logger import logger_init

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        logger.info("WebSocketManager initialized")
        self.connections: dict[str, WebSocket] = {}  # key = wallet_address

    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        logger.info(f"WebSocket connected for {username}")
        self.connections[username] = websocket

    def disconnect(self, username: str):
        if username in self.connections:
            del self.connections[username]
            logger.info(f"WebSocket disconnected for {username}")

    async def send_to(self, username: str, message: dict):
        if username in self.connections:
            await self.connections[username].send_json(message)
            logger.info(f"WebSocket message sent to {username}")

    async def broadcast(self, message: dict):
        for ws in self.connections.values():
            await ws.send_json(message)
        logger.info(f"WebSocket message broadcasted to {len(self.connections)} connections")

websocket_pool = WebSocketManager()