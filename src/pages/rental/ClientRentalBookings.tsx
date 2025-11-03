import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Car, Clock, MapPin, Phone, Mail, 
  ChevronRight, X, Download, MessageCircle, Edit,
  Star, AlertCircle, CheckCircle, XCircle, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

interface RentalBooking {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  security_deposit: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  equipment: string[];
  driver_name: string;
  driver_phone: string;
  driver_email: string;
  driver_license: string;
  pickup_location?: string;
  delivery_requested?: boolean;
  created_at: string;
  vehicle: {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    images: string[];
    seats: number;
    fuel_type: string;
    transmission: string;
  };
}

export const ClientRentalBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<RentalBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'active' | 'completed' | 'cancelled'>('all');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchBookings();
    
    // Écouter les changements en temps réel
    const channel = supabase
      .channel('rental_bookings_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rental_bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterBookings();
  }, [activeFilter, bookings]);

  const fetchBookings = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          vehicle:rental_vehicles(id, name, brand, model, year, images, seats, fuel_type, transmission)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBookings(data as any || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos réservations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];
    
    switch (activeFilter) {
      case 'upcoming':
        filtered = bookings.filter(b => 
          b.status === 'confirmed' && isFuture(new Date(b.start_date))
        );
        break;
      case 'active':
        filtered = bookings.filter(b => b.status === 'in_progress');
        break;
      case 'completed':
        filtered = bookings.filter(b => b.status === 'completed');
        break;
      case 'cancelled':
        filtered = bookings.filter(b => b.status === 'cancelled');
        break;
      default:
        filtered = bookings;
    }
    
    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer une raison d'annulation",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('rental_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancelReason
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Réservation annulée",
        description: "Votre réservation a été annulée avec succès",
      });

      setShowCancelDialog(false);
      setCancelReason('');
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelBooking = (booking: RentalBooking): boolean => {
    if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;
    
    // Peut annuler si >48h avant le début
    const startDate = new Date(booking.start_date);
    const now = new Date();
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilStart > 48;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'outline', label: 'En attente', icon: Clock },
      confirmed: { variant: 'default', label: 'Confirmé', icon: CheckCircle },
      in_progress: { variant: 'secondary', label: 'En cours', icon: Car },
      completed: { variant: 'outline', label: 'Terminé', icon: CheckCircle },
      cancelled: { variant: 'destructive', label: 'Annulé', icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <div className="flex gap-2 flex-wrap">
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>
    );
  };

  const getDriverBadge = (driverChoice: string) => {
    if (driverChoice === 'with_driver') {
      return <Badge variant="default" className="text-xs">👤 Avec chauffeur</Badge>;
    }
    if (driverChoice === 'without_driver') {
      return <Badge variant="secondary" className="text-xs">🚗 Sans chauffeur</Badge>;
    }
    return null;
  };

  const renderBookingCard = (booking: RentalBooking) => (
    <motion.div
      key={booking.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className="glassmorphism hover:shadow-lg transition-all cursor-pointer"
        onClick={() => setSelectedBooking(booking)}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Vehicle Image */}
            {booking.vehicle?.images?.[0] && (
              <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                <img 
                  src={booking.vehicle.images[0]} 
                  alt={booking.vehicle.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg truncate">
                    {booking.vehicle?.name || 'Véhicule'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.year})
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(booking.status)}
                  {(booking as any).driver_choice && getDriverBadge((booking as any).driver_choice)}
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(booking.start_date), 'dd MMM', { locale: fr })}</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}</span>
                </div>
              </div>

              {/* Duration & Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {differenceInDays(new Date(booking.end_date), new Date(booking.start_date))} jour(s)
                </span>
                <span className="text-lg font-bold text-primary">
                  {booking.total_price.toLocaleString()} FC
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="glassmorphism border-b border-border/20 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mes Locations</h1>
              <p className="text-sm text-muted-foreground">
                {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={() => navigate('/app/client')}>
              <Car className="h-4 w-4 mr-2" />
              Nouvelle location
            </Button>
          </div>

          {/* Filters */}
          <Tabs value={activeFilter} onValueChange={(v: any) => setActiveFilter(v)} className="mt-4">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">Tout</TabsTrigger>
              <TabsTrigger value="upcoming">À venir</TabsTrigger>
              <TabsTrigger value="active">En cours</TabsTrigger>
              <TabsTrigger value="completed">Terminées</TabsTrigger>
              <TabsTrigger value="cancelled">Annulées</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="glassmorphism">
            <CardContent className="py-12 text-center">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Aucune réservation</h3>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore de location dans cette catégorie
              </p>
              <Button onClick={() => navigate('/app/client')}>
                Découvrir les véhicules
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredBookings.map(booking => renderBookingCard(booking))}
          </AnimatePresence>
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Détails de la réservation</span>
                  {getStatusBadge(selectedBooking.status)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Vehicle */}
                <div>
                  <h4 className="font-semibold mb-2">Véhicule</h4>
                  <div className="flex gap-4">
                    {selectedBooking.vehicle?.images?.[0] && (
                      <img 
                        src={selectedBooking.vehicle.images[0]} 
                        alt={selectedBooking.vehicle.name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium">{selectedBooking.vehicle?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model} ({selectedBooking.vehicle?.year})
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>{selectedBooking.vehicle?.seats} places</span>
                        <span>{selectedBooking.vehicle?.fuel_type}</span>
                        <span>{selectedBooking.vehicle?.transmission}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h4 className="font-semibold mb-2">Période de location</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Début</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.start_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fin</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.end_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Durée totale : {differenceInDays(new Date(selectedBooking.end_date), new Date(selectedBooking.start_date))} jour(s)
                  </p>
                </div>

                {/* Driver Info */}
                <div>
                  <h4 className="font-semibold mb-2">Conducteur</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.driver_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.driver_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.driver_email}</span>
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                {selectedBooking.equipment?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Équipements</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.equipment.map((eq, idx) => (
                        <Badge key={idx} variant="secondary">{eq}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Prix de location</span>
                      <span>{selectedBooking.total_price.toLocaleString()} FC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dépôt de garantie</span>
                      <span>{selectedBooking.security_deposit.toLocaleString()} FC</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">
                        {(selectedBooking.total_price + selectedBooking.security_deposit).toLocaleString()} FC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                {canCancelBooking(selectedBooking) && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler la réservation
                  </Button>
                )}
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter le partenaire
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le contrat
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <label className="text-sm font-medium">Raison de l'annulation</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Expliquez pourquoi vous souhaitez annuler..."
              className="mt-2"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Retour
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientRentalBookings;
