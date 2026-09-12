from fastapi import APIRouter
from pydantic import BaseModel
from valuation.model import PriceEstimator
from valuation.price_rules import BASELINE_PRICES

router = APIRouter()
estimator = PriceEstimator()

class EstimateRequest(BaseModel):
    category: str
    weight_kg: float
    location_city: str

@router.post("")
def estimate_price(request: EstimateRequest):
    result = estimator.predict(request.category, request.location_city)
    price_per_kg = result["estimated_price"]
    total_val = price_per_kg * request.weight_kg
    
    return {
        "estimated_value_inr": total_val,
        "price_per_kg": price_per_kg,
        "range": {
            "low": result["confidence_interval"][0] * request.weight_kg,
            "high": result["confidence_interval"][1] * request.weight_kg
        },
        "confidence": 0.85 if estimator.model else 0.5
    }

@router.get("/rates")
def get_rates(city: str = "Default"):
    rates = {}
    for cat in BASELINE_PRICES.keys():
        res = estimator.predict(cat, city)
        rates[cat] = {
            "estimated_price": res["estimated_price"],
            "range": res["confidence_interval"]
        }
    return rates
