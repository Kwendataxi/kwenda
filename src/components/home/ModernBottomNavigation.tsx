import { Home, Activity, User, Heart, Search } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModernBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
  favoritesCount?: number;
}

export const ModernBottomNavigation = ({ 
  activeTab, 
  onTabChange,
  notificationCount = 0,
  favoritesCount = 0
}: ModernBottomNavigationProps) => {
  const { t } = useLanguage();
  const tabs = [
    {
      id: 'home',
      name: t('client.nav.home'),
      icon: Home,
      badge: 0
    },
    {
      id: 'activity',
      name: t('client.nav.activity'),
      icon: Activity,
      badge: notificationCount
    },
    {
      id: 'profil',
      name: t('client.nav.account'),
      icon: User,
      badge: 0
    }
  ];

  return (
    <nav 
      className="bottom-nav-standard z-[110]"
      style={{ 
        willChange: 'transform',
        pointerEvents: 'auto',
        touchAction: 'none'
      } as React.CSSProperties}
    >
      <div className="relative h-full">
        {/* Glassmorphism Background - Background principal avec blur moderne */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
        
        {/* Gradient d'accentuation subtile */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
        
        {/* Border top avec glow effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        
        {/* Subtle inner shadow pour profondeur */}
        <div className="absolute inset-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] pointer-events-none" />
        
        <div className="relative flex items-center justify-around h-full px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[64px] group active:scale-95"
              >
                {/* Active background avec glassmorphism moderne */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/6 to-primary/4 rounded-2xl backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/10 transition-all duration-300" />
                )}
                
                {/* Icon container with micro-animations */}
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 transition-all duration-300 ease-out ${
                      isActive 
                        ? 'text-primary scale-110 drop-shadow-[0_2px_8px_rgba(220,38,38,0.4)]' 
                        : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                    }`}
                  />
                  
                  {/* Glow effect pour icône active - version améliorée */}
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/25 rounded-full blur-xl -z-10 animate-pulse" />
                  )}
                  
                  {/* Notification badge - optimisé */}
                  {tab.badge > 0 && (
                    <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow-md border border-background">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </div>
                  )}
                </div>
                
                {/* Label - Typography moderne avec gradient subtil */}
                <span 
                  className={`text-xs font-bold tracking-tight transition-all duration-300 ${
                    isActive 
                      ? 'text-primary scale-105 drop-shadow-sm' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  {tab.name}
                </span>
                
                {/* Active indicator bar - design moderne */}
                {isActive && (
                  <div className="absolute -bottom-1 h-1 w-12 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};