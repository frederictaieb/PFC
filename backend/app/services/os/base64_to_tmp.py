import base64
import tempfile

def base64_to_tmp(base64_str: str) -> str:
    if base64_str.startswith("data:image"):
        base64_str = base64_str.split(",")[1]  # Retire l'entête

    image_bytes = base64.b64decode(base64_str)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
        temp_file.write(image_bytes)
        return temp_file.name