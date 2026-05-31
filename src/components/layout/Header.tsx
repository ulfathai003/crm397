'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Bell, Search, Moon, Sun, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  user?: { full_name: string; role: string };
  title?: string;
}

export function Header({ onMenuClick, user, title }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  function toggleTheme() {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    toast.success('Logged out successfully');
  }

  return (
    <header className="sticky top-0 z-30 h-[var(--header-height)] bg-card/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-3">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      {title && (
        <h1 className="hidden sm:block text-lg font-semibold flex-1">{title}</h1>
      )}

      {/* Search - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 bg-muted rounded-xl px-3 py-2 flex-1 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search leads, properties..."
          className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-muted rounded-xl transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <Link href="/notifications" className="relative p-2 hover:bg-muted rounded-xl transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center text-sm font-bold">
              {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? 'U'}
            </div>
            <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
              {user?.full_name ?? 'User'}
            </span>
          </button>

          {showUserMenu && (
            <div className={cn(
              'absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg',
              'animate-fade-in z-50 overflow-hidden'
            )}>
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-sm">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
