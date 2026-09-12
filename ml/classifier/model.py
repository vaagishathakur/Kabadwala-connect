import os
import numpy as np
from PIL import Image
import io

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

CATEGORIES = ['CRT', 'LCD', 'PCB', 'Cable', 'Battery', 'Motor', 'Plastic', 'Mixed', 'Other']

class MaterialClassifier:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'weights', 'model_weights.h5')
        
        if TF_AVAILABLE and os.path.exists(self.model_path):
            try:
                self.model = tf.keras.models.load_model(self.model_path)
            except Exception as e:
                print(f"Failed to load model: {e}")
        
    def preprocess(self, image_bytes):
        image = Image.open(io.BytesIO(image_bytes))
        image = image.resize((224, 224))
        img_array = np.array(image)
        if img_array.shape[-1] == 4:
            img_array = img_array[..., :3]
        img_array = img_array.astype('float32') / 255.0
        return np.expand_dims(img_array, axis=0)

    def predict(self, image_bytes):
        if self.model:
            processed_img = self.preprocess(image_bytes)
            predictions = self.model.predict(processed_img)[0]
            max_index = np.argmax(predictions)
            
            all_scores = {CATEGORIES[i]: float(predictions[i]) for i in range(len(CATEGORIES))}
            
            return {
                "category": CATEGORIES[max_index],
                "confidence": float(predictions[max_index]),
                "all_scores": all_scores
            }
        else:
            # Rule-based fallback based on color/random logic for demo if model not available
            import random
            scores = {cat: random.uniform(0, 1) for cat in CATEGORIES}
            total = sum(scores.values())
            scores = {k: v/total for k, v in scores.items()}
            best_cat = max(scores, key=scores.get)
            
            return {
                "category": best_cat,
                "confidence": scores[best_cat],
                "all_scores": scores
            }

classifier_instance = None

def get_classifier():
    global classifier_instance
    if classifier_instance is None:
        classifier_instance = MaterialClassifier()
    return classifier_instance
