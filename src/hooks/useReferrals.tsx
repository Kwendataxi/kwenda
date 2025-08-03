import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Referral {
  id: string;
  referrer_id: string;
  referred_id?: string;
  referral_code: string;
  status: string;
  referred_user_type?: string;
  completion_date?: string;
  reward_given_date?: string;
  created_at: string;
}

interface ReferralReward {
  id: string;
  referral_id: string;
  tier_level: string;
  reward_amount: number;
  reward_currency: string;
  created_at: string;
}

interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
  currentTier: string;
  recentReferrals: Referral[];
}

export const useReferrals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    totalEarned: 0,
    pendingRewards: 0,
    currentTier: 'bronze',
    recentReferrals: []
  });
  const [rewards, setRewards] = useState<ReferralReward[]>([]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get or create user's referral code
      let { data: existingReferral, error: referralError } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', user.id)
        .maybeSingle();

      let userReferralCode = '';

      if (referralError && referralError.code !== 'PGRST116') {
        console.error('Error fetching referral:', referralError);
      }

      if (!existingReferral) {
        // Generate new referral code
        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_referral_code');

        if (codeError) {
          console.error('Error generating code:', codeError);
          throw codeError;
        }

        userReferralCode = codeData;

        // Create referral entry
        const { error: insertError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: user.id,
            referral_code: userReferralCode,
            status: 'pending'
          });

        if (insertError) {
          console.error('Error creating referral:', insertError);
          throw insertError;
        }
      } else {
        userReferralCode = existingReferral.referral_code;
      }

      setReferralCode(userReferralCode);

      // Load referral statistics
      const { data: referrals, error: statsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (statsError) {
        console.error('Error loading referral stats:', statsError);
        throw statsError;
      }

      const totalReferred = referrals?.filter(r => r.status === 'completed').length || 0;
      const recentReferrals = referrals?.slice(0, 5) || [];

      // Load rewards
      const { data: rewardData, error: rewardError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (rewardError) {
        console.error('Error loading rewards:', rewardError);
      }

      const totalEarned = rewardData?.reduce((sum, reward) => sum + Number(reward.reward_amount), 0) || 0;
      const pendingRewards = referrals?.filter(r => r.status === 'completed' && !r.reward_given_date).length || 0;

      // Determine current tier
      let currentTier = 'bronze';
      if (totalReferred >= 100) currentTier = 'platinum';
      else if (totalReferred >= 51) currentTier = 'gold';
      else if (totalReferred >= 21) currentTier = 'silver';

      setStats({
        totalReferred,
        totalEarned,
        pendingRewards,
        currentTier,
        recentReferrals
      });

      setRewards(rewardData || []);

    } catch (error) {
      console.error('Error in loadReferralData:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de parrainage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const shareReferralCode = async () => {
    const referralMessage = `Rejoignez-moi sur Kwenda Taxi Congo avec mon code de parrainage ${referralCode} et recevez des bonus ! Téléchargez l'app: https://kwenda.taxi`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kwenda Taxi Congo',
          text: referralMessage,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        await navigator.clipboard.writeText(referralMessage);
        toast({
          title: "Lien copié !",
          description: "Le message de parrainage a été copié dans le presse-papiers",
        });
      }
    } else {
      await navigator.clipboard.writeText(referralMessage);
      toast({
        title: "Lien copié !",
        description: "Le message de parrainage a été copié dans le presse-papiers",
      });
    }
  };

  const copyReferralCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    toast({
      title: "Code copié !",
      description: "Votre code de parrainage a été copié dans le presse-papiers",
    });
  };

  const getTierInfo = () => {
    const tiers = {
      bronze: { min: 1, max: 20, reward: 2000, color: 'text-orange-600' },
      silver: { min: 21, max: 50, reward: 3000, color: 'text-gray-500' },
      gold: { min: 51, max: 100, reward: 5000, color: 'text-yellow-500' },
      platinum: { min: 100, max: Infinity, reward: 10000, color: 'text-purple-600' }
    };

    return tiers[stats.currentTier as keyof typeof tiers] || tiers.bronze;
  };

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  // Set up real-time listeners for referral updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('referral-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`
        },
        () => {
          loadReferralData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referral_rewards',
          filter: `referrer_id=eq.${user.id}`
        },
        (payload) => {
          toast({
            title: "Nouvelle récompense de parrainage !",
            description: `Vous avez gagné ${payload.new.reward_amount} ${payload.new.reward_currency}`,
          });
          loadReferralData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    loading,
    referralCode,
    stats,
    rewards,
    shareReferralCode,
    copyReferralCode,
    getTierInfo,
    refreshReferrals: loadReferralData
  };
};