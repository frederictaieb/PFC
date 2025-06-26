from app.services.ai.hume import synthesize_tts_json, synthesize_tts_wav, send_tts_to_master, TTSRequest
from fastapi import APIRouter
from os import getenv
from dotenv import load_dotenv

router = APIRouter()

@router.post("/tts_json")
async def synthesize_tts_json_endpoint(request: TTSRequest):
    return await synthesize_tts_json(request)

@router.post("/tts_wav")
async def synthesize_tts_wav_endpoint(request: TTSRequest):
    return await synthesize_tts_wav(request)