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
      className="!fixed !bottom-0 left-0 right-0 z-[200] bg-background/95 backdrop-blur-xl"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        willChange: 'transform',
        pointerEvents: 'auto'
      } as React.CSSProperties}
    >
      <div 
        className="border-t border-border/30 shadow-2xl rounded-t-3xl overflow-hidden"
        style={{ 
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0rem))',
          isolation: 'isolate'
        }}
      >
        {/* Gradient moderne - du bas vers le haut */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-background/50 to-transparent pointer-events-none" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 shadow-inner pointer-events-none" />
        
        <div className="relative flex items-center justify-around px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[64px] group active:scale-95"
              >
                {/* Active background avec effet subtil */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/8 to-secondary/8 rounded-2xl shadow-md transition-all duration-200" />
                )}
                
                {/* Icon container with micro-animations */}
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 transition-all duration-300 ${
                      isActive 
                        ? 'text-primary scale-115 drop-shadow-md' 
                        : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                    }`}
                  />
                  
                  {/* Glow effect pour icône active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md -z-10" />
                  )}
                  
                  {/* Notification badge - optimisé */}
                  {tab.badge > 0 && (
                    <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow-md border border-background">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </div>
                  )}
                </div>
                
                {/* Label - plus imposant */}
                <span 
                  className={`text-xs font-bold transition-all duration-300 ${
                    isActive 
                      ? 'text-primary scale-105' 
                      : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                  }`}
                >
                  {tab.name}
                </span>
                
                {/* Active indicator bar - simplifié */}
                {isActive && (
                  <div className="absolute -bottom-1 h-0.5 w-10 bg-primary rounded-full shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};