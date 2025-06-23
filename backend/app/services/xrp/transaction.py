from xrpl.clients import JsonRpcClient
from xrpl.models.transactions import Payment
from xrpl.models.requests import AccountInfo
from xrpl.transaction import (
    safe_sign_and_autofill_transaction,
    send_reliable_submission,
)
from xrpl.wallet import Wallet
from xrpl.utils import xrp_to_drops
from xrpl.models.requests import AccountInfo
from xrpl.models.exceptions import XRPLRequestFailureException
import logging

JSON_RPC_URL = os.getenv("XRP_RPC_URL", "https://s.altnet.rippletest.net:51234/")

def send_xrp(sender_wallet: Wallet, destination_address: str, amount_xrp: float) -> str:
    """
    Envoie des XRP d'un wallet vers une adresse.
    
    :param sender_wallet: Wallet XRPL (xrpl.wallet.Wallet)
    :param destination_address: Adresse XRP du destinataire
    :param amount_xrp: Montant en XRP (float)
    :return: Hash de la transaction
    """
    client = JsonRpcClient(JSON_RPC_URL)
    try:
        # Vérifie que l'adresse source est valide et a un compte actif
        acct_info = AccountInfo(
            account=sender_wallet.classic_address,
            ledger_index="validated",
            strict=True
        )
        response = client.request(acct_info)
        if response.is_successful():
            logger.info(f"Source Account {sender_wallet.classic_address} is valid")
        else:
            raise ValueError(f"Source Account {sender_wallet.classic_address} is not valid")

        # Création de la transaction
        payment = Payment(
            account=sender_wallet.classic_address,
            amount=xrp_to_drops(amount_xrp),  # conversion XRP → drops
            destination=destination_address,
        )

        # Signature + remplissage automatique
        signed_tx = safe_sign_and_autofill_transaction(payment, sender_wallet, client)

        # Envoi et soumission
        tx_response = send_reliable_submission(signed_tx, client)
        tx_hash = signed_tx.get_hash()

        logging.info(f"Transaction envoyée. Hash: {tx_hash}")
        return tx_hash

    except XRPLRequestFailureException as e:
        logging.error(f"Erreur XRPL : {e}")
        raise

    except Exception as e:
        logging.error(f"Erreur lors de l'envoi de XRP : {e}")
        raise
