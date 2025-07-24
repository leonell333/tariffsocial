import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { campaign: 'Fashion Ads', impressions: 125000, clicks: 3200, ctr: 2.56, conversions: 185 },
  { campaign: 'Tech Products', impressions: 89000, clicks: 2800, ctr: 3.15, conversions: 220 },
  { campaign: 'Food & Dining', impressions: 156000, clicks: 2100, ctr: 1.35, conversions: 95 },
  { campaign: 'Travel & Tourism', impressions: 98000, clicks: 4200, ctr: 4.29, conversions: 310 },
  { campaign: 'Finance', impressions: 67000, clicks: 1800, ctr: 2.69, conversions: 145 },
  { campaign: 'Entertainment', impressions: 134000, clicks: 3800, ctr: 2.84, conversions: 280 },
];

export default function AdPerformanceChart() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Ad Campaign Performance</h3>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="campaign" 
            stroke="#6b7280" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis yAxisId="left" stroke="#6b7280" />
          <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            formatter={(value, name) => {
              if (name === 'ctr') return [`${value}%`, 'CTR'];
              if (name === 'impressions') return [value.toLocaleString(), 'Impressions'];
              if (name === 'clicks') return [value.toLocaleString(), 'Clicks'];
              if (name === 'conversions') return [value.toLocaleString(), 'Conversions'];
              return [value, name];
            }}
          />
          <Legend />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="impressions" 
            fill="#ddd6fe" 
            stroke="#8b5cf6"
            fillOpacity={0.3}
            name="Impressions"
          />
          <Bar 
            yAxisId="left"
            dataKey="clicks" 
            fill="#3b82f6" 
            name="Clicks"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="conversions" 
            fill="#10b981" 
            name="Conversions"
            radius={[4, 4, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
} 