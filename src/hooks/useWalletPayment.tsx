import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook pour gérer les paiements avec portefeuille (bonus_balance et balance)
 * 
 * Règle : Le bonus_balance est utilisé UNIQUEMENT s'il couvre 100% du montant
 * Sinon, on utilise le balance principal
 */
export const useWalletPayment = () => {
  
  /**
   * Effectue un paiement en utilisant le portefeuille de l'utilisateur
   * Priorité : bonus_balance si suffisant, sinon balance principal
   */
  const payWithWallet = async (
    userId: string,
    amount: number,
    description: string,
    referenceType: string,
    referenceId: string
  ) => {
    try {
      // Récupérer le wallet
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance, bonus_balance')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        throw new Error('Portefeuille introuvable');
      }

      const bonusBalance = Number(wallet.bonus_balance || 0);
      const mainBalance = Number(wallet.balance || 0);

      // ✅ Règle : Bonus utilisable UNIQUEMENT si couvre 100% du montant
      if (bonusBalance >= amount) {
        // Payer avec le bonus
        const { error: updateError } = await supabase
          .from('user_wallets')
          .update({
            bonus_balance: bonusBalance - amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        // Logger la transaction
        await supabase.from('activity_logs').insert({
          user_id: userId,
          activity_type: 'bonus_payment',
          description: `Paiement bonus - ${description}`,
          amount: -amount,
          currency: 'CDF',
          reference_type: referenceType,
          reference_id: referenceId
        });

        toast.success(`Paiement réussi avec votre bonus (${amount} CDF) !`);
        return { success: true, paidWithBonus: true };
      } else if (mainBalance >= amount) {
        // Payer avec le solde principal
        const { error: updateError } = await supabase
          .from('user_wallets')
          .update({
            balance: mainBalance - amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        await supabase.from('activity_logs').insert({
          user_id: userId,
          activity_type: 'wallet_payment',
          description: `Paiement - ${description}`,
          amount: -amount,
          currency: 'CDF',
          reference_type: referenceType,
          reference_id: referenceId
        });

        toast.success(`Paiement réussi (${amount} CDF) !`);
        return { success: true, paidWithBonus: false };
      } else {
        const totalAvailable = mainBalance + bonusBalance;
        toast.error(
          `Solde insuffisant. Requis: ${amount} CDF | Disponible: ${totalAvailable} CDF`,
          { description: 'Rechargez votre portefeuille pour continuer' }
        );
        return { success: false, error: 'Solde insuffisant' };
      }
    } catch (error) {
      console.error('❌ Erreur paiement wallet:', error);
      toast.error('Erreur lors du paiement');
      return { success: false, error: 'Erreur de transaction' };
    }
  };

  return { payWithWallet };
};
