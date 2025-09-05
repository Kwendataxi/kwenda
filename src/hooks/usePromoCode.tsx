import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface PromoCode {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_delivery';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  applicable_services: string[];
  valid_until: string;
  usage_limit: number;
  user_limit: number;
}

export const usePromoCode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<PromoCode[]>([]);
  const [userUsage, setUserUsage] = useState<any[]>([]);
  const { toast } = useToast();

  const validatePromoCode = async (code: string, orderAmount: number, serviceType: string) => {
    setIsLoading(true);
    try {
      const { data: promoData, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !promoData) {
        throw new Error('Code promo invalide ou expiré');
      }

      // Vérifier si le service est applicable
      if (!promoData.applicable_services.includes(serviceType)) {
        throw new Error('Ce code promo n\'est pas valide pour ce service');
      }

      // Vérifier le montant minimum
      if (orderAmount < promoData.min_order_amount) {
        throw new Error(`Montant minimum requis: ${promoData.min_order_amount} CDF`);
      }

      // Vérifier si l'utilisateur a déjà utilisé ce code
      const { data: usage } = await supabase
        .from('promo_code_usage')
        .select('*')
        .eq('promo_code_id', promoData.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (usage && usage.length >= promoData.user_limit) {
        throw new Error('Vous avez déjà utilisé ce code promo');
      }

      // Calculer la réduction
      let discountAmount = 0;
      if (promoData.discount_type === 'percentage') {
        discountAmount = (orderAmount * promoData.discount_value) / 100;
        if (promoData.max_discount_amount) {
          discountAmount = Math.min(discountAmount, promoData.max_discount_amount);
        }
      } else if (promoData.discount_type === 'fixed_amount') {
        discountAmount = promoData.discount_value;
      } else if (promoData.discount_type === 'free_delivery') {
        discountAmount = 0; // Gérée différemment selon le service
      }

      toast({
        title: "Code promo appliqué !",
        description: `${promoData.title} - Réduction: ${discountAmount} CDF`,
      });

      return {
        isValid: true,
        promoCode: promoData,
        discountAmount,
      };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { isValid: false, promoCode: null, discountAmount: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  const applyPromoCode = async (promoCodeId: string, orderId: string, orderType: string, discountAmount: number) => {
    try {
      const { error } = await supabase
        .from('promo_code_usage')
        .insert({
          promo_code_id: promoCodeId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          order_id: orderId,
          order_type: orderType,
          discount_amount: discountAmount,
        });

      if (error) throw error;

      // Incrémenter le compteur d'utilisation
      const { data: currentCode } = await supabase
        .from('promo_codes')
        .select('usage_count')
        .eq('id', promoCodeId)
        .single();

      await supabase
        .from('promo_codes')
        .update({ usage_count: (currentCode?.usage_count || 0) + 1 })
        .eq('id', promoCodeId);

    } catch (error: any) {
      console.error('Erreur lors de l\'application du code promo:', error);
    }
  };

  const fetchAvailableCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableCodes((data || []).map(code => ({
        ...code,
        discount_type: code.discount_type as 'percentage' | 'fixed_amount' | 'free_delivery'
      })));
    } catch (error) {
      console.error('Erreur lors de la récupération des codes promo:', error);
    }
  };

  const fetchUserUsage = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('promo_code_usage')
        .select(`
          *,
          promo_codes (
            code,
            title,
            discount_value
          )
        `)
        .eq('user_id', user.user.id)
        .order('used_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUserUsage(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    }
  };

  const getPersonalizedCodes = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Chercher d'abord les codes personnalisés existants dans la DB
      const { data: existingCodes } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('created_by', user.user.id)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString());

      if (existingCodes && existingCodes.length > 0) {
        return existingCodes.map(code => ({
          id: code.id,
          code: code.code,
          title: code.title,
          description: code.description,
          discount_type: code.discount_type as 'percentage' | 'fixed_amount' | 'free_delivery',
          discount_value: code.discount_value,
          min_order_amount: code.min_order_amount,
          max_discount_amount: code.max_discount_amount,
          applicable_services: code.applicable_services,
          usage_limit: code.usage_limit,
          user_limit: code.user_limit,
          valid_until: code.valid_until
        }));
      }

      // Utiliser la fonction pour calculer les statistiques utilisateur
      const { data: loyaltyData } = await supabase.rpc('calculate_user_loyalty_points', {
        p_user_id: user.user.id
      });

      if (!loyaltyData) return [];

      const data = loyaltyData as any;
      const totalSpent = data.total_spent || 0;
      const totalOrders = data.total_orders || 0;

      // Générer des codes personnalisés basés sur l'activité
      const personalizedCodes: PromoCode[] = [];

      // Bonus première commande
      if (totalOrders === 0) {
        const firstTimeCode = {
          code: 'PREMIERE20',
          title: 'Première course',
          description: '20% de réduction sur votre première course',
          discount_type: 'percentage' as const,
          discount_value: 20,
          min_order_amount: 2000,
          applicable_services: ['transport'],
          usage_limit: 1,
          user_limit: 1,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_by: user.user.id
        };

        // Créer le code dans la DB
        const { data: newCode, error } = await supabase
          .from('promo_codes')
          .insert(firstTimeCode)
          .select()
          .single();

        if (!error && newCode) {
          personalizedCodes.push({
            id: newCode.id,
            code: firstTimeCode.code,
            title: firstTimeCode.title,
            description: firstTimeCode.description,
            discount_type: firstTimeCode.discount_type,
            discount_value: firstTimeCode.discount_value,
            min_order_amount: firstTimeCode.min_order_amount,
            applicable_services: firstTimeCode.applicable_services,
            usage_limit: firstTimeCode.usage_limit,
            user_limit: firstTimeCode.user_limit,
            valid_until: firstTimeCode.valid_until
          });
        }
      }

      return personalizedCodes;
    } catch (error) {
      console.error('Erreur lors de la génération des codes personnalisés:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchAvailableCodes();
    fetchUserUsage();
  }, []);

  return {
    validatePromoCode,
    applyPromoCode,
    fetchAvailableCodes,
    getPersonalizedCodes,
    availableCodes,
    userUsage,
    isLoading,
  };
};