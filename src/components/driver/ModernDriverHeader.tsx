/**
 * 🚗 Header Driver Moderne - Épuré et professionnel
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Car, Package, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

interface ModernDriverHeaderProps {
  serviceType: 'taxi' | 'delivery' | 'unknown';
  isOnline?: boolean;
  onToggleOnline?: () => void;
  className?: string;
}

export const ModernDriverHeader: React.FC<ModernDriverHeaderProps> = ({
  serviceType,
  isOnline = false,
  onToggleOnline,
  className
}) => {
  const { user } = useAuth();

  // Extraire prénom depuis email ou metadata
  const driverFirstName = useMemo(() => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    }
    return 'Chauffeur';
  }, [user]);

  // Salutation selon l'heure
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const ServiceIcon = serviceType === 'taxi' ? Car : Package;
  const serviceColor = serviceType === 'taxi' ? 'orange' : 'blue';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50',
        className
      )}
    >
      <div className="px-4 py-3 pt-safe">
        {/* Single Row: All elements aligned */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Greeting + Name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {greeting} 👋
            </p>
            <h1 className="text-lg font-bold text-foreground truncate">
              {driverFirstName}
            </h1>
          </div>

          {/* Center: Service Badge */}
          <Badge 
            variant="secondary" 
            className={cn(
              "gap-1.5 px-3 py-1.5 text-xs font-semibold shrink-0",
              serviceType === 'taxi' && "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30",
              serviceType === 'delivery' && "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
              serviceType === 'unknown' && "bg-muted"
            )}
          >
            <ServiceIcon className="h-3.5 w-3.5" />
            {serviceType === 'taxi' ? 'VTC' : serviceType === 'delivery' ? 'Livraison' : 'Service'}
          </Badge>

          {/* Right: Theme Toggle + Online Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle variant="icon" size="sm" />
            
            {/* Compact Online Toggle */}
            {onToggleOnline && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onToggleOnline}
                className={cn(
                  'relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                  'shadow-md hover:shadow-lg',
                  isOnline 
                    ? serviceColor === 'orange'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-muted'
                )}
              >
                <Power 
                  className={cn(
                    'w-5 h-5 transition-all duration-300',
                    isOnline ? 'text-white' : 'text-muted-foreground'
                  )} 
                />
                
                {/* Online Indicator */}
                {isOnline && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-background"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-full h-full bg-green-400 rounded-full"
                    />
                  </motion.div>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
