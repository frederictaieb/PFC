from fastapi import APIRouter
from app.core.playerManager import player_pool

router = APIRouter()

@router.get("/api/helloworld")
async def helloworld():
    return {"message": "Hello from FastAPI!"}

@router.get("/api/create_player")
async def create_player(username: str):
    p = await player_pool.create(username)
    return {"message": "Player created", "player": p}
