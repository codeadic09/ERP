'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PerformanceAnalyticsCard() {
  const data = [
    { month: 'Jan', performance: 72 },
    { month: 'Feb', performance: 76 },
    { month: 'Mar', performance: 74 },
    { month: 'Apr', performance: 80 },
    { month: 'May', performance: 82 },
    { month: 'Jun', performance: 85 },
  ];

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] p-4 sm:p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Analytics</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Pass percentage trend</p>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
          <p className="text-3xl sm:text-4xl font-bold gradient-text">85%</p>
          <p className="text-xs text-green-600 font-medium">↑ 3% from last month</p>
        </div>
      </div>
      <div className="flex-1 w-full min-h-64 sm:min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Line
              type="monotone"
              dataKey="performance"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
