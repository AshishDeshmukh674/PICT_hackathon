from fastapi import File, UploadFile, HTTPException
from PIL import Image
import io
import os
from inference_sdk import InferenceHTTPClient
from .. import BaseModel

class SkinDiseaseModel(BaseModel):
    def load_model(self):
        try:
            self.client = InferenceHTTPClient(
                api_url="https://outline.roboflow.com",
                api_key="ejX2g8OKP9TO4VxUTvVp"
            )
            # Replace with your Roboflow skin disease model ID
            self.model_id = "skin-disease-detection/1"
            print("Roboflow client initialized successfully")
        except Exception as e:
            print(f"Error initializing Roboflow client: {e}")
            raise RuntimeError(f"Failed to initialize Roboflow client: {e}")

    async def predict(self, file: UploadFile = File(...)):
        try:
            # Read image data
            image_data = await file.read()
            
            # Save temporarily to pass to Roboflow
            temp_path = "temp_image.jpg"
            with open(temp_path, "wb") as f:
                f.write(image_data)
            
            try:
                # Make prediction using Roboflow
                result = self.client.infer(temp_path, model_id=self.model_id)
                
                # Process predictions
                if result and isinstance(result, dict) and 'predictions' in result:
                    predictions = result['predictions']
                    if predictions:
                        # Get the prediction with highest confidence
                        best_pred = max(predictions, key=lambda x: x.get('confidence', 0))
                        
                        return {
                            "prediction": best_pred.get('class', 'Unknown'),
                            "confidence": best_pred.get('confidence', 0.0)
                        }
                
                return {
                    "prediction": "No Disease Detected",
                    "confidence": 0.0
                }
                
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
        except Exception as e:
            print(f"Prediction error: {e}")
            raise HTTPException(status_code=500, detail=str(e)) 