import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from classifier.model import CATEGORIES

# Expected dataset structure: datasets/images/{category}/image.jpg
DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'datasets', 'images'))
WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), 'weights')

def train_model(epochs=10, batch_size=32):
    if not os.path.exists(DATASET_DIR):
        print(f"Dataset directory {DATASET_DIR} not found. Cannot train.")
        return
        
    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    
    # Data augmentation
    datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=30,
        horizontal_flip=True,
        brightness_range=[0.7, 1.3],
        validation_split=0.2
    )
    
    train_generator = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='categorical',
        subset='training'
    )
    
    val_generator = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='categorical',
        subset='validation'
    )
    
    # Transfer learning on MobileNetV2
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False  # Freeze base model
    
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    predictions = Dense(len(CATEGORIES), activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    print("Starting training...")
    history = model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=epochs
    )
    
    weights_path = os.path.join(WEIGHTS_DIR, 'model_weights.h5')
    model.save(weights_path)
    print(f"Model saved to {weights_path}")

if __name__ == "__main__":
    train_model()
