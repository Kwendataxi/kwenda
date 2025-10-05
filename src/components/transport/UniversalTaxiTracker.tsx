import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle,
  Clock, 
  Star,
  ChevronLeft,
  Car,
  CreditCard,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { calculateDistanceFromCoordinates, calculateTripDuration } from '@/utils/distanceCalculator';
import { logger } from '@/utils/logger';
import TaxiPaymentModal from '../payment/TaxiPaymentModal';
import { supabase } from '@/integrations/supabase/client';
import { useBookingChat } from '@/hooks/useBookingChat';

interface UniversalTaxiTrackerProps {
  bookingId: string;
  onBack?: () => void;
}

interface BookingData {
  id: string;
  status: string | null;
  pickup_coordinates: any;
  destination_coordinates: any;
  pickup_location: string;
  destination: string;
  actual_price: number | null;
  estimated_price: number | null;
  driver_id: string | null;
  driver_assigned_at: string | null;
  pickup_time: string | null;
  completion_time: string | null;
  vehicle_type: string;
  booking_time: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  driver?: {
    id: string;
    display_name: string;
    phone_number: string;
    rating_average: number;
    vehicle_model: string;
    vehicle_plate: string;
  };
}

const STATUS_CONFIG = {
  pending: { label: 'Recherche d\'un chauffeur', progress: 10, color: 'secondary' },
  confirmed: { label: 'Chauffeur trouvé', progress: 25, color: 'primary' },
  driver_assigned: { label: 'Chauffeur en route', progress: 50, color: 'primary' },
  picked_up: { label: 'Course en cours', progress: 75, color: 'primary' },
  completed: { label: 'Course terminée', progress: 100, color: 'success' },
  cancelled: { label: 'Course annulée', progress: 0, color: 'destructive' }
};

export default function UniversalTaxiTracker({ bookingId, onBack }: UniversalTaxiTrackerProps) {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { openChatFromBooking } = useBookingChat();

  // Charger les données de réservation
  const fetchBookingData = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select(`
          *,
          driver:chauffeurs(
            id,
            display_name,
            phone_number,
            rating_average,
            vehicle_model,
            vehicle_plate
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      
      // Nettoyer les données pour correspondre à l'interface
      const cleanedData = {
        ...data,
        driver: data.driver_id && data.driver && typeof data.driver === 'object' && !Array.isArray(data.driver) ? {
          id: (data.driver as any).id || '',
          display_name: (data.driver as any).display_name || 'Chauffeur',
          phone_number: (data.driver as any).phone_number || '',
          rating_average: (data.driver as any).rating_average || 0,
          vehicle_model: (data.driver as any).vehicle_model || '',
          vehicle_plate: (data.driver as any).vehicle_plate || ''
        } : undefined
      };
      
      setBookingData(cleanedData as BookingData);
      setLastUpdate(new Date());
      
      // Ouvrir automatiquement le paiement si la course est terminée
      if (data.status === 'completed' && !showPayment) {
        setTimeout(() => setShowPayment(true), 1000);
      }
    } catch (error) {
      console.error('Erreur chargement réservation:', error);
      toast.error('Impossible de charger les détails de la réservation');
    } finally {
      setLoading(false);
    }
  };

  // Abonnement temps réel
  useEffect(() => {
    fetchBookingData();

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('🔄 Booking updated:', payload);
          fetchBookingData();
          
          // Notifications selon le statut
          const newStatus = payload.new.status;
          if (newStatus === 'driver_assigned') {
            toast.success('Chauffeur assigné ! Il arrive vers vous.');
          } else if (newStatus === 'picked_up') {
            toast.info('Course démarrée. Bon voyage !');
          } else if (newStatus === 'completed') {
            toast.success('Course terminée. Merci pour votre confiance !');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const handleCallDriver = () => {
    if (bookingData?.driver?.phone_number) {
      window.open(`tel:${bookingData.driver.phone_number}`);
    } else {
      toast.error('Numéro du chauffeur non disponible');
    }
  };

  const handlePaymentComplete = (paymentData: any) => {
    console.log('💳 Payment completed:', paymentData);
    toast.success('Merci ! Course payée avec succès.');
    setShowPayment(false);
  };

  const getStatusInfo = () => {
    if (!bookingData) return STATUS_CONFIG.pending;
    return STATUS_CONFIG[bookingData.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  const statusInfo = getStatusInfo();
  const hasDriver = bookingData?.driver_id && bookingData?.driver;
  const canOpenChat = hasDriver && ['driver_assigned', 'picked_up'].includes(bookingData?.status || '');
  const isCompleted = bookingData?.status === 'completed';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
            <div className="w-24 h-6 bg-muted rounded animate-pulse" />
          </div>
          
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="w-32 h-8 bg-muted rounded animate-pulse" />
              <div className="w-full h-2 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5 p-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg border-destructive/20">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">Réservation non trouvée</p>
              {onBack && (
                <Button onClick={onBack} variant="outline" className="mt-4">
                  Retour
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/50 p-4 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            <Car className="h-5 w-5 text-primary" />
            <span className="font-medium">Suivi Taxi</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full bg-green-500`} />
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-20">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{statusInfo.label}</h2>
                    <p className="text-sm text-muted-foreground">
                      #{bookingData.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <Badge variant={statusInfo.color as any} className="px-3 py-1">
                    {statusInfo.progress}%
                  </Badge>
                </div>
                
                <Progress value={statusInfo.progress} className="h-2" />
                
                {bookingData.pickup_time && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Démarré à {new Date(bookingData.pickup_time).toLocaleTimeString()}</span>
                  </div>
                )}
                {bookingData.completion_time && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Terminé à {new Date(bookingData.completion_time).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Driver Card */}
        {hasDriver && bookingData.driver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{bookingData.driver.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {bookingData.driver.vehicle_model}
                        {bookingData.driver.vehicle_plate && ` • ${bookingData.driver.vehicle_plate}`}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">
                          {bookingData.driver.rating_average?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleCallDriver} 
                      className="flex-1 h-12"
                      disabled={!bookingData.driver.phone_number}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                    {canOpenChat && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12"
                        onClick={() => openChatFromBooking(bookingId, 'transport', bookingData.driver.display_name)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Route Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-medium">Itinéraire</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Départ</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {bookingData.pickup_location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 border-l border-dashed border-muted-foreground/30 h-6" />
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Arrivée</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {bookingData.destination}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix estimé</span>
                    <span>{bookingData.estimated_price?.toLocaleString()} CDF</span>
                  </div>
                  {bookingData.actual_price && (
                    <div className="flex justify-between font-medium">
                      <span>Prix final</span>
                      <span>{bookingData.actual_price.toLocaleString()} CDF</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Button for completed rides */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Button 
              onClick={() => setShowPayment(true)}
              className="w-full h-12"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Payer la course
            </Button>
          </motion.div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && isCompleted && (
        <TaxiPaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          bookingData={{
            id: bookingData.id,
            pickup: { address: bookingData.pickup_location },
            destination: { address: bookingData.destination },
            actualPrice: bookingData.actual_price || bookingData.estimated_price || 0,
            distance: calculateDistanceFromCoordinates(
              bookingData.pickup_coordinates,
              bookingData.destination_coordinates
            ),
            duration: calculateTripDuration({
              pickup_time: bookingData.pickup_time,
              trip_started_at: bookingData.pickup_time,
              completion_time: bookingData.completion_time
            }),
            driverName: bookingData.driver?.display_name || 'Chauffeur',
            driverRating: bookingData.driver?.rating_average || 0
          }}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}