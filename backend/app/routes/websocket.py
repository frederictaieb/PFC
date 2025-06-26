from fastapi import WebSocket, WebSocketDisconnect
from app.core.userPool import user_pool
import logging
from app.utils.logger import logger_init
from app.services.xrp.transaction import send_net_xrp, send_xrp
from app.services.xrp.wallet import get_xrp_balance
from app.services.os.base64_to_tmp import base64_to_tmp
import os

from app.services.ai.hume import send_tts_to_master

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

                #username: playerInfo.username,
                #gesture: myGesture,
                #result: result,
                #round: roundNumber,
                #hasWin: win,
                #image: imageBase64,

                master_session = user_pool.get("master")
                if master_session and master_session.websocket:
                    username = data["value"]["username"]
                    logger.info(f"Username: {username}")

                    gesture = data["value"]["gesture"]
                    logger.info(f"Gesture: {gesture}")

                    round_number = data["value"]["round"]
                    logger.info(f"Round number: {round_number}")

                    hasWin = data["value"]["hasWin"]
                    logger.info(f"Has win: {hasWin}")

                    result = data["value"]["result"]
                    logger.info(f"Result: {result}")
                    
                    image = data["value"]["image"]
                    logger.info(f"Image base64 received ({len(image)} characters)")

                    thumbnail = data["value"]["thumbnail"]
                    logger.info(f"Thumbnail base64 received ({len(thumbnail)} characters)")

                    try:
                        session = user_pool.get(username)
                        if not session:
                            logger.warning(f"User {username} not found in user pool")
                            continue

                        logger.info(f"User {username} is still playing: {session.user.is_still_playing}")

                        if session.user:
                            logger.info(f"Updating last result and round for user {username}")
                            
                            session.user.last_result = result
                            logger.info(f"Last result: {session.user.last_result}") 

                            session.user.last_round = round_number
                            logger.info(f"Last round: {session.user.last_round}")

                            logger.info(f"Adding images to user {username}")
                            image_path = base64_to_tmp(image)
                            logger.info(f"Image path: {image_path}")

                            thumbnail_path = base64_to_tmp(thumbnail)
                            logger.info(f"Thumbnail path: {thumbnail_path}")

                            session.user.add_ipfs_images(image_path, thumbnail_path)
                            logger.info(f"Images added to user {username}")

                            os.remove(image_path)
                            os.remove(thumbnail_path)

                            # Si le joueur a perdu, on lui retire les xrp   
                            if not hasWin:
                                logger.info(f"User {username} has lost")
                                session.user.is_still_playing = False
                            #    user_wallet_address = session.user.wallet.classic_address
                            #    master_wallet_address = user_pool.get("master").user.wallet.classic_address
                            #    logger.info(f"Wallet address: {user_wallet_address}")
                            #    balance = await get_xrp_balance(user_wallet_address)
                            #    logger.info(f"{username}'s Balance: {balance}")
                            #    if balance > 0:
                            #        logger.info(f"sending {balance} xrp from {username} to master")
                            #        #await send_net_xrp(session.user.wallet, master_wallet_address, balance)
                            #        await send_xrp(session.user.wallet, master_wallet_address, balance)
                    except Exception as e:
                        logger.error(f"Error adding image to user {username}: {e}")


                    await master_session.websocket.send_json({
                        "type": "player_result",
                        "value": {
                            "username": username,
                            "gesture": gesture,
                            "result": result,
                            "round": round_number,
                            "hasWin": hasWin,
                            "image": image,
                            "thumbnail": thumbnail,
                        }
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
