import { useState, useEffect } from 'react';
import { Bell, MapPin, Battery, Wifi, WifiOff, Signal } from 'lucide-react';
import NotificationCenter from '@/components/advanced/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface ModernHeaderProps {
  hasNotifications?: boolean;
}

export const ModernHeader = ({ 
  hasNotifications = false
}: ModernHeaderProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const geolocation = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState(t('city.kinshasa') + ', RD Congo');
  const { metrics, isSlowConnection } = usePerformanceMonitor();
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);

  // Get user's full name from metadata or default
  const fullName = user?.user_metadata?.full_name || 
                  user?.user_metadata?.name || 
                  (user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : user?.user_metadata?.first_name) || 
                  t('common.user') || 'Utilisateur';
  
  // Dynamic greeting based on time and language
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  // Get current location on component mount
  useEffect(() => {
    geolocation.getCurrentPosition();
  }, [geolocation.getCurrentPosition]);

  // Reverse geocoding to get address from coordinates
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude) {
      // Simple reverse geocoding - in a real app, you'd use a proper geocoding service
      setCurrentAddress(t('home.location.current'));
    }
  }, [geolocation.latitude, geolocation.longitude]);

  // Battery status monitoring
  useEffect(() => {
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore
          const battery = await navigator.getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
          
          // Listen for battery changes
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        } catch (error) {
          // Fallback for unsupported browsers
          setBatteryLevel(85);
        }
      }
    };
    
    getBatteryInfo();
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Fond moderne avec gradient subtil */}
      <div 
        className="px-6 py-4 pt-12 relative z-10"
        style={{
          background: 'linear-gradient(135deg, hsl(0, 0%, 100%) 0%, hsl(210, 40%, 98%) 100%)'
        }}
      >

        {/* Structure en 2 colonnes améliorée */}
        <div className="flex items-center justify-between">
          {/* Salutation personnalisée et localisation */}
          <div className="flex-1">
            <p className="text-foreground font-bold text-lg">
              {getGreeting()}, {fullName.split(' ')[0]}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-muted-foreground text-sm">
                {geolocation.loading ? t('common.loading') : t('city.kinshasa')}
              </p>
            </div>
          </div>
          
          {/* Actions à droite */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 bg-white rounded-xl hover:bg-grey-50 transition-all duration-200 shadow-sm border border-grey-100 hover:scale-105 active:scale-95"
              >
                <Bell className="h-5 w-5 text-foreground" />
                {hasNotifications && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs font-bold text-white">{t('home.notifications.unread')}</span>
                  </div>
                )}
              </button>
            </div>
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