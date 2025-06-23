from xrpl.clients import JsonRpcClient
from xrpl.models.transactions import Payment
from xrpl.asyncio.transaction import autofill_and_sign, submit_and_wait
from xrpl.wallet import Wallet
from xrpl.utils import xrp_to_drops
from app.utils.logger import logger_init
import logging

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

JSON_RPC_URL = "https://s.altnet.rippletest.net:51234"


logger = logging.getLogger(__name__)



async def send_xrp(sender_wallet: Wallet, destination_address: str, amount_xrp: float) -> str:
    logger.info(f"Sending {amount_xrp} xrp from {sender_wallet.classic_address} to {destination_address}")
    client = JsonRpcClient(JSON_RPC_URL)
    try:
        payment = Payment(
            account=sender_wallet.classic_address,
            destination=destination_address,
            amount=xrp_to_drops(amount_xrp),
        )

        
        signed_tx = await autofill_and_sign(payment, client, sender_wallet)
        response = await submit_and_wait(signed_tx, client)

        tx_id = signed_tx.get_hash()
        logger.info(f"Transaction sent: {tx_id}")

    except Exception as e:
        logger.error(f"Transaction failed: {e}")
        raise

async def send_net_xrp(sender_wallet: Wallet, destination_address: str, amount_xrp: float) -> str:
    if not isinstance(amount_xrp, Decimal):
        amount_xrp = Decimal(str(amount_xrp))
    fee = Decimal("0.000010")
    net_xrp = amount_xrp - fee
    send_xrp(sender_wallet, destination_address, float(net_xrp))
