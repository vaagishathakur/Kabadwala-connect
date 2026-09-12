# ml/test_endpoints.py
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    print("[OK] Health check passed")

def test_predict_price():
    res = client.post("/predict/price", json={
        "category": "PCB",
        "weight_kg": 10.0,
        "condition": "Good",
        "location": "Mumbai"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "PCB"
    assert data["weight_kg"] == 10.0
    assert data["estimated_value_inr"] > 0
    assert data["range"]["low"] < data["range"]["high"]
    print(f"[OK] Price prediction passed: {data['estimated_value_inr']} INR")

def test_predict_category():
    res = client.post("/predict/category", json={})
    assert res.status_code == 200
    data = res.json()
    assert "predicted_category" in data
    assert "confidence_score" in data
    assert "recommended_sub_category" in data
    print(f"[OK] Category prediction passed: {data['predicted_category']}")

def test_detect_anomaly():
    # Normal transaction
    res = client.post("/detect/anomaly", json={
        "category": "PCB",
        "weight_kg": 5.0,
        "claimed_value": 500.0
    })
    assert res.status_code == 200
    normal_data = res.json()
    assert "is_anomalous" in normal_data

    # Highly anomalous transaction (100,000 INR for 1 kg of PCB)
    res2 = client.post("/detect/anomaly", json={
        "category": "PCB",
        "weight_kg": 1.0,
        "claimed_value": 100000.0
    })
    assert res2.status_code == 200
    anom_data = res2.json()
    assert anom_data["is_anomalous"] == True
    print("[OK] Anomaly detection passed")

if __name__ == "__main__":
    test_health()
    test_predict_price()
    test_predict_category()
    test_detect_anomaly()
    print("ALL ML ENDPOINTS PASSED SUCCESSFULLY!")
