'use client';
import { clearSession } from "@/lib/auth" 

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  Wallet,
  Library,
  Home,
  Users2,
  MessageSquare,
  Settings,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}



export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  // ✅ Logout handler — clears session and Next.js cache
  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    clearSession();
    router.push('/login');
    router.refresh();
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '#', active: true },
    { name: 'Students', icon: <Users size={20} />, href: '#' },
    { name: 'Faculty', icon: <Users2 size={20} />, href: '#' },
    { name: 'Courses', icon: <BookOpen size={20} />, href: '#' },
    { name: 'Attendance', icon: <ClipboardCheck size={20} />, href: '#' },
    { name: 'Exams & Results', icon: <BookOpen size={20} />, href: '#' },
    { name: 'Finance & Fees', icon: <Wallet size={20} />, href: '#' },
    { name: 'Library', icon: <Library size={20} />, href: '#' },
    { name: 'Hostel', icon: <Home size={20} />, href: '#' },
    { name: 'HR & Payroll', icon: <Users2 size={20} />, href: '#' },
    { name: 'Communication', icon: <MessageSquare size={20} />, href: '#' },
    { name: 'Settings', icon: <Settings size={20} />, href: '#' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden backdrop-blur-xl bg-white/70 border border-white/50 rounded-lg shadow-lg p-2 hover:bg-white/80 transition-smooth"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-30 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-72 backdrop-blur-xl bg-white/70 border border-white/50 rounded-3xl shadow-lg m-4 overflow-hidden flex flex-col transition-all duration-300 z-40 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-96'
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/20">
          <h1 className="text-2xl font-bold gradient-text mb-1">ERP</h1>
          <p className="text-sm text-gray-600">University Management</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth active:scale-95',
                item.active
                  ? 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold shadow-md'
                  : 'text-gray-700 hover:bg-white/50 active:bg-white/40'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              {item.active && <ChevronRight size={16} className="animate-slide-in-left" />}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/20 space-y-2">
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-smooth active:scale-95">
            Help & Support
          </button>

          {/* ✅ Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-smooth active:scale-95 disabled:opacity-50"
          >
            <LogOut size={16} />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className="hidden md:block md:w-80 flex-shrink-0" />
    </>
  );
}
