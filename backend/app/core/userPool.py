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
from fastapi import Request

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
XRP_FEES = float(os.getenv("XRP_FEES"))

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
        return self.sessions.get("master").user
    
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


    def get_players(self) -> List[User]:
        players = []
        for username, session in self.sessions.items():
            if username == "master":
                continue  # ⛔️ on ignore l'utilisateur master
            players.append(session.user)
        return players

    def get_neutral(self) -> List[User]:
        neutral = []
        for username, session in self.sessions.items():
            if username == "master":
                continue  # ⛔️ on ignore l'utilisateur master
            #if not session.user.is_still_playing:
            if session.user.last_result == -0:
                neutral.append(session.user)
        return neutral

    def get_losers(self) -> List[User]:
        losers = []
        for username, session in self.sessions.items():
            if username == "master":
                continue  # ⛔️ on ignore l'utilisateur master
            #if not session.user.is_still_playing:
            if session.user.last_result == -1:
                losers.append(session.user)
        return losers

    async def collect_pool_xrp(self):
        tx_ids=[]
        losers = self.get_losers()
        master = self.get_master()
        if master is None:
            raise ValueError("Master wallet not initialized")
        
        master_wallet_address = master.wallet.address
        total_xrp = 0.0

        for loser in losers:
            amount = await loser.get_balance() or 0
            if amount > 0:
                logger.info(f"Collecting {amount} XRP from {loser.username}")
                tx_ids.append(await loser.send_xrp(
                    destination=master_wallet_address,
                    amount=amount - XRP_FEES
                ))
                total_xrp += amount

        return {"message": "XRP collected", "total_xrp": total_xrp, "tx_ids": tx_ids}


    def get_winners(self) -> List[User]:
        winners = []
        for username, session in self.sessions.items():
            if username == "master":
                continue  # ⛔️ on ignore l'utilisateur master
            #if session.user.is_still_playing:
            if session.user.last_result == 1:
                winners.append(session.user)
        return winners

    async def dispatch_pool_xrp(self):
        tx_ids=[]
        winners = self.get_winners()
        master = self.get_master()


        nb_winners = len(winners)

        if master is None:
            raise ValueError("Master wallet not initialized")

        cash_pool = await master.get_balance() - 8
        
        if nb_winners > 0 and cash_pool > XRP_FEES:
            cash_pool = await master.get_balance() - 8
            share_per_winner = cash_pool / nb_winners - XRP_FEES
            logger.info(f"Cash pool: {cash_pool}, winners: {nb_winners}, Share per winner: {share_per_winner}")

            for winner in winners:
                logger.info(f"Dispatching {share_per_winner} XRP to {winner.username}")
                winner_wallet_address = winner.wallet.address
                tx_ids.append(await master.send_xrp(
                        destination=winner_wallet_address,
                        amount=share_per_winner
                    ))

            return {"message": "XRP dispatched", "cash_pool": cash_pool, "tx_ids": tx_ids}
        return {"message": "No winners or cash pool is too low"}

    
    async def get_leaderboard(self, request: Request):
       # winners = [await u.to_user_info() for u in self.get_winners()]
       # losers = [await u.to_user_info() for u in self.get_losers()]
       # neutrals = [await u.to_user_info() for u in self.get_neutral()]


        winners = [
            await u.to_user_info()
            for u in self.get_winners()
            if u.last_round == request.app.state.round_number
        ]
        losers = [
            await u.to_user_info()
            for u in self.get_losers()
            if u.last_round == request.app.state.round_number
        ]
        neutrals = [
            await u.to_user_info()
            for u in self.get_neutral()
            if u.last_round == request.app.state.round_number
        ]

        logger.info(winners)
        logger.info(losers)
        logger.info(neutrals)

        def to_leaderboard_entry(user_info):
            last_round = user_info.last_round or -1
            last_result = user_info.last_result or 0

            last_image = next(
                (img for img in reversed(user_info.ipfs_images or []) if img.round == last_round),
                None
            )

            return {
                "username": user_info.username,
                "result": last_result,
                "last_evi": float(last_image.evi) if last_image and last_image.evi else 0.0,
                "last_photo": last_image.image_cid if last_image else "",
                "last_thumbnail": last_image.thumbnail_cid if last_image else "",
                "balance": float(user_info.wallet.balance or 0)
            }

        return {
            "winners": [to_leaderboard_entry(u) for u in winners],
            "losers": [to_leaderboard_entry(u) for u in losers],
            "neutrals": [to_leaderboard_entry(u) for u in neutrals]
        }
        

user_pool = UserPool()