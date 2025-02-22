"use client"
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Activity, Heart, Trophy, AlertTriangle, TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import axios from 'axios';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { generateHealthTask } from './HealthDataGenerator';

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
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [healthRecommendations, setHealthRecommendations] = useState(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState({
    riskLevel: 'NA',
    progress: 'NA'
  });
  const [historicalData, setHistoricalData] = useState([]);
  const [comparison, setComparison] = useState({
    bloodPressure: { trend: 'stable', change: 0 },
    heartRate: { trend: 'stable', change: 0 },
    progress: { trend: 'stable', change: 0 }
  });
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
            'filters[Email][$eq]': userEmail,
            'sort[0]': 'Date:desc',
          },
        });

        console.log('Full API Response:', response);

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

  // Update health recommendations and risk alerts
  useEffect(() => {
    const updateHealthData = async () => {
      if (currentMetrics.bloodPressure === 'NA') return;

      try {
        const aiResponse = await generateHealthTask(currentMetrics);
        console.log('AI Response:', aiResponse);

        setRiskAlerts(aiResponse.alerts || []);
        setHealthRecommendations(aiResponse.dietPlan || null);
        setCalculatedMetrics(aiResponse.calculatedMetrics || {
          riskLevel: 'NA',
          progress: 'NA'
        });

      } catch (error) {
        console.error('Error updating health data:', error);
      }
    };

    updateHealthData();
  }, [currentMetrics]);

  // Process historical data and calculate trends
  useEffect(() => {
    if (healthData.length >= 2) {
      const current = healthData[0];
      const previous = healthData[1];

      const calculateTrend = (current, previous) => {
        const diff = current - previous;
        return {
          trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
          change: Math.abs(diff)
        };
      };

      setComparison({
        bloodPressure: calculateTrend(current.bloodPressure, previous.bloodPressure),
        heartRate: calculateTrend(current.heartRate, previous.heartRate),
        progress: calculateTrend(current.progress, previous.progress)
      });

      setHistoricalData(healthData);
    }
  }, [healthData]);

  // Render metric card with trend
  const MetricCard = ({ title, value, icon, trend, change, unit }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value} {unit}</div>
          {trend && (
            <div className={`flex items-center ${
              trend.trend === 'up' ? 'text-green-500' : 
              trend.trend === 'down' ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {trend.trend === 'up' ? <ArrowUpCircle className="h-4 w-4" /> :
               trend.trend === 'down' ? <ArrowDownCircle className="h-4 w-4" /> :
               <TrendingUp className="h-4 w-4" />}
              <span className="text-sm ml-1">{trend.change}{unit}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Previous: {value - (trend?.change || 0)} {unit}</p>
      </CardContent>
    </Card>
  );

  // Render interactive charts
  const renderCharts = () => {
    if (historicalData.length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Blood Pressure & Heart Rate Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bloodPressure" 
                  stroke="#8884d8" 
                  name="Blood Pressure"
                />
                <Line 
                  type="monotone" 
                  dataKey="heartRate" 
                  stroke="#82ca9d" 
                  name="Heart Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="progress" fill="#ffc658" name="Progress" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
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
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Blood Pressure" 
          value={currentMetrics.bloodPressure}
          icon={<Activity className="h-4 w-4 text-red-500" />}
          trend={comparison.bloodPressure}
          unit="mmHg"
        />
        <MetricCard 
          title="Heart Rate" 
          value={currentMetrics.heartRate}
          icon={<Heart className="h-4 w-4 text-pink-500" />}
          trend={comparison.heartRate}
          unit="bpm"
        />
        <MetricCard 
          title="Progress" 
          value={calculatedMetrics.progress}
          icon={<Trophy className="h-4 w-4 text-yellow-500" />}
          trend={comparison.progress}
          unit="%"
        />
        <MetricCard 
          title="Risk Level" 
          value={calculatedMetrics.riskLevel}
          icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
        />
      </div>

      {/* Interactive Charts */}
      {renderCharts()}

      {/* Health Recommendations */}
      {healthRecommendations && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Personalized Health Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current Status</h3>
              <p className="text-sm text-gray-600">
                Based on your latest readings compared to previous data:
                {comparison.bloodPressure.trend !== 'stable' && 
                  ` Blood pressure has ${comparison.bloodPressure.trend}ed by ${comparison.bloodPressure.change} mmHg.`}
                {comparison.heartRate.trend !== 'stable' && 
                  ` Heart rate has ${comparison.heartRate.trend}ed by ${comparison.heartRate.change} bpm.`}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Recommended Diet</h3>
              <ul className="list-disc pl-5 space-y-1">
                {healthRecommendations.meals.map((meal, index) => (
                  <li key={index} className="text-sm">{meal}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Dietary Restrictions</h3>
              <p className="text-sm">{healthRecommendations.restrictions}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Supplements</h3>
              <p className="text-sm">{healthRecommendations.supplements}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      <div className="space-y-4">
        {Array.isArray(riskAlerts) && riskAlerts.map((alert, index) => (
          <Alert 
            key={index} 
            variant={alert.type === 'warning' ? 'destructive' : 'default'}
          >
            <AlertDescription>
              {typeof alert.message === 'string' ? alert.message : 'Health alert'}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default HealthMonitoringDashboard;