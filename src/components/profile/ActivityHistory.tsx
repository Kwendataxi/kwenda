import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, Star, Clock, ArrowRight } from 'lucide-react';

interface EnhancedBooking {
  id: string;
  pickup_location: string;
  destination: string;
  vehicle_type: string;
  status: string;
  actual_price?: number;
  created_at: string;
  booking_time: string;
  completion_time?: string;
  driver_id?: string;
  driver?: {
    display_name: string;
    avatar_url?: string;
  };
  rating?: {
    rating: number;
    comment?: string;
  };
}

export const ActivityHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Get all bookings to show demo data
      const { data: bookingsData, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && bookingsData) {
        // Get driver profiles and ratings for each booking
        const enhancedBookings = await Promise.all(
          bookingsData.map(async (booking) => {
            let driver = null;
            let rating = null;

            // Get driver profile if driver_id exists
            if (booking.driver_id) {
              const { data: driverData } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('user_id', booking.driver_id)
                .maybeSingle();
              
              driver = driverData;

              // Get rating for this booking
              const { data: ratingData } = await supabase
                .from('user_ratings')
                .select('rating, comment')
                .eq('booking_id', booking.id)
                .maybeSingle();
              
              rating = ratingData;
            }

            return {
              ...booking,
              driver,
              rating
            };
          })
        );

        setBookings(enhancedBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 2) {
      return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    return <Car className="h-4 w-4 text-blue-500" />;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">{t('activity.title')}</h1>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">{t('activity.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">{t('activity.title')}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('activity.no_rides')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Driver Avatar */}
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={booking.driver?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {booking.driver?.display_name 
                          ? booking.driver.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)
                          : 'DR'
                        }
                      </AvatarFallback>
                    </Avatar>

                    {/* Trip Details */}
                    <div className="flex-1 min-w-0">
                      {/* Driver name and rating */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {booking.driver?.display_name || t('activity.driver')}
                          </p>
                          {booking.rating && (
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(booking.rating.rating)}
                              <span className="text-xs text-muted-foreground">
                                {booking.rating.rating}/5
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {booking.actual_price ? formatAmount(booking.actual_price) : t('activity.price_undefined')}
                          </p>
                          <Badge 
                            variant={booking.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {booking.status === 'completed' ? t('activity.completed') : 
                             booking.status === 'pending' ? t('activity.pending') : booking.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 mb-2">
                        {getVehicleIcon(booking.vehicle_type)}
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <span className="truncate font-medium">{booking.pickup_location}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate font-medium">{booking.destination}</span>
                        </div>
                      </div>

                      {/* Date and time */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(booking.created_at)}</span>
                        <span className="flex items-center gap-1">
                          <span className="capitalize">{booking.vehicle_type}</span>
                        </span>
                      </div>

                      {/* Comment if available */}
                      {booking.rating?.comment && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                          "{booking.rating.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};