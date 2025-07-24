import React from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Direct Messages', value: 85, fill: '#3b82f6' },
  { name: 'Post Interactions', value: 72, fill: '#10b981' },
  { name: 'Profile Views', value: 68, fill: '#f59e0b' },
  { name: 'Network Connections', value: 45, fill: '#ef4444' },
  { name: 'Group Activities', value: 38, fill: '#8b5cf6' },
  { name: 'Content Sharing', value: 29, fill: '#06b6d4' },
];

export default function NetworkActivityChart() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Network Activity Levels</h3>
      <ResponsiveContainer width="100%" height={350}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
          <RadialBar
            minAngle={15}
            label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
            background
            clockWise
            dataKey="value"
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Activity Level']}
            contentStyle={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
          />
          <Legend 
            iconSize={10} 
            layout="vertical" 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
} 