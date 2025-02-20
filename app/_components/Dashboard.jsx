"use client"
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Activity, Heart, Trophy, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const HealthMonitoringDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1M');
  const [healthData, setHealthData] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    bloodPressure: 'NA',
    heartRate: 'NA',
    progress: 'NA',
    riskLevel: 'NA'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const { user } = useKindeBrowserClient();
  console.log(user);

  // Update to use Kinde authentication
  useEffect(() => {
    if (user) {
      console.log("Current user email (Kinde):", user.email);
      setUserEmail(user.email);
    } else {
      console.log("No user logged in (Kinde)");
    }
  }, [user]);

  // Fetch data from Strapi with debug logging
  useEffect(() => {
    const fetchHealthData = async () => {
      if (!userEmail) {
        console.log("No user email available, skipping fetch");
        return;
      }

      console.log("Attempting to fetch data for email:", userEmail);
      console.log("API URL:", `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/patient-dashboards`);
      console.log("API Key available:", !!process.env.NEXT_PUBLIC_STRAPI_API_KEY);

      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/patient-dashboards`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          params: {
            'populate': '*',
            // 'filters[Email][$eq]': userEmail,
            'sort[0]': 'Date:desc',
          },
        });

        console.log('Full API Response:', response.data);

        if (response.data.data && response.data.data.length > 0) {
          console.log('Raw data from API:', response.data.data);
          
          const transformedData = response.data.data.map(item => ({
            date: new Date(item.attributes.Date).toLocaleDateString(),
            bloodPressure: parseFloat(item.attributes.BloodPresure) || 'NA',
            heartRate: parseFloat(item.attributes.HeartRate) || 'NA',
            progress: parseFloat(item.attributes.Progress) || 'NA',
            riskLevel: item.attributes.RiskLevel || 'NA'
          }));

          console.log('Transformed data:', transformedData);
          setHealthData(transformedData);

          const latestRecord = transformedData[0];
          setCurrentMetrics({
            bloodPressure: latestRecord.bloodPressure,
            heartRate: latestRecord.heartRate,
            progress: latestRecord.progress,
            riskLevel: latestRecord.riskLevel
          });
        } else {
          console.log('No data found for user:', userEmail);
          // Set default values when no data is found
          setHealthData([]);
          setCurrentMetrics({
            bloodPressure: 'NA',
            heartRate: 'NA',
            progress: 'NA',
            riskLevel: 'NA'
          });
        }
      } catch (err) {
        console.error('Detailed error:', {
          message: err.message,
          response: err.response,
          config: err.config
        });
        setError(err.response?.data?.message || 'Failed to fetch health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [userEmail]);

  const riskAlerts = [
    { type: 'warning', message: 'Slightly elevated blood pressure trend detected' },
    { type: 'info', message: 'Next medication review due in 2 weeks' }
  ];

  // Modify the LineChart component to handle string values
  const renderLineChart = () => {
    if (healthData.length === 0) {
      return <div className="text-center py-4">No health trend data available</div>;
    }

    const chartData = healthData.map(item => ({
      ...item,
      bloodPressure: item.bloodPressure === 'NA' ? null : item.bloodPressure,
      heartRate: item.heartRate === 'NA' ? null : item.heartRate,
      progress: item.progress === 'NA' ? null : item.progress
    }));

    return (
      <LineChart width={800} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="bloodPressure" 
          stroke="#8884d8" 
          connectNulls 
        />
        <Line 
          type="monotone" 
          dataKey="heartRate" 
          stroke="#82ca9d" 
          connectNulls 
        />
      </LineChart>
    );
  };

  // Add loading state UI
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
        <div className="text-center">
          <p>Loading health data...</p>
          <p className="text-sm text-gray-500">Current user email: {userEmail || 'Not logged in'}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.bloodPressure}</div>
            <p className="text-xs text-muted-foreground">
              {currentMetrics.bloodPressure !== 'NA' ? '+2% from last reading' : 'No data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.heartRate} {currentMetrics.heartRate !== 'NA' ? 'bpm' : ''}</div>
            <p className="text-xs text-muted-foreground">
              {currentMetrics.heartRate !== 'NA' ? 'Normal range' : 'No data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.progress}{currentMetrics.progress !== 'NA' ? '%' : ''}</div>
            <p className="text-xs text-muted-foreground">
              {currentMetrics.progress !== 'NA' ? 'Treatment adherence' : 'No data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.riskLevel}</div>
            <p className="text-xs text-muted-foreground">
              {currentMetrics.riskLevel !== 'NA' ? 'Based on current metrics' : 'No data available'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {renderLineChart()}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {riskAlerts.map((alert, index) => (
          <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default HealthMonitoringDashboard;