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

      // Get user statistics to generate personalized codes
      const { data: orders } = await supabase
        .from('transport_bookings')
        .select('actual_price, created_at')
        .eq('user_id', user.user.id)
        .eq('status', 'completed');

      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, order) => sum + (order.actual_price || 0), 0) || 0;

      const personalizedCodes: PromoCode[] = [];

      // First-time user bonus
      if (totalOrders === 0) {
        personalizedCodes.push({
          id: 'first-ride',
          code: 'PREMIERE',
          title: 'Première course gratuite',
          description: 'Réduction de 50% sur votre première course (max 5000 CDF)',
          discount_type: 'percentage',
          discount_value: 50,
          min_order_amount: 0,
          max_discount_amount: 5000,
          applicable_services: ['transport'],
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usage_limit: 1,
          user_limit: 1
        });
      }

      // Loyal customer bonus
      if (totalOrders >= 10) {
        personalizedCodes.push({
          id: 'loyal-customer',
          code: 'FIDELE10',
          title: 'Client fidèle',
          description: 'Réduction de 20% pour nos clients fidèles',
          discount_type: 'percentage',
          discount_value: 20,
          min_order_amount: 3000,
          max_discount_amount: 8000,
          applicable_services: ['transport', 'delivery'],
          valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          usage_limit: 5,
          user_limit: 1
        });
      }

      // High spender bonus
      if (totalSpent >= 50000) {
        personalizedCodes.push({
          id: 'vip-member',
          code: 'VIP2024',
          title: 'Membre VIP',
          description: 'Livraison gratuite pour nos membres VIP',
          discount_type: 'free_delivery',
          discount_value: 0,
          min_order_amount: 0,
          applicable_services: ['delivery', 'marketplace'],
          valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          usage_limit: 10,
          user_limit: 3
        });
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