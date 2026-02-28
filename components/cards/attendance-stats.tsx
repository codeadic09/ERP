'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AttendanceStatsCard() {
  const data = [
    { month: 'Jan', attendance: 85 },
    { month: 'Feb', attendance: 88 },
    { month: 'Mar', attendance: 82 },
    { month: 'Apr', attendance: 90 },
    { month: 'May', attendance: 87 },
    { month: 'Jun', attendance: 92 },
  ];

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] p-4 sm:p-6 flex flex-col h-full">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Attendance Statistics</h3>
      <div className="flex-1 w-full min-h-64 sm:min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
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
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Bar dataKey="attendance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
