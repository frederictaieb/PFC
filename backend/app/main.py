from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.routes import user, game, master, hume
from app.routes.websocket import websocket_manager
from app.utils.logger import logger_init
import logging


logger_init(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sockets for not registered users
app.state.waiting_sockets = set()


# State of the game initialized false at startup
@app.on_event("startup")
def setup_game_state():
    app.state.game_started = False
    app.state.round_number = 0

# Routes API
app.include_router(master.router, prefix="/api/master", tags=["Master"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(game.router, prefix="/api/game", tags=["Game"])
app.include_router(hume.router, prefix="/api/hume", tags=["Hume"])


#@app.websocket("/ws/{username}")
#async def websocket_entrypoint(websocket: WebSocket, username: str):
#    await websocket_manager(websocket, username)

@app.websocket("/ws/{username}")
async def websocket_user(websocket: WebSocket, username: str):
    await websocket_manager(websocket, username)
    
@app.websocket("/ws/anon/{uuid}")
async def websocket_anon(websocket: WebSocket, uuid: str):
    await websocket_manager(websocket, f"anon/{uuid}")