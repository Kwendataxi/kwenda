import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Car, Package, TrendingUp, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useDriverDailyStats } from '@/hooks/useDriverDailyStats';
import { useAuth } from '@/hooks/useAuth';

interface ModernDriverHeaderProps {
  serviceType: 'taxi' | 'delivery' | 'unknown';
  className?: string;
}

export const ModernDriverHeader: React.FC<ModernDriverHeaderProps> = ({
  serviceType,
  className
}) => {
  const { user } = useAuth();
  const { stats, loading } = useDriverDailyStats();

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

  // Gradient selon service
  const gradientClass = serviceType === 'taxi' 
    ? 'from-orange-500/10 to-orange-600/5' 
    : serviceType === 'delivery'
    ? 'from-blue-500/10 to-blue-600/5'
    : 'from-primary/10 to-primary/5';

  const ServiceIcon = serviceType === 'taxi' ? Car : Package;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-[150]',
        'bg-gradient-to-r backdrop-blur-md border-b border-border/50',
        gradientClass,
        className
      )}
    >
      <div className="container mx-auto px-4 py-3 pt-safe">
        {/* Row 1: Greeting + Actions */}
        <div className="flex items-center justify-between mb-2">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {greeting} 👋
            </p>
            <h1 className="text-xl font-bold text-foreground">
              {driverFirstName}
            </h1>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-2"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <NotificationBell />
            <ThemeToggle variant="icon" size="md" />
          </motion.div>
        </div>

        {/* Row 2: Service Badge + Quick Stats */}
        <motion.div 
          className="flex items-center justify-between gap-3"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Service Badge */}
          <Badge 
            variant="secondary" 
            className={cn(
              "gap-1.5 text-xs font-semibold",
              serviceType === 'taxi' && "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
              serviceType === 'delivery' && "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
              serviceType === 'unknown' && "bg-muted"
            )}
          >
            <ServiceIcon className="h-3.5 w-3.5" />
            {serviceType === 'taxi' ? 'VTC' : serviceType === 'delivery' ? 'Livraison' : 'Service'}
          </Badge>
          
          {/* Quick Stats */}
          {!loading && (
            <div className="flex items-center gap-3 text-xs">
              {/* Courses du jour */}
              <motion.div 
                className="flex items-center gap-1.5 text-muted-foreground"
                whileHover={{ scale: 1.05 }}
              >
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{stats.todayCourses}</span>
                <span className="hidden sm:inline">courses</span>
              </motion.div>

              {/* Gains du jour */}
              <motion.div 
                className="flex items-center gap-1.5 text-muted-foreground"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-sm">💰</span>
                <span className="font-semibold text-foreground">
                  {stats.todayEarnings.toLocaleString()}
                </span>
                <span className="hidden sm:inline">CDF</span>
              </motion.div>

              {/* Note moyenne (si disponible) */}
              {stats.rating > 0 && (
                <motion.div 
                  className="flex items-center gap-1 text-muted-foreground"
                  whileHover={{ scale: 1.05 }}
                >
                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-foreground">{stats.rating}</span>
                </motion.div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
};
