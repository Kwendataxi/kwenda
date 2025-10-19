import React from 'react';
import { Store } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { EnhancedThemeToggle } from '@/components/theme/EnhancedThemeToggle';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
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
          {/* LEFT: Titre */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Icône */}
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

          {/* RIGHT: Actions groupées dans une capsule moderne */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="flex items-center gap-1 md:gap-2 bg-muted/30 hover:bg-muted/50 rounded-full px-2 py-1.5 transition-all duration-300 border border-border/50"
          >
            {/* Notifications */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <NotificationBell />
            </motion.div>

            {/* Theme Toggle */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <EnhancedThemeToggle variant="icon" size={isMobile ? "sm" : "default"} />
            </motion.div>

            {/* Language Selector */}
            {!isMobile && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LanguageSelector />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};
