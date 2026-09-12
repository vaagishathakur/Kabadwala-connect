import base64
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from classifier.router import router as classifier_router
from classifier.model import get_classifier
from valuation.router import router as valuation_router
from valuation.model import PriceEstimator
from anomaly.router import router as anomaly_router
from anomaly.detector import AnomalyDetector
from recommendation.router import router as recommendation_router

app = FastAPI(title="KabadConnect ML Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = get_classifier()
estimator = PriceEstimator()
detector = AnomalyDetector()

RECOMMENDED_SUB_CATEGORIES = {
  "PCB": "Motherboards / Telecom Grade",
  "Cable": "Copper Insulated Wiring",
  "Battery": "Lithium-Ion / Lead-Acid",
  "CRT": "Monochrome / Color Picture Tube",
  "LCD": "LED / Backlit Panels",
  "Motor": "Compressor / Alternator",
  "Plastic": "High-Grade ABS / Polycarbonate Casing",
  "Mixed": "Unsorted Consumer Electronics",
  "Other": "Miscellaneous E-Waste Components"
}

class PricePredictRequest(BaseModel):
    category: str
    weight_kg: float
    condition: Optional[str] = "Good"
    location: Optional[str] = "Mumbai"

class AnomalyDetectRequest(BaseModel):
    category: str
    weight_kg: float
    claimed_value: float

@app.post("/predict/category")
async def predict_category(request: Request):
    """
    Predict material category and sub-category from base64 JSON or multipart upload
    """
    image_bytes = None
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file = form.get("file")
            if file and hasattr(file, "read"):
                image_bytes = await file.read()
        except Exception:
            pass
    else:
        try:
            body = await request.json()
            raw_b64 = body.get("image_base64")
            if raw_b64:
                if "," in raw_b64:
                    raw_b64 = raw_b64.split(",")[1]
                image_bytes = base64.b64decode(raw_b64)
        except Exception:
            pass

    if not image_bytes:
        image_bytes = b"\x00" * 1024

    result = classifier.predict(image_bytes)
    cat = result.get("category", "PCB")
    return {
        "predicted_category": cat,
        "confidence_score": float(result.get("confidence", 0.92)),
        "recommended_sub_category": RECOMMENDED_SUB_CATEGORIES.get(cat, "General E-Waste"),
        "all_scores": result.get("all_scores", {}),
    }

@app.post("/predict/price")
def predict_price(req: PricePredictRequest):
    """
    Calculate fair price estimate with upper/lower fair-market thresholds
    """
    city = req.location or "Mumbai"
    res = estimator.predict(req.category, city)
    unit_price = res["estimated_price"]
    
    cond_factor = 1.0
    if req.condition == "Damaged":
        cond_factor = 0.85
    elif req.condition == "Good":
        cond_factor = 1.1

    adjusted_unit = unit_price * cond_factor
    total_val = +(adjusted_unit * req.weight_kg)
    low_val = +(res["confidence_interval"][0] * cond_factor * req.weight_kg)
    high_val = +(res["confidence_interval"][1] * cond_factor * req.weight_kg)

    return {
        "category": req.category,
        "weight_kg": req.weight_kg,
        "estimated_value_inr": round(total_val, 2),
        "price_per_kg": round(adjusted_unit, 2),
        "range": {
            "low": round(low_val, 2),
            "high": round(high_val, 2),
        },
        "confidence": 0.88 if estimator.model else 0.75,
    }

@app.post("/detect/anomaly")
def detect_anomaly(req: AnomalyDetectRequest):
    """
    Runs Isolation Forest / rule-based anomaly check on weight and claimed value
    """
    unit_claimed = req.claimed_value / req.weight_kg if req.weight_kg > 0 else 0
    res = detector.detect(req.category, "Mumbai", unit_claimed)
    
    volume_anomalous = req.weight_kg > 500 or req.weight_kg < 0.05
    is_anomalous = res["is_anomaly"] or volume_anomalous

    confidence = res["anomaly_score"] if res["anomaly_score"] > 0 else (0.85 if is_anomalous else 0.95)

    return {
        "is_anomalous": bool(is_anomalous),
        "confidence": float(confidence),
        "expected_unit_range_inr": res["expected_range"],
        "claimed_unit_price_inr": round(unit_claimed, 2),
        "z_score": res["z_score"],
    }

app.include_router(classifier_router, prefix="/classify", tags=["classification"])
app.include_router(valuation_router, prefix="/estimate", tags=["valuation"])
app.include_router(anomaly_router, prefix="/anomaly", tags=["anomaly"])
app.include_router(recommendation_router, prefix="/recommend", tags=["recommendation"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "KabadConnect ML", "port": 8001}
