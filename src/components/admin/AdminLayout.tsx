'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/admin/leads', icon: Users },
  { name: 'Projects', href: '/admin/projects', icon: Building2 },
  { name: 'Materials', href: '/admin/materials', icon: Package },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase().auth.signOut();
    router.push('/admin');
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-all"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col 
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${!isSidebarOpen && (isSidebarCollapsed ? 'md:w-20' : 'md:w-64')}
      `}>
        {/* Logo Section - Fixed Positioning */}
        <div className={`pt-12 pb-8 px-4 flex flex-col items-center gap-4 border-b border-slate-50 relative transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-8'}`}>
          {/* Close button for mobile inside sidebar */}
          <button
            onClick={closeSidebar}
            className="absolute top-4 right-4 p-2 text-slate-400 md:hidden hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Collapse toggle desktop button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm z-50 transition-all hover:scale-110"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <img
            src="/icon.io/android-chrome-192x192.png"
            alt="V Grand Logo"
            className={`rounded-2xl shadow-lg shadow-blue-100 transition-all duration-500 ${isSidebarCollapsed ? 'w-10 h-10' : 'w-24 h-24'}`}
          />
          <div className={`text-center transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            <p className="text-sm text-slate-500 font-semibold tracking-wide whitespace-nowrap">Hey Admin 👋</p>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center rounded-lg transition-all ${isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                title={isSidebarCollapsed ? item.name : ''}
              >
                <Icon size={20} className={isSidebarCollapsed ? 'flex-shrink-0' : ''} />
                {!isSidebarCollapsed && <span className="transition-opacity duration-300">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-slate-100 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleSignOut}
            className={`flex items-center text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all ${isSidebarCollapsed ? 'p-2' : 'gap-3 w-full px-4 py-3'}`}
            title={isSidebarCollapsed ? 'Sign out' : ''}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 w-full transition-all duration-300 ${isSidebarOpen ? 'ml-0' : (isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64')}`}>
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-8 sticky top-0 z-10 shadow-sm gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-base md:text-xl font-bold text-slate-800 truncate min-w-0">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-slate-100 rounded-full flex-shrink-0">
            <ShieldCheck size={14} className="text-slate-600 md:block hidden" />
            <span className="text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-wider">Admin</span>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
