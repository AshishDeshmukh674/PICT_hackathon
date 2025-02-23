"use client"
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Activity, Heart } from 'lucide-react';

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

  // Update to use Kinde authentication
  useEffect(() => {
    const fetchMetricsData = async () => {
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

    fetchHealthData();
  }, [userEmail]);

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