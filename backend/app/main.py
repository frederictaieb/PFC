from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.routes import user, game
from app.routes import websocket as ws_route

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

# Routes API
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(game.router, prefix="/api/game", tags=["Game"])

# WebSocket
@app.websocket("/ws/{username}")
async def websocket_entrypoint(websocket: WebSocket, username: str):
    await ws_route.websocket_endpoint(websocket, username)