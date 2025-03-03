"use client";
import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function HealthDashboard({ data }) {
  const [metrics, setMetrics] = useState({
    steps: 0,
    heartRate: 0,
    calories: 0,
    distance: 0
  });

  useEffect(() => {
    if (data) {
      setMetrics({
        steps: data.steps || 0,
        heartRate: data.heartRate || 0,
        calories: data.calories || 0,
        distance: data.distance || 0
      });
    }
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Steps</h3>
        <p className="text-3xl font-bold">{metrics.steps}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Heart Rate</h3>
        <p className="text-3xl font-bold">{metrics.heartRate} BPM</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Calories</h3>
        <p className="text-3xl font-bold">{metrics.calories} kcal</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Distance</h3>
        <p className="text-3xl font-bold">{metrics.distance} km</p>
      </Card>

      {data?.heartRateHistory && (
        <div className="col-span-full h-[400px]">
          <h3 className="text-xl font-semibold mb-4">Heart Rate History</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.heartRateHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 