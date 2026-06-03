import numpy as np
from PIL import Image
import io

def preprocess_image(image_bytes):
    """
    Preprocesses the uploaded image bytes for model prediction.
    - Opens image bytes
    - Converts to RGB
    - Resizes to 224x224
    - Applies Noise Reduction (OpenCV fastNlMeansDenoisingColored)
    - Applies Background Removal (rembg)
    - Normalizes to [0, 1]
    - Expands dimensions to (1, 224, 224, 3)
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert('RGB')
        
        # Resize first to ensure noise reduction and background removal are extremely fast
        image = image.resize((224, 224), Image.Resampling.LANCZOS)

        # 1. Noise Reduction
        try:
            import cv2
            img_np = np.array(image)
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            denoised_bgr = cv2.fastNlMeansDenoisingColored(img_bgr, None, 10, 10, 7, 21)
            image = Image.fromarray(cv2.cvtColor(denoised_bgr, cv2.COLOR_BGR2RGB))
        except Exception as cv_err:
            print(f"Warning: OpenCV noise reduction failed, skipping. Error: {cv_err}")

        # 2. Background Removal
        try:
            from rembg import remove
            image_no_bg = remove(image)
            if image_no_bg.mode == 'RGBA':
                # Create a black background to replace transparent regions
                black_bg = Image.new("RGBA", image_no_bg.size, (0, 0, 0, 255))
                image = Image.alpha_composite(black_bg, image_no_bg).convert('RGB')
            else:
                image = image_no_bg.convert('RGB')
        except Exception as bg_err:
            print(f"Warning: rembg background removal failed, skipping. Error: {bg_err}")

        final_array = np.array(image).astype(np.float32) / 255.0
        final_array = np.expand_dims(final_array, axis=0)
        return final_array
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None

