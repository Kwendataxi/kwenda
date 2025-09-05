import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

interface ReferralData {
  id: string;
  referral_code: string;
  status: string;
  referrer_reward_amount: number;
  referee_reward_amount: number;
  created_at: string;
  completed_at?: string;
}

export const useReferralSystem = () => {
  const [userReferralCode, setUserReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Récupérer le code de parrainage de l'utilisateur
  useEffect(() => {
    fetchUserReferralCode();
    fetchUserReferrals();
  }, []);

  const fetchUserReferralCode = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Chercher le code de parrainage existant
      const { data: existingCode } = await supabase
        .from('referral_system')
        .select('referral_code')
        .eq('referrer_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (existingCode) {
        setUserReferralCode(existingCode.referral_code);
      } else {
        // Créer un nouveau code de parrainage
        const newCode = await createReferralCode();
        if (newCode) {
          setUserReferralCode(newCode);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du code de parrainage:', error);
    }
  };

  const createReferralCode = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      // Générer un code unique
      const referralCode = `KWENDA${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Créer une entrée dans referral_system
      const { data, error } = await supabase
        .from('referral_system')
        .insert({
          referrer_id: user.user.id,
          referee_id: user.user.id, // Sera mis à jour quand quelqu'un utilise le code
          referral_code: referralCode,
          status: 'active',
          referrer_reward_amount: 5000,
          referee_reward_amount: 3000,
          currency: 'CDF'
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du code de parrainage:', error);
        return null;
      }

      return referralCode;
    } catch (error) {
      console.error('Erreur lors de la création du code:', error);
      return null;
    }
  };

  const fetchUserReferrals = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Récupérer tous les parrainages où l'utilisateur est le parrain
      const { data: referrals } = await supabase
        .from('referral_system')
        .select('*')
        .eq('referrer_id', user.user.id)
        .order('created_at', { ascending: false });

      if (referrals) {
        const processedReferrals: ReferralData[] = referrals.map((ref: any) => ({
          id: ref.id,
          referral_code: ref.referral_code,
          status: ref.status,
          referrer_reward_amount: ref.referrer_reward_amount,
          referee_reward_amount: ref.referee_reward_amount,
          created_at: ref.created_at,
          completed_at: ref.completed_at
        }));

        setReferrals(processedReferrals);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des parrainages:', error);
    }
  };

  const useReferralCode = async (referralCode: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return { success: false, message: 'Utilisateur non connecté' };

      setIsLoading(true);

      // Vérifier si le code de parrainage existe et est valide
      const { data: existingReferral } = await supabase
        .from('referral_system')
        .select('referrer_id, referee_id')
        .eq('referral_code', referralCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (!existingReferral) {
        return { success: false, message: 'Code de parrainage invalide' };
      }

      if (existingReferral.referrer_id === user.user.id) {
        return { success: false, message: 'Vous ne pouvez pas utiliser votre propre code' };
      }

      // Vérifier si l'utilisateur a déjà utilisé un code de parrainage
      const { data: existingUse } = await supabase
        .from('referral_system')
        .select('id')
        .eq('referee_id', user.user.id)
        .eq('status', 'completed')
        .single();

      if (existingUse) {
        return { success: false, message: 'Vous avez déjà utilisé un code de parrainage' };
      }

      // Créer un nouvel enregistrement pour ce parrainage
      const { error } = await supabase
        .from('referral_system')
        .insert({
          referrer_id: existingReferral.referrer_id,
          referee_id: user.user.id,
          referral_code: referralCode.toUpperCase(),
          status: 'completed',
          referrer_reward_amount: 5000,
          referee_reward_amount: 3000,
          currency: 'CDF',
          completed_at: new Date().toISOString(),
          rewarded_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erreur lors de l\'utilisation du code:', error);
        return { success: false, message: 'Erreur lors de l\'application du code' };
      }

      // Actualiser la liste des parrainages
      await fetchUserReferrals();

      toast({
        title: "Code de parrainage appliqué !",
        description: "Vous avez reçu 3000 CDF de bonus !",
      });

      return { success: true, message: 'Code de parrainage appliqué avec succès ! Vous avez reçu 3000 CDF.' };
    } catch (error) {
      console.error('Erreur lors de l\'utilisation du code de parrainage:', error);
      return { success: false, message: 'Erreur inattendue' };
    } finally {
      setIsLoading(false);
    }
  };

  const shareReferralCode = () => {
    const message = `Rejoignez-moi sur KwendaTaxi avec mon code de parrainage ${userReferralCode} et obtenez 3000 CDF de crédit gratuit ! 🚗`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Code de parrainage KwendaTaxi',
        text: message,
      });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas Web Share API
      navigator.clipboard.writeText(message);
      toast({
        title: "Code copié !",
        description: "Le message de parrainage a été copié dans le presse-papier.",
      });
    }
  };

  const calculateEarnings = () => {
    const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded');
    return completedReferrals.reduce((total, referral) => total + referral.referrer_reward_amount, 0);
  };

  return {
    userReferralCode,
    referrals,
    useReferralCode,
    shareReferralCode,
    calculateEarnings,
    isLoading,
  };
};