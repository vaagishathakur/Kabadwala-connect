from fastapi import APIRouter
from pydantic import BaseModel
from anomaly.detector import AnomalyDetector

router = APIRouter()
detector = AnomalyDetector()

class AnomalyRequest(BaseModel):
    category: str
    location_city: str
    quoted_price_inr: float

@router.post("")
def detect_anomaly(request: AnomalyRequest):
    result = detector.detect(request.category, request.location_city, request.quoted_price_inr)
    
    message = "Price is within normal range."
    if result["is_anomaly"]:
        message = f"Anomaly detected. Expected range: {result['expected_range'][0]}-{result['expected_range'][1]}"
        
    return {
        "is_anomaly": result["is_anomaly"],
        "anomaly_score": result["anomaly_score"],
        "expected_range": result["expected_range"],
        "z_score": result["z_score"],
        "message": message
    }
