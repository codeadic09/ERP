'use client';

export function AcademicOverviewCard() {
  const stats = [
    { label: 'Students', value: '2,450', color: 'from-blue-400 to-blue-600' },
    { label: 'Faculty', value: '180', color: 'from-purple-400 to-purple-600' },
    { label: 'Active Courses', value: '95', color: 'from-cyan-400 to-cyan-600' },
  ];

  return (
    <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] p-4 sm:p-6 flex flex-col h-full">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Academic Overview</h3>
      <div className="space-y-3 sm:space-y-4 flex-1">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-white/30 rounded-lg hover:bg-white/40 transition-smooth">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </div>
            <div className={`w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-gradient-to-r ${stat.color} opacity-10 flex-shrink-0`} />
          </div>
        ))}
      </div>
    </div>
  );
}
