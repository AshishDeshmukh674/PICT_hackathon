'use client';
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Sample data
const monthlyPatients = [
    { month: 'Jan', patients: 150 },
    { month: 'Feb', patients: 180 },
    { month: 'Mar', patients: 200 },
    { month: 'Apr', patients: 170 },
    { month: 'May', patients: 220 },
    { month: 'Jun', patients: 190 },
];

const departmentData = [
    { name: 'Cardiology', patients: 350 },
    { name: 'Orthopedics', patients: 280 },
    { name: 'Pediatrics', patients: 420 },
    { name: 'Neurology', patients: 190 },
];

const feedbackData = [
    { name: 'Very Satisfied', value: 400 },
    { name: 'Satisfied', value: 300 },
    { name: 'Neutral', value: 200 },
    { name: 'Dissatisfied', value: 100 },
];

export default function Stats() {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Healthcare Statistics</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Monthly Patient Trend */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Monthly Patient Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyPatients}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="patients" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Department-wise Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Department-wise Patients</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="patients" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Patient Feedback */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Patient Feedback Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={feedbackData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                            >
                                {feedbackData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}