"use client"
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Activity, Heart } from 'lucide-react';
import { initializeNotifications, sendHealthAlert } from '../services/notificationService';

const HealthMonitoringDashboard = () => {
  const [currentMetrics, setCurrentMetrics] = useState({
    bloodPressure: 'NA',
    heartRate: 'NA'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [riskFactors, setRiskFactors] = useState([]);
  const [keyFindings, setKeyFindings] = useState([]);

  // Fetch data from medical_metrics.json
  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/output/metrics/medical_metrics.json');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        
        const data = await response.json();
        
        // Set current metrics
        setCurrentMetrics({
          bloodPressure: data.blood_pressure,
          heartRate: data.heart_rate
        });

        // Set risk factors and key findings
        setRiskFactors(data.risk_factors);
        setKeyFindings(data.key_findings);

      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to load health metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetricsData();
  }, []);

  useEffect(() => {
    // Initialize notifications when component mounts
    const setupNotifications = async () => {
      try {
        const token = await initializeNotifications();
        setNotificationsSupported(!!token);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setNotificationsSupported(false);
      }
    };
    setupNotifications();
  }, []);

  // Add notification effect when critical values are detected
  useEffect(() => {
    if (!notificationsSupported) return;

    if (currentMetrics.bloodPressure.includes('140')) {
      sendHealthAlert("High blood pressure detected. Please consult your healthcare provider.");
    }
    if (parseInt(currentMetrics.heartRate) > 100) {
      sendHealthAlert("Elevated heart rate detected. Monitor your condition closely.");
    }
  }, [currentMetrics, notificationsSupported]);

  // Render metric card
  const MetricCard = ({ title, value, icon }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );

  // Add loading state UI
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
        <div className="text-center">
          <p>Loading health data...</p>
        </div>
      </div>
    );
  }

  // Add error state UI
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard 
          title="Blood Pressure" 
          value={currentMetrics.bloodPressure}
          icon={<Activity className="h-4 w-4 text-red-500" />}
        />
        <MetricCard 
          title="Heart Rate" 
          value={currentMetrics.heartRate}
          icon={<Heart className="h-4 w-4 text-pink-500" />}
        />
      </div>

      {/* Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {riskFactors.map((factor, index) => (
              <li key={index} className="text-sm text-gray-700">{factor}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle>Key Medical Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {keyFindings.map((finding, index) => (
              <li key={index} className="text-sm text-gray-700">{finding}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Alerts for Critical Values */}
      {(currentMetrics.bloodPressure.includes('140') || 
        parseInt(currentMetrics.heartRate) > 100) && (
        <Alert variant="destructive">
          <AlertDescription>
            {currentMetrics.bloodPressure.includes('140') && 
              "High blood pressure detected. Please consult your healthcare provider."}
            {parseInt(currentMetrics.heartRate) > 100 && 
              " Elevated heart rate detected. Monitor your condition closely."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default HealthMonitoringDashboard;