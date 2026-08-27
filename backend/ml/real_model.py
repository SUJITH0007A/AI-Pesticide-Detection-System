import os
import numpy as np

# Set Keras backend to PyTorch or default
os.environ["KERAS_BACKEND"] = "torch"

_model = None

CLASS_MAPPING = {
    0: {
        "category": "Organic / Naturally Grown",
        "label": "Healthy / Organic Apple",
        "risk_level": "Low Risk"
    },
    1: {
        "category": "Possibly Chemically Treated",
        "label": "Surface Wax / Light Treatment",
        "risk_level": "Moderate Risk"
    },
    2: {
        "category": "Possibly Chemically Treated",
        "label": "Post-Harvest Chemical Spray",
        "risk_level": "Moderate Risk"
    },
    3: {
        "category": "High Pesticide Treatment Probability",
        "label": "High Pesticide Residue",
        "risk_level": "High Risk"
    }
}

def load_trained_model():
    global _model
    if _model is not None:
        return _model
        
    import keras
    
    # Check for .keras model file
    ml_dir = os.path.dirname(__file__)
    keras_file = os.path.join(ml_dir, "apple_mobilenetv2_final.keras")
    root_file = os.path.abspath(os.path.join(ml_dir, "..", "..", "apple_mobilenetv2_final.keras"))
    
    if os.path.exists(keras_file):
        model_path = keras_file
    elif os.path.exists(root_file):
        model_path = root_file
    else:
        model_path = os.path.join(ml_dir, "apple_mobilenetv2_final.keras.zip")
    
    try:
        print(f"[FreshScan ML] Loading trained CNN model from: {model_path}")
        _model = keras.models.load_model(model_path)
        print("[FreshScan ML] Trained MobileNetV2 CNN model loaded successfully!")
        return _model
    except Exception as e:
        print(f"[FreshScan ML] Warning: Could not load keras model: {e}")
        return None

def predict(image_tensor):
    """
    Makes a prediction on an image tensor using the trained MobileNetV2 Keras model.
    Input tensor shape: (224, 224, 3) with float values [0, 1] or [0, 255]
    """
    model = load_trained_model()
    
    if model is None:
        # Fallback if model fails to load
        from ml.mock_model import predict as mock_predict
        return mock_predict(image_tensor)
        
    try:
        # Ensure image has shape (1, 224, 224, 3)
        if len(image_tensor.shape) == 3:
            input_batch = np.expand_dims(image_tensor, axis=0)
        else:
            input_batch = image_tensor
            
        # Scale to [0, 255] if input is in [0, 1] as MobileNetV2 rescaling layer expects
        if np.max(input_batch) <= 1.0:
            input_batch = input_batch * 255.0
            
        predictions = model.predict(input_batch, verbose=0)[0]
        
        best_idx = int(np.argmax(predictions))
        confidence = float(predictions[best_idx]) * 100.0
        
        info = CLASS_MAPPING.get(best_idx, CLASS_MAPPING[0])
        
        prob_breakdown = {}
        for idx, pred in enumerate(predictions):
            c_name = CLASS_MAPPING.get(idx, {}).get("label", f"Class {idx}")
            prob_breakdown[c_name] = round(float(pred) * 100.0, 2)
            
        return {
            "category": info["category"],
            "confidence": round(confidence, 2),
            "detected_label": info["label"],
            "risk_level": info["risk_level"],
            "model_used": "MobileNetV2 (Trained CNN - Apple Dataset)",
            "all_probabilities": prob_breakdown
        }
    except Exception as e:
        print(f"[FreshScan ML] Inference exception: {e}")
        from ml.mock_model import predict as mock_predict
        return mock_predict(image_tensor)
