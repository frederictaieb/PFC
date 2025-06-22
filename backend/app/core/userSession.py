from fastapi import WebSocket
from app.models.user import User

class UserSession:
    def __init__(self, user: User, websocket: WebSocket = None):
        self.user = user
        self.websocket: WebSocket | None = None

    def is_connected(self) -> bool:
        return self.websocket is not None

    async def send(self, message: dict):
        if self.websocket:
            await self.websocket.send_json(message)

    def disconnect(self):
        self.websocket = None