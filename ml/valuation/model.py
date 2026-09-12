import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from datetime import datetime
from valuation.price_rules import BASELINE_PRICES

class PriceEstimator:
    def __init__(self):
        self.model = None
        self.features = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'model.joblib')
        self.load()
        
    def load(self):
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data['model']
            self.features = data['features']
            
    def save(self):
        if self.model:
            joblib.dump({'model': self.model, 'features': self.features}, self.model_path)
            
    def train(self, df):
        # df expects: category, location_city, date_recorded, buying_price_inr
        df['date_recorded'] = pd.to_datetime(df['date_recorded'])
        df['month'] = df['date_recorded'].dt.month
        df['day_of_week'] = df['date_recorded'].dt.dayofweek
        
        # One-hot encoding
        df_encoded = pd.get_dummies(df, columns=['category', 'location_city'])
        
        X = df_encoded.drop(columns=['buying_price_inr', 'date_recorded', 'sub_category', 'location_state', 'unit', 'market_range_low', 'market_range_high'], errors='ignore')
        y = df['buying_price_inr']
        
        self.features = list(X.columns)
        
        self.model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.model.fit(X, y)
        self.save()
        
    def predict(self, category, city, date=None):
        if not date:
            date = datetime.now()
            
        if not self.model:
            # Fall back to rule-based
            if category in BASELINE_PRICES:
                base = BASELINE_PRICES[category]['base']
                r_low, r_high = BASELINE_PRICES[category]['range']
                return {
                    "estimated_price": base,
                    "confidence_interval": [r_low, r_high]
                }
            return {"estimated_price": 0, "confidence_interval": [0, 0]}
            
        # Prepare input for model
        input_dict = {f: 0 for f in self.features}
        input_dict['month'] = date.month
        input_dict['day_of_week'] = date.weekday()
        
        cat_feat = f'category_{category}'
        city_feat = f'location_city_{city}'
        
        if cat_feat in input_dict:
            input_dict[cat_feat] = 1
        if city_feat in input_dict:
            input_dict[city_feat] = 1
            
        input_df = pd.DataFrame([input_dict])
        pred = self.model.predict(input_df)[0]
        
        # Simple confidence interval heuristic based on base prices
        variation = 0.2 * pred
        
        return {
            "estimated_price": float(pred),
            "confidence_interval": [float(pred - variation), float(pred + variation)]
        }
