from models.player import Player

import logging
from utils.logger import logger_init

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlayerManager:
    def __init__(self):
        self.players: dict[str, Player] = {}  # key = wallet_address

    def get_or_create(self, wallet_address: str, username: str = None) -> Player:
        if wallet_address not in self.players:
            self.players[wallet_address] = Player(username)
        logger.info(f"Player {username} with wallet {wallet_address}")
        return self.players[wallet_address]

player_pool = PlayerStore()