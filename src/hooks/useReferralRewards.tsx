import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useReferralRewards = () => {
  
  /**
   * Crédite automatiquement les portefeuilles du parrain et du filleul
   * Parrain: 5000 CDF | Filleul: 3000 CDF
   */
  const creditReferralRewards = async (
    referrerId: string,
    refereeId: string,
    referralId: string
  ) => {
    try {
      // 1. Créditer le parrain (5000 CDF)
      const { data: referrerWallet } = await supabase
        .from('user_wallets')
        .select('id, balance')
        .eq('user_id', referrerId)
        .single();

      if (referrerWallet) {
        const newReferrerBalance = Number(referrerWallet.balance) + 5000;
        
        await supabase
          .from('user_wallets')
          .update({ 
            balance: newReferrerBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', referrerId);

        // Logger la transaction parrain dans activity_logs
        await supabase.from('activity_logs').insert({
          user_id: referrerId,
          activity_type: 'referral_reward',
          description: 'Bonus de parrainage - Nouveau filleul inscrit',
          amount: 5000,
          currency: 'CDF',
          reference_type: 'referral',
          reference_id: referralId
        });

        console.log('✅ Parrain crédité: 5000 CDF');
      }

      // 2. Créditer le filleul (3000 CDF)
      const { data: refereeWallet } = await supabase
        .from('user_wallets')
        .select('id, balance')
        .eq('user_id', refereeId)
        .single();

      if (refereeWallet) {
        const newRefereeBalance = Number(refereeWallet.balance) + 3000;
        
        await supabase
          .from('user_wallets')
          .update({ 
            balance: newRefereeBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', refereeId);

        await supabase.from('activity_logs').insert({
          user_id: refereeId,
          activity_type: 'referral_bonus',
          description: 'Bonus de bienvenue - Code de parrainage utilisé',
          amount: 3000,
          currency: 'CDF',
          reference_type: 'referral',
          reference_id: referralId
        });

        console.log('✅ Filleul crédité: 3000 CDF');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur crédit récompenses parrainage:', error);
      throw error;
    }
  };

  return { creditReferralRewards };
};
