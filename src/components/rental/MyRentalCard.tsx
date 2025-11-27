import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Car, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RentalBooking {
  id: string;
  start_date: string;
  end_date: string;
  total_price?: number;      // Mappé depuis total_amount
  total_amount?: number;     // Nom réel DB
  status: string;
  payment_status: string;
  pickup_location?: string;
  dropoff_location?: string; // Mappé depuis return_location
  return_location?: string;  // Nom réel DB
  special_requests?: string;
  created_at: string;
  rental_vehicles?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    daily_rate: number;
  };
}

interface MyRentalCardProps {
  booking: RentalBooking;
  onCancel?: (bookingId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed': return 'Confirmée';
    case 'pending': return 'En attente';
    case 'cancelled': return 'Annulée';
    case 'completed': return 'Terminée';
    default: return status;
  }
};

export const MyRentalCard: React.FC<MyRentalCardProps> = ({ booking, onCancel }) => {
  const vehicle = booking.rental_vehicles;
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const isUpcoming = startDate > new Date();
  
  // Compatibilité avec les deux formats de colonnes
  const totalPrice = booking.total_price || booking.total_amount || 0;
  const returnLocation = booking.dropoff_location || booking.return_location;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        {/* En-tête avec véhicule et statut */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
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
          <Badge className={`${getStatusColor(booking.status)} border`}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>

        {/* Dates */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Du:</span>
            <span className="font-medium">
              {format(startDate, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
        <div className="flex items-center justify-between pt-3 border-t">
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
          
          {canCancel && isUpcoming && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCancel?.(booking.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          )}
        </div>

        {/* Badge paiement */}
        {booking.payment_status === 'pending' && booking.status !== 'cancelled' && (
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              En attente de paiement
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
