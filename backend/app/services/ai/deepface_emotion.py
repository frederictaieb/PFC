from PIL import Image
import numpy as np
from deepface import DeepFace
from app.utils.logger import logger_init
import logging

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

def compute_emotion_score_deepface(image_path: str) -> float:
    try:
        pil_image = Image.open(image_path).convert("RGB")
        np_image = np.array(pil_image)

        result = DeepFace.analyze(np_image, actions=['emotion'], enforce_detection=True)
        emotions = result[0]['emotion'] if isinstance(result, list) else result['emotion']

        weights = {
            "happy": 1.0,
            "neutral": 0.5,
            "surprise": 0.3,
            "sad": -1.0,
            "angry": -0.8,
            "fear": -0.6,
            "disgust": -0.7
        }

        raw_score = sum(emotions.get(e, 0) * weights.get(e, 0) for e in emotions)
        score = float(np.clip(((raw_score + 100) / 200) * 100, 0, 100))  # 0-100 normalisé
        ratio = round(score / 100, 2)
        logger.info(f"Emotion score ratio: {ratio}")
        return ratio

    except Exception as e:
        logger.error(f"Error computing emotion score: {e}")
        return 0.0
