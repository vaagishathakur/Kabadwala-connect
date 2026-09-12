import os
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from valuation.price_rules import BASELINE_PRICES

class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'model.joblib')
        self.load()
        
    def load(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            
    def save(self):
        if self.model:
            joblib.dump(self.model, self.model_path)
            
    def fit(self, price_records):
        # price_records: list of floats
        if len(price_records) > 10:
            X = np.array(price_records).reshape(-1, 1)
            self.model = IsolationForest(contamination=0.05, random_state=42)
            self.model.fit(X)
            self.save()
            
    def detect(self, category, city, price):
        is_anomaly = False
        score = 0.0
        z_score = 0.0
        
        # Rule based expected range fallback
        if category in BASELINE_PRICES:
            low, high = BASELINE_PRICES[category]['range']
        else:
            low, high = (0, 0)
            
        if self.model:
            # -1 for anomaly, 1 for normal
            pred = self.model.predict([[price]])[0]
            # score is negative for anomalies
            raw_score = self.model.decision_function([[price]])[0] 
            is_anomaly = bool(pred == -1)
            score = float(abs(min(0, raw_score)))
        else:
            # Fallback z-score method if model not trained
            if low != 0 and high != 0:
                mean = (low + high) / 2
                std = (high - low) / 4 # approx
                z_score = (price - mean) / std if std > 0 else 0
                
                if abs(z_score) > 2.0:
                    is_anomaly = True
                    score = min(1.0, abs(z_score) / 5.0)
                    
        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": score,
            "expected_range": [low, high],
            "z_score": float(z_score)
        }
