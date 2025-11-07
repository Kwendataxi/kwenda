/**
 * Panneau d'actions pour les chauffeurs pendant une course
 * Permet d'accepter, démarrer, et terminer une course
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  X, 
  MapPin, 
  Navigation as NavigationIcon,
  Clock,
  DollarSign,
  Phone,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { NavigationModal } from './NavigationModal';

interface RideDetails {
  id: string;
  status: string;
  pickup_location: string;
  destination_location?: string;
  delivery_location?: string;
  destination?: string;
  pickup_coordinates: any;
  destination_coordinates?: any;
  delivery_coordinates?: any;
  estimated_price?: number;
  customer_phone?: string;
  sender_phone?: string;
  recipient_phone?: string;
  customer_name?: string;
  sender_name?: string;
  recipient_name?: string;
  distance_km?: number;
  rideType?: 'transport' | 'delivery';
  [key: string]: any;
}

export const RideActionPanel: React.FC = () => {
  const { user } = useAuth();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);

  // Charger automatiquement les courses/livraisons assignées
  useEffect(() => {
    if (!user?.id) return;

    loadActiveRide();

    // S'abonner aux changements transport
    const transportChannel = supabase
      .channel(`transport-driver-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transport_bookings',
        filter: `driver_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔄 Transport updated:', payload.new);
        if (['driver_assigned', 'driver_arrived', 'in_progress'].includes(payload.new.status)) {
          setRide({ ...payload.new, rideType: 'transport' } as RideDetails);
        } else if (payload.new.status === 'completed' || payload.new.status === 'cancelled') {
          setRide(null);
        }
      })
      .subscribe();

    // S'abonner aux changements delivery
    const deliveryChannel = supabase
      .channel(`delivery-driver-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_orders',
        filter: `driver_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔄 Delivery updated:', payload.new);
        if (['driver_assigned', 'picked_up', 'in_transit'].includes(payload.new.status)) {
          setRide({ ...payload.new, rideType: 'delivery' } as RideDetails);
        } else if (payload.new.status === 'delivered' || payload.new.status === 'cancelled') {
          setRide(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(transportChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [user?.id]);

  const loadActiveRide = async () => {
    if (!user?.id) return;

    // Chercher transport actif
    const { data: transportData } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('driver_id', user.id)
      .in('status', ['driver_assigned', 'driver_arrived', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (transportData) {
      setRide({ ...transportData, rideType: 'transport' } as RideDetails);
      return;
    }

    // Sinon chercher delivery active
    const { data: deliveryData } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('driver_id', user.id)
      .in('status', ['driver_assigned', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (deliveryData) {
      setRide({ ...deliveryData, rideType: 'delivery' } as RideDetails);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!ride?.id || !ride.rideType) return;

    setLoading(true);
    const table = ride.rideType === 'transport' ? 'transport_bookings' : 'delivery_orders';
    
    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Ajouter des timestamps selon le statut
    if (newStatus === 'driver_arrived') {
      updates.driver_arrived_at = new Date().toISOString();
    } else if (newStatus === 'in_progress' || newStatus === 'picked_up') {
      updates.trip_started_at = new Date().toISOString();
    } else if (newStatus === 'completed' || newStatus === 'delivered') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', ride.id);

    setLoading(false);

    if (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      toast.error('Erreur lors de la mise à jour');
      return;
    }

    // Feedback selon le statut
    if (newStatus === 'driver_arrived') {
      toast.success('✅ Arrivée confirmée !');
    } else if (newStatus === 'in_progress' || newStatus === 'picked_up') {
      toast.success('🚗 Course démarrée !');
    } else if (newStatus === 'completed' || newStatus === 'delivered') {
      toast.success('🎉 Course terminée !');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setRide(null); // Masquer le panneau
    }

    loadActiveRide();
  };

  const handleAccept = () => {
    updateStatus('driver_arrived');
  };

  const handleReject = async () => {
    if (!ride?.id || !ride.rideType) return;
    
    const confirmed = window.confirm('Êtes-vous sûr de refuser cette course ?');
    if (!confirmed) return;

    setLoading(true);
    const table = ride.rideType === 'transport' ? 'transport_bookings' : 'delivery_orders';

    const { error } = await supabase
      .from(table)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Refusée par le chauffeur'
      })
      .eq('id', ride.id);

    setLoading(false);

    if (!error) {
      toast.info('Course refusée');
      setRide(null);
    }
  };

  const handleStartRide = () => {
    if (!ride?.rideType) return;
    const status = ride.rideType === 'transport' ? 'in_progress' : 'picked_up';
    updateStatus(status);
  };

  const handleCompleteRide = () => {
    if (!ride?.rideType) return;
    const status = ride.rideType === 'transport' ? 'completed' : 'delivered';
    updateStatus(status);
  };

  if (!ride) {
    return null; // Ne rien afficher si pas de course active
  }

  // Déterminer les actions disponibles selon le statut
  const showAcceptReject = ride.status === 'driver_assigned';
  const showArrived = ride.status === 'driver_assigned';
  const showStart = ride.status === 'driver_arrived';
  const showComplete = ride.status === 'in_progress' || ride.status === 'picked_up';

  return (
    <>
      <Card className="border-primary shadow-lg">
        <CardContent className="p-4 space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
          <div>
              <h3 className="font-bold text-lg">
                {ride.rideType === 'transport' ? '🚗 Course' : '📦 Livraison'}
              </h3>
              <Badge variant={
                ride.status === 'completed' || ride.status === 'delivered' 
                  ? 'default' 
                  : 'secondary'
              }>
                {ride.status}
              </Badge>
            </div>
            {ride.estimated_price && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {ride.estimated_price.toLocaleString()} CDF
                </div>
                <div className="text-xs text-muted-foreground">
                  {ride.distance_km?.toFixed(1)} km
                </div>
              </div>
            )}
          </div>

      {/* Itinéraire */}
      <div className="space-y-2 bg-muted/50 rounded-lg p-3">
        <div className="flex items-start gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
          <div className="flex-1">
            <p className="font-medium">Départ</p>
            <p className="text-muted-foreground">{ride.pickup_location}</p>
          </div>
        </div>
        <div className="ml-1 border-l-2 border-dashed h-4" />
        <div className="flex items-start gap-2 text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
          <div className="flex-1">
            <p className="font-medium">Arrivée</p>
            <p className="text-muted-foreground">
              {ride.destination_location || ride.delivery_location || ride.destination || 'Destination'}
            </p>
          </div>
        </div>
      </div>

      {/* Contact client */}
      {(ride.customer_phone || ride.sender_phone || ride.recipient_phone) && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            const phone = ride.customer_phone || ride.sender_phone || ride.recipient_phone;
            window.location.href = `tel:${phone}`;
          }}
        >
          <Phone className="w-4 h-4 mr-2" />
          Appeler {ride.customer_name || ride.sender_name || ride.recipient_name || 'le client'}
        </Button>
      )}

          {/* Actions selon le statut */}
          <div className="space-y-2">
            {showAcceptReject && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Refuser
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={loading}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accepter
                </Button>
              </div>
            )}

            {showArrived && (
              <Button
                onClick={() => updateStatus('driver_arrived')}
                disabled={loading}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Je suis arrivé
              </Button>
            )}

            {showStart && (
              <Button
                onClick={handleStartRide}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Démarrer la course
              </Button>
            )}

            {showComplete && (
              <Button
                onClick={handleCompleteRide}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                <Star className="w-4 h-4 mr-2" />
                Terminer la course
              </Button>
            )}

            {/* Navigation GPS */}
            {!showAcceptReject && (
              <Button
                variant="outline"
                onClick={() => setShowNavigation(true)}
                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <NavigationIcon className="w-4 h-4 mr-2" />
                Ouvrir GPS
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de navigation */}
      {showNavigation && ride && (
        <NavigationModal
          open={showNavigation}
          onClose={() => setShowNavigation(false)}
          orderId={ride.id}
          orderType={ride.rideType || 'transport'}
          pickup={{
            lat: ride.pickup_coordinates?.lat || 0,
            lng: ride.pickup_coordinates?.lng || 0,
            address: ride.pickup_location || 'Point de départ'
          }}
          destination={{
            lat: (ride.destination_coordinates?.lat || ride.delivery_coordinates?.lat || 0),
            lng: (ride.destination_coordinates?.lng || ride.delivery_coordinates?.lng || 0),
            address: ride.destination_location || ride.delivery_location || ride.destination || 'Destination'
          }}
          customerPhone={ride.customer_phone || ride.sender_phone || ride.recipient_phone}
        />
      )}
    </>
  );
};
