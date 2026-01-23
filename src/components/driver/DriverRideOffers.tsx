import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Navigation, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RideOffer {
  id: string;
  ride_request_id: string;
  status: string;
  expires_at: string;
  created_at: string;
  ride_request: {
    id: string;
    pickup_location: string;
    destination: string;
    estimated_price: number;
    status: string;
  };
}

export default function DriverRideOffers() {
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ride_offers')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Charger les ride_requests associés
      if (data && data.length > 0) {
        const requestIds = data.map(o => o.ride_request_id);
        const { data: requests } = await supabase
          .from('ride_requests')
          .select('*')
          .in('id', requestIds);

        const offersWithRequests = data.map(offer => ({
          ...offer,
          ride_request: requests?.find(r => r.id === offer.ride_request_id) || {
            id: offer.ride_request_id,
            pickup_location: 'Chargement...',
            destination: 'Chargement...',
            estimated_price: 0,
            status: 'pending'
          }
        }));
        setOffers(offersWithRequests as any);
      } else {
        setOffers([]);
      }
    } catch (error) {
      console.error('Erreur chargement offres:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptOffer = async (offerId: string, rideRequestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mettre à jour l'offre
      const { error: offerError } = await supabase
        .from('ride_offers')
        .update({ status: 'accepted' })
        .eq('id', offerId);

      if (offerError) throw offerError;

      // Mettre à jour la demande de course
      const { error: requestError } = await supabase
        .from('ride_requests')
        .update({ 
          status: 'accepted',
          assigned_driver_id: user.id
        })
        .eq('id', rideRequestId);

      if (requestError) throw requestError;

      // Mettre à jour le transport_booking
      const { error: bookingError } = await supabase
        .from('transport_bookings')
        .update({ 
          status: 'driver_assigned',
          driver_id: user.id,
          driver_assigned_at: new Date().toISOString()
        })
        .eq('id', rideRequestId);

      if (bookingError) throw bookingError;

      toast.success('Course acceptée avec succès !');
      loadOffers();
    } catch (error) {
      console.error('Erreur acceptation course:', error);
      toast.error('Impossible d\'accepter la course');
    }
  };

  const rejectOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('ride_offers')
        .update({ status: 'rejected' })
        .eq('id', offerId);

      if (error) throw error;

      toast.success('Offre refusée');
      loadOffers();
    } catch (error) {
      console.error('Erreur refus offre:', error);
      toast.error('Impossible de refuser l\'offre');
    }
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadOffers();

    const channel = supabase
      .channel('ride-offers-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers'
        },
        () => {
          loadOffers();
          toast.info('Nouvelle course disponible !');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des offres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Courses disponibles</h2>
        <Badge variant="outline">{offers.length} offre{offers.length > 1 ? 's' : ''}</Badge>
      </div>

      {offers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aucune course disponible pour le moment</p>
        </Card>
      ) : (
        offers.map((offer) => (
          <Card key={offer.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{offer.ride_request.pickup_location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{offer.ride_request.destination}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  <DollarSign className="w-5 h-5" />
                  {offer.ride_request.estimated_price.toLocaleString()} CDF
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Clock className="w-4 h-4" />
                  {getTimeRemaining(offer.expires_at)}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => acceptOffer(offer.id, offer.ride_request_id)}
                className="flex-1"
                variant="default"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accepter
              </Button>
              <Button
                onClick={() => rejectOffer(offer.id)}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Refuser
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
