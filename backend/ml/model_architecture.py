import os
os.environ["KERAS_BACKEND"] = "torch"
import keras
from keras.applications import MobileNetV2
from keras.layers import Dense, GlobalAveragePooling2D, Dropout
from keras import Model

def create_pesticide_detection_model(input_shape=(224, 224, 3), num_classes=3):
    """
    Builds the CNN architecture based on MobileNetV2.
    This model is designed to extract features related to:
    - Color uniformity
    - Surface texture (smoothness, polish, wax)
    - Chemical burn marks
    """
    # 1. Base Model for feature extraction
    # MobileNetV2 is lightweight and effective at capturing fine-grained visual details
    base_model = MobileNetV2(
        weights='imagenet', 
        include_top=False, 
        input_shape=input_shape
    )
    
    # Freeze the base model layers initially (to train only the top layers first)
    base_model.trainable = False
    
    # 2. Custom Classification Head
    x = base_model.output
    x = GlobalAveragePooling2D(name='global_avg_pooling')(x)
    
    # Add a fully connected layer to learn relationships between extracted features
    x = Dense(256, activation='relu', name='dense_features')(x)
    x = Dropout(0.5, name='dropout')(x) # Prevent overfitting
    
    # Output layer for the 3 categories:
    # 0: Organic / Naturally Grown
    # 1: Possibly Chemically Treated
    # 2: High Pesticide Treatment Probability
    predictions = Dense(num_classes, activation='softmax', name='classification_output')(x)
    
    # 3. Compile the Model
    model = Model(inputs=base_model.input, outputs=predictions)
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

if __name__ == "__main__":
    # Test the architecture creation
    model = create_pesticide_detection_model()
    model.summary()
    print("Model architecture built successfully. Ready for dataset training.")

