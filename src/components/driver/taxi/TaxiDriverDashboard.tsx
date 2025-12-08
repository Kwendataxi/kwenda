/**
 * 🚗 Dashboard Taxi - Interface moderne et épurée pour chauffeurs taxi
 */

import { useEffect, useState } from 'react';
import { Car, MapPin, TrendingUp, Zap, Bell } from 'lucide-react';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverNotifications } from '@/hooks/useDriverNotifications';
import { useDriverDailyStats } from '@/hooks/useDriverDailyStats';
import { TaxiFloatingStats } from './TaxiFloatingStats';
import { RideRequestSheet } from '@/components/driver/RideRequestSheet';
import { RideActionPanel } from '@/components/driver/RideActionPanel';
import { ModernDriverHeader } from '@/components/driver/ModernDriverHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const TaxiDriverDashboard = () => {
  const { status, goOnline, goOffline } = useDriverStatus();
  const { pendingNotifications, activeOrders, acceptOrder, rejectOrder } = useDriverDispatch();
  const { notifications, unreadCount } = useDriverNotifications();
  const { stats } = useDriverDailyStats();
  const [currentRequest, setCurrentRequest] = useState<any>(null);

  const handleToggle = async () => {
    if (status.isOnline) {
      await goOffline();
    } else {
      await goOnline();
    }
  };

  // Handle new ride request from notifications
  useEffect(() => {
    if (pendingNotifications.length > 0 && !currentRequest) {
      const firstNotif = pendingNotifications[0];
      setCurrentRequest({
        id: firstNotif.id,
        pickupLocation: firstNotif.location || firstNotif.data?.pickup_location || 'Chargement...',
        destination: firstNotif.data?.destination || firstNotif.data?.delivery_location || 'Chargement...',
        estimatedPrice: firstNotif.estimatedPrice || 0,
        estimatedDistance: firstNotif.distance,
        estimatedDuration: firstNotif.data?.estimated_duration
      });
    }
  }, [pendingNotifications, currentRequest]);

  const handleAcceptRide = (id: string) => {
    const notif = pendingNotifications.find(n => n.id === id);
    if (notif) {
      acceptOrder(notif);
    }
    setCurrentRequest(null);
  };

  const handleRejectRide = (id: string) => {
    rejectOrder(id);
    setCurrentRequest(null);
  };

  useEffect(() => {
    // Appliquer le thème taxi
    document.documentElement.setAttribute('data-service-type', 'taxi');
    
    return () => {
      document.documentElement.removeAttribute('data-service-type');
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header épuré avec toggle intégré */}
      <ModernDriverHeader 
        serviceType="taxi"
        isOnline={status.isOnline}
        onToggleOnline={handleToggle}
      />

      {/* Main Content */}
      <div className="px-4 py-4 pb-24 space-y-5">
        {/* Stats Cards Glassmorphism */}
        <TaxiFloatingStats
          ridesCount={stats.todayCourses}
          earnings={stats.todayEarnings}
          hoursOnline={0}
        />

        {/* RideActionPanel - Gestion des courses assignées */}
        <RideActionPanel />

        {/* Course active */}
        <AnimatePresence>
          {activeOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className={cn(
                'p-5 border-2 border-orange-500/30',
                'bg-gradient-to-br from-orange-500/5 to-orange-600/10',
                'backdrop-blur-sm'
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Car className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-foreground">Course en cours</h3>
                      <p className="text-sm text-muted-foreground">Passager à bord</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium">
                    En route
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-background/60">
                    <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="text-sm font-medium text-foreground">
                        {activeOrders[0].destination || 'Chargement...'}
                      </p>
                    </div>
                  </div>
                  
                  <Button className={cn(
                    'w-full h-12 font-semibold gap-2',
                    'bg-gradient-to-r from-orange-500 to-orange-600',
                    'hover:from-orange-600 hover:to-orange-700',
                    'shadow-lg shadow-orange-500/25'
                  )}>
                    <MapPin className="w-5 h-5" />
                    Naviguer vers destination
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* État en ligne - En attente */}
        <AnimatePresence>
          {status.isOnline && pendingNotifications.length === 0 && activeOrders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              {/* Animated Waiting State */}
              <motion.div 
                className="relative w-24 h-24 mx-auto mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 blur-xl" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-2 border-dashed border-orange-500/30 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Car className="w-10 h-10 text-orange-500" />
                  </motion.div>
                </div>
              </motion.div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                En attente de courses
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Restez à proximité des zones à forte demande pour recevoir plus de courses
              </p>

              {/* Tips Card */}
              <Card className="p-4 bg-orange-500/5 border-orange-500/20 max-w-sm mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Astuce</p>
                    <p className="text-xs text-muted-foreground">
                      Activez les notifications pour ne manquer aucune opportunité
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* État hors ligne */}
        <AnimatePresence>
          {!status.isOnline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Car className="w-10 h-10 text-muted-foreground" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2">
                Vous êtes hors ligne
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Activez votre statut pour recevoir des courses
              </p>
              
              <Button
                onClick={handleToggle}
                size="lg"
                className={cn(
                  'h-14 px-8 text-base font-semibold gap-3',
                  'bg-gradient-to-r from-orange-500 to-orange-600',
                  'hover:from-orange-600 hover:to-orange-700',
                  'shadow-lg shadow-orange-500/30'
                )}
              >
                <Zap className="w-5 h-5" />
                Passer en ligne
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Roll-up Sheet for Ride Requests */}
      <RideRequestSheet
        request={currentRequest}
        onAccept={handleAcceptRide}
        onReject={handleRejectRide}
        timeoutSeconds={30}
      />
    </div>
  );
};
