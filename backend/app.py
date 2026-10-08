import os
import sys

# 1. Fix sys.path so ml imports work regardless of execution context
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# 2. Set Keras backend to PyTorch before any ML imports
os.environ["KERAS_BACKEND"] = "torch"

from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from ml.preprocess import preprocess_image

try:
    from ml.real_model import predict, warmup
    warmup()
except Exception as e:
    print(f"[FreshScan Backend] Fallback to mock model: {e}")
    from ml.mock_model import predict

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "service": "FreshScan AI API Server",
        "status": "running",
        "endpoints": ["/api/health", "/api/predict"]
    })

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "running",
        "service": "FreshScan Backend API",
        "backend": os.environ.get("KERAS_BACKEND", "torch")
    })

@app.route('/predict', methods=['POST'])
@app.route('/api/predict', methods=['POST'])
def make_prediction():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided in request"}), 400
        
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "Empty file provided"}), 400
        
    try:
        image_bytes = file.read()
        if not image_bytes:
            return jsonify({"error": "Uploaded image file is empty"}), 400

        # Preprocess image
        image_tensor = preprocess_image(image_bytes)
        if image_tensor is None:
            raise ValueError("Failed to preprocess image")

        # Get prediction from ML model (real or fallback)
        result = predict(image_tensor)
        return jsonify(result)
    except Exception as e:
        app.logger.exception("Prediction failed")
        return jsonify({"error": str(e) or "Prediction failed"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', debug=True, port=port)

