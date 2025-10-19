import React from 'react';
import { Store } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface UnifiedVendorHeaderProps {
  className?: string;
}

export const UnifiedVendorHeader: React.FC<UnifiedVendorHeaderProps> = ({ className = '' }) => {
  const isMobile = useIsMobile();
  
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 ${className}`}
    >
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Store className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-lg font-bold text-foreground">
              {isMobile ? 'Vendeur' : 'Espace Vendeur'}
            </h1>
          </motion.div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <NotificationBell />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};
