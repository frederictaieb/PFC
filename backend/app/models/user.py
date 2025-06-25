import os
import random
import logging
import dotenv
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field
from xrpl.wallet import Wallet

from app.models.client import Client
from app.services.xrp.wallet import create_wallet
from app.services.ipfs.upload import upload_file
from app.utils.logger import logger_init
from app.services.ai.emotion_score import compute_emotion_score
from app.services.xrp.wallet import get_xrp_balance


# Initialiser le logger
logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

# Charger les variables d’environnement
dotenv.load_dotenv()

# ✅ Modèle Wallet pour sérialisation (par exemple dans une API)
class WalletInfo(BaseModel):
    address: str
    public_key: str
    balance: Optional[Decimal] = None

# ✅ Modèle d’image avec validation automatique
class ImageData(BaseModel):
    round: int
    ipfs_cid: str
    evi: Optional[float] = None

class LeaderboardEntry(BaseModel):
    username: str
    result: int
    last_evi: float
    last_photo: str
    balance: float

# ✅ Modèle utilisateur exportable (si nécessaire dans API ou front)
class UserInfo(BaseModel):
    username: str
    wallet: WalletInfo
    connected: bool
    ipfs_images: List[ImageData]
    last_result: Optional[int] = None  # ✅ maintenant optionnel
    last_round: Optional[int] = None   # ✅ maintenant optionnel
    is_still_playing: bool

# ✅ Classe User principale
class User(Client):
    def __init__(self, username: str, wallet: Wallet, ipfs_images: Optional[List[ImageData]] = None):
        super().__init__(username)
        self.wallet = wallet
        self.ipfs_images: List[ImageData] = ipfs_images or []
        self.is_still_playing: bool = True  # 🎯 ajouté par défaut
        self.last_result: int = 0
        self.last_round: int = 0
        logger.info(f"User {self.username} created with wallet {self.wallet.address}")
        logger.info(f"Last result: {self.last_result}")
        logger.info(f"Last round: {self.last_round}")
        logger.info(f"Is still playing: {self.is_still_playing}")

    @classmethod
    async def create(cls, username: str):
        wallet = await create_wallet()
        return cls(username, wallet)

    def get_wallet_address(self) -> str:
        return self.wallet.classic_address

    async def get_balance(self) -> float:
        reserve = Decimal(os.getenv("XRP_RESERVE", "2"))
        balance = await get_xrp_balance(self.wallet.address)
        return float(balance - reserve)

    def add_ipfs_image(self, image_path: str):
        # 1. Uploader l'image vers IPFS
        ipfs_url = os.getenv("IPFS_URL")
        logger.info(f"Uploading image {image_path} to IPFS {ipfs_url}")
        ipfs_cid = upload_file(ipfs_url, image_path)
        logger.info(f"upload_file returned: {ipfs_cid} (type: {type(ipfs_cid)})")
        logger.info(f"IPFS CID: {ipfs_cid}")

        # 2. Score émotionnel simulé (à remplacer plus tard par une vraie IA)
        evi = compute_emotion_score(image_path, method="deepface")
        logger.info(f"Emotion score: {evi}")

        # 3. Round = nombre d’images existantes + 1
        round_num = len(self.ipfs_images) + 1
        
        logger.info(f"Current round: {round_num}")
        
        # 4. Créer l’objet ImageData
        logger.info(f"Creating image data for round {round_num} with IPFS CID {ipfs_cid} and EVI {evi}")
        image_data = ImageData(round=round_num, ipfs_cid=ipfs_cid, evi=evi)
        logger.info(f"Image data created: {image_data}")

        # 5. Ajouter à la liste
        self.ipfs_images.append(image_data)
        logger.info(f"Image data added to user {self.username}")

    def get_last_image(self) -> Optional[ImageData]:
        if self.ipfs_images:
            return self.ipfs_images[-1]
        return None

    def get_all_images(self) -> List[ImageData]:
        return self.ipfs_images.copy()

    def clear_images(self):
        self.ipfs_images.clear()

    def __repr__(self):
        return (
            f"<User(username={self.username}, "
            f"wallet={self.wallet.address}, "
            f"images={len(self.ipfs_images)}, "
            f"isStillPlaying={self.is_still_playing})>"
        )

    async def to_user_info(self) -> UserInfo:
        balance = await self.get_balance()
        return UserInfo(
            username=self.username,
            wallet=WalletInfo(
                address=self.wallet.address,
                public_key=self.wallet.public_key,
                balance=balance
            ),
            connected=True,
            ipfs_images=self.ipfs_images,
            last_result=self.last_result,
            last_round=self.last_round,
            is_still_playing=self.is_still_playing,
        )
