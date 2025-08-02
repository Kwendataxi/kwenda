import { useState } from 'react';
import { Bell, MapPin } from 'lucide-react';
import NotificationCenter from '@/components/advanced/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';

interface ModernHeaderProps {
  hasNotifications?: boolean;
  userLocation?: string;
}

export const ModernHeader = ({ 
  hasNotifications = false,
  userLocation = "Kinshasa, RD Congo"
}: ModernHeaderProps) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Get user's first name from metadata or default
  const firstName = user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || 'Utilisateur';
  
  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };
  return (
    <div className="relative overflow-hidden">
      {/* Gradient simplifié */}
      <div 
        className="px-6 py-4 pt-8 relative z-10"
        style={{ 
          background: 'var(--gradient-hero)'
        }}
      >
        {/* Structure simplifiée en 2 colonnes */}
        <div className="flex items-center justify-between">
          {/* Salutation personnalisée et localisation */}
          <div className="flex-1">
            <div className="mb-1">
              <p className="text-white font-bold text-lg">
                {getGreeting()}, {firstName}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-white/80" />
              <p className="text-white/80 text-sm">{userLocation}</p>
            </div>
          </div>
          
          {/* Notifications fonctionnelles */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
            >
              <Bell className="h-5 w-5 text-white" />
              {hasNotifications && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Panel de notifications */}
      {showNotifications && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white shadow-xl border-t animate-slide-in-down">
          <div className="max-h-96 overflow-y-auto">
            <NotificationCenter />
          </div>
        </div>
      )}
    </div>
  );
};