import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VehicleReviewsProps {
  vehicleId: string;
}

export const VehicleReviews: React.FC<VehicleReviewsProps> = ({ vehicleId }) => {
  // Fetch reviews from database
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['rental-reviews', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_reviews' as any)
        .select(`
          *,
          profiles:reviewer_id (
            display_name,
            avatar_url
          ),
          rental_bookings (
            start_date,
            end_date
          )
        `)
        .eq('vehicle_id', vehicleId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch review stats from materialized view
  const { data: stats } = useQuery({
    queryKey: ['rental-review-stats', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_vehicle_review_stats' as any)
        .select('*')
        .eq('vehicle_id', vehicleId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const averageRating = (stats as any)?.avg_overall_rating || 0;
  const totalReviews = (stats as any)?.total_reviews || 0;

  const ratingDistribution = [
    { stars: 5, count: (stats as any)?.five_stars || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.five_stars || 0) / totalReviews * 100) : 0 },
    { stars: 4, count: (stats as any)?.four_stars || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.four_stars || 0) / totalReviews * 100) : 0 },
    { stars: 3, count: (stats as any)?.three_stars || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.three_stars || 0) / totalReviews * 100) : 0 },
    { stars: 2, count: (stats as any)?.two_stars || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.two_stars || 0) / totalReviews * 100) : 0 },
    { stars: 1, count: (stats as any)?.one_star || 0, percentage: totalReviews > 0 ? Math.round(((stats as any)?.one_star || 0) / totalReviews * 100) : 0 }
  ];

  if (reviewsLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (totalReviews === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            Avis clients
          </h3>
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucun avis disponible pour ce véhicule</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Avis clients
          </h3>
          <Button variant="link" size="sm" className="text-xs sm:text-sm">
            Voir tous
          </Button>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 p-4 bg-muted/50 rounded-lg">
          {/* Score global */}
          <div className="text-center sm:text-left sm:pr-6 sm:border-r">
            <p className="text-3xl sm:text-4xl font-bold">{averageRating}</p>
            <div className="flex items-center gap-1 justify-center sm:justify-start mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${
                    i <= Math.floor(averageRating) 
                      ? 'fill-yellow-500 text-yellow-500' 
                      : 'text-muted-foreground'
                  }`} 
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{totalReviews} avis</p>
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs w-3 text-muted-foreground">{stars}</span>
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Liste des avis */}
        <div className="space-y-3">
          {reviews.map((review: any) => {
            const displayName = review.profiles?.display_name || 'Utilisateur anonyme';
            const avatarUrl = review.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.id}`;
            const timeAgo = formatDistanceToNow(new Date(review.created_at), { 
              addSuffix: true, 
              locale: fr 
            });
            
            const booking = review.rental_bookings;
            const duration = booking 
              ? `Location du ${new Date(booking.start_date).toLocaleDateString('fr-FR')} au ${new Date(booking.end_date).toLocaleDateString('fr-FR')}`
              : 'Location';

            return (
              <div key={review.id} className="p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <p className="font-semibold text-sm truncate">{displayName}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-semibold">
                          {review.overall_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {timeAgo} · {duration}
                    </p>
                    
                    {/* Ratings détaillés */}
                    <div className="flex gap-3 mb-2 text-xs">
                      <span className="text-muted-foreground">
                        🚗 Véhicule: {review.vehicle_rating}/5
                      </span>
                      <span className="text-muted-foreground">
                        👔 Service: {review.service_rating}/5
                      </span>
                      <span className="text-muted-foreground">
                        ✨ Propreté: {review.cleanliness_rating}/5
                      </span>
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
