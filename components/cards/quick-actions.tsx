'use client';

import { UserPlus, BookOpen, Users, FileText } from 'lucide-react';

export function QuickActionsCard() {
  const actions = [
    { icon: <UserPlus size={24} />, label: 'Add Student', color: 'bg-blue-100' },
    { icon: <Users size={24} />, label: 'Add Faculty', color: 'bg-purple-100' },
    { icon: <BookOpen size={24} />, label: 'Create Course', color: 'bg-cyan-100' },
    { icon: <FileText size={24} />, label: 'Generate Report', color: 'bg-amber-100' },
  ];

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] p-4 sm:p-6 flex flex-col h-full">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-1">
        {actions.map((action, index) => (
          <button
            key={index}
            className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/40 hover:bg-white/60 transition-smooth hover:shadow-md active:scale-95 focus-ring"
          >
            <div className={`p-2.5 sm:p-3 rounded-lg ${action.color}`}>{action.icon}</div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 text-center line-clamp-2">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
