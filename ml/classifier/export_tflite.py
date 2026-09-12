import os
import tensorflow as tf

def export_tflite():
    weights_path = os.path.join(os.path.dirname(__file__), 'weights', 'model_weights.h5')
    tflite_path = os.path.join(os.path.dirname(__file__), 'weights', 'material_classifier.tflite')
    
    if not os.path.exists(weights_path):
        print(f"Model weights not found at {weights_path}.")
        return
        
    model = tf.keras.models.load_model(weights_path)
    
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    # Quantization for small file size
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    
    tflite_model = converter.convert()
    
    with open(tflite_path, 'wb') as f:
        f.write(tflite_model)
        
    print(f"TFLite model saved to {tflite_path}")

if __name__ == "__main__":
    export_tflite()
