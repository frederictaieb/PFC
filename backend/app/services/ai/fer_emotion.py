# app/services/emotion/fer_emotion.py
# pip install fer opencv-python

import cv2
from fer import FER

fer_detector = FER()

def compute_emotion_score_fer(image_path: str) -> float:
    img = cv2.imread(image_path)
    results = fer_detector.detect_emotions(img)

    if not results:
        return 0.0

    emotions = results[0]["emotions"]
    happy_score = emotions.get("happy", 0.0)
    return round(happy_score, 2)
