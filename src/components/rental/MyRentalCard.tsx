import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Car, AlertCircle, Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface RentalBooking {
  id: string;
  start_date: string;
  end_date: string;
  total_price?: number;
  total_amount?: number;
  status: 'pending' | 'approved_by_partner' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded';
  pickup_location?: string;
  dropoff_location?: string;
  return_location?: string;
  special_requests?: string;
  created_at: string;
  rental_vehicles?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    daily_rate: number;
    images?: string[];
  };
}

interface MyRentalCardProps {
  booking: RentalBooking;
  onCancel?: (bookingId: string) => void;
  onPay?: (booking: RentalBooking) => void;
  isPaying?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'approved_by_partner': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'in_progress': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed': return 'Confirmée & Payée';
    case 'approved_by_partner': return 'Validée - À payer';
    case 'pending': return 'En attente partenaire';
    case 'cancelled': return 'Annulée';
    case 'rejected': return 'Rejetée';
    case 'completed': return 'Terminée';
    case 'in_progress': return 'En cours';
    default: return status;
  }
};

const getPaymentBadge = (paymentStatus: string, status: string) => {
  if (status === 'cancelled') return null;
  
  if (paymentStatus === 'paid') {
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Payé
      </Badge>
    );
  }
  return null;
};

export const MyRentalCard: React.FC<MyRentalCardProps> = ({ 
  booking, 
  onCancel, 
  onPay,
  isPaying = false
}) => {
  const vehicle = booking.rental_vehicles;
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const canCancel = booking.status === 'pending' || booking.status === 'approved_by_partner';
  const isUpcoming = startDate > new Date();
  // IMPORTANT: Le client peut payer UNIQUEMENT après validation partenaire
  const needsPayment = booking.payment_status === 'pending' && booking.status === 'approved_by_partner';
  const isWaitingPartner = booking.status === 'pending';
  
  const totalPrice = booking.total_price || booking.total_amount || 0;
  const returnLocation = booking.dropoff_location || booking.return_location;
  const vehicleImage = vehicle?.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
        {/* Image du véhicule */}
        {vehicleImage && (
          <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5">
            <img 
              src={vehicleImage} 
              alt={`${vehicle?.brand} ${vehicle?.model}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge className={`${getStatusColor(booking.status)} border backdrop-blur-sm`}>
                {getStatusLabel(booking.status)}
              </Badge>
              {getPaymentBadge(booking.payment_status, booking.status)}
            </div>
          </div>
        )}

        <CardContent className={vehicleImage ? "p-4" : "p-4"}>
          {/* En-tête avec véhicule */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">
                  {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Véhicule'}
                </h3>
                {vehicle && (
                  <p className="text-sm text-muted-foreground">Année {vehicle.year}</p>
                )}
              </div>
            </div>
            {!vehicleImage && (
              <div className="flex gap-2">
                <Badge className={`${getStatusColor(booking.status)} border`}>
                  {getStatusLabel(booking.status)}
                </Badge>
                {getPaymentBadge(booking.payment_status, booking.status)}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Du:</span>
              <span className="font-medium">
                {format(startDate, 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Au:</span>
              <span className="font-medium">
                {format(endDate, 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{daysDiff} jour{daysDiff > 1 ? 's' : ''} de location</span>
            </div>
          </div>

          {/* Lieux */}
          {(booking.pickup_location || returnLocation) && (
            <div className="space-y-1 mb-4 text-sm">
              {booking.pickup_location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground line-clamp-1">
                    {booking.pickup_location}
                  </span>
                </div>
              )}
              {returnLocation && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground line-clamp-1">
                    {returnLocation}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Prix et actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div>
              <p className="text-2xl font-bold text-primary">
                {totalPrice.toLocaleString()} CDF
              </p>
              {vehicle && (
                <p className="text-xs text-muted-foreground">
                  {vehicle.daily_rate.toLocaleString()} CDF/jour
                </p>
              )}
            </div>
            
            {canCancel && isUpcoming && booking.payment_status !== 'paid' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCancel?.(booking.id)}
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Annuler
              </Button>
            )}
          </div>

          {/* Section en attente partenaire */}
          {isWaitingPartner && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    En attente de validation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Le partenaire doit confirmer la disponibilité du véhicule
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Section paiement - uniquement après validation partenaire */}
          {needsPayment && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 p-4 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-xl"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      Véhicule disponible !
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Payez maintenant pour finaliser votre réservation
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => onPay?.(booking)}
                  disabled={isPaying}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
                >
                  {isPaying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4 mr-2" />
                  )}
                  Payer {totalPrice.toLocaleString()} CDF
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
