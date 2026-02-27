import { NavLink, useNavigate } from 'react-router-dom';
import { Heart, Camera, Map, Target, Home, LogOut, MoreHorizontal, Bell } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { useAppName } from '../lib/useAppName';
import { useUnreadCount } from '../lib/useUnreadCount';
import UploadToast from './UploadToast';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/moments', icon: Camera, label: 'Moments' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/more', icon: MoreHorizontal, label: 'Profile' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const appName = useAppName();
  const navigate = useNavigate();
  const unreadCount = useUnreadCount();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border p-6 fixed h-full">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-primary fill-primary" />
            <h1 className="font-heading text-2xl font-bold text-primary">{appName}</h1>
          </div>
          {/* Bell — desktop */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative text-text-light hover:text-primary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-light hover:bg-primary/5 hover:text-primary'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-border">
          <div className="text-xs text-text-light mb-2 truncate">{user?.name}</div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-text-light hover:text-red-500 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6 px-4 md:px-8 pt-[calc(1.5rem+env(safe-area-inset-top))] md:pt-6">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                isActive ? 'text-primary' : 'text-text-light'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Global upload progress toasts */}
      <UploadToast />
    </div>
  );
}
