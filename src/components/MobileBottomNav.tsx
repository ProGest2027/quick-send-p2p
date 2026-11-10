/**
 * Quick Send — Mobile Bottom Navigation Bar (Android & iOS Native Style)
 * Fixed at screen bottom with safe area insets for iOS Home Indicator bar
 */

import React from 'react';
import {
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Crown,
  User,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { UserProfile } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: UserProfile | null;
  pendingRequestsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  pendingRequestsCount = 0,
}) => {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const navItems = [
    {
      id: 'marketplace',
      label: 'Mercado',
      icon: ArrowLeftRight,
    },
    {
      id: 'converter',
      label: 'Câmbio',
      icon: TrendingUp,
    },
    {
      id: 'requests',
      label: 'Ordens',
      icon: Clock,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    {
      id: 'premium',
      label: 'Premium',
      icon: Crown,
      highlight: true,
    },
    {
      id: isSuperAdmin ? 'admin' : (currentUser ? 'dashboard' : 'home'),
      label: isSuperAdmin ? 'Admin' : (currentUser ? 'Conta' : 'Início'),
      icon: isSuperAdmin ? ShieldCheck : User,
    },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1323]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg transition-colors">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'dashboard' && activeTab === 'profile') ||
            (item.id === 'requests' && activeTab === 'chat');

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-90 ${
                isActive
                  ? 'text-[#246BFD] font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  } ${item.highlight && !isActive ? 'text-amber-500' : ''}`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#246BFD] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
