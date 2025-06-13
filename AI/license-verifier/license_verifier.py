import cv2
import numpy as np
from flask import Flask, request, jsonify
import pytesseract
import logging
import os
import traceback
pytesseract.pytesseract.tesseract_cmd = r'C:\Users\ASUS\Downloads\tesseract-ocr-w64-setup-5.5.0.20241111 (1).exe'
# Initialize Flask app
app = Flask(__name__)

# Set logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Upload and reference config
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load reference stamp image
REFERENCE_IMAGE_PATH = r"C:\Users\ASUS\PetWeb\GP-Web\newfront\public\assets\stamp7.jpg"
reference_image = cv2.imread(REFERENCE_IMAGE_PATH)

if reference_image is None:
    logger.error("Reference stamp image not found or failed to load!")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_stamp_present(target_image):
    try:
        if reference_image is None:
            logger.error("Reference image not available.")
            return False

        # Convert to grayscale and apply Canny edges
        gray_doc = cv2.cvtColor(target_image, cv2.COLOR_BGR2GRAY)
        gray_stamp = cv2.cvtColor(reference_image, cv2.COLOR_BGR2GRAY)

        doc_edges = cv2.Canny(gray_doc, 50, 200)
        stamp_edges = cv2.Canny(gray_stamp, 50, 200)

        result = cv2.matchTemplate(doc_edges, stamp_edges, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

        logger.info(f"Template match score: {max_val:.3f}")

        # Threshold for detection
        if max_val > 0.05:
            logger.info("✅ Stamp detected in image.")
            return True
        else:
            logger.info("❌ Stamp NOT detected.")
            return False

    except Exception as e:
        logger.error(f"Error in stamp detection: {str(e)}", exc_info=True)
        return False

def contains_required_keywords(image):
    try:
        config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(image, config=config)
        logger.info("OCR text extracted")

        keywords = ["Ministry of Agriculture", "State of Palestine"]
        found = [k for k in keywords if k.lower() in text.lower()]
        logger.info(f"Keywords found: {found}")

        return len(found) > 0
    except Exception as e:
        logger.error(f"OCR error: {str(e)}", exc_info=True)
        return False

@app.route('/verify-license', methods=['POST'])
def verify_license():
    try:
        logger.info("Received request for license verification.")

        if 'licenseImage' not in request.files:
            return jsonify({
                'isValid': False,
                'message': 'No image uploaded',
                'details': {
                    'received_files': list(request.files.keys()),
                    'received_form': list(request.form.keys())
                }
            }), 400

        file = request.files['licenseImage']
        if file.filename == '':
            return jsonify({'isValid': False, 'message': 'No selected file'}), 400

        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({'isValid': False, 'message': 'Invalid image file'}), 400

        logger.info(f"Image shape: {image.shape}")

        # Check for stamp and keywords
        stamp_ok = is_stamp_present(image)
        keywords_ok = contains_required_keywords(image)

        if not stamp_ok:
            return jsonify({'isValid': False, 'message': 'Official stamp not detected'}), 200

        if not keywords_ok:
            return jsonify({'isValid': False, 'message': 'Required keywords not found'}), 200

        return jsonify({
            'isValid': True,
            'message': 'Stamp and required keywords detected'
        })

    except Exception as e:
        logger.error(f"Verification error: {str(e)}", exc_info=True)
        return jsonify({
            'isValid': False,
            'message': 'Error processing license image',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
