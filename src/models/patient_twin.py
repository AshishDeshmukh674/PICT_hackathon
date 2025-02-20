from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

@dataclass
class HealthMetrics:
    blood_pressure: tuple[int, int]  # systolic, diastolic
    heart_rate: int
    blood_sugar: float
    bmi: float
    temperature: float
    timestamp: datetime

@dataclass
class PatientTwin:
    patient_id: str
    health_metrics: List[HealthMetrics] = None
    medical_history: List[str] = None
    medications: List[str] = None
    lab_results: Dict[str, float] = None
    genetic_data: Dict[str, str] = None
    lifestyle_data: Dict[str, any] = None

    def __post_init__(self):
        self.health_metrics = self.health_metrics or []
        self.medical_history = self.medical_history or []
        self.medications = self.medications or []
        self.lab_results = self.lab_results or {}
        self.genetic_data = self.genetic_data or {}
        self.lifestyle_data = self.lifestyle_data or {}

    def get_features(self) -> List[float]:
        """Extract numerical features for ML models"""
        features = []
        features.extend(list(self.lab_results.values()))
        return features

    async def update_metrics(self, new_metrics: HealthMetrics) -> None:
        """Update patient's health metrics with new data"""
        self.health_metrics.append(new_metrics)
        await self._analyze_health_trends()

    async def _analyze_health_trends(self) -> Dict[str, str]:
        """Analyze recent health metrics for concerning patterns"""
        if not self.health_metrics:
            return {"status": "no data"}
            
        recent_bp = self.health_metrics[-1].blood_pressure
        if recent_bp[0] > 140:  # High blood pressure threshold
            return {"alert": "High blood pressure detected", "severity": "high"}
        return {"status": "normal"}
    
    async def simulate_treatment(self, treatment_plan: Dict) -> Dict[str, float]:
        """Simulate how patient might respond to a treatment based on their profile"""
        # This would integrate with a more complex ML model
        response_probabilities = {
            "efficacy": 0.85,
            "side_effects": 0.15,
            "risk_level": 0.05
        }
        return response_probabilities
    
    async def get_health_recommendations(self) -> List[str]:
        """Generate personalized health recommendations"""
        recommendations = []
        latest_metrics = self.health_metrics[-1] if self.health_metrics else None
        
        if latest_metrics:
            if latest_metrics.bmi > 25:
                recommendations.append("Consider increasing physical activity")
            if latest_metrics.blood_sugar > 140:
                recommendations.append("Monitor carbohydrate intake")
                
        return recommendations 