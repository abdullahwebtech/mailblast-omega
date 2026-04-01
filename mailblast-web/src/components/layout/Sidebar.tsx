'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Send, Calendar, Bot, BarChart2, Zap, Users, LayoutTemplate, ShieldAlert, Settings, History, Layers, Menu, X, ChevronLeft, ChevronRight, LogOut, User, Trash2 } from 'lucide-react';
import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Composer', href: '/composer', icon: Send },
  { name: 'All Campaigns', href: '/campaigns', icon: Layers },
  { name: 'Scheduler', href: '/scheduler', icon: Calendar },
  { name: 'AI Studio', href: '/ai-studio', icon: Bot },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Sent', href: '/sent', icon: History },
  { name: 'Warm-Up', href: '/warmup', icon: Zap },
  { name: 'Accounts', href: '/accounts', icon: Users },
  { name: 'Templates', href: '/templates', icon: LayoutTemplate },
  { name: 'Blacklist', href: '/blacklist', icon: ShieldAlert },
  { name: 'Trash', href: '/trash', icon: Trash2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const SidebarContext = createContext<{
  isCollapsed: boolean;
  setCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}>({ isCollapsed: false, setCollapsed: () => {}, isMobileOpen: false, setMobileOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarWidth = isCollapsed && !isMobile ? 'w-[72px]' : 'w-[260px]';

  return (
    <>
      {/* Mobile Hamburger */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-[60] p-2.5 bg-white border border-[#E8E9EC] rounded-xl text-[#1297FD] shadow-sm hover:bg-[#F2F3F5] transition-all active:scale-95"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${sidebarWidth} h-screen bg-[#F2F3F5] border-r border-[#E8E9EC] flex flex-col fixed left-0 top-0 z-[60]
          transition-all duration-300 ease-in-out
          ${isMobile ? (isMobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full') : 'translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E8E9EC] flex items-center justify-between min-h-[72px]">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[9px] bg-[#1297FD] flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 2px 10px rgba(18,151,253,.35)' }}>
                <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
                  <path d="M9 2L3 9h5l-1 5 6-7H8L9 2Z" fill="#fff" stroke="#fff" strokeWidth=".4" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-[#0C0D10]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>MailBlast Pro</h1>
                <p className="text-[10px] text-[#8D909C] font-mono tracking-widest">SaaS EDITION</p>
              </div>
            </div>
          )}
          {isCollapsed && !isMobile && (
            <div className="w-8 h-8 rounded-[9px] bg-[#1297FD] flex items-center justify-center mx-auto" style={{ boxShadow: '0 2px 10px rgba(18,151,253,.35)' }}>
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                <path d="M9 2L3 9h5l-1 5 6-7H8L9 2Z" fill="#fff" stroke="#fff" strokeWidth=".4" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          {/* Close button (mobile) */}
          {isMobile && isMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white text-[#8D909C] hover:text-[#0C0D10] transition-colors"
            >
              <X size={18} />
            </button>
          )}

          {/* Collapse toggle (desktop) */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-white text-[#8D909C] hover:text-[#1297FD] transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link key={link.name} href={link.href} className="block relative group" title={isCollapsed && !isMobile ? link.name : undefined}>
                {isActive && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#1297FD] rounded-r-full" />
                )}
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[rgba(18,151,253,.07)] text-[#1297FD]'
                    : 'text-[#8D909C] hover:bg-white hover:text-[#0C0D10]'
                } ${isCollapsed && !isMobile ? 'justify-center px-2' : ''}`}>
                  <Icon size={18} className="flex-shrink-0" />
                  {(!isCollapsed || isMobile) && (
                    <span className="font-medium text-sm whitespace-nowrap">{link.name}</span>
                  )}
                </div>

                {/* Tooltip for collapsed state */}
                {isCollapsed && !isMobile && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-white border border-[#E8E9EC] rounded-md text-xs text-[#0C0D10] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[70] shadow-md">
                    {link.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-3 border-t border-[#E8E9EC] bg-white">
          {(!isCollapsed || isMobile) ? (
            <div className="flex flex-col gap-2">
              <div className="px-3 py-2 bg-[#F2F3F5] rounded-lg border border-[#E8E9EC] flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1297FD] to-[#0A82E0] flex items-center justify-center text-white flex-shrink-0">
                  <User size={12} />
                </div>
                <div className="text-xs font-medium text-[#0C0D10] truncate" title={user?.email || ''}>
                  {user?.email || 'Loading...'}
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#EF4444] hover:bg-[rgba(239,68,68,.08)] transition-colors w-full text-left"
              >
                <LogOut size={18} className="flex-shrink-0" />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1297FD] to-[#0A82E0] flex items-center justify-center text-white mx-auto shadow-sm" title={user?.email || ''}>
                <User size={14} />
              </div>
              <button
                onClick={signOut}
                className="w-full flex justify-center p-2 rounded-lg text-[#EF4444] hover:bg-[rgba(239,68,68,.08)] transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
