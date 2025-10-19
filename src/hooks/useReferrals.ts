import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Referral {
  id: string;
  referee_name: string;
  reward_amount: number;
  status: string;
  created_at: string;
}

export const useReferrals = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchReferralData = async () => {
      try {
        setIsLoading(true);

        // Récupérer le code de parrainage
        const { data: codeData } = await supabase
          .rpc('get_or_create_referral_code', { p_user_id: user.id });

        if (codeData) {
          setReferralCode(codeData);
        }

        // Récupérer les filleuls
        const { data: referralsData } = await supabase
          .from('referrals')
          .select('id, created_at, status, referred_id')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });

        if (referralsData) {
          // Enrichir avec les noms des filleuls
          const enrichedReferrals = await Promise.all(
            referralsData.map(async (ref) => {
              const { data: userData } = await supabase
                .from('clients')
                .select('display_name')
                .eq('user_id', ref.referred_id)
                .single();

              return {
                id: ref.id,
                created_at: ref.created_at,
                status: ref.status,
                reward_amount: ref.status === 'completed' ? 5000 : 0,
                referee_name: userData?.display_name || 'Utilisateur'
              };
            })
          );

          setReferrals(enrichedReferrals);

          // Calculer les gains totaux
          const total = enrichedReferrals
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + r.reward_amount, 0);
          setTotalEarnings(total);
        }
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralData();
  }, [user]);

  return { referralCode, referrals, totalEarnings, isLoading };
};
