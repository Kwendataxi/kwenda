import { Bell, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ModernHeaderProps {
  userBalance: number;
  hasNotifications?: boolean;
  userLocation?: string;
}

export const ModernHeader = ({ 
  userBalance, 
  hasNotifications = false,
  userLocation = "Kinshasa, RD Congo"
}: ModernHeaderProps) => {
  return (
    <div className="relative overflow-hidden">
      {/* Gradient principal avec effet moderne */}
      <div 
        className="px-4 py-6 pt-12 relative z-10"
        style={{ 
          background: 'var(--gradient-hero)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">
                {userBalance.toLocaleString()} FC
              </p>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-white/90" />
                <p className="text-white/90 text-sm font-medium">{userLocation}</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-200">
              <Bell className="h-6 w-6 text-white" />
            </div>
            {hasNotifications && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-secondary rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                <span className="text-xs font-bold text-white">!</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Logo et branding améliorés */}
        <div className="text-center mb-2">
          <h1 className="text-white text-3xl font-bold tracking-tight mb-1">Kwenda</h1>
          <p className="text-white/90 text-sm font-medium tracking-wide">
            Transport • Livraison • Shopping
          </p>
        </div>
      </div>
      
      {/* Effet de décoration en arrière-plan */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
    </div>
  );
};