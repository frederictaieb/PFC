from fastapi import WebSocket, WebSocketDisconnect
from app.core.playerPool import user_pool
import logging

logger = logging.getLogger(__name__)

async def websocket_endpoint(websocket: WebSocket, username: str):
    try:
        await user_pool.connect_websocket(username, websocket)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        user_pool.disconnect_websocket(username)
        logger.info(f"WebSocket disconnected for {username}")