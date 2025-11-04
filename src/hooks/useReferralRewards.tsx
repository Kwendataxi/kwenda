import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useReferralRewards = () => {
  
  /**
   * Crédite automatiquement les portefeuilles du parrain et du filleul
   * Parrain: 500 CDF dans bonus_balance | Filleul: 500 CDF dans bonus_balance
   */
  const creditReferralRewards = async (
    referrerId: string,
    refereeId: string,
    referralId: string
  ) => {
    try {
      // 1. Créditer le parrain (500 CDF dans bonus_balance)
      const { data: referrerWallet } = await supabase
        .from('user_wallets')
        .select('id, bonus_balance')
        .eq('user_id', referrerId)
        .single();

      if (referrerWallet) {
        const newReferrerBonus = Number(referrerWallet.bonus_balance || 0) + 500;
        
        await supabase
          .from('user_wallets')
          .update({ 
            bonus_balance: newReferrerBonus,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', referrerId);

        // Logger la transaction parrain dans activity_logs
        await supabase.from('activity_logs').insert({
          user_id: referrerId,
          activity_type: 'referral_bonus',
          description: 'Bonus parrainage - Nouveau filleul inscrit',
          amount: 500,
          currency: 'CDF',
          reference_type: 'referral',
          reference_id: referralId
        });

        console.log('✅ Parrain crédité: 500 CDF dans bonus_balance');
      }

      // 2. Créditer le filleul (500 CDF dans bonus_balance)
      const { data: refereeWallet } = await supabase
        .from('user_wallets')
        .select('id, bonus_balance')
        .eq('user_id', refereeId)
        .single();

      if (refereeWallet) {
        const newRefereeBonus = Number(refereeWallet.bonus_balance || 0) + 500;
        
        await supabase
          .from('user_wallets')
          .update({ 
            bonus_balance: newRefereeBonus,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', refereeId);

        await supabase.from('activity_logs').insert({
          user_id: refereeId,
          activity_type: 'referral_bonus',
          description: 'Bonus parrainage - Code utilisé',
          amount: 500,
          currency: 'CDF',
          reference_type: 'referral',
          reference_id: referralId
        });

        console.log('✅ Filleul crédité: 500 CDF dans bonus_balance');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur crédit récompenses parrainage:', error);
      throw error;
    }
  };

  return { creditReferralRewards };
};
