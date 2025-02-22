'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';

const formatValue = (metric, value) => {
  if (value === 0 || value === null || value === undefined) {
    return 'No data';
  }
  
  // Format based on metric type
  switch (metric) {
    case 'Steps':
      return Math.round(value).toLocaleString();
    case 'Distance':
      return `${(value / 1000).toFixed(2)} km`;
    case 'Calories':
      return `${Math.round(value)} cal`;
    case 'Heart Rate':
      return `${Math.round(value)} bpm`;
    case 'Blood Pressure':
    case 'Oxygen Saturation':
      return value.toFixed(1);
    case 'Sleep':
      return `${(value / 3600).toFixed(1)} hours`;
    default:
      return value.toLocaleString();
  }
};

export default function GoogleFitPage() {
  const [mode, setMode] = useState(1);
  const [days, setDays] = useState(7);
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Sending request with data:', {
        mode,
        days: mode === 2 ? days : 0,
        start_hour: mode === 3 ? startHour : 0,
        end_hour: mode === 3 ? endHour : 23,
      });

      const response = await fetch('http://localhost:8001/health_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          mode,
          days: mode === 2 ? days : 0,
          start_hour: mode === 3 ? startHour : 0,
          end_hour: mode === 3 ? endHour : 23,
        }),
      });

      const result = await response.json();
      console.log('Received response:', result);

      if (!response.ok) {
        throw new Error(result.detail || `HTTP error! status: ${response.status}`);
      }

      // Check if we got any non-zero values
      const hasData = Object.values(result.data).some(value => value > 0);
      if (!hasData) {
        console.log('No data values found in response');
        setError('No health data found for the selected time period. Make sure you have granted all necessary permissions and have data in Google Fit.');
      }

      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to fetch health data. Please check the console for more details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Google Fit Integration</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Data Range</h2>
        <div className="flex gap-4 mb-4">
          <Button
            onClick={() => setMode(1)}
            variant={mode === 1 ? "default" : "outline"}
          >
            Today
          </Button>
          <Button
            onClick={() => setMode(2)}
            variant={mode === 2 ? "default" : "outline"}
          >
            Past Days
          </Button>
          <Button
            onClick={() => setMode(3)}
            variant={mode === 3 ? "default" : "outline"}
          >
            Custom Time
          </Button>
        </div>

        {mode === 2 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Number of Past Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="border rounded p-2"
              min="1"
              max="30"
            />
          </div>
        )}

        {mode === 3 && (
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Hour (0-23)</label>
              <input
                type="number"
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
                className="border rounded p-2"
                min="0"
                max="23"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Hour (0-23)</label>
              <input
                type="number"
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
                className="border rounded p-2"
                min="0"
                max="23"
              />
            </div>
          </div>
        )}

        <Button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Data'}
        </Button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}
      </div>

      {data && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="mb-2"><strong>Mode:</strong> {data.mode_selected}</p>
            <p className="mb-2"><strong>Start Time:</strong> {data.start_time}</p>
            <p className="mb-2"><strong>End Time:</strong> {data.end_time}</p>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Health Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.data).map(([metric, value]) => (
                <div key={metric} className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium">{metric}</h4>
                  <p className="text-2xl font-bold">{formatValue(metric, value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 