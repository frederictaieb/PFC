from fastapi import WebSocket, WebSocketDisconnect
from app.core.userPool import user_pool
import logging

logger = logging.getLogger(__name__)

async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_pool.add_anonymous(websocket)
    username = None  # sera défini si l'utilisateur s'enregistre

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "register":
                username = data.get("username")
                if not username:
                    await websocket.send_json({"type": "error", "message": "Username is required"})
                    continue

                if user_pool.username_exists(username):
                    await websocket.send_json({"type": "error", "message": "Username already taken"})
                    continue

                session = await user_pool.create_user(username)
                session.websocket = websocket
                user_pool.remove_anonymous(websocket)
                await websocket.send_json({"type": "register_success", "message": f"Welcome {username}"})
                logger.info(f"{username} registered and connected")

            elif username:
                # Traiter les messages utilisateurs ici
                logger.info(f"Message from {username}: {data}")
                # Exemple : await user_pool.broadcast({...})
            else:
                logger.info(f"Anonymous message: {data}")

    except WebSocketDisconnect:
        if username:
            user_pool.disconnect_websocket(username)
            logger.info(f"WebSocket disconnected for {username}")
        else:
            user_pool.remove_anonymous(websocket)
            logger.info("Anonymous WebSocket disconnected")
