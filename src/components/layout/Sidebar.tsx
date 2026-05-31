'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Phone, Home, Calendar,
  Clock, BarChart3, Instagram, MapPin, Settings,
  ChevronRight, Building2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/properties', icon: Home, label: 'Properties' },
  { href: '/follow-ups', icon: Clock, label: 'Follow-Ups' },
  { href: '/attendance', icon: MapPin, label: 'Attendance' },
  { href: '/social', icon: Instagram, label: 'Social Planner' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { full_name: string; role: string; avatar_url?: string };
}

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-blue-950 text-white z-50',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'w-[var(--sidebar-width)]',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-blue-800/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-blue-700 rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white leading-none">EstateFlow</div>
              <div className="text-xs text-blue-300 mt-0.5">CRM Platform</div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-blue-200 hover:bg-blue-800/70 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-blue-300')} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                ) : null}
                {isActive && <ChevronRight className="w-4 h-4 text-blue-300" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        {user && (
          <div className="px-3 py-4 border-t border-blue-800/50">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-800/50 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.full_name}</div>
                <div className="text-xs text-blue-300 capitalize">{user.role.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// Mobile bottom nav
export function BottomNav() {
  const pathname = usePathname();
  const mobileNavItems = navItems.slice(0, 5);

  return (
    <div className="bottom-nav safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors',
                isActive ? 'text-blue-900' : 'text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
