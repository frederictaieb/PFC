from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
from io import BytesIO
from fastapi import APIRouter
from app.utils.logger import logger_init
import logging
from hume import AsyncHumeClient
from hume.tts import PostedUtterance
import base64

router = APIRouter()
logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
api_key = os.getenv("HUME_API_KEY")
if not api_key:
    raise EnvironmentError("HUME_API_KEY not found in environment variables")

hume_client = AsyncHumeClient(api_key=api_key)

class TTSRequest(BaseModel):
    text: str
    description: str | None = None

async def send_tts_to_master(websocket, text: str, description: str = "Metallic neutral voice"):
    try:
        tts_request = TTSRequest(text=text, description=description)
        result = await synthesize_tts(tts_request)
        audio_base64 = result["audio_base64"]
        
        await websocket.send_json({
            "type": "countdown",
            "value": text,
            "audio_base64": audio_base64
        })
    except Exception as e:
        logger.error(f"Erreur synthèse vocale : {e}")

@router.post("/tts_json")
async def synthesize_tts_json(request: TTSRequest):
    try:
        result = await hume_client.tts.synthesize_json(
            utterances=[
                PostedUtterance(
                    text=request.text,
                    description=request.description
                )
            ]
        )

        audio_base64 = result.generations[0].audio
        generation_id = result.generations[0].generation_id

        return {
            "generation_id": generation_id,
            "audio_base64": audio_base64,
            "message": "Success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts_wav")
async def synthesize_tts_wav(request: TTSRequest):
    try:
        result = await hume_client.tts.synthesize_json(
            utterances=[
                PostedUtterance(
                    text=request.text,
                    description=request.description
                )
            ]
        )

        # On reste dans la portée de la fonction ici
        generation = result.generations[0]
        generation_id = generation.generation_id
        audio_bytes = base64.b64decode(generation.audio)
        audio_stream = BytesIO(audio_bytes)

        return StreamingResponse(
            audio_stream,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f'attachment; filename="speech_{generation_id}.wav"'
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
