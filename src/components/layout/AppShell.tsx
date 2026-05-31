'use client';

import { useState } from 'react';
import { Sidebar, BottomNav } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
  user?: { full_name: string; role: string };
  title?: string;
}

export function AppShell({ children, user, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 w-[var(--sidebar-width)]">
        <Sidebar isOpen={true} onClose={() => {}} user={user} />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          title={title}
        />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
}
