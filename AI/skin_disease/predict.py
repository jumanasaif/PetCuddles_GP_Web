import torch
from torchvision import transforms, models
from PIL import Image
import numpy as np
import os

class SkinDiseaseClassifier:
    def __init__(self, model_path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model, self.class_names = self._load_model(model_path)
        self.transform = self._get_transform()
        
    def _load_model(self, model_path):
        checkpoint = torch.load(model_path, map_location=self.device)
        class_names = checkpoint['class_names']
        
        model = models.resnet50(weights=None)
        num_ftrs = model.fc.in_features
        model.fc = torch.nn.Linear(num_ftrs, len(class_names))
        model.load_state_dict(checkpoint['model_state_dict'])
        model = model.to(self.device)
        model.eval()
        
        return model, class_names
    
    def _get_transform(self):
        return transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    def predict(self, image_path, species):
        """Predict skin condition for specific species"""
        try:
            # Filter classes for the specified species
            species_classes = [c for c in self.class_names if c.startswith(species + '_')]
            if not species_classes:
                raise ValueError(f"No classes found for species: {species}")
            
            # Get indices of species-specific classes
            class_indices = [self.class_names.index(c) for c in species_classes]
            
            # Process image
            image = Image.open(image_path).convert('RGB')
            image = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(image)
                probs = torch.nn.functional.softmax(outputs, dim=1)
                
                # Get probabilities only for the specified species
                species_probs = probs[0][class_indices]
                conf, pred_idx = torch.max(species_probs, 0)
                
                # Get the full class name and base condition
                full_pred = species_classes[pred_idx]
                base_condition = full_pred.replace(f"{species}_", "")
                
                # Get all probabilities for the species
                prob_dict = {
                    c.replace(f"{species}_", ""): float(p)
                    for c, p in zip(species_classes, species_probs)
                }
            
            return {
                'species': species,
                'prediction': base_condition,
                'full_prediction': full_pred,
                'confidence': float(conf),
                'class_probabilities': prob_dict
            }
            
        except Exception as e:
            return {'error': str(e)}

if __name__ == '__main__':
    # Example usage
    classifier = SkinDiseaseClassifier('best_model.pth')
    
    # Test prediction for dog
    dog_result = classifier.predict('test_dog.jpg', 'dog')
    print("Dog Prediction:", dog_result)
    
    # Test prediction for cat
    cat_result = classifier.predict('test_cat.jpg', 'cat')
    print("Cat Prediction:", cat_result)
