# app/services/emotion/blip_emotion.py
# pip install transformers torchvision torch pillow
from transformers import BlipProcessor, BlipForConditionalGeneration, pipeline
from PIL import Image

blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
emotion_classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)

def generate_caption(image_path: str) -> str:
    if not HF_AVAILABLE:
        return ""
    image = Image.open(image_path).convert("RGB")
    inputs = blip_processor(image, return_tensors="pt")
    out = blip_model.generate(**inputs)
    return blip_processor.decode(out[0], skip_special_tokens=True)

def compute_emotion_score_blip(image_path: str) -> float:
    if not HF_AVAILABLE:
        return 0.0

    caption = generate_caption(image_path)
    print(f"[BLIP] Caption: {caption}")

    results = emotion_classifier(caption)[0]
    for r in results:
        if r["label"].lower() == "joy":
            return round(r["score"], 2)
    return 0.0
