from fastapi import WebSocket, WebSocketDisconnect
from app.core.userPool import user_pool
import logging
from app.utils.logger import logger_init

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)


async def websocket_manager(websocket: WebSocket, username: str):
    await websocket.accept()
    logger.info(f"User {username} connected via WebSocket")

    try:
        if username == "master":
            master_session = user_pool.get("master")
            if master_session:
                master_session.websocket = websocket
                logger.info("Master WebSocket session initialized.")
            else:
                logger.warning("Master session does not exist in user pool.")

        elif username.startswith("anon/"):
            user_pool.add_anonymous(websocket)
            logger.info(f"Anonymous socket {websocket} added to user_pool.anonymous_sockets")

        else:
            session = user_pool.get(username)
            if session:
                session.websocket = websocket
                logger.info(f"WebSocket assigned to session for user: {username}")
            else:
                logger.warning(f"No session found for user {username}")

        while True:
            data = await websocket.receive_json()
            logger.info(f"Received data: {data} from {username}")

            # Si un joueur envoie un résultat
            if data.get("type") == "player_result":
                master_session = user_pool.get("master")
                if master_session and master_session.websocket:
                    username = data["value"]["username"],
                    gesture = data["value"]["gesture"],
                    hasWin = data["value"]["hasWin"],
                    image = data["value"]["image"],

                    try:
                        user = user_pool.get(username)
                        if user:
                            logger.info(f"Adding image to user {username}")
                            user.add_ipfs_image(image)
                            if !hasWin:
                                logger.info(f"User {username} has lost")
                                user.is_still_playing = False
                                balance = get_xrp_balance(wallet_address)
                                logger.info(f"Balance: {balance}")
                                if balance > 0:
                                    send_xrp_to_master(username, balance)
                                    logger.info(f"sending xrp to master")
                                    await send_xrp_to_master(username)


                    except Exception as e:
                        logger.error(f"Error adding image to user {username}: {e}")


                    await master_session.websocket.send_json({
                        "type": "player_result",
                        "username": username,
                        "gesture": gesture,
                        "hasWin": hasWin,
                        "image": image,
                    })

                    logger.info(f"Relayed player_result from {username} to master.")
                else:
                    logger.warning("No active master session to receive player_result.")
            else:
                # Echo pour debug
                await websocket.send_text(f"{username}: {data}")

    except WebSocketDisconnect:
        logger.info(f"User {username} disconnected from WebSocket")

        if username.startswith("anon-"):
            user_pool.remove_anonymous(websocket)
            logger.info(f"Anonymous socket {websocket} removed from pool")

        elif username == "master":
            session = user_pool.get("master")
            if session and session.websocket == websocket:
                session.websocket = None
                logger.info("Master WebSocket cleared")

        else:
            session = user_pool.get(username)
            if session and session.websocket == websocket:
                session.websocket = None
                logger.info(f"WebSocket cleared for user: {username}")
