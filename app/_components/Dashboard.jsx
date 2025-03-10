"use client"
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Activity, Heart, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import axios from 'axios';
import { sendPushbulletNotification, checkMetricThreshold } from '../services/notificationService';

const HealthMonitoringDashboard = () => {
  const [currentMetrics, setCurrentMetrics] = useState({
    bloodPressure: 'NA',
    heartRate: 'NA'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pushbulletToken, setPushbulletToken] = useState(null);
  const [riskFactors, setRiskFactors] = useState([]);
  const [keyFindings, setKeyFindings] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [healthRecommendations, setHealthRecommendations] = useState(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState({
    riskLevel: 'NA',
    progress: 'NA'
  });
  const [healthData, setHealthData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [comparison, setComparison] = useState({
    bloodPressure: { trend: 'stable', change: 0 },
    heartRate: { trend: 'stable', change: 0 },
    progress: { trend: 'stable', change: 0 }
  });
  const { user } = useKindeBrowserClient();
  const defaultToken = process.env.PUSHBULLET_ACCESS_TOKEN;

  // Health metric thresholds
  const healthThresholds = {
    systolicHigh: 140,
    diastolicHigh: 90,
    bloodPressureHigh: 140,
    heartRateHigh: 100,
    heartRateLow: 50
  };

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

  // Set user email from Kinde auth
  useEffect(() => {
    if (user) {
      setUserEmail(user.email);
    }
  }, [user]);

  // Load Pushbullet token from localStorage, user settings, or environment variable
  useEffect(() => {
    // Try to get token from localStorage first
    const savedToken = localStorage.getItem('pushbulletToken');
    
    if (savedToken) {
      setPushbulletToken(savedToken);
    } else if (defaultToken) {
      // If no saved token but we have a default token in env vars, use that
      setPushbulletToken(defaultToken);
      // Optionally save the default token to localStorage
      localStorage.setItem('pushbulletToken', defaultToken);
    } else if (userEmail) {
      // As a last resort, try to fetch from user settings in backend
      const fetchPushbulletToken = async () => {
        try {
          const response = await axios.get(`/api/user-settings?email=${userEmail}`);
          if (response.data.pushbulletToken) {
            setPushbulletToken(response.data.pushbulletToken);
            localStorage.setItem('pushbulletToken', response.data.pushbulletToken);
          }
        } catch (error) {
          console.error('Error fetching Pushbullet token:', error);
        }
      };
      
      fetchPushbulletToken();
    }
  }, [userEmail, defaultToken]);

  // Update to use Kinde authentication
  useEffect(() => {
    const fetchHealthData = async () => {
      if (!userEmail) return;
      
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
          setHealthData([]);
          setCurrentMetrics({
            bloodPressure: 'NA',
            heartRate: 'NA',
            progress: 'NA',
            riskLevel: 'NA'
          });
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to load health metrics');
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchHealthData();
    }
  }, [userEmail]);

  // Check for health alerts and send Pushbullet notifications
  useEffect(() => {
    // We can now call sendPushbulletNotification without explicitly passing a token
    // It will use the user's token if available, or fall back to the default token
    if (!currentMetrics) return;
    
    // Check if any metrics exceed thresholds
    const alerts = checkMetricThreshold(currentMetrics, healthThresholds);
    
    // Send Pushbullet notification for each alert
    alerts.forEach(async (alert) => {
      await sendPushbulletNotification(
        alert.title,
        alert.message,
        pushbulletToken
      );
    });
    
    // Update UI with alerts
    if (alerts.length > 0) {
      setRiskAlerts(prev => [...prev, ...alerts.map(a => a.message)]);
    }
  }, [currentMetrics, pushbulletToken]);

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
      {/* Pushbullet Token Input - only show if no default token is available */}
      {!pushbulletToken && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Set Up Smartwatch Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Enter your Pushbullet Access Token to receive health alerts on your smartwatch.
                <a href="https://www.pushbullet.com/#settings/account" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-blue-500 ml-1">
                  Get your token here
                </a>
              </p>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Pushbullet Access Token" 
                  className="flex-1 px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    const token = e.target.value.trim();
                    if (token) {
                      setPushbulletToken(token);
                      localStorage.setItem('pushbulletToken', token);
                    }
                  }}
                />
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={() => {
                    sendPushbulletNotification(
                      "Test Notification", 
                      "Your smartwatch notifications are working!", 
                      pushbulletToken
                    );
                  }}
                >
                  Test
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show a "Test Notification" button if we already have a token */}
      {pushbulletToken && (
        <div className="flex justify-end mb-4">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
            onClick={() => {
              sendPushbulletNotification(
                "Test Notification", 
                "Your smartwatch notifications are working!", 
                pushbulletToken
              );
            }}
          >
            Test Notification
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard 
          title="Blood Pressure" 
          value={currentMetrics.bloodPressure}
          icon={<Activity className="h-4 w-4 text-red-500" />}
          trend={comparison.bloodPressure}
          unit=""
        />
        <MetricCard 
          title="Heart Rate" 
          value={currentMetrics.heartRate}
          icon={<Heart className="h-4 w-4 text-pink-500" />}
          trend={comparison.heartRate}
          unit="bpm"
        />
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Health Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {riskAlerts.map((alert, index) => (
                <li key={index} className="text-sm text-red-700">{alert}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {riskFactors.length > 0 ? (
              riskFactors.map((factor, index) => (
                <li key={index} className="text-sm text-gray-700">{factor}</li>
              ))
            ) : (
              <li className="text-sm text-gray-500">No risk factors identified</li>
            )}
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
            {keyFindings.length > 0 ? (
              keyFindings.map((finding, index) => (
                <li key={index} className="text-sm text-gray-700">{finding}</li>
              ))
            ) : (
              <li className="text-sm text-gray-500">No key findings available</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Charts */}
      {renderCharts()}
    </div>
  );
};

export default HealthMonitoringDashboard;