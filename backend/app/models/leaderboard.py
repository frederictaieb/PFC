from pydantic import BaseModel
from typing import List
from app.models.user import LeaderboardEntry


class LeaderboardResponse(BaseModel):
    winners: List[LeaderboardEntry]
    losers: List[LeaderboardEntry]
    neutrals: List[LeaderboardEntry]