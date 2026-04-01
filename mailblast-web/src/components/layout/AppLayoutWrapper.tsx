'use client';

import { usePathname } from 'next/navigation';
import { Sidebar, SidebarContext } from "@/components/layout/Sidebar";
import { useState } from 'react';
import AuthGuard from "@/components/layout/AuthGuard";

function AppContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setCollapsed, isMobileOpen, setMobileOpen }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className={`flex-1 ${isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'} ml-0 relative min-h-screen transition-all duration-300`}>
          <div className="max-w-[1600px] mx-auto p-4 pt-16 lg:pt-8 lg:p-8 xl:p-12 w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const isAuth = pathname === '/auth';

  if (isLanding || isAuth) {
    return (
      <main className="min-h-screen w-full relative m-0 p-0 overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <AuthGuard>
      <AppContent>{children}</AppContent>
    </AuthGuard>
  );
}
