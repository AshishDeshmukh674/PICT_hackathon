from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import gdown
import zipfile
import pandas as pd
import os
import json
from pathlib import Path

router = APIRouter()

@router.get("/api/fit-data")
async def get_fit_data():
    try:
        # File ID from the shared link
        file_id = "1ITz-4jaXpk_72PJKTyLt_YXIafXmEkAF"
        
        # Construct the direct download URL
        file_url = f"https://drive.google.com/uc?id={file_id}"
        
        # Output filename
        zip_file = "takeout-20250222T085926Z-001.zip"
        
        # Download the file if it doesn't exist
        if not os.path.exists(zip_file):
            gdown.download(file_url, zip_file, quiet=False)
        
        # Extract the zip file
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall('.')
        
        # Path to the CSV file
        csv_path = os.path.join('Takeout', 'Fit', 'Daily activity metrics', 'Daily activity metrics.csv')
        
        # Read the CSV
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            
            # Convert DataFrame to list of dictionaries
            data = df.to_dict('records')
            
            # Clean up extracted files
            if os.path.exists('Takeout'):
                os.system('rm -rf Takeout')
            if os.path.exists(zip_file):
                os.remove(zip_file)
            
            return JSONResponse(content=data)
        else:
            raise HTTPException(status_code=404, detail="CSV file not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 