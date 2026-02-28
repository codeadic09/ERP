'use client';

import { Calendar, Clock, MapPin, DollarSign } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  type: string;
  details: string;
  icon: React.ReactNode;
  color: string;
}

export function AcademicEventsCard() {
  const events: Event[] = [
    {
      id: 1,
      title: 'Midterm Exams',
      date: 'Mar 15 - Mar 25',
      type: 'Exam',
      details: 'All Departments',
      icon: <Calendar size={20} />,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 2,
      title: 'Assignment Deadline',
      date: 'Mar 20',
      type: 'Assignment',
      details: 'CS501 - Database Systems',
      icon: <Clock size={20} />,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      id: 3,
      title: 'Semester Fee Due',
      date: 'Mar 31',
      type: 'Finance',
      details: '$450.00',
      icon: <DollarSign size={20} />,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      id: 4,
      title: 'Department Meeting',
      date: 'Mar 18 @ 2:00 PM',
      type: 'Meeting',
      details: 'Conference Room A',
      icon: <MapPin size={20} />,
      color: 'bg-cyan-100 text-cyan-700',
    },
  ];

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] p-6 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Events & Deadlines</h3>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/40 rounded-lg hover:bg-white/60 transition-smooth active:scale-95"
          >
            <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${event.color}`}>{event.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
              <p className="text-xs text-gray-600 mt-1">{event.date}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{event.details}</p>
            </div>
            <span className="text-xs font-medium px-2 sm:px-2.5 py-1 bg-white/60 text-gray-700 rounded whitespace-nowrap flex-shrink-0 self-start sm:self-auto">
              {event.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
