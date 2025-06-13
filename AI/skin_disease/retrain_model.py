import os
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam

def build_model(num_classes):
    print("\nBuilding model...")
    base_model = EfficientNetB0(weights='imagenet', 
                               include_top=False, 
                               input_shape=(224, 224, 3))
    
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(1024, activation='relu', name='dense_1024')(x)
    predictions = Dense(num_classes, activation='softmax', name='predictions')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    for layer in base_model.layers:
        layer.trainable = False
        
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def save_model(model, model_dir='models'):
    """Save the model using TensorFlow's SavedModel format"""
    os.makedirs(model_dir, exist_ok=True)
    
    # Save the entire model in SavedModel format
    model_path = os.path.join(model_dir, 'dog_model')
    tf.saved_model.save(model, model_path)
    print(f"Model successfully saved to {model_path}")

if __name__ == '__main__':
    model = build_model(num_classes=3)
    save_model(model)
