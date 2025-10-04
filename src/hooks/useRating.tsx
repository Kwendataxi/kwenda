import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface RatingParams {
  ratedUserId: string;
  rating: number;
  comment?: string;
  bookingId?: string;
  deliveryId?: string;
  marketplaceOrderId?: string;
}

interface RatingStats {
  total_ratings: number;
  average_rating: number;
  five_stars: number;
  four_stars: number;
  three_stars: number;
  two_stars: number;
  one_star: number;
  last_rating_at?: string;
  ratings_with_comments: number;
}

export const useRating = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const submitRating = async (params: RatingParams): Promise<void> => {
    if (!user) {
      toast.error('Vous devez être connecté pour noter');
      throw new Error('Utilisateur non connecté');
    }

    if (params.rating < 1 || params.rating > 5) {
      toast.error('Note invalide (1-5)');
      throw new Error('Note invalide (1-5)');
    }

    setLoading(true);
    try {
      // Vérifier les doublons
      const checkColumn = params.bookingId ? 'booking_id' : 
                         params.deliveryId ? 'delivery_id' : 
                         'marketplace_order_id';
      const checkValue = params.bookingId || params.deliveryId || params.marketplaceOrderId;

      const { data: existing } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('rater_user_id', user.id)
        .eq(checkColumn, checkValue)
        .maybeSingle();

      if (existing) {
        toast.error('Vous avez déjà noté ce service');
        throw new Error('Déjà noté');
      }

      // Insérer la notation
      const { error } = await supabase
        .from('user_ratings')
        .insert({
          rated_user_id: params.ratedUserId,
          rater_user_id: user.id,
          rating: params.rating,
          comment: params.comment?.trim() || null,
          booking_id: params.bookingId || null,
          delivery_id: params.deliveryId || null,
          marketplace_order_id: params.marketplaceOrderId || null
        });

      if (error) throw error;

      toast.success('Merci pour votre évaluation !');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      if (!error.message?.includes('Déjà noté')) {
        toast.error('Erreur lors de la notation');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRatingStats = async (userId: string): Promise<RatingStats> => {
    try {
      const { data, error } = await supabase
        .from('v_user_rating_stats')
        .select('*')
        .eq('rated_user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return data || {
        total_ratings: 0,
        average_rating: 0,
        five_stars: 0,
        four_stars: 0,
        three_stars: 0,
        two_stars: 0,
        one_star: 0,
        ratings_with_comments: 0
      };
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      return {
        total_ratings: 0,
        average_rating: 0,
        five_stars: 0,
        four_stars: 0,
        three_stars: 0,
        two_stars: 0,
        one_star: 0,
        ratings_with_comments: 0
      };
    }
  };

  const canRate = async (
    orderId: string, 
    orderType: 'transport' | 'delivery' | 'marketplace'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase.rpc('can_rate_order', {
        p_user_id: user.id,
        p_order_id: orderId,
        p_order_type: orderType
      });

      return data || false;
    } catch (error) {
      console.error('Error checking if can rate:', error);
      return false;
    }
  };

  return {
    submitRating,
    getRatingStats,
    canRate,
    loading
  };
};
