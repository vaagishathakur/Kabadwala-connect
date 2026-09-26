import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
from valuation.model import PriceEstimator
from classifier.train import train_model

DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'datasets'))
GROUND_TRUTH_FILE = os.path.join(DATASETS_DIR, 'ground_truth.json')
SEED_PRICES_FILE = os.path.join(DATASETS_DIR, 'seed_prices.csv')
IMAGES_DIR = os.path.join(DATASETS_DIR, 'images')

def load_training_data():
    """
    Combines baseline seed prices with ground-truth completed transaction history
    """
    records = []

    # 1. Load seed baseline records if present
    if os.path.exists(SEED_PRICES_FILE):
        try:
            df_seed = pd.read_csv(SEED_PRICES_FILE)
            for _, row in df_seed.iterrows():
                records.append({
                    'category': str(row.get('material_category', row.get('category', 'Mixed'))),
                    'location_city': str(row.get('location_city', 'Mumbai')),
                    'date_recorded': str(row.get('date_recorded', datetime.now().strftime('%Y-%m-%d'))),
                    'buying_price_inr': float(row.get('buying_price_inr', 50)),
                    'source': 'seed'
                })
        except Exception as e:
            print(f"Warning reading seed prices: {e}")

    # 2. Load ground-truth verified transaction records
    if os.path.exists(GROUND_TRUTH_FILE):
        try:
            with open(GROUND_TRUTH_FILE, 'r', encoding='utf-8') as f:
                gt_data = json.load(f)
            for item in gt_data:
                unit_rate = item.get('unit_rate_inr_kg')
                if unit_rate and unit_rate > 0:
                    records.append({
                        'category': item.get('ground_truth_category', 'Mixed'),
                        'location_city': 'Mumbai',
                        'date_recorded': item.get('verified_timestamp', datetime.now().isoformat())[:10],
                        'buying_price_inr': float(unit_rate),
                        'source': 'ground_truth_transaction'
                    })
        except Exception as e:
            print(f"Warning reading ground-truth records: {e}")

    if not records:
        # Default safety baseline
        from valuation.price_rules import BASELINE_PRICES
        for cat, val in BASELINE_PRICES.items():
            records.append({
                'category': cat,
                'location_city': 'Mumbai',
                'date_recorded': datetime.now().strftime('%Y-%m-%d'),
                'buying_price_inr': float(val['base']),
                'source': 'default_baseline'
            })

    return pd.DataFrame(records)

def retrain_price_model():
    print("--- [Retrain] Loading price training data ---")
    df = load_training_data()
    print(f"Loaded {len(df)} total price training observations (Ground-truth transactions: {len(df[df['source'] == 'ground_truth_transaction'])})")

    estimator = PriceEstimator()
    df_clean = df[['category', 'location_city', 'date_recorded', 'buying_price_inr']].copy()
    estimator.train(df_clean)
    print("SUCCESS: GradientBoostingRegressor retrained and saved to valuation/model.joblib")

    # Evaluate on test predictions
    test_eval = {}
    for cat in ['PCB', 'Cable', 'Battery', 'Plastic', 'Mixed']:
        pred = estimator.predict(cat, 'Mumbai')
        test_eval[cat] = {
            'predicted_rate_inr': round(pred['estimated_price'], 2),
            'confidence_range': [round(x, 2) for x in pred['confidence_interval']]
        }

    return {
        'observations_count': len(df),
        'ground_truth_transactions': len(df[df['source'] == 'ground_truth_transaction']),
        'evaluations': test_eval,
        'retrained_at': datetime.now().isoformat()
    }

def check_and_retrain_vision_model():
    """
    Checks if enough ground-truth images have accumulated in datasets/images to run MobileNetV2 fine-tuning
    """
    print("\n--- [Retrain] Checking ground-truth image dataset ---")
    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR, exist_ok=True)

    category_counts = {}
    for cat in os.listdir(IMAGES_DIR):
        cat_path = os.path.join(IMAGES_DIR, cat)
        if os.path.isdir(cat_path):
            imgs = [f for f in os.listdir(cat_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            category_counts[cat] = len(imgs)

    total_images = sum(category_counts.values())
    print(f"Total accumulated images across classes: {total_images} ({category_counts})")

    # If at least 20 images per class across top 3 classes, trigger MobileNetV2 transfer learning
    qualifying_classes = [c for c, count in category_counts.items() if count >= 10]
    if len(qualifying_classes) >= 3:
        print(f"Dataset threshold met for classes {qualifying_classes}. Triggering MobileNetV2 training...")
        train_model(epochs=5, batch_size=8)
        return {"status": "trained", "image_count": total_images, "classes": category_counts}
    else:
        print(f"Image dataset accumulating ({total_images} images). Heuristic color/texture vision model active until threshold reached.")
        return {"status": "accumulating", "image_count": total_images, "classes": category_counts}

def run_retrain_pipeline():
    price_res = retrain_price_model()
    vision_res = check_and_retrain_vision_model()
    return {
        "status": "completed",
        "price_model": price_res,
        "vision_model": vision_res,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    result = run_retrain_pipeline()
    print("\n================ RETRAIN PIPELINE COMPLETED ================")
    print(json.dumps(result, indent=2))
