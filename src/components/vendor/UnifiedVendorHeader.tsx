import React from 'react';
import { Store } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { EnhancedThemeToggle } from '@/components/theme/EnhancedThemeToggle';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface UnifiedVendorHeaderProps {
  className?: string;
}

export const UnifiedVendorHeader: React.FC<UnifiedVendorHeaderProps> = ({ className = '' }) => {
  const isMobile = useIsMobile();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-[150] bg-background/95 backdrop-blur-xl border-b ${className}`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between h-[60px] md:h-[68px]">
          {/* LEFT: Titre avec bouton retour mobile */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Icône Store */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Store className="h-5 w-5 text-primary" />
            </motion.div>

            {/* Titre */}
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
            >
              {isMobile ? 'Vendeur' : 'Espace Vendeur'}
            </motion.h1>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <NotificationBell />
            </motion.div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <EnhancedThemeToggle variant="icon" size="sm" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
