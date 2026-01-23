/**
 * 🎁 Hook système de parrainage client optimisé
 * - Limite de 20 filleuls maximum
 * - Validation en temps réel
 * - Tracking filleuls et calcul bonus
 */

import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getBaseUrl } from '@/lib/mobileUrl';

export interface ClientReferral {
  id: string;
  referee_id: string;
  status: string;
  reward_amount: number;
  created_at: string;
  referee_name?: string;
}

export interface ReferralValidation {
  valid: boolean;
  message?: string;
  referrer_name?: string;
  remaining_slots?: number;
  reward_amount?: number;
  limit_reached?: boolean;
}

const REWARD_PER_REFERRAL = 500;
const MAX_REFERRALS = 20;

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
  const { data: referralCode, isLoading: loadingCode, refetch: refetchCode } = useQuery({
    queryKey: ['client-referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('🎁 Fetching referral code for user:', user.id);
      
      const { data, error } = await supabase
        .rpc('get_or_create_referral_code', { p_user_id: user.id });
      
      if (error) {
        console.error('❌ Error getting referral code:', error);
        const fallbackCode = generateUniqueCode(user.id);
        console.log('🔄 Using fallback code:', fallbackCode);
        return fallbackCode;
      }
      
      console.log('✅ Got referral code:', data);
      return data as string;
    },
    enabled: !!user,
    retry: 2,
    staleTime: 10 * 60 * 1000
  });

  // Récupérer les filleuls
  const { data: referrals, isLoading: loadingReferrals, refetch: refetchReferrals } = useQuery({
    queryKey: ['client-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('referral_system')
        .select('id, referee_id, status, referrer_reward_amount, created_at')
        .eq('referrer_id', user.id)
        .neq('referee_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching referrals:', error);
        return [];
      }

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

  // Générer le lien de partage (compatible mobile)
  const getShareLink = () => {
    if (!referralCode) return '';
    return `${getBaseUrl()}/client/register?ref=${referralCode}`;
  };

  // Valider un code de parrainage (avant inscription)
  const validateCode = async (code: string): Promise<ReferralValidation> => {
    if (!code || code.trim().length < 4) {
      return { valid: false, message: 'Code trop court' };
    }

    try {
      const { data, error } = await supabase.rpc('validate_referral_code', {
        p_referral_code: code.trim().toUpperCase()
      });

      if (error) {
        console.error('❌ Error validating code:', error);
        return { valid: false, message: 'Erreur de validation' };
      }

      const result = data as unknown as ReferralValidation;
      return {
        valid: result.valid === true,
        message: result.message,
        referrer_name: result.referrer_name,
        remaining_slots: result.remaining_slots,
        reward_amount: result.reward_amount,
        limit_reached: result.limit_reached
      };
    } catch (err) {
      console.error('❌ Exception validating code:', err);
      return { valid: false, message: 'Erreur de connexion' };
    }
  };

  // Partager via l'API Web Share
  const shareReferralCode = async () => {
    if (!referralCode) {
      toast.error('Code non disponible');
      return;
    }

    // Vérifier la limite avant de partager
    if (stats.totalReferrals >= MAX_REFERRALS) {
      toast.error('Vous avez atteint la limite de 20 amis parrainés');
      return;
    }

    const shareData = {
      title: 'Rejoignez Kwenda !',
      text: `Utilisez mon code ${referralCode} pour vous inscrire sur Kwenda et recevez ${REWARD_PER_REFERRAL} CDF de bonus ! 🎁`,
      url: getShareLink()
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Merci de partager !');
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
    if (!referralCode) {
      toast.error('Code non disponible');
      return;
    }
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success('Code copié ! 📋');
    } catch {
      // Fallback pour navigateurs anciens
      const textArea = document.createElement('textarea');
      textArea.value = referralCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Code copié ! 📋');
    }
  };

  // Copier le lien complet
  const copyShareLink = async () => {
    const link = getShareLink();
    if (!link) {
      toast.error('Lien non disponible');
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Lien copié ! 🔗');
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
    pendingEarnings: (referrals?.filter(r => r.status === 'pending').length || 0) * REWARD_PER_REFERRAL,
    remainingSlots: MAX_REFERRALS - (referrals?.length || 0),
    maxReferrals: MAX_REFERRALS,
    limitReached: (referrals?.length || 0) >= MAX_REFERRALS,
    progressPercent: Math.min(((referrals?.length || 0) / MAX_REFERRALS) * 100, 100)
  };

  return {
    referralCode: referralCode ? { code: referralCode } : null,
    referrals,
    stats,
    loading: loadingCode || loadingReferrals,
    shareReferralCode,
    copyToClipboard,
    copyShareLink,
    getShareLink,
    validateCode,
    refetchCode,
    refetchReferrals,
    REWARD_PER_REFERRAL,
    MAX_REFERRALS
  };
};
