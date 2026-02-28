'use client';

import { Bell, Search, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border border-white/50 rounded-xl sm:rounded-2xl shadow-lg m-2 sm:m-4 animate-slide-in-left">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 gap-3">
        {/* Left Section - Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-white/60 border border-white/40 rounded-lg pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/80 transition-smooth"
            />
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
          {/* Notifications */}
          <button className="p-2 hover:bg-white/40 rounded-lg transition-smooth relative active:scale-95 focus-ring">
            <Bell size={20} className="text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-glow-pulse" />
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-white/40 rounded-lg transition-smooth active:scale-95 focus-ring hidden sm:block">
            <Settings size={20} className="text-gray-700" />
          </button>

          {/* User Profile */}
          <button className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-3 pr-2 py-1 hover:bg-white/40 rounded-full transition-smooth active:scale-95 focus-ring">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:inline">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
