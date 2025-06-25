import os
import requests
from app.utils.logger import logger_init
import logging

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

def upload_file(url, file_path, timeout=10):
    logger.info(f"Uploading file {file_path} to {url}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found : {file_path}")
    try:
        with open(file_path, 'rb') as file:
            logger.info(f"Uploading file to {url}")
            response = requests.post(
                f"{url.rstrip('/')}/api/v0/add",
                files={'file': file},
                timeout=int(timeout)
            )
        response.raise_for_status()
        data = response.json()
        logger.info(f"Uploaded file to {url} with hash {data['Hash']} (type: {type(data['Hash'])})")
        return data['Hash']
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"IPFS Error (upload) : {e}")