import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DollarSign, 
  Check, 
  X, 
  Star, 
  Clock, 
  Car, 
  Navigation,
  Users,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DriverOffer {
  offerId: string;
  driverId: string;
  driverName: string;
  driverPhoto?: string;
  offeredPrice: number;
  message?: string;
  estimatedArrival?: number;
  distanceToPickup?: number;
  driverRating?: number;
  driverVehicleClass?: string;
  createdAt: string;
}

interface ClientOfferViewerProps {
  bookingId: string;
  estimatedPrice: number;
  onOfferAccepted?: (driverId: string, price: number) => void;
  onClose?: () => void;
}

export const ClientOfferViewer = ({
  bookingId,
  estimatedPrice,
  onOfferAccepted,
  onClose
}: ClientOfferViewerProps) => {
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);

  // Load existing offers
  useEffect(() => {
    const loadOffers = async () => {
      const { data, error } = await supabase
        .from('ride_offers' as any)
        .select('*')
        .eq('booking_id', bookingId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading offers:', error);
        return;
      }

      if (data && data.length > 0) {
        // Fetch driver details for each offer
        const offersWithDrivers: DriverOffer[] = await Promise.all(
          data.map(async (offer: any) => {
            let driverName = 'Chauffeur';
            let driverPhoto = '';
            let driverRating = 0;
            let driverVehicleClass = '';

            try {
              const { data: driverData } = await supabase
                .from('chauffeurs')
                .select('display_name, profile_photo_url, rating_average, vehicle_class')
                .eq('user_id', offer.driver_id)
                .maybeSingle();

              if (driverData) {
                driverName = driverData.display_name || 'Chauffeur';
                driverPhoto = driverData.profile_photo_url || '';
                driverRating = driverData.rating_average || 0;
                driverVehicleClass = driverData.vehicle_class || '';
              }
            } catch (e) {
              console.warn('Could not fetch driver info:', e);
            }

            return {
              offerId: offer.id,
              driverId: offer.driver_id,
              driverName,
              driverPhoto,
              offeredPrice: offer.offered_price,
              message: offer.message,
              estimatedArrival: offer.estimated_arrival_time,
              distanceToPickup: offer.distance_to_pickup,
              driverRating,
              driverVehicleClass,
              createdAt: offer.created_at
            };
          })
        );

        setOffers(offersWithDrivers);
      }
    };

    loadOffers();

    // Listen for new offers in realtime
    const channel = supabase
      .channel(`client-offers-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers',
          filter: `booking_id=eq.${bookingId}`
        },
        async (payload) => {
          console.log('📩 New offer received:', payload.new);
          
          let driverName = 'Chauffeur';
          let driverPhoto = '';
          let driverRating = 0;
          let driverVehicleClass = '';

          try {
            const { data: driverData } = await supabase
              .from('chauffeurs')
              .select('display_name, profile_photo_url, rating_average, vehicle_class')
              .eq('user_id', payload.new.driver_id)
              .maybeSingle();

            if (driverData) {
              driverName = driverData.display_name || 'Chauffeur';
              driverPhoto = driverData.profile_photo_url || '';
              driverRating = driverData.rating_average || 0;
              driverVehicleClass = driverData.vehicle_class || '';
            }
          } catch (e) {
            console.warn('Could not fetch driver info:', e);
          }

          const newOffer: DriverOffer = {
            offerId: payload.new.id as string,
            driverId: payload.new.driver_id as string,
            driverName,
            driverPhoto,
            offeredPrice: payload.new.offered_price || 0,
            message: payload.new.message || '',
            estimatedArrival: payload.new.estimated_arrival_time,
            distanceToPickup: payload.new.distance_to_pickup,
            driverRating,
            driverVehicleClass,
            createdAt: payload.new.created_at || new Date().toISOString()
          };

          setOffers(prev => [newOffer, ...prev]);
          
          toast.success('📨 Nouvelle offre !', {
            description: `${driverName} propose ${newOffer.offeredPrice.toLocaleString()} CDF`
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const handleAcceptOffer = async (offer: DriverOffer) => {
    setAcceptingOfferId(offer.offerId);
    setLoading(true);

    try {
      // Update offer status
      const { error: offerError } = await supabase
        .from('ride_offers' as any)
        .update({ status: 'accepted' })
        .eq('id', offer.offerId);

      if (offerError) throw offerError;

      // Update booking with driver assignment
      const { error: bookingError } = await supabase
        .from('transport_bookings')
        .update({
          driver_id: offer.driverId,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString(),
          estimated_price: offer.offeredPrice,
          bidding_mode: false
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Reject all other offers
      await supabase
        .from('ride_offers' as any)
        .update({ status: 'rejected' })
        .eq('booking_id', bookingId)
        .neq('id', offer.offerId);

      toast.success('✅ Offre acceptée !', {
        description: `${offer.driverName} a été assigné à votre course`
      });

      onOfferAccepted?.(offer.driverId, offer.offeredPrice);
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Erreur lors de l\'acceptation de l\'offre');
    } finally {
      setLoading(false);
      setAcceptingOfferId(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('ride_offers' as any)
        .update({ status: 'rejected' })
        .eq('id', offerId);

      if (error) throw error;

      setOffers(prev => prev.filter(o => o.offerId !== offerId));
      toast.info('Offre refusée');
    } catch (error) {
      console.error('Error rejecting offer:', error);
    }
  };

  const getPriceComparisonBadge = (offeredPrice: number) => {
    const diff = ((offeredPrice - estimatedPrice) / estimatedPrice) * 100;
    
    if (diff <= -10) {
      return <Badge className="bg-emerald-500 text-white">-{Math.abs(Math.round(diff))}%</Badge>;
    } else if (diff >= 10) {
      return <Badge className="bg-destructive text-white">+{Math.round(diff)}%</Badge>;
    } else {
      return <Badge variant="secondary">≈ Prix Kwenda</Badge>;
    }
  };

  if (offers.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              En attente d'offres...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Les chauffeurs à proximité voient votre demande
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Offres des chauffeurs
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10">
            {offers.length} offre{offers.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {offers.map((offer) => (
            <motion.div
              key={offer.offerId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="p-4 bg-muted/50 rounded-xl border"
            >
              <div className="flex items-start gap-3">
                {/* Driver Avatar */}
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={offer.driverPhoto} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {offer.driverName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Driver Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold truncate">{offer.driverName}</h4>
                    {getPriceComparisonBadge(offer.offeredPrice)}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    {offer.driverRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {offer.driverRating.toFixed(1)}
                      </span>
                    )}
                    {offer.driverVehicleClass && (
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {offer.driverVehicleClass}
                      </span>
                    )}
                    {offer.distanceToPickup && (
                      <span className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {offer.distanceToPickup.toFixed(1)} km
                      </span>
                    )}
                    {offer.estimatedArrival && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{offer.estimatedArrival} min
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {offer.offeredPrice.toLocaleString()} CDF
                    </span>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectOffer(offer.offerId)}
                        disabled={loading}
                        className="h-9 w-9 p-0 border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptOffer(offer)}
                        disabled={loading}
                        className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {acceptingOfferId === offer.offerId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Accepter
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Message if any */}
                  {offer.message && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      "{offer.message}"
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Info about Kwenda price */}
        <div className="text-center pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Prix Kwenda estimé: <span className="font-semibold">{estimatedPrice.toLocaleString()} CDF</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
