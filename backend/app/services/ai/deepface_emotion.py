# app/services/emotion/deepface_emotion.py
# pip install deepface

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False

def compute_emotion_score_deepface(image_path: str) -> float:
    if not DEEPFACE_AVAILABLE:
        return 0.0

    try:
        results = DeepFace.analyze(img_path=image_path, actions=["emotion"], enforce_detection=False)
        emotions = results[0]["emotion"]
        happy_score = emotions.get("happy", 0.0)
        return round(happy_score / 100.0, 2)  # DeepFace renvoie des %
    except Exception as e:
        print(f"[DeepFace] Erreur: {e}")
        return 0.0
