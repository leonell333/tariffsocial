import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ageData = [
  { name: '18-24', value: 28, color: '#3b82f6' },
  { name: '25-34', value: 32, color: '#10b981' },
  { name: '35-44', value: 22, color: '#f59e0b' },
  { name: '45-54', value: 12, color: '#ef4444' },
  { name: '55+', value: 6, color: '#8b5cf6' },
];

const genderData = [
  { name: 'Female', value: 52, color: '#ec4899' },
  { name: 'Male', value: 45, color: '#3b82f6' },
  { name: 'Other', value: 3, color: '#6b7280' },
];

export default function UserDemographicsChart() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">User Demographics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Age Distribution */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-4 text-center">Age Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ageData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {ageData.map((entry, index) => (
                  <Cell key={`age-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-4 text-center">Gender Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`gender-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 