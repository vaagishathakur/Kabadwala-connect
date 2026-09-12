from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from recommendation.scorer import RecyclerRecommender

router = APIRouter()
recommender = RecyclerRecommender()

class LotData(BaseModel):
    category: str
    weight_kg: float

class RecommendRequest(BaseModel):
    lot: LotData
    collector_lat: float
    collector_lng: float
    recyclers: List[Dict[str, Any]]

@router.post("")
def recommend_recyclers(request: RecommendRequest):
    ranked = recommender.rank(
        lot=request.lot.dict(),
        recyclers=request.recyclers,
        collector_lat=request.collector_lat,
        collector_lng=request.collector_lng
    )
    
    return {"recommendations": ranked}
