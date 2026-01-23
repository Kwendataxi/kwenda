/**
 * 🚗 Centre de Notifications Unifié pour Chauffeurs
 * Regroupe toutes les notifications : courses, livraisons et alertes système
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  MapPin, 
  Clock, 
  DollarSign, 
  Package, 
  X, 
  CheckCircle,
  AlertCircle,
  Car,
  Bike,
  Info
} from 'lucide-react';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { CancellationDialog } from '@/components/shared/CancellationDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DriverNotificationCenterProps {
  className?: string;
}

export const DriverNotificationCenter: React.FC<DriverNotificationCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Notifications système via hook unifié
  const {
    notifications: systemNotifications,
    unreadCount: systemUnreadCount,
    markAsRead,
    markAllAsRead
  } = useUnifiedNotifications('driver');

  // Alertes de livraison via hook unifié
  const {
    pendingNotifications,
    loading: deliveryLoading,
    acceptOrder,
    rejectOrder
  } = useDriverDispatch();
  
  // Filtrer les alertes de livraison uniquement
  const deliveryAlerts = pendingNotifications.filter(n => n.type === 'delivery' || n.type === 'marketplace');

  // Calculer le temps restant pour les alertes
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: Record<string, number> = {};
      
      deliveryAlerts.forEach(alert => {
        if (alert.expires_at) {
          const expiresAt = new Date(alert.expires_at).getTime();
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          newTimeRemaining[alert.id] = remaining;
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [deliveryAlerts]);

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAcceptRide = (id: string) => {
    toast.success('Course acceptée !');
  };

  const handleRejectRide = (id: string) => {
    setSelectedBookingId(id);
    setShowCancelDialog(true);
  };

  const handleCancelBooking = async (reason: string) => {
    if (!selectedBookingId || !user) return;

    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason,
          cancellation_type: 'driver'
        })
        .eq('id', selectedBookingId);

      if (error) throw error;

      await supabase
        .from('cancellation_history')
        .insert({
          reference_id: selectedBookingId,
          reference_type: 'transport',
          cancelled_by: user.id,
          cancellation_type: 'driver',
          reason,
          status_at_cancellation: 'pending'
        });

      toast.success('Course refusée');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Erreur lors du refus de la course');
    } finally {
      setShowCancelDialog(false);
      setSelectedBookingId(null);
    }
  };

  const totalUnread = systemUnreadCount + deliveryAlerts.length;

  return (
    <>
      <Card className={`border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Notifications
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalUnread}
                </Badge>
              )}
            </CardTitle>
            {systemNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 m-4 rounded-lg">
              <TabsTrigger 
                value="all"
                className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                Tout {totalUnread > 0 && `(${totalUnread})`}
              </TabsTrigger>
              <TabsTrigger 
                value="rides"
                className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                <Car className="h-4 w-4 mr-1" />
                Courses
              </TabsTrigger>
              <TabsTrigger 
                value="deliveries"
                className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                <Bike className="h-4 w-4 mr-1" />
                Livraisons {deliveryAlerts.length > 0 && `(${deliveryAlerts.length})`}
              </TabsTrigger>
              <TabsTrigger 
                value="system"
                className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                <Info className="h-4 w-4 mr-1" />
                Système {systemUnreadCount > 0 && `(${systemUnreadCount})`}
              </TabsTrigger>
            </TabsList>

            {/* Onglet Tout */}
            <TabsContent value="all" className="m-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-3">
                  {deliveryAlerts.length === 0 && systemNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Bell className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Aucune notification
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Les nouvelles courses apparaîtront ici
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Alertes de livraison */}
                      {deliveryAlerts.map((alert) => {
                        const remaining = timeRemaining[alert.id] || 0;
                        const isExpired = remaining === 0;
                        const isExpiringSoon = remaining > 0 && remaining <= 30;

                        return (
                          <Card 
                            key={alert.id}
                            className={`border-2 ${
                              isExpired 
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                                : isExpiringSoon
                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 animate-pulse'
                                : 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isExpired 
                                      ? 'bg-red-100 dark:bg-red-900/30' 
                                      : 'bg-indigo-100 dark:bg-indigo-900/30'
                                  }`}>
                                    <Package className={`h-5 w-5 ${
                                      isExpired ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'
                                    }`} />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                      {isExpired ? 'Course expirée' : alert.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {alert.distance?.toFixed(1) || '0.0'}km • ~{alert.distance ? Math.ceil(alert.distance * 3) : 15} min
                                    </p>
                                  </div>
                                </div>
                                {!isExpired && (
                                  <Badge variant={isExpiringSoon ? "destructive" : "default"} className="font-mono">
                                    ⏱️ {formatTimeRemaining(remaining)}
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                    {alert.data?.pickup_location || alert.location}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                    {alert.data?.delivery_location || alert.data?.destination || 'Destination'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg mb-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Prix estimé</span>
                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                  {alert.estimatedPrice?.toLocaleString()} FC
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    acceptOrder(alert);
                                  }}
                                  disabled={deliveryLoading || isExpired}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {isExpired ? 'Expirée' : 'Accepter'}
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectOrder(alert.id);
                                  }}
                                  variant="outline"
                                  disabled={isExpired}
                                  className="border-slate-200 dark:border-slate-700"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Ignorer
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {/* Notifications système */}
                      {systemNotifications.slice(0, 10).map((notification) => (
                        <div 
                          key={notification.id}
                          className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                            notification.is_read 
                              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50' 
                              : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20'
                          } hover:border-indigo-300 dark:hover:border-indigo-700`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              notification.severity === 'error' || notification.priority === 'urgent'
                                ? 'bg-red-100 dark:bg-red-900/30' 
                                : notification.severity === 'warning'
                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              <Info className={`h-5 w-5 ${
                                notification.severity === 'error' || notification.priority === 'urgent'
                                  ? 'text-red-600 dark:text-red-400' 
                                  : notification.severity === 'warning'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {notification.title}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {new Date(notification.created_at).toLocaleString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Onglet Courses */}
            <TabsContent value="rides" className="m-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-3">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Car className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                      Aucune course disponible
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Les nouvelles demandes apparaîtront ici
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Onglet Livraisons */}
            <TabsContent value="deliveries" className="m-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-3">
                  {deliveryAlerts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Bike className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Aucune livraison disponible
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Les nouvelles commandes apparaîtront ici
                      </p>
                    </div>
                  ) : (
                    deliveryAlerts.map((alert) => {
                      const remaining = timeRemaining[alert.id] || 0;
                      const isExpired = remaining === 0;
                      const isExpiringSoon = remaining > 0 && remaining <= 30;

                      return (
                        <Card 
                          key={alert.id}
                          className={`border-2 ${
                            isExpired 
                              ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                              : isExpiringSoon
                              ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 animate-pulse'
                              : 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isExpired 
                                    ? 'bg-red-100 dark:bg-red-900/30' 
                                    : 'bg-indigo-100 dark:bg-indigo-900/30'
                                }`}>
                                  <Package className={`h-5 w-5 ${
                                    isExpired ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'
                                  }`} />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                    {isExpired ? 'Course expirée' : alert.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {alert.distance?.toFixed(1) || '0.0'}km • ~{alert.distance ? Math.ceil(alert.distance * 3) : 15} min
                                  </p>
                                </div>
                              </div>
                              {!isExpired && (
                                <Badge variant={isExpiringSoon ? "destructive" : "default"} className="font-mono">
                                  ⏱️ {formatTimeRemaining(remaining)}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2 mb-3">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                  {alert.data?.pickup_location || alert.location}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                  {alert.data?.delivery_location || alert.data?.destination || 'Destination'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg mb-3">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Prix estimé</span>
                              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {alert.estimatedPrice?.toLocaleString()} FC
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acceptOrder(alert);
                                }}
                                disabled={deliveryLoading || isExpired}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {isExpired ? 'Expirée' : 'Accepter'}
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectOrder(alert.id);
                                }}
                                variant="outline"
                                disabled={isExpired}
                                className="border-slate-200 dark:border-slate-700"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Ignorer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Onglet Système */}
            <TabsContent value="system" className="m-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-3">
                  {systemNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Info className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Aucune notification système
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Les alertes importantes apparaîtront ici
                      </p>
                    </div>
                  ) : (
                    systemNotifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                          notification.is_read 
                            ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50' 
                            : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20'
                        } hover:border-indigo-300 dark:hover:border-indigo-700`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            notification.severity === 'error' || notification.priority === 'urgent'
                              ? 'bg-red-100 dark:bg-red-900/30' 
                              : notification.severity === 'warning'
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            <Info className={`h-5 w-5 ${
                              notification.severity === 'error' || notification.priority === 'urgent'
                                ? 'text-red-600 dark:text-red-400' 
                                : notification.severity === 'warning'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {new Date(notification.created_at).toLocaleString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CancellationDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setSelectedBookingId(null);
        }}
        onConfirm={handleCancelBooking}
        userType="driver"
        bookingType="transport"
      />
    </>
  );
};

export default DriverNotificationCenter;
