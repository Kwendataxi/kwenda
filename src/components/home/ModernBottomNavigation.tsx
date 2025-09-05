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
      name: 'Accueil',
      icon: Home,
      badge: 0
    },
    {
      id: 'activity',
      name: 'Activité',
      icon: Activity,
      badge: notificationCount
    },
    {
      id: 'profil',
      name: 'Compte',
      icon: User,
      badge: 0
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100]">
      {/* Background avec effet de flou */}
      <div 
        className="bg-background/95 backdrop-blur-xl border-t border-border/60 transition-all duration-300"
        style={{ 
          boxShadow: '0 -4px 20px -4px hsl(var(--primary) / 0.1)' 
        }}
      >
        <div className="px-4 py-2">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    relative flex flex-col items-center justify-center py-3 px-4 rounded-2xl
                    transition-all duration-300 min-w-[60px]
                    ${isActive 
                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 scale-110' 
                      : 'hover:bg-grey-50 active:scale-95'
                    }
                  `}
                >
                  {/* Icône avec animation */}
                  <div className="relative">
                    <Icon 
                      className={`h-5 w-5 transition-all duration-200 ${
                        isActive 
                          ? 'text-primary scale-110' 
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`} 
                    />
                    
                    {/* Badge de notification */}
                    {tab.badge > 0 && (
                      <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-xs font-bold text-white">
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span 
                    className={`text-xs font-medium mt-1 transition-all duration-200 ${
                      isActive 
                        ? 'text-primary scale-105' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    {tab.name}
                  </span>
                  
                  {/* Indicateur actif */}
                  {isActive && (
                    <div 
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-primary to-primary-glow rounded-full animate-fade-in"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Indicateur de zone sécurisée */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
};