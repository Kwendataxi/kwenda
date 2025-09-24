import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone,
  MessageCircle,
  Share2,
  Star,
  AlertTriangle,
  Edit,
  ArrowLeft,
  Car,
  Route,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import TaxiChat from './TaxiChat';
import BookingActions from './BookingActions';
import StatusProgress from './StatusProgress';

interface AdvancedTaxiTrackerProps {
  bookingId: string;
  onBack: () => void;
}

interface BookingData {
  id: string;
  pickup_location: string;
  destination: string;
  pickup_coordinates?: { lat: number; lng: number };
  destination_coordinates?: { lat: number; lng: number };
  vehicle_type: string;
  estimated_price: number;
  actual_price?: number;
  status: string;
  created_at: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_rating?: number;
  vehicle_model?: string;
  vehicle_plate?: string;
  vehicle_color?: string;
  estimated_duration?: number;
  distance_km?: number;
}

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  last_update: string;
}

const STATUS_CONFIG = {
  pending: { 
    label: 'Recherche en cours', 
    color: 'bg-amber-500', 
    icon: Clock,
    description: 'Recherche d\'un chauffeur disponible...',
    progress: 10
  },
  driver_assigned: { 
    label: 'Chauffeur assigné', 
    color: 'bg-blue-500', 
    icon: Car,
    description: 'Un chauffeur a accepté votre course',
    progress: 30
  },
  driver_en_route: { 
    label: 'En route vers vous', 
    color: 'bg-orange-500', 
    icon: Navigation,
    description: 'Le chauffeur arrive à votre position',
    progress: 50
  },
  pickup: { 
    label: 'Prise en charge', 
    color: 'bg-purple-500', 
    icon: Activity,
    description: 'Vous êtes à bord',
    progress: 70
  },
  in_progress: { 
    label: 'En route', 
    color: 'bg-blue-600', 
    icon: Route,
    description: 'Direction votre destination',
    progress: 85
  },
  completed: { 
    label: 'Terminée', 
    color: 'bg-green-500', 
    icon: Star,
    description: 'Course terminée avec succès',
    progress: 100
  },
  cancelled: { 
    label: 'Annulée', 
    color: 'bg-red-500', 
    icon: AlertTriangle,
    description: 'Course annulée',
    progress: 0
  }
};

export default function AdvancedTaxiTracker({ bookingId, onBack }: AdvancedTaxiTrackerProps) {
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [showChat, setShowChat] = useState(false);
  const [eta, setEta] = useState<number | null>(null);

  // Données calculées
  const statusConfig = useMemo(() => {
    if (!booking) return null;
    return STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
  }, [booking?.status]);

  const canShowRoute = useMemo(() => {
    return booking?.pickup_coordinates && booking?.destination_coordinates;
  }, [booking]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' CDF';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  useEffect(() => {
    loadBookingData();
    
    // Écouter les mises à jour de la réservation
    const bookingSubscription = supabase
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
          console.log('📱 Réservation mise à jour:', payload);
          setBooking(prev => prev ? { ...prev, ...payload.new } : null);
          
          // Notification du changement de statut
          const newStatus = payload.new.status;
          const config = STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG];
          if (config) {
            toast({
              title: config.label,
              description: config.description,
            });

            // Vibration tactile si supportée
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 50, 100]);
            }
          }
        }
      )
      .subscribe();

    // Écouter la localisation du chauffeur si assigné
    let driverLocationSubscription: any = null;
    if (booking?.driver_id) {
      driverLocationSubscription = supabase
        .channel('driver_location')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'driver_locations',
            filter: `driver_id=eq.${booking.driver_id}`
          },
          (payload) => {
            console.log('📍 Position chauffeur mise à jour:', payload);
            const data = payload.new;
            setDriverLocation({
              lat: data.latitude,
              lng: data.longitude,
              heading: data.heading,
              speed: data.speed,
              last_update: data.updated_at
            });
          }
        )
        .subscribe();
    }

    return () => {
      bookingSubscription.unsubscribe();
      if (driverLocationSubscription) {
        driverLocationSubscription.unsubscribe();
      }
    };
  }, [bookingId, booking?.driver_id, toast]);

  const loadBookingData = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Charger les infos du chauffeur si assigné
      let driverInfo = null;
      if (data.driver_id) {
        const { data: driverData } = await supabase
          .from('driver_profiles')
          .select('display_name, phone, rating_average, vehicle_model, vehicle_plate, vehicle_color')
          .eq('user_id', data.driver_id)
          .single();
        
        driverInfo = driverData;

        // Charger la position actuelle du chauffeur
        const { data: locationData } = await supabase
          .from('driver_locations')
          .select('latitude, longitude, heading, speed, updated_at')
          .eq('driver_id', data.driver_id)
          .eq('is_online', true)
          .single();

        if (locationData) {
          setDriverLocation({
            lat: locationData.latitude,
            lng: locationData.longitude,
            heading: locationData.heading,
            speed: locationData.speed,
            last_update: locationData.updated_at
          });
        }
      }

      setBooking({
        ...data,
        driver_name: driverInfo?.display_name,
        driver_phone: driverInfo?.phone,
        driver_rating: driverInfo?.rating_average,
        vehicle_model: driverInfo?.vehicle_model,
        vehicle_plate: driverInfo?.vehicle_plate,
        vehicle_color: driverInfo?.vehicle_color
      });

    } catch (error) {
      console.error('Erreur chargement réservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la réservation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareLocation = async () => {
    if (!booking || !booking.pickup_coordinates) return;

    const shareData = {
      title: 'Ma course Kwenda Taxi',
      text: `Je suis en route vers ${booking.destination}`,
      url: `https://maps.google.com/?q=${booking.pickup_coordinates.lat},${booking.pickup_coordinates.lng}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copier dans le presse-papier
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Lien copié",
          description: "Le lien de votre position a été copié"
        });
      }
    } catch (error) {
      console.error('Erreur partage:', error);
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

  if (!booking || !statusConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glassmorphism w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Réservation introuvable</h3>
            <Button onClick={onBack}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-lg font-semibold">Suivi en temps réel</h1>
          <Badge variant="secondary">#{booking.id.slice(-6)}</Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Status et Progression */}
        <StatusProgress 
          status={booking.status}
          statusConfig={statusConfig}
          bookingId={booking.id}
        />

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map">Carte</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            {/* Carte interactive */}
            <Card className="glassmorphism">
              <CardContent className="p-0">
                <GoogleMapsKwenda
                  pickup={booking.pickup_coordinates}
                  destination={booking.destination_coordinates}
                  driverLocation={driverLocation ? {
                    lat: driverLocation.lat,
                    lng: driverLocation.lng,
                    heading: driverLocation.heading || undefined
                  } : undefined}
                  showRoute={canShowRoute}
                  height="400px"
                />
              </CardContent>
            </Card>

            {/* Infos temps réel */}
            {driverLocation && (
              <Card className="glassmorphism">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Position en temps réel</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Mis à jour il y a {Math.round((Date.now() - new Date(driverLocation.last_update).getTime()) / 1000)}s
                    </span>
                  </div>
                  {driverLocation.speed && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Vitesse: {Math.round(driverLocation.speed * 3.6)} km/h
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Détails du trajet */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Détails du trajet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Départ</p>
                    <p className="font-medium">{booking.pickup_location}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{booking.destination}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Prix estimé</p>
                    <p className="font-bold text-lg">{formatPrice(booking.estimated_price)}</p>
                  </div>
                  {booking.estimated_duration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Durée estimée</p>
                      <p className="font-medium">{formatDuration(booking.estimated_duration)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Infos chauffeur */}
            {booking.driver_id && (
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Votre chauffeur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{booking.driver_name || 'Chauffeur'}</p>
                      {booking.driver_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{booking.driver_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.vehicle_model && (
                    <div className="space-y-2">
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
                      {booking.vehicle_color && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Couleur</span>
                          <span className="font-medium">{booking.vehicle_color}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {booking.driver_phone && (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.open(`tel:${booking.driver_phone}`)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Appeler
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowChat(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions">
            <BookingActions 
              booking={booking}
              onBookingUpdate={(updates) => setBooking(prev => prev ? { ...prev, ...updates } : null)}
              onBack={onBack}
            />
          </TabsContent>
        </Tabs>

        {/* Bouton d'action rapide */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg"
            onClick={handleShareLocation}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          {booking.driver_id && (
            <Button
              className="rounded-full shadow-lg"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && booking.driver_id && (
        <TaxiChat
          bookingId={booking.id}
          driverId={booking.driver_id}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}