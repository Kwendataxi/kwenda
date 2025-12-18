import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, CheckCircle, X, Zap, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { CancellationDialog } from '@/components/shared/CancellationDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DriverArrivalButton } from './DriverArrivalButton';
import { useDriverSubscriptions } from '@/hooks/useDriverSubscriptions';
import { DriverOfferSheet } from './DriverOfferSheet';

interface RideNotification {
  id: string;
  title: string;
  message: string;
  distance: number;
  estimatedTime: number;
  expiresIn: number;
  status?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  estimatedPrice?: number;
  vehicleClass?: string;
  ridesRemaining?: number;
  biddingMode?: boolean;
  offerCount?: number;
  biddingClosesAt?: string;
}

// Helper pour calculer temps restant
const getRemainingTime = (closesAt: string): string => {
  const remaining = new Date(closesAt).getTime() - Date.now();
  if (remaining <= 0) return 'Expiré';
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function DriverRideNotifications() {
  const { user } = useAuth();
  const { currentSubscription, refreshSubscription } = useDriverSubscriptions();
  const [notifications, setNotifications] = useState<RideNotification[]>([]);
  const [acceptedRides, setAcceptedRides] = useState<Map<string, boolean>>(new Map());
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showOfferSheet, setShowOfferSheet] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<RideNotification | null>(null);

  // Load real-time notifications from Supabase
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up ride notifications for driver:', user.id);

    // Load pending notifications
    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('push_notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('notification_type', ['ride_assignment', 'ride_bidding'])
        .eq('is_sent', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`✅ Loaded ${data.length} pending ride notifications`);
        
        const mappedNotifications: RideNotification[] = data.map((notif: any) => {
          const isBidding = notif.notification_type === 'ride_bidding' || 
                            (notif as any).metadata?.biddingMode === true;
          
          return {
            id: notif.reference_id || notif.id,
            title: isBidding ? '🎯 Mode Enchères' : notif.title,
            message: notif.message,
            distance: (notif as any).metadata?.distance || 0,
            estimatedTime: Math.ceil(((notif as any).metadata?.distance || 0) * 3),
            expiresIn: 120,
            pickupAddress: (notif as any).metadata?.pickupLocation?.address,
            destinationAddress: (notif as any).metadata?.destinationLocation?.address,
            estimatedPrice: (notif as any).metadata?.estimatedPrice,
            vehicleClass: (notif as any).metadata?.vehicleClass,
            ridesRemaining: (notif as any).metadata?.rides_remaining,
            status: 'pending',
            biddingMode: isBidding,
            offerCount: (notif as any).metadata?.offerCount || 0,
            biddingClosesAt: (notif as any).metadata?.biddingClosesAt
          };
        });

        setNotifications(mappedNotifications);
      }
    };

    loadNotifications();

    // Real-time subscription for new ride assignments
    const channel = supabase
      .channel('driver-ride-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'push_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          
          const newNotif = payload.new as any;
          const isBidding = newNotif.notification_type === 'ride_bidding' || 
                            newNotif.metadata?.biddingMode === true;
          
          if (newNotif.notification_type === 'ride_assignment' || newNotif.notification_type === 'ride_bidding') {
            const notification: RideNotification = {
              id: newNotif.reference_id || newNotif.id,
              title: isBidding ? '🎯 Mode Enchères' : newNotif.title,
              message: newNotif.message,
              distance: newNotif.metadata?.distance || 0,
              estimatedTime: Math.ceil((newNotif.metadata?.distance || 0) * 3),
              expiresIn: isBidding ? 180 : 120, // 3 min for bidding
              pickupAddress: newNotif.metadata?.pickupLocation?.address,
              destinationAddress: newNotif.metadata?.destinationLocation?.address,
              estimatedPrice: newNotif.metadata?.estimatedPrice,
              vehicleClass: newNotif.metadata?.vehicleClass,
              ridesRemaining: newNotif.metadata?.rides_remaining,
              status: 'pending',
              biddingMode: isBidding,
              offerCount: newNotif.metadata?.offerCount || 0,
              biddingClosesAt: newNotif.metadata?.biddingClosesAt
            };

            setNotifications(prev => [notification, ...prev]);
            
            // Play notification sound with different message for bidding
            toast(isBidding ? '🎯 Nouvelle enchère disponible !' : '🚗 Nouvelle course disponible !', {
              description: isBidding 
                ? `${notification.estimatedPrice?.toLocaleString()} CDF • ${notification.distance.toFixed(1)}km`
                : `Distance: ${notification.distance.toFixed(1)}km`,
              duration: isBidding ? 180000 : 120000
            });
          }
        }
      )
      .subscribe();

    // Timer for expiration
    const timerInterval = setInterval(() => {
      setNotifications(prev => 
        prev
          .map(n => ({ ...n, expiresIn: n.expiresIn - 1 }))
          .filter(n => n.expiresIn > 0)
      );
    }, 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(timerInterval);
    };
  }, [user]);

  const handleAccept = async (id: string) => {
    if (!user) return;

    try {
      // Mark as accepted in UI immediately
      setAcceptedRides(prev => new Map(prev).set(id, true));

      // Update booking status
      const { error } = await supabase
        .from('transport_bookings')
        .update({
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('driver_id', user.id);

      if (error) throw error;

      // Mark notification as sent
      await supabase
        .from('push_notifications')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq('reference_id', id)
        .eq('user_id', user.id);

      toast.success('✅ Course acceptée !', {
        description: 'Dirigez-vous vers le client. Le crédit sera défalqué à votre arrivée.'
      });

    } catch (error) {
      console.error('Error accepting ride:', error);
      toast.error('Erreur lors de l\'acceptation de la course');
      setAcceptedRides(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
  };

  const handleReject = (id: string) => {
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

      // Log cancellation
      await supabase
        .from('cancellation_history')
        .insert({
          reference_id: selectedBookingId,
          reference_type: 'transport',
          cancelled_by: user.id,
          cancellation_type: 'driver',
          reason,
          status_at_cancellation: notifications.find(n => n.id === selectedBookingId)?.status || 'pending'
        });

      setNotifications(prev => prev.filter(n => n.id !== selectedBookingId));
      toast.success('Course refusée');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Erreur lors du refus de la course');
    } finally {
      setShowCancelDialog(false);
      setSelectedBookingId(null);
    }
  };

  const handleArrivalConfirmed = (bookingId: string, ridesRemaining: number) => {
    // Remove notification after arrival confirmed
    setNotifications(prev => prev.filter(n => n.id !== bookingId));
    setAcceptedRides(prev => {
      const newMap = new Map(prev);
      newMap.delete(bookingId);
      return newMap;
    });
    
    // Refresh subscription to show updated credits
    refreshSubscription();
    
    toast.success('✅ Course démarrée !', {
      description: `Crédits restants: ${ridesRemaining}`
    });
  };

  const handleMakeOffer = (notification: RideNotification) => {
    setSelectedOffer(notification);
    setShowOfferSheet(true);
  };

  if (notifications.length === 0 && acceptedRides.size === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <p>Aucune course en attente</p>
        <p className="text-sm mt-1">Restez disponible pour recevoir des demandes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Display credits badge */}
      {currentSubscription && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">{currentSubscription.rides_remaining}</span>
            <span className="text-muted-foreground">courses restantes</span>
          </Badge>
        </div>
      )}

      {notifications.map((notification) => {
        const isAccepted = acceptedRides.get(notification.id);
        return (
        <Card
          key={notification.id} 
          className={`border shadow-lg transition-all ${
            isAccepted ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-primary'
          }`}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-full ${
                isAccepted ? 'bg-green-500/20' : 'bg-primary/10'
              }`}>
                <MapPin className={`h-4 w-4 ${isAccepted ? 'text-green-600' : 'text-primary'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <p className="text-xs text-muted-foreground">{notification.vehicleClass || notification.message}</p>
              </div>
              {isAccepted && (
                <Badge variant="default" className="bg-green-500">
                  Acceptée
                </Badge>
              )}
            </div>

            {/* Route Info */}
            <div className="space-y-2 mb-4 bg-muted/50 rounded-lg p-3">
              <div className="flex items-start gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">Départ</p>
                  <p className="text-muted-foreground truncate">
                    {notification.pickupAddress || 'Adresse de départ'}
                  </p>
                </div>
              </div>
              <div className="ml-1 border-l border-dashed h-4" />
              <div className="flex items-start gap-2 text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">Arrivée</p>
                  <p className="text-muted-foreground truncate">
                    {notification.destinationAddress || 'Adresse d\'arrivée'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
              <div className="bg-background rounded p-2 text-center">
                <MapPin className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                <p className="font-medium">{notification.distance.toFixed(1)} km</p>
              </div>
              <div className="bg-background rounded p-2 text-center">
                <Clock className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                <p className="font-medium">~{notification.estimatedTime} min</p>
              </div>
              <div className="bg-background rounded p-2 text-center">
                <DollarSign className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                <p className="font-medium">{notification.estimatedPrice?.toLocaleString() || '-'} CDF</p>
              </div>
            </div>

            {/* Info bénéficiaire si course pour autrui */}
            {(notification as any).bookedForOther && (
              <div className="mt-3 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
                  ⚠️ Course réservée pour un tiers
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Bénéficiaire :</strong> {(notification as any).beneficiaryName}</p>
                  <p><strong>Téléphone :</strong> {(notification as any).beneficiaryPhone}</p>
                </div>
              </div>
            )}

            {/* Badge mode bidding */}
            {notification.biddingMode && !isAccepted && (
              <Badge variant="outline" className="mb-3 bg-primary/10 border-primary/30">
                🎯 Mode enchères • {notification.offerCount || 0} offre{(notification.offerCount || 0) > 1 ? 's' : ''}
              </Badge>
            )}

            {!isAccepted ? (
              <>
                {/* Timer */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-destructive h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(notification.expiresIn / 120) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono">{notification.expiresIn}s</span>
                </div>

                {/* Action Buttons */}
                {notification.biddingMode ? (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full justify-center py-1">
                      🎯 Mode Enchères • {notification.offerCount || 0} offre(s)
                    </Badge>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleMakeOffer(notification)}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      💰 Faire une offre
                    </Button>
                    
                    {notification.biddingClosesAt && (
                      <p className="text-xs text-center text-muted-foreground">
                        ⏱️ Expire dans {getRemainingTime(notification.biddingClosesAt)}
                      </p>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleReject(notification.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Ignorer
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReject(notification.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAccept(notification.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Accepter
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 mb-3 text-xs">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    ℹ️ Dirigez-vous vers le client
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Le crédit sera déduit lorsque vous confirmerez votre arrivée à moins de 100m du client.
                  </p>
                </div>

                {/* Arrival Button */}
                <DriverArrivalButton
                  bookingId={notification.id}
                  ridesRemaining={notification.ridesRemaining || currentSubscription?.rides_remaining || 0}
                  onArrivalConfirmed={(remaining) => handleArrivalConfirmed(notification.id, remaining)}
                  className="w-full"
                />
              </>
            )}
          </CardContent>
        </Card>
        );
      })}

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

      {/* Sheet pour faire une offre */}
      {selectedOffer && (
        <DriverOfferSheet
          open={showOfferSheet}
          onOpenChange={setShowOfferSheet}
          bookingId={selectedOffer.id}
          estimatedPrice={selectedOffer.estimatedPrice || 0}
          distance={selectedOffer.distance}
          pickupAddress={selectedOffer.pickupAddress || 'Adresse de départ'}
          destinationAddress={selectedOffer.destinationAddress || 'Adresse d\'arrivée'}
          offerCount={selectedOffer.offerCount}
        />
      )}
    </div>
  );
}