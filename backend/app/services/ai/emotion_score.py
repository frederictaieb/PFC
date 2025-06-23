# app/services/emotion/emotion_score.py

import random
from app.services.ai.fer_emotion import compute_emotion_score_fer
from app.services.ai.deepface_emotion import compute_emotion_score_deepface
from app.services.ai.blip_emotion import compute_emotion_score_blip

def compute_emotion_score(image_path: str, method: str = "fer") -> float:
    """
    Retourne un score émotionnel (evi) selon la méthode choisie.
    Méthodes : "fer", "deepface", "blip", "random"
    """
    method = method.lower()

    if method == "fer":
        return compute_emotion_score_fer(image_path)
    elif method == "deepface":
        return compute_emotion_score_deepface(image_path)
    elif method == "blip":
        return compute_emotion_score_blip(image_path)
    elif method == "random":
        return round(random.uniform(0.0, 1.0), 2)
    else:
        raise ValueError(f"[Emotion] Méthode inconnue : {method}")
