from fastapi import APIRouter
from fastapi import Request
from app.core.userPool import user_pool
import asyncio
import random
from app.utils.logger import logger_init
import logging
from app.routes.hume import TTSRequest, synthesize_tts_json
from pydub import AudioSegment
import os

logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

#BASE_DIR = os.path.dirname(__file__)

BASE_DIR = os.getcwd()
print(BASE_DIR)
SOUNDS_DIR = os.path.join(BASE_DIR, "app", "public", "sounds")

sounds = {
    # voice 1
    "1_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "1.mp3")),
    "2_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "2.mp3")),
    "3_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "3.mp3")),
    "4_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "4.mp3")),
    "5_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "5.mp3")),
    "6_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "6.mp3")),
    "7_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "7.mp3")),
    "8_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "8.mp3")),
    "9_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "9.mp3")),
    "10_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "10.mp3")),
    "attention_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "attention.mp3")),
    "beready_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "beready.mp3")),
    "nextround_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "nextround.mp3")),
    "paper_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "paper.mp3")),
    "scissors_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "scissors.mp3")),
    "rock_1": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice1", "rock.mp3")),

    # voice 2
    "1_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "1.mp3")),
    "2_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "2.mp3")),
    "3_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "3.mp3")),
    "4_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "4.mp3")),
    "5_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "5.mp3")),
    "6_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "6.mp3")),
    "7_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "7.mp3")),
    "8_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "8.mp3")),
    "9_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "9.mp3")),
    "10_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "10.mp3")),
    "attention_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "attention.mp3")),
    "beready_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "beready.mp3")),
    "nextround_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "nextround.mp3")),
    "paper_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "paper.mp3")),
    "scissors_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "scissors.mp3")),
    "rock_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "rock.mp3")),
    "round_2": AudioSegment.from_file(os.path.join(SOUNDS_DIR, "voice2", "round.mp3")),
}


VOICE = "1"


async def speak_and_broadcast(type_broadcast: str, value: str, include_anonymous: bool = True):
    try:
        words_to_speak = value

        if type_broadcast == "result":
            if value == "0":
                words_to_speak = "Rock"
            elif value == "1":
                words_to_speak = "Paper"
            else:
                words_to_speak = "Scissors"

        #req = TTSRequest(text=words_to_speak, description=DESCRIPTION_OF_SPEECH)
        #result = await synthesize_tts_json(req)  # appel direct de la fonction Python
        #audio_base64 = result["audio_base64"]    # accès direct au dict

        await user_pool.broadcast({
            "type": type_broadcast,
            "value": value,
            #"audio_base64": audio_base64
            "audio_base64": None
        }, include_anonymous=include_anonymous)

    except Exception as e:
        logger.error(f"Erreur pendant speak_and_broadcast : {e}")
        await user_pool.broadcast({
            "type": type_broadcast,
            "value": value,
            "audio_base64": None
        }, include_anonymous=include_anonymous)



router = APIRouter()

@router.get("/round")
def get_round(request: Request):
    return {"round": request.app.state.round_number}

@router.post("/round/increment")
def increment_round(request: Request):
    request.app.state.round_number += 1
    return {"round": request.app.state.round_number}

@router.post("/round/reset")
def reset_round(request: Request):
    request.app.state.round_number = 1
    return {"round": request.app.state.round_number}

@router.get("/status")
def get_game_status(request: Request):
    logger.info(f"Getting game status: {request.app.state.game_started}")
    return {"game_started": request.app.state.game_started}

@router.post("/startGame")
async def start_game(request: Request):
    logger.info("Starting game countdown...")

    for i in reversed(range(1, 4)):
        await user_pool.broadcast(
            {"type": "countdown", "value": str(i)}, include_anonymous=True
        )
        await asyncio.sleep(1)

    await user_pool.broadcast(
        {"type": "countdown", "value": "GO"}, include_anonymous=True
    )

    request.app.state.game_started = True

    await user_pool.broadcast(
        {"type": "info", "value": "Game started!"}, include_anonymous=True
    )

    return {"message": "Game started!"}

@router.post("/startRound")
async def start_round(request: Request):
    logger.info("⏳ Starting game round...")

    round_number = request.app.state.round_number

    await speak_and_broadcast(type_broadcast="announcement", value=f"Round {round_number}!")
    await asyncio.sleep(len(sounds[f"nextround_{VOICE}"])/1000)

    # Étape 1 : introduction vocale
    await speak_and_broadcast(type_broadcast="announcement", value="Attention! Game is starting!")
    await asyncio.sleep(len(sounds[f"attention_{VOICE}"])/1000)

    await speak_and_broadcast(type_broadcast="announcement", value="Be ready!")
    await asyncio.sleep(len(sounds[f"beready_{VOICE}"])/1000)
    await asyncio.sleep(3)

    # Étape 2 : décompte
    for i in range(1, 4):
        await speak_and_broadcast(type_broadcast="countdown", value=str(i))
        await asyncio.sleep(len(sounds[f"{i}_{VOICE}"])/1000)

    # Étape 3 : choix aléatoire du master
    result = random.randint(0, 2)
    await speak_and_broadcast(type_broadcast="result", value=str(result))
    if result == 0:
        await asyncio.sleep(len(sounds[f"rock_{VOICE}"])/1000)
    elif result == 1:
        await asyncio.sleep(len(sounds[f"paper_{VOICE}"])/1000)
    else:
        await asyncio.sleep(len(sounds[f"scissors_{VOICE}"])/1000)

    #logger.info(f"🎯 Master gesture selected: {result}")

    #gesture_map = {0: "Rock", 1: "Paper", 2: "Scissors"}
    #gesture_name = gesture_map[result]

    # Étape 4 : caster le geste choisi (Rock, Paper, Scissors)
    #await speak_and_broadcast(gesture_name, message_type="result")
    #await asyncio.sleep(1.5)

    # Étape 5 : transmettre le résultat numérique aux clients (pour logique jeu)
    #await user_pool.broadcast({
    #    "type": "result",
    #    "value": result
    #}, include_anonymous=True)

    return {"result": result, "message": "Round started!"}


@router.post("/round_reset")
async def round_reset(request: Request):
    logger.info("🔁 Reset des emojis de tous les joueurs")

    await user_pool.broadcast(
        {"type": "broadcast_reset"},
        include_anonymous=False
    )

    return {"status": "ok", "message": "Reset broadcast sent"}


 

