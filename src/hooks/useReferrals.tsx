import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

type UserType = 'client' | 'driver' | 'admin' | 'partner';

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
  userType: UserType;
  currentReward: number;
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
    recentReferrals: [],
    userType: 'client',
    currentReward: 500
  });
  const [rewards, setRewards] = useState<ReferralReward[]>([]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user type first
      const { data: userTypeData, error: userTypeError } = await supabase
        .rpc('get_user_type', { p_user_id: user.id });

      if (userTypeError) {
        console.error('Error getting user type:', userTypeError);
      }

      const userType: UserType = (userTypeData as UserType) || 'client';

      // Get reward amount for this user type
      const { data: rewardAmountData, error: rewardAmountError } = await supabase
        .rpc('get_referral_reward_amount', { p_user_id: user.id });

      if (rewardAmountError) {
        console.error('Error getting reward amount:', rewardAmountError);
      }

      const currentReward = rewardAmountData || (userType === 'client' ? 500 : 2000);

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
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (rewardsError) {
        console.error('Error loading rewards:', rewardsError);
      }

      const totalEarned = rewardsData?.reduce((sum, reward) => sum + Number(reward.reward_amount), 0) || 0;
      const pendingRewards = referrals?.filter(r => r.status === 'completed' && !r.reward_given_date).length || 0;

      // Determine current tier based on user type
      let currentTier = 'bronze';
      
      if (userType === 'driver' || userType === 'admin' || userType === 'partner') {
        // Tiers for drivers/partners: smaller thresholds, higher rewards
        if (totalReferred >= 31) currentTier = 'platinum';
        else if (totalReferred >= 16) currentTier = 'gold';
        else if (totalReferred >= 6) currentTier = 'silver';
      } else {
        // Tiers for clients: higher thresholds, lower rewards
        if (totalReferred >= 51) currentTier = 'platinum';
        else if (totalReferred >= 26) currentTier = 'gold';
        else if (totalReferred >= 11) currentTier = 'silver';
      }

      setStats({
        totalReferred,
        totalEarned,
        pendingRewards,
        currentTier,
        recentReferrals,
        userType,
        currentReward
      });

      setRewards(rewardsData || []);

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
    const getShareMessage = () => {
      const baseUrl = "https://kwenda.taxi";
      
      if (stats.userType === 'driver' || stats.userType === 'admin' || stats.userType === 'partner') {
        return `🚗💼 Deviens chauffeur sur Kwenda Taxi Congo !

Utilise mon code de parrainage : ${referralCode}
🎁 Gagne ${stats.currentReward} CDF de bonus !

✅ Plus de courses, plus de revenus
✅ Application moderne et fiable
✅ Support chauffeur 24/7

Télécharge l'app : ${baseUrl}`;
      } else {
        return `🚗💰 Rejoins-moi sur Kwenda Taxi Congo !

Utilise mon code : ${referralCode}
🎁 Bonus de ${stats.currentReward} CDF pour toi !

✅ Transport sûr et rapide
✅ Prix transparents
✅ Chauffeurs vérifiés

Télécharge l'app : ${baseUrl}`;
      }
    };

    const referralMessage = getShareMessage();

    if (navigator.share) {
      try {
        await navigator.share({
          title: stats.userType === 'driver' ? 'Deviens chauffeur sur Kwenda Taxi !' : 'Rejoins-moi sur Kwenda Taxi !',
          text: referralMessage,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        await navigator.clipboard.writeText(referralMessage);
        toast({
          title: "Message copié !",
          description: "Le message de parrainage a été copié dans le presse-papiers",
        });
      }
    } else {
      await navigator.clipboard.writeText(referralMessage);
      toast({
        title: "Message copié !",
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
    if (stats.userType === 'driver' || stats.userType === 'admin' || stats.userType === 'partner') {
      const driverTiers = {
        bronze: { min: 1, max: 5, reward: 2000, color: 'text-orange-600' },
        silver: { min: 6, max: 15, reward: 3000, color: 'text-gray-500' },
        gold: { min: 16, max: 30, reward: 5000, color: 'text-yellow-500' },
        platinum: { min: 31, max: Infinity, reward: 8000, color: 'text-purple-600' }
      };
      return driverTiers[stats.currentTier as keyof typeof driverTiers] || driverTiers.bronze;
    } else {
      const clientTiers = {
        bronze: { min: 1, max: 10, reward: 500, color: 'text-orange-600' },
        silver: { min: 11, max: 25, reward: 750, color: 'text-gray-500' },
        gold: { min: 26, max: 50, reward: 1000, color: 'text-yellow-500' },
        platinum: { min: 51, max: Infinity, reward: 1500, color: 'text-purple-600' }
      };
      return clientTiers[stats.currentTier as keyof typeof clientTiers] || clientTiers.bronze;
    }
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