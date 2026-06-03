import random
import time

def predict(image_tensor):
    """
    A mock model prediction function.
    Returns a random category and confidence score.
    """
    # Simulate a short processing delay for realism without slowing the app.
    time.sleep(0.2)
    
    categories = [
        "Organic / Naturally Grown", 
        "Possibly Chemically Treated", 
        "High Pesticide Treatment Probability"
    ]
    
    # Generate random prediction
    category = random.choice(categories)
    
    # Generate mock confidence score based on category
    if category == "Organic / Naturally Grown":
        score = random.uniform(85.0, 99.9)
    elif category == "Possibly Chemically Treated":
        score = random.uniform(50.0, 84.9)
    else:
        score = random.uniform(80.0, 99.9)
        
    return {
        "category": category,
        "confidence": round(score, 2),
        "model_used": "MobileNetV2 (Mock)"
    }
