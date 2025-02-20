from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models.patient_twin import PatientTwin, HealthMetrics
from .ml.disease_predictor import DiseasePredictor
from .monitoring.health_monitor import HealthMonitor
from datetime import datetime
from typing import Dict, List
from pydantic import BaseModel

# Add request/response models
class PatientRequest(BaseModel):
    name: str
    age: int
    gender: str
    medical_history: list[str] = []
    medications: list[str] = []

class MetricsRequest(BaseModel):
    blood_pressure: tuple[int, int]
    heart_rate: int
    blood_sugar: float
    bmi: float
    temperature: float

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store patients in memory (replace with database in production)
patients: Dict[str, PatientTwin] = {}
predictor = DiseasePredictor()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/patients")
async def get_all_patients():
    return list(patients.values())

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    if patient_id not in patients:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patients[patient_id]

@app.post("/api/patients")
async def create_patient(patient: PatientRequest):
    """Create a new patient"""
    patient_id = str(len(patients) + 1)  # Simple ID generation
    new_patient = PatientTwin(
        patient_id=patient_id,
        medical_history=patient.medical_history,
        medications=patient.medications,
        lab_results={},
        genetic_data={},
        lifestyle_data={"age": patient.age, "gender": patient.gender}
    )
    patients[patient_id] = new_patient
    return {"patient_id": patient_id, "status": "created"}

@app.post("/api/patients/{patient_id}/metrics")
async def update_patient_metrics(patient_id: str, metrics: MetricsRequest):
    if patient_id not in patients:
        patients[patient_id] = PatientTwin(patient_id=patient_id)
    
    health_metrics = HealthMetrics(
        blood_pressure=metrics.blood_pressure,
        heart_rate=metrics.heart_rate,
        blood_sugar=metrics.blood_sugar,
        bmi=metrics.bmi,
        temperature=metrics.temperature,
        timestamp=datetime.now()
    )
    
    await patients[patient_id].update_metrics(health_metrics)
    return {"status": "updated"}

@app.get("/api/patients/{patient_id}/risks")
async def get_patient_risks(patient_id: str):
    if patient_id not in patients:
        raise HTTPException(status_code=404, detail="Patient not found")
    risks = await predictor.predict_disease_risk(patients[patient_id])
    return risks

# Add your API endpoints here 