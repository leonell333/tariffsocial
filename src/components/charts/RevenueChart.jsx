import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', adRevenue: 12000, subscriptions: 8000, ecommerce: 15000 },
  { month: 'Feb', adRevenue: 15000, subscriptions: 9200, ecommerce: 18000 },
  { month: 'Mar', adRevenue: 18000, subscriptions: 11000, ecommerce: 22000 },
  { month: 'Apr', adRevenue: 22000, subscriptions: 13500, ecommerce: 26000 },
  { month: 'May', adRevenue: 25000, subscriptions: 15000, ecommerce: 28000 },
  { month: 'Jun', adRevenue: 28000, subscriptions: 16800, ecommerce: 32000 },
];

export default function RevenueChart() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }} 
            formatter={(value) => [`$${value.toLocaleString()}`, '']}
          />
          <Area 
            type="monotone" 
            dataKey="ecommerce" 
            stackId="1" 
            stroke="#10b981" 
            fill="#10b981" 
            fillOpacity={0.8}
          />
          <Area 
            type="monotone" 
            dataKey="subscriptions" 
            stackId="1" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.8}
          />
          <Area 
            type="monotone" 
            dataKey="adRevenue" 
            stackId="1" 
            stroke="#f59e0b" 
            fill="#f59e0b" 
            fillOpacity={0.8}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Ad Revenue</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Subscriptions</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">E-commerce</span>
        </div>
      </div>
    </div>
  );
} 