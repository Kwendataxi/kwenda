import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone,
  ArrowLeft,
  Car,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TaxiLiveTrackerProps {
  bookingId: string;
  onBack: () => void;
}

interface BookingData {
  id: string;
  pickup_location: string;
  destination: string;
  vehicle_type: string;
  estimated_price: number;
  status: string;
  created_at: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_rating?: number;
  vehicle_model?: string;
  vehicle_plate?: string;
}

const STATUS_CONFIG = {
  pending: { 
    label: 'Recherche en cours', 
    color: 'bg-yellow-500', 
    icon: Clock,
    description: 'Recherche d\'un chauffeur disponible...'
  },
  driver_assigned: { 
    label: 'Chauffeur assigné', 
    color: 'bg-blue-500', 
    icon: Car,
    description: 'Un chauffeur a accepté votre course'
  },
  driver_en_route: { 
    label: 'En route vers vous', 
    color: 'bg-orange-500', 
    icon: Navigation,
    description: 'Le chauffeur arrive à votre position'
  },
  pickup: { 
    label: 'Prise en charge', 
    color: 'bg-purple-500', 
    icon: CheckCircle,
    description: 'Course en cours'
  },
  in_progress: { 
    label: 'En route', 
    color: 'bg-blue-600', 
    icon: Navigation,
    description: 'Direction votre destination'
  },
  completed: { 
    label: 'Terminée', 
    color: 'bg-green-500', 
    icon: CheckCircle,
    description: 'Course terminée avec succès'
  },
  cancelled: { 
    label: 'Annulée', 
    color: 'bg-red-500', 
    icon: AlertCircle,
    description: 'Course annulée'
  }
};

export default function TaxiLiveTracker({ bookingId, onBack }: TaxiLiveTrackerProps) {
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingData();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('booking_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('Booking updated:', payload);
          setBooking(prev => prev ? { ...prev, ...payload.new } : null);
          
          // Show status update notification
          const newStatus = payload.new.status;
          const statusConfig = STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG];
          if (statusConfig) {
            toast({
              title: statusConfig.label,
              description: statusConfig.description,
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [bookingId, toast]);

  const loadBookingData = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Récupérer les infos du chauffeur si assigné
      let driverInfo = null;
      if (data.driver_id) {
        const { data: driverData } = await supabase
          .from('driver_profiles')
          .select('display_name, phone, rating, vehicle_model, vehicle_plate')
          .eq('user_id', data.driver_id)
          .single();
        driverInfo = driverData;
      }

      setBooking({
        ...data,
        driver_name: driverInfo?.display_name,
        driver_phone: driverInfo?.phone,
        driver_rating: driverInfo?.rating,
        vehicle_model: driverInfo?.vehicle_model,
        vehicle_plate: driverInfo?.vehicle_plate
      });
    } catch (error) {
      console.error('Error loading booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la réservation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Réservation annulée",
        description: "Votre course a été annulée",
      });

      onBack();
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glassmorphism w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des détails...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glassmorphism w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Réservation introuvable</h3>
            <Button onClick={onBack}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig?.icon || AlertCircle;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-lg font-semibold">Suivi de course</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Status Card */}
        <Card className="glassmorphism">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className={`p-3 rounded-full ${statusConfig.color}`}>
                <StatusIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">{statusConfig.label}</h2>
            <p className="text-muted-foreground">{statusConfig.description}</p>
            <Badge variant="secondary" className="mt-3">
              Réservation #{booking.id.slice(-6)}
            </Badge>
          </CardContent>
        </Card>

        {/* Trip Details */}
        <Card className="glassmorphism">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold mb-4">Détails du trajet</h3>
            
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Départ</p>
                <p className="font-medium">{booking.pickup_location}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-secondary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="font-medium">{booking.destination}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Prix estimé</span>
                <span className="font-bold text-lg">{booking.estimated_price.toLocaleString()} CDF</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Info (if assigned) */}
        {booking.driver_id && (
          <Card className="glassmorphism">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Votre chauffeur</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{booking.driver_name || 'Chauffeur'}</p>
                  {booking.driver_rating && (
                    <p className="text-sm text-muted-foreground">
                      ⭐ {booking.driver_rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>

              {booking.vehicle_model && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Véhicule</span>
                    <span className="font-medium">{booking.vehicle_model}</span>
                  </div>
                  {booking.vehicle_plate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Plaque</span>
                      <span className="font-medium">{booking.vehicle_plate}</span>
                    </div>
                  )}
                </div>
              )}

              {booking.driver_phone && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(`tel:${booking.driver_phone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler le chauffeur
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {booking.status === 'pending' && (
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleCancelBooking}
          >
            Annuler la réservation
          </Button>
        )}

        {booking.status === 'completed' && (
          <Button 
            className="w-full"
            onClick={onBack}
          >
            Nouvelle course
          </Button>
        )}
      </div>
    </div>
  );
}