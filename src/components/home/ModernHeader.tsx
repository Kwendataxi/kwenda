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
    <div className="bg-gradient-to-r from-red-600 to-orange-500 px-4 py-6 pt-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">Solde: {userBalance.toLocaleString()} FC</p>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-white/80" />
              <p className="text-white/80 text-xs">{userLocation}</p>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <Bell className="h-6 w-6 text-white" />
          {hasNotifications && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-yellow-400 text-xs">
              !
            </Badge>
          )}
        </div>
      </div>
      
      {/* Logo and branding */}
      <div className="text-center">
        <h1 className="text-white text-2xl font-bold">Kwenda</h1>
        <p className="text-white/80 text-sm">Transport • Livraison • Shopping</p>
      </div>
    </div>
  );
};