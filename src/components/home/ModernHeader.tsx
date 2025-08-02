import { useState, useEffect } from 'react';
import { Bell, MapPin } from 'lucide-react';
import NotificationCenter from '@/components/advanced/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';

interface ModernHeaderProps {
  hasNotifications?: boolean;
}

export const ModernHeader = ({ 
  hasNotifications = false
}: ModernHeaderProps) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const geolocation = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState('Kinshasa, RD Congo');

  // Get user's full name from metadata or default
  const fullName = user?.user_metadata?.full_name || 
                  user?.user_metadata?.name || 
                  (user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : user?.user_metadata?.first_name) || 
                  'Utilisateur';
  
  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // Get current location on component mount
  useEffect(() => {
    geolocation.getCurrentPosition();
  }, [geolocation.getCurrentPosition]);

  // Reverse geocoding to get address from coordinates
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude) {
      // Simple reverse geocoding - in a real app, you'd use a proper geocoding service
      setCurrentAddress('Position actuelle');
    }
  }, [geolocation.latitude, geolocation.longitude]);
  return (
    <div className="relative overflow-hidden">
      {/* Fond blanc */}
      <div 
        className="px-6 py-4 pt-8 relative z-10 bg-white"
      >
        {/* Structure simplifiée en 2 colonnes */}
        <div className="flex items-center justify-between">
          {/* Salutation personnalisée et localisation */}
          <div className="flex-1">
            <div className="mb-1">
              <p className="text-gray-900 font-bold text-lg">
                {getGreeting()}, {fullName}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-gray-600" />
              <p className="text-gray-600 text-sm">
                {geolocation.loading ? 'Localisation...' : currentAddress}
              </p>
            </div>
          </div>
          
          {/* Notifications fonctionnelles */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              <Bell className="h-5 w-5 text-gray-700" />
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