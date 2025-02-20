"use client"
import React from 'react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Activity, Heart, Trophy, AlertTriangle } from 'lucide-react';

const HealthMonitoringDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1M');
  
  // Sample data - replace with real patient data
  const healthData = [
    { date: '2024-01', bloodPressure: 120, heartRate: 75, glucose: 95, weight: 70 },
    { date: '2024-02', bloodPressure: 118, heartRate: 72, glucose: 92, weight: 69 },
    { date: '2024-03', bloodPressure: 122, heartRate: 78, glucose: 98, weight: 69.5 },
  ];

  const riskAlerts = [
    { type: 'warning', message: 'Slightly elevated blood pressure trend detected' },
    { type: 'info', message: 'Next medication review due in 2 weeks' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120/80</div>
            <p className="text-xs text-muted-foreground">+2% from last reading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75 bpm</div>
            <p className="text-xs text-muted-foreground">Normal range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Treatment adherence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Low</div>
            <p className="text-xs text-muted-foreground">Based on current metrics</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart width={800} height={300} data={healthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="bloodPressure" stroke="#8884d8" />
            <Line type="monotone" dataKey="heartRate" stroke="#82ca9d" />
            <Line type="monotone" dataKey="glucose" stroke="#ffc658" />
          </LineChart>
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