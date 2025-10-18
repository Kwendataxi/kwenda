import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useReferralRewards = () => {
  
  /**
   * Crédite automatiquement les portefeuilles du parrain et du filleul
   * Parrain: 50 points Kwenda (500 CDF) | Filleul: 30 points Kwenda (300 CDF)
   */
  const creditReferralRewards = async (
    referrerId: string,
    refereeId: string,
    referralId: string
  ) => {
    try {
      // 1. Créditer le parrain (50 points Kwenda = 500 CDF)
      const { data: referrerWallet } = await supabase
        .from('user_wallets')
        .select('id, kwenda_points')
        .eq('user_id', referrerId)
        .single();

      if (referrerWallet) {
        const newReferrerPoints = Number(referrerWallet.kwenda_points || 0) + 50;
        
        await supabase
          .from('user_wallets')
          .update({ 
            kwenda_points: newReferrerPoints,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', referrerId);

        // Logger la transaction parrain dans activity_logs
        await supabase.from('activity_logs').insert({
          user_id: referrerId,
          activity_type: 'kwenda_points_earned',
          description: 'Points de parrainage - Nouveau filleul inscrit',
          amount: 50,
          currency: 'POINTS',
          reference_type: 'referral',
          reference_id: referralId
        });

        console.log('✅ Parrain crédité: 50 points Kwenda (≈ 500 CDF)');
      }

      // 2. Créditer le filleul (30 points Kwenda = 300 CDF)
      const { data: refereeWallet } = await supabase
        .from('user_wallets')
        .select('id, kwenda_points')
        .eq('user_id', refereeId)
        .single();

      if (refereeWallet) {
        const newRefereePoints = Number(refereeWallet.kwenda_points || 0) + 30;
        
        await supabase
          .from('user_wallets')
          .update({ 
            kwenda_points: newRefereePoints,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', refereeId);

        await supabase.from('activity_logs').insert({
          user_id: refereeId,
          activity_type: 'kwenda_points_earned',
          description: 'Points de bienvenue - Code de parrainage utilisé',
          amount: 30,
          currency: 'POINTS',
          reference_type: 'referral',
          reference_id: referralId
        });

        console.log('✅ Filleul crédité: 30 points Kwenda (≈ 300 CDF)');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur crédit récompenses parrainage:', error);
      throw error;
    }
  };

  return { creditReferralRewards };
};
