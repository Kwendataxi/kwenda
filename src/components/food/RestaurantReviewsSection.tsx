import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface RestaurantReviewsSectionProps {
  restaurantId: string;
  averageRating?: number;
  totalRatings?: number;
}

export const RestaurantReviewsSection: React.FC<RestaurantReviewsSectionProps> = ({
  restaurantId,
  averageRating = 0,
  totalRatings = 0,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });

  useEffect(() => {
    loadReviews();
  }, [restaurantId]);

  const loadReviews = async () => {
    try {
      setLoading(true);

      // Load reviews with user info
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('user_ratings')
        .select(`
          id,
          rating,
          comment,
          created_at,
          profiles!inner (
            display_name,
            avatar_url
          )
        `)
        .eq('rated_user_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;

      setReviews(reviewsData || []);

      // Calculate breakdown
      const { data: allRatings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', restaurantId);

      if (allRatings) {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allRatings.forEach((r) => {
          counts[r.rating as keyof typeof counts]++;
        });
        setBreakdown(counts);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (totalRatings === 0) {
    return (
      <div className="px-4 py-8 text-center" id="restaurant-reviews-section">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Aucun avis pour le moment</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 space-y-6" id="restaurant-reviews-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Avis Clients</h2>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {totalRatings} avis
        </Badge>
      </div>

      {/* Breakdown */}
      <Card className="p-6 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
        <div className="flex items-center gap-8">
          {/* Average */}
          <div className="text-center">
            <div className="text-5xl font-bold text-yellow-600">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(averageRating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {totalRatings} avis
            </div>
          </div>

          {/* Bars */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = breakdown[stars];
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              
              return (
                <motion.div
                  key={stars}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (5 - stars) * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  </div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {review.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold truncate">
                      {review.profiles?.display_name || 'Utilisateur'}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
