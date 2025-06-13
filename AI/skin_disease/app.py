from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import SkinDiseaseClassifier
import os

app = Flask(__name__)
CORS(app)

# Initialize classifier
classifier = SkinDiseaseClassifier('best_model.pth')

def allowed_file(filename):
    return '.' in filename and filename.lower().endswith(('.png', '.jpg', '.jpeg'))

def generate_recommendation(condition, confidence, species):
    recommendations = {
        'healthy': 'No issues detected. Continue regular care.',
        'allergies': f'Consider {species} allergy testing and environmental changes.',
        'ringworm': 'Highly contagious! Isolate pet and seek veterinary treatment.',
        'fleas': 'Start flea treatment immediately and treat environment.',
        'miliary': 'Veterinary attention needed for this dermatitis condition.'
    }
    
    base_recommendation = recommendations.get(condition, 'Consult your veterinarian.')
    
    if condition != 'healthy' and confidence > 0.8:
        return f"Urgent: {base_recommendation} Schedule vet visit within 24 hours."
    elif condition != 'healthy':
        return f"Recommended: {base_recommendation} Monitor closely."
    return base_recommendation

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
        
    file = request.files['image']
    species = request.form.get('species', '').lower()
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if species not in ['dog', 'cat']:
        return jsonify({'error': 'Invalid species. Must be "dog" or "cat"'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    try:
        # Save temporary file
        temp_path = 'temp_pred.jpg'
        file.save(temp_path)
        
        # Make prediction
        result = classifier.predict(temp_path, species)
        
        if 'error' in result:
            return jsonify(result), 400
            
        # Add recommendation
        result['recommendation'] = generate_recommendation(
            result['prediction'],
            result['confidence'],
            species
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006, debug=True)