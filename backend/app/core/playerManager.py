from app.models.player import Player

import logging
from app.utils.logger import logger_init

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlayerManager:
    def __init__(self):
        self.players: dict[str, Player] = {}  # key = wallet_address

    async def create(self, username):
        p = await Player.create(username)
        self.players[username] = p
        logger.info(f"Player {p.username} with wallet {p.wallet.address}")
        return self.players[username]

player_pool = PlayerManager()