from fastapi import File, UploadFile, HTTPException
from PIL import Image
import io
import os
import torch
import torchvision.transforms as T
from .. import BaseModel

class SkinDiseaseModel(BaseModel):
    def load_model(self):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(current_dir, 'weights', 'skin-model-pokemon.pt')
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found at {model_path}")
                
            print(f"Loading model from: {model_path}")
            
            # Load the entire model, not just state dict
            self.model = torch.load(model_path, map_location=torch.device('cpu'))
            self.model.eval()
            
            # Define classes as in original code
            self.classes = [
                'acanthosis-nigricans',
                'acne',
                'acne-scars',
                'alopecia-areata',
                'dry',
                'melasma',
                'oily',
                'vitiligo',
                'warts'
            ]
            
            print("Model loaded successfully")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise RuntimeError(f"Failed to load skin disease model: {e}")

    def get_transforms(self):
        transform = []
        transform.append(T.Resize((512, 512)))
        transform.append(T.ToTensor())
        return T.Compose(transform)

    async def predict(self, file: UploadFile = File(...)):
        try:
            # Read and process image
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            
            # Get transforms
            tr = self.get_transforms()
            
            # Transform image
            img_tensor = tr(image)
            
            # Make prediction
            with torch.no_grad():
                out = self.model(img_tensor.unsqueeze(0))
                pred, idx = torch.max(out, 1)
                
                prediction = {
                    "prediction": self.classes[idx.item()],
                    "confidence": float(pred.item())
                }
                
                return prediction
                
        except Exception as e:
            print(f"Prediction error: {e}")
            raise HTTPException(status_code=500, detail=str(e)) 