import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useRating = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const submitRating = async (ratedUserId: string, rating: number, comment?: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const { error } = await supabase.from('user_ratings').insert({
        rater_user_id: user.id,
        rated_user_id: ratedUserId,
        rating: rating,
        comment: comment || null,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error submitting rating:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitRating, loading };
};
