import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KwendaPoints {
  total_points: number;
  points_earned_today: number;
  points_earned_this_month: number;
  lifetime_points: number;
}

export const useKwendaPoints = () => {
  const [points, setPoints] = useState<KwendaPoints>({
    total_points: 0,
    points_earned_today: 0,
    points_earned_this_month: 0,
    lifetime_points: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le portefeuille
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('kwenda_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wallet) {
        setPoints({
          total_points: wallet.kwenda_points || 0,
          points_earned_today: 0, // TODO: calculer depuis activity_logs
          points_earned_this_month: 0,
          lifetime_points: wallet.kwenda_points || 0,
        });
      }
    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToCredits = async (pointsToConvert: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (points.total_points < pointsToConvert) {
        toast({
          title: 'Points insuffisants',
          description: `Vous avez besoin de ${pointsToConvert} points mais vous n'en avez que ${points.total_points}`,
          variant: 'destructive',
        });
        return false;
      }

      // Conversion : 100 points = 1000 CDF
      const creditsToAdd = (pointsToConvert / 100) * 1000;

      // Mettre à jour le portefeuille
      const { error } = await supabase.rpc('convert_points_to_credits', {
        p_user_id: user.id,
        p_points: pointsToConvert,
        p_credits: creditsToAdd,
      });

      if (error) throw error;

      toast({
        title: '✅ Conversion réussie',
        description: `${pointsToConvert} points convertis en ${creditsToAdd} CDF`,
      });

      await loadPoints();
      return true;
    } catch (error) {
      console.error('Error converting points:', error);
      toast({
        title: 'Erreur de conversion',
        description: 'Impossible de convertir vos points',
        variant: 'destructive',
      });
      return false;
    }
  };

  const enterSuperLottery = async (drawId: string, pointsCost: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (points.total_points < pointsCost) {
        toast({
          title: 'Points insuffisants',
          description: `Cette entrée coûte ${pointsCost} points`,
          variant: 'destructive',
        });
        return false;
      }

      // Générer un numéro d'entrée unique
      const entryNumber = `SL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('super_lottery_entries')
        .insert({
          draw_id: drawId,
          user_id: user.id,
          points_spent: pointsCost,
          entry_number: entryNumber,
        });

      if (error) throw error;

      // Déduire les points
      await supabase.rpc('deduct_kwenda_points', {
        p_user_id: user.id,
        p_points: pointsCost,
      });

      toast({
        title: '🎉 Entrée enregistrée !',
        description: `Votre numéro : ${entryNumber}`,
      });

      await loadPoints();
      return true;
    } catch (error) {
      console.error('Error entering super lottery:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer votre entrée',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    loadPoints();
  }, []);

  return {
    points,
    loading,
    refresh: loadPoints,
    convertToCredits,
    enterSuperLottery,
  };
};
