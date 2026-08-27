from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from ml.preprocess import preprocess_image
try:
    from ml.real_model import predict
except Exception as e:
    print(f"Fallback to mock model: {e}")
    from ml.mock_model import predict

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return redirect('http://localhost:5173/')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "running"})

@app.route('/api/predict', methods=['POST'])
def make_prediction():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
        
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "Empty file provided"}), 400
        
    image_bytes = file.read()

    try:
        # Preprocess image
        image_tensor = preprocess_image(image_bytes)
        if image_tensor is None:
            raise ValueError("Failed to process image")

        # Get prediction from mock model
        result = predict(image_tensor)
        return jsonify(result)
    except Exception as e:
        app.logger.exception("Prediction failed")
        return jsonify({"error": str(e) or "Prediction failed"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
