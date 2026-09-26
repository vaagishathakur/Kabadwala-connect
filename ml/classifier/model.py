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
            # Deterministic computer vision fallback: color histogram, contrast, and hue spectrum
            try:
                img = Image.open(io.BytesIO(image_bytes)).convert('RGB').resize((64, 64))
                arr = np.array(img, dtype=np.float32)
                
                r = arr[:, :, 0]
                g = arr[:, :, 1]
                b = arr[:, :, 2]
                
                total_pixels = 64 * 64
                
                # Green dominance (PCBs, circuit boards)
                green_mask = (g > r + 15) & (g > b + 15)
                pcb_ratio = float(np.sum(green_mask)) / total_pixels
                
                # Copper / Bronze wire hue (Cables, wiring)
                copper_mask = (r > 120) & (g > 50) & (g < 130) & (b < 70)
                cable_ratio = float(np.sum(copper_mask)) / total_pixels
                
                # Dark screen glass / low luminance (CRT / LCD flat panels)
                brightness = 0.299 * r + 0.587 * g + 0.114 * b
                dark_mask = brightness < 50
                display_ratio = float(np.sum(dark_mask)) / total_pixels
                
                # Metallic gray / Stator casing (Motor, compressor, alternator)
                diff_rg = np.abs(r - g)
                diff_gb = np.abs(g - b)
                metallic_mask = (diff_rg < 15) & (diff_gb < 15) & (brightness >= 70) & (brightness <= 170)
                motor_ratio = float(np.sum(metallic_mask)) / total_pixels
                
                # Lead / battery casing (Heavy dark blocks)
                battery_mask = (diff_rg < 12) & (diff_gb < 12) & (brightness >= 40) & (brightness < 70)
                battery_ratio = float(np.sum(battery_mask)) / total_pixels
                
                # High saturation color casings (Plastics)
                max_c = np.maximum(np.maximum(r, g), b)
                min_c = np.minimum(np.minimum(r, g), b)
                saturation = np.where(max_c > 0, (max_c - min_c) / (max_c + 1e-5), 0)
                plastic_ratio = float(np.sum(saturation > 0.40)) / total_pixels
                
                # Score distribution
                scores = {
                    'PCB': 0.15 + (pcb_ratio * 3.5),
                    'Cable': 0.12 + (cable_ratio * 3.2),
                    'LCD': 0.10 + (display_ratio * 1.5),
                    'CRT': 0.08 + (display_ratio * 1.2),
                    'Motor': 0.10 + (motor_ratio * 2.0),
                    'Battery': 0.08 + (battery_ratio * 2.2),
                    'Plastic': 0.10 + (plastic_ratio * 2.0),
                    'Mixed': 0.20,
                    'Other': 0.07,
                }
                
                total = sum(scores.values())
                norm_scores = {k: round(v / total, 4) for k, v in scores.items()}
                best_cat = max(norm_scores, key=norm_scores.get)
                confidence = min(0.85, max(0.60, norm_scores[best_cat] * 1.4))
                
                return {
                    "category": best_cat,
                    "confidence": round(confidence, 2),
                    "all_scores": norm_scores,
                    "model_type": "deterministic_vision_heuristic",
                    "is_fallback": True,
                    "method": "Deterministic Color & Texture Spectrum Analysis"
                }
            except Exception as e:
                # If image parsing fails, honest explicit fallback to Mixed
                return {
                    "category": "Mixed",
                    "confidence": 0.50,
                    "all_scores": {cat: 0.11 for cat in CATEGORIES},
                    "model_type": "deterministic_fallback",
                    "is_fallback": True,
                    "method": "Image parsing error; defaulted to Mixed"
                }

classifier_instance = None

def get_classifier():
    global classifier_instance
    if classifier_instance is None:
        classifier_instance = MaterialClassifier()
    return classifier_instance
