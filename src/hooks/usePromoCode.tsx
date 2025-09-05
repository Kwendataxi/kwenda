import { useState } from 'react';
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
}

export const usePromoCode = () => {
  const [isLoading, setIsLoading] = useState(false);
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

  return {
    validatePromoCode,
    applyPromoCode,
    isLoading,
  };
};