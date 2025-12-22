/**
 * 🎁 Hook système de parrainage client
 * - Utilise la table referral_system existante
 * - Tracking filleuls et calcul bonus
 */

import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ClientReferral {
  id: string;
  referee_id: string;
  status: string;
  reward_amount: number;
  created_at: string;
  referee_name?: string;
}

const REWARD_PER_REFERRAL = 500;

export const useClientReferral = () => {
  const { user } = useAuth();

  // Générer un code unique
  const generateUniqueCode = (userId: string): string => {
    const prefix = 'KW';
    const userPart = userId.slice(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${userPart}${randomPart}`;
  };

  // Récupérer ou créer le code via RPC existant
  const { data: referralCode, isLoading: loadingCode } = useQuery({
    queryKey: ['client-referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .rpc('get_or_create_referral_code', { p_user_id: user.id });
      
      if (error) {
        console.error('Error getting referral code:', error);
        return generateUniqueCode(user.id);
      }
      
      return data as string;
    },
    enabled: !!user
  });

  // Récupérer les filleuls
  const { data: referrals, isLoading: loadingReferrals } = useQuery({
    queryKey: ['client-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('referral_system')
        .select('id, referee_id, status, referrer_reward_amount, created_at')
        .eq('referrer_id', user.id)
        .neq('referee_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return [];

      return (data || []).map((ref) => ({
        id: ref.id,
        referee_id: ref.referee_id,
        status: ref.status,
        reward_amount: ref.status === 'completed' ? (ref.referrer_reward_amount || REWARD_PER_REFERRAL) : 0,
        created_at: ref.created_at,
        referee_name: `Ami ${ref.referee_id?.slice(0, 6) || ''}`
      })) as ClientReferral[];
    },
    enabled: !!user
  });

  // Générer le lien de partage
  const getShareLink = () => {
    if (!referralCode) return '';
    return `${window.location.origin}/auth?ref=${referralCode}`;
  };

  // Partager via l'API Web Share
  const shareReferralCode = async () => {
    if (!referralCode) return;

    const shareData = {
      title: 'Rejoignez Kwenda !',
      text: `Utilisez mon code ${referralCode} pour vous inscrire sur Kwenda et recevez ${REWARD_PER_REFERRAL} CDF de bonus ! 🎁`,
      url: getShareLink()
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  // Copier le code
  const copyToClipboard = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success('Code copié !');
    } catch {
      toast.error('Impossible de copier');
    }
  };

  // Stats
  const stats = {
    totalReferrals: referrals?.length || 0,
    pendingReferrals: referrals?.filter(r => r.status === 'pending').length || 0,
    completedReferrals: referrals?.filter(r => r.status === 'completed').length || 0,
    totalEarnings: referrals?.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.reward_amount, 0) || 0,
    pendingEarnings: (referrals?.filter(r => r.status === 'pending').length || 0) * REWARD_PER_REFERRAL
  };

  return {
    referralCode: referralCode ? { code: referralCode } : null,
    referrals,
    stats,
    loading: loadingCode || loadingReferrals,
    shareReferralCode,
    copyToClipboard,
    getShareLink,
    REWARD_PER_REFERRAL
  };
};
