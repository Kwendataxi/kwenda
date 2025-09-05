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
    if (user) {
      fetchUserReferralCode();
      fetchUserReferrals();
    }
  }, [user]);

  const fetchUserReferralCode = async () => {
    try {
      const { data } = await supabase
        .from('referral_system')
        .select('referral_code')
        .eq('referrer_id', user?.id)
        .limit(1)
        .single();

      if (data) {
        setUserReferralCode(data.referral_code);
      } else {
        // Créer un code de parrainage si l'utilisateur n'en a pas
        await createReferralCode();
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du code de parrainage:', error);
    }
  };

  const createReferralCode = async () => {
    try {
      // Appeler la fonction pour générer un code unique
      const { data: codeData } = await supabase.rpc('generate_referral_code');
      
      if (codeData) {
        setUserReferralCode(codeData);
      }
    } catch (error) {
      console.error('Erreur lors de la création du code de parrainage:', error);
    }
  };

  const fetchUserReferrals = async () => {
    try {
      const { data } = await supabase
        .from('referral_system')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setReferrals(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des parrainages:', error);
    }
  };

  const useReferralCode = async (referralCode: string) => {
    if (!user) return { success: false, message: 'Vous devez être connecté' };

    setIsLoading(true);
    try {
      // Vérifier si le code existe et n'est pas celui de l'utilisateur
      const { data: referrerData, error: referrerError } = await supabase
        .from('referral_system')
        .select('referrer_id')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrerError || !referrerData) {
        return { success: false, message: 'Code de parrainage invalide' };
      }

      if (referrerData.referrer_id === user.id) {
        return { success: false, message: 'Vous ne pouvez pas utiliser votre propre code' };
      }

      // Vérifier si l'utilisateur n'a pas déjà été parrainé
      const { data: existingReferral } = await supabase
        .from('referral_system')
        .select('*')
        .eq('referee_id', user.id)
        .single();

      if (existingReferral) {
        return { success: false, message: 'Vous avez déjà été parrainé' };
      }

      // Créer l'entrée de parrainage
      const { error: insertError } = await supabase
        .from('referral_system')
        .insert({
          referrer_id: referrerData.referrer_id,
          referee_id: user.id,
          referral_code: referralCode.toUpperCase(),
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Code de parrainage appliqué !",
        description: "Vous recevrez vos récompenses après votre première commande.",
      });

      return { success: true, message: 'Code de parrainage appliqué avec succès' };
    } catch (error: any) {
      console.error('Erreur lors de l\'utilisation du code de parrainage:', error);
      return { success: false, message: 'Erreur lors de l\'application du code' };
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