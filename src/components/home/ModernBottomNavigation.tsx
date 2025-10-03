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
    <div 
      className="fixed bottom-0 left-0 right-0 z-[100]"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
      }}
    >
      <div className="mx-4 mb-4 rounded-3xl bg-background/90 backdrop-blur-xl border-2 border-border/60 shadow-2xl overflow-hidden">
        {/* Gradient overlay animé */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-secondary/5 to-accent/8 opacity-70 pointer-events-none animate-congo-gradient bg-[length:200%_100%]" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 shadow-inner pointer-events-none" />
        
        <div className="relative flex items-center justify-around px-3 py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-all duration-300 min-w-[76px] group active:scale-95"
              >
                {/* Active background with wave effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/10 rounded-2xl shadow-lg" />
                )}
                
                {/* Icon container with micro-animations */}
                <div className="relative">
                  <Icon 
                    className={`w-7 h-7 transition-all duration-300 ${
                      isActive 
                        ? 'text-primary scale-115 drop-shadow-md' 
                        : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                    }`}
                  />
                  
                  {/* Glow effect pour icône active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md -z-10" />
                  )}
                  
                  {/* Notification badge - plus visible */}
                  {tab.badge > 0 && (
                    <div className="absolute -top-2.5 -right-2.5 min-w-[20px] h-[20px] px-1.5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-background animate-pulse">
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
                
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute -bottom-0.5 h-1 w-12 bg-gradient-to-r from-primary via-secondary to-primary rounded-full shadow-md" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};