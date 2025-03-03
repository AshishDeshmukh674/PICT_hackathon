"use client";
import { useEffect, useState } from 'react';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import HealthDashboard from './_components/HealthDashboard';
import GoogleFitConnect from './_components/GoogleFitConnect';

export default function HealthMonitoring() {
  const { user } = useKindeBrowserClient();
  const [isConnected, setIsConnected] = useState(false);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    // Check if user has connected Google Fit
    checkGoogleFitConnection();
  }, [user]);

  const checkGoogleFitConnection = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/health/connection-status', {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      const data = await response.json();
      setIsConnected(data.isConnected);
      
      if (data.isConnected) {
        fetchHealthData();
      }
    } catch (error) {
      console.error('Error checking Google Fit connection:', error);
    }
  };

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/data', {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Health Monitoring</h1>
      
      {!isConnected ? (
        <GoogleFitConnect onConnect={() => setIsConnected(true)} />
      ) : (
        <HealthDashboard data={healthData} />
      )}
    </div>
  );
} 