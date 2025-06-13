import os
import numpy as np
from PIL import Image, ImageFile
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Configure image loading
ImageFile.LOAD_TRUNCATED_IMAGES = True

class SafeImageDataGenerator(ImageDataGenerator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def _get_batches_of_transformed_samples(self, index_array):
        batch_x = []
        batch_y = []
        
        for idx in index_array:
            try:
                # Get single item batch
                x, y = super()._get_batches_of_transformed_samples([idx])
                batch_x.append(x[0])
                batch_y.append(y[0])
            except Exception as e:
                print(f"Skipping corrupted image (index {idx}): {str(e)}")
                continue
                
        if not batch_x:
            return np.zeros((0,) + self.image_shape), np.zeros((0, len(self.class_indices)))
            
        return np.array(batch_x), np.array(batch_y)

def build_model(num_classes):
    base_model = EfficientNetB0(weights='imagenet', include_top=False)
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(1024, activation='relu')(x)
    predictions = Dense(num_classes, activation='softmax')(x)
    model = Model(inputs=base_model.input, outputs=predictions)
    
    for layer in base_model.layers:
        layer.trainable = False
        
    model.compile(
        optimizer=Adam(0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def train_model():
    dataset_path = os.path.join('datasets', 'dog')
    
    # Verify all images are JPG/PNG
    for root, _, files in os.walk(dataset_path):
        for file in files:
            if not file.lower().endswith(('.jpg', '.jpeg', '.png')):
                raise ValueError(f"Invalid image format: {file}. Only JPG/PNG allowed.")
    
    train_datagen = SafeImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True
    )

    train_generator = train_datagen.flow_from_directory(
        dataset_path,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='training'
    )
    
    model = build_model(train_generator.num_classes)
    model.fit(train_generator, epochs=5)
    
    os.makedirs('models', exist_ok=True)
    model.save(os.path.join('models', 'dog_model.h5'))

if __name__ == '__main__':
    print("=== Starting Training ===")
    try:
        train_model()
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        print("\nFinal Troubleshooting Steps:")
        print("1. Manually inspect your dataset folder for non-image files")
        print("2. Run this command to find problematic files:")
        print('   find datasets/dog/ -type f -exec file {} \; | grep -v "JPEG\|PNG"')
        print("3. Consider recreating your dataset with only JPG/PNG images")
        print("4. As last resort, try this nuclear option:")
        print('   find datasets/dog/ -type f ! -name "*.jpg" ! -name "*.jpeg" ! -name "*.png" -delete')
