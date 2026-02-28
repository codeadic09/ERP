'use client';

import { useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleSwitchCard() {
  const [activeRole, setActiveRole] = useState('admin');

  const roles = [
    { id: 'admin', label: 'Admin', count: 0 },
    { id: 'faculty', label: 'Faculty', count: 0 },
    { id: 'student', label: 'Student', count: 0 },
  ];

  const quickItems = [
    { icon: <Clock size={16} />, label: "Today's Classes", value: '4' },
    { icon: <AlertCircle size={16} />, label: 'Pending Approvals', value: '12' },
  ];

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] p-4 sm:p-6 flex flex-col h-full">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Switch Role</h3>

      {/* Role Buttons */}
      <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={cn(
              'flex-1 py-2 px-2 sm:px-3 rounded-lg font-medium text-xs sm:text-sm transition-smooth active:scale-95 focus-ring',
              activeRole === role.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/40 text-gray-700 hover:bg-white/60'
            )}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Quick Info */}
      <div className="space-y-2 sm:space-y-3">
        {quickItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-white/40 rounded-lg hover:bg-white/50 transition-smooth">
            <div className="flex items-center gap-2 text-gray-700 min-w-0">
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-xs sm:text-sm truncate">{item.label}</span>
            </div>
            <span className="font-semibold text-blue-600 flex-shrink-0 ml-2">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
