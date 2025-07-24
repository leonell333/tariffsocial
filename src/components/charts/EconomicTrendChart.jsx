import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { quarter: 'Q1 2023', gdp: 2.1, inflation: 3.2, unemployment: 4.8, tariffImpact: 1.2 },
  { quarter: 'Q2 2023', gdp: 2.3, inflation: 3.8, unemployment: 4.6, tariffImpact: 1.5 },
  { quarter: 'Q3 2023', gdp: 2.8, inflation: 4.1, unemployment: 4.2, tariffImpact: 1.8 },
  { quarter: 'Q4 2023', gdp: 3.1, inflation: 3.9, unemployment: 4.0, tariffImpact: 2.1 },
  { quarter: 'Q1 2024', gdp: 3.4, inflation: 3.6, unemployment: 3.8, tariffImpact: 2.3 },
  { quarter: 'Q2 2024', gdp: 3.2, inflation: 3.4, unemployment: 3.9, tariffImpact: 2.0 },
];

export default function EconomicTrendChart() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Economic Trends & Tariff Impact</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="quarter" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            formatter={(value, name) => [`${value}%`, name]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="gdp" 
            stroke="#10b981" 
            strokeWidth={3}
            name="GDP Growth" 
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="inflation" 
            stroke="#f59e0b" 
            strokeWidth={3}
            name="Inflation Rate" 
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="unemployment" 
            stroke="#ef4444" 
            strokeWidth={3}
            name="Unemployment" 
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="tariffImpact" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            name="Tariff Impact" 
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 