import React from 'react';
import { Car, Package, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModernDriverHeaderProps {
  serviceType: 'taxi' | 'delivery';
  driverName?: string;
  notificationCount?: number;
  className?: string;
}

export const ModernDriverHeader: React.FC<ModernDriverHeaderProps> = ({
  serviceType,
  driverName = 'Chauffeur',
  notificationCount = 0,
  className
}) => {
  const Icon = serviceType === 'taxi' ? Car : Package;
  const gradientClass = serviceType === 'taxi' 
    ? 'from-orange-600 to-orange-500' 
    : 'from-blue-600 to-blue-500';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-gradient-to-r",
        gradientClass,
        "text-white shadow-lg",
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Service Icon & Title */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            
            <div>
              <h1 className="font-bold text-lg leading-tight">
                {serviceType === 'taxi' ? 'VTC Kwenda' : 'Livraison Kwenda'}
              </h1>
              <p className="text-sm opacity-90">
                {driverName}
              </p>
            </div>
          </div>

          {/* Right: Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-white/20"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Service Type Badge */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3"
        >
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {serviceType === 'taxi' ? '🚗 Service VTC' : '📦 Service Livraison'}
          </Badge>
        </motion.div>
      </div>
    </motion.header>
  );
};
