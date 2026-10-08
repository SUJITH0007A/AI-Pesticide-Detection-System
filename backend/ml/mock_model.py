import random
import time

def predict(image_tensor=None):
    """
    A robust mock model prediction function.
    Returns realistic predictions matching the trained CNN output schema.
    """
    time.sleep(0.1)
    
    mapping = [
        {
            "category": "Organic / Naturally Grown",
            "label": "Healthy / Organic Produce",
            "risk_level": "Low Risk"
        },
        {
            "category": "Possibly Chemically Treated",
            "label": "Surface Wax / Light Chemical Treatment",
            "risk_level": "Moderate Risk"
        },
        {
            "category": "High Pesticide Treatment Probability",
            "label": "High Pesticide Residue Detected",
            "risk_level": "High Risk"
        }
    ]
    
    choice = random.choice(mapping)
    category = choice["category"]
    
    if category == "Organic / Naturally Grown":
        confidence = random.uniform(88.0, 99.5)
        p1 = confidence
        p2 = random.uniform(0.1, 100 - p1 - 0.1)
        p3 = round(100 - p1 - p2, 2)
    elif category == "Possibly Chemically Treated":
        confidence = random.uniform(65.0, 85.0)
        p2 = confidence
        p1 = random.uniform(5.0, 100 - p2 - 5.0)
        p3 = round(100 - p1 - p2, 2)
    else:
        confidence = random.uniform(82.0, 99.0)
        p3 = confidence
        p1 = random.uniform(0.1, 100 - p3 - 0.1)
        p2 = round(100 - p1 - p3, 2)
        
    prob_breakdown = {
        "Healthy / Organic Produce": round(p1, 2),
        "Surface Wax / Light Chemical Treatment": round(p2, 2),
        "High Pesticide Residue Detected": round(p3, 2)
    }

    return {
        "category": category,
        "confidence": round(confidence, 2),
        "detected_label": choice["label"],
        "risk_level": choice["risk_level"],
        "model_used": "MobileNetV2 (High-Speed Engine)",
        "all_probabilities": prob_breakdown
    }

