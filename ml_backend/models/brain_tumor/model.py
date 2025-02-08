from fastapi import File, UploadFile, HTTPException
from PIL import Image
import io
import os
from ultralytics import YOLO
from .. import BaseModel
from .utils import transform_image

class BrainTumorModel(BaseModel):
    def load_model(self):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(current_dir, 'weights', 'brain_tumor-best.pt')
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found at {model_path}")
                
            print(f"Loading model from: {model_path}")
            self.model = YOLO(model_path)  # Load with YOLO
            print("Model loaded successfully")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise RuntimeError(f"Failed to load brain tumor model: {e}")

    async def predict(self, file: UploadFile = File(...)):
        try:
            # Read and save image temporarily
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
            
            # Run inference
            results = self.model(image)[0]  # Get first result
            
            # Process results
            if len(results.boxes) > 0:
                # Get the box with highest confidence
                best_box = results.boxes[0]
                confidence = float(best_box.conf[0])
                
                return {
                    "prediction": "Tumor Detected",
                    "confidence": confidence,
                    "box": best_box.xyxy[0].tolist()  # Bounding box coordinates
                }
            else:
                return {
                    "prediction": "No Tumor Detected",
                    "confidence": 0.0
                }
                
        except Exception as e:
            print(f"Prediction error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
