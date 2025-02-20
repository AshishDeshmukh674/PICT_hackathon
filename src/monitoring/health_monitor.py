from typing import List, Dict
import asyncio
from datetime import datetime, timedelta
from ..models.patient_twin import PatientTwin, HealthMetrics

class HealthMonitor:
    def __init__(self, patient_twin: PatientTwin):
        self.patient_twin = patient_twin
        self.alert_thresholds = {
            "blood_pressure_systolic": 140,
            "blood_pressure_diastolic": 90,
            "heart_rate_max": 100,
            "blood_sugar_max": 140
        }
        
    async def monitor_vitals(self) -> None:
        """Continuous monitoring of patient vitals"""
        while True:
            latest_metrics = self.patient_twin.health_metrics[-1]
            alerts = await self._check_vital_thresholds(latest_metrics)
            
            if alerts:
                await self._send_alerts(alerts)
            
            await asyncio.sleep(300)  # Check every 5 minutes
    
    async def _check_vital_thresholds(self, metrics: 'HealthMetrics') -> List[Dict]:
        """Check if any vital signs exceed safe thresholds"""
        alerts = []
        
        if metrics.blood_pressure[0] > self.alert_thresholds["blood_pressure_systolic"]:
            alerts.append({
                "type": "high_blood_pressure",
                "value": metrics.blood_pressure[0],
                "timestamp": datetime.now(),
                "severity": "warning"
            })
            
        return alerts 