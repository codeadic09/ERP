'use client';

import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: number;
  name: string;
  type: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
}

export function RecentActivitiesCard() {
  const activities: Activity[] = [
    {
      id: 1,
      name: 'Course Registration',
      type: 'Registration',
      date: 'Today',
      status: 'approved',
    },
    {
      id: 2,
      name: 'Lab Assignment',
      type: 'Assignment',
      date: 'Yesterday',
      status: 'pending',
    },
    {
      id: 3,
      name: 'Attendance Update',
      type: 'Attendance',
      date: '2 days ago',
      status: 'approved',
    },
    {
      id: 4,
      name: 'Fee Payment Request',
      type: 'Finance',
      date: '3 days ago',
      status: 'rejected',
    },
  ];

  const statusConfig = {
    approved: {
      icon: <CheckCircle size={16} />,
      color: 'bg-green-100 text-green-700',
      label: 'Approved',
    },
    pending: {
      icon: <Clock size={16} />,
      color: 'bg-amber-100 text-amber-700',
      label: 'Pending',
    },
    rejected: {
      icon: <XCircle size={16} />,
      color: 'bg-red-100 text-red-700',
      label: 'Rejected',
    },
  };

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] p-6 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {activities.map((activity) => {
          const config = statusConfig[activity.status];
          return (
            <div
              key={activity.id}
              className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 p-3 bg-white/40 rounded-lg hover:bg-white/60 transition-smooth active:scale-95"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{activity.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{activity.type} · {activity.date}</p>
              </div>
              <div className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0', config.color)}>
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{config.label.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
