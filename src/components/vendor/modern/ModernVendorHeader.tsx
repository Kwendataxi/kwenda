import React from 'react';
import { Bell, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ModernVendorHeaderProps {
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export const ModernVendorHeader: React.FC<ModernVendorHeaderProps> = ({
  notificationCount = 0,
  onNotificationClick
}) => {
  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Kwenda Shop</h1>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          onClick={onNotificationClick}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                variant="destructive" 
                className="h-5 min-w-5 px-1 text-xs flex items-center justify-center animate-pulse"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </div>
    </div>
  );
};
