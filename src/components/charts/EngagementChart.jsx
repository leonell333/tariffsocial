import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { metric: 'Posts', thisWeek: 2400, lastWeek: 2100 },
  { metric: 'Likes', thisWeek: 18500, lastWeek: 16200 },
  { metric: 'Comments', thisWeek: 5600, lastWeek: 4800 },
  { metric: 'Shares', thisWeek: 3200, lastWeek: 2900 },
  { metric: 'Messages', thisWeek: 8900, lastWeek: 7600 },
];

export default function EngagementChart() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Platform Engagement Metrics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="metric" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }} 
          />
          <Legend />
          <Bar 
            dataKey="lastWeek" 
            fill="#94a3b8" 
            name="Last Week"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="thisWeek" 
            fill="#3b82f6" 
            name="This Week"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 