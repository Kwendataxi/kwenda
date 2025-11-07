/**
 * 🚗 Dashboard Taxi - Interface moderne pour chauffeurs taxi
 */

import { useEffect, useState } from 'react';
import { Car, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverNotifications } from '@/hooks/useDriverNotifications';
import { ModernOnlineToggle } from '../shared/ModernOnlineToggle';
import { TaxiFloatingStats } from './TaxiFloatingStats';
import { RideActionPanel } from '@/components/driver/RideActionPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export const TaxiDriverDashboard = () => {
  const { status, goOnline, goOffline } = useDriverStatus();
  const { pendingNotifications, activeOrders, acceptOrder, rejectOrder } = useDriverDispatch();
  const { notifications, unreadCount } = useDriverNotifications();
  const [todayStats, setTodayStats] = useState({ rides: 0, earnings: 0, hours: 0 });

  const handleToggle = async () => {
    if (status.isOnline) {
      await goOffline();
    } else {
      await goOnline();
    }
  };

  useEffect(() => {
    // Appliquer le thème taxi
    document.documentElement.setAttribute('data-service-type', 'taxi');
    
    return () => {
      document.documentElement.removeAttribute('data-service-type');
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* 🔔 RideActionPanel - Gestion des courses assignées */}
      <RideActionPanel />

      {/* Header avec toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl service-pulse">
            🚗
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mode Chauffeur Taxi</h1>
            <p className="text-sm text-muted-foreground">
              {status.isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>
        
        <ModernOnlineToggle
          isOnline={status.isOnline}
          onToggle={handleToggle}
          serviceType="taxi"
        />
      </div>

      {/* Stats flottantes */}
      <TaxiFloatingStats
        ridesCount={todayStats.rides}
        earnings={todayStats.earnings}
        hoursOnline={todayStats.hours}
      />

      {/* Course active */}
      {activeOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-6 service-card border-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Course en cours</h3>
                  <p className="text-sm text-muted-foreground">Passager à bord</p>
                </div>
              </div>
              <span className="stats-badge px-3 py-1 rounded-full text-sm">
                En route
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="text-sm font-medium text-foreground">
                    {activeOrders[0].destination || 'Chargement...'}
                  </p>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                Naviguer vers destination
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Nouvelles courses disponibles */}
      {pendingNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Nouvelles courses disponibles
          </h2>
          
          {pendingNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="service-card border-2 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{notif.title}</h3>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                </div>
                <span className="text-lg font-bold text-blue-500">
                  {notif.estimatedPrice} CDF
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Expire dans 60s</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => rejectOrder(notif.id)}
                  className="w-full"
                >
                  Refuser
                </Button>
                <Button
                  onClick={() => acceptOrder(notif)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  Accepter
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* État vide */}
      {status.isOnline && pendingNotifications.length === 0 && activeOrders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mx-auto mb-4">
            <Car className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">En attente de courses</h3>
          <p className="text-sm text-muted-foreground">
            Vous recevrez une notification dès qu'une course sera disponible
          </p>
        </motion.div>
      )}

      {!status.isOnline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Car className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Vous êtes hors ligne</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Activez votre statut pour recevoir des courses
          </p>
          <Button
            onClick={handleToggle}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Passer en ligne
          </Button>
        </motion.div>
      )}
    </div>
  );
};
