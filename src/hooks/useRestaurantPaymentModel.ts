import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommissionConfig {
  default_rate: number;
  min_rate: number;
  max_rate: number;
}

interface CustomRate {
  custom_commission_rate: number;
  reason: string | null;
}

export const useRestaurantPaymentModel = (restaurantId: string) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentModel, setPaymentModel] = useState<'subscription' | 'commission'>('commission');
  const [commissionRate, setCommissionRate] = useState<number>(5.00);
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig | null>(null);
  const [customRate, setCustomRate] = useState<CustomRate | null>(null);

  const fetchPaymentModel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('payment_model')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;
      setPaymentModel(data.payment_model as 'subscription' | 'commission');
    } catch (error: any) {
      console.error('Error fetching payment model:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_commission_config')
        .select('default_commission_rate, min_commission_rate, max_commission_rate')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      setCommissionConfig({
        default_rate: data.default_commission_rate,
        min_rate: data.min_commission_rate,
        max_rate: data.max_commission_rate,
      });
    } catch (error: any) {
      console.error('Error fetching commission config:', error);
    }
  };

  const fetchCustomRate = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_custom_commission_rates')
        .select('custom_commission_rate, reason')
        .eq('restaurant_id', restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCustomRate(data);
        setCommissionRate(data.custom_commission_rate);
      } else if (commissionConfig) {
        setCommissionRate(commissionConfig.default_rate);
      }
    } catch (error: any) {
      console.error('Error fetching custom rate:', error);
    }
  };

  const switchPaymentModel = async (newModel: 'subscription' | 'commission') => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('restaurant_profiles')
        .update({ payment_model: newModel })
        .eq('id', restaurantId);

      if (error) throw error;

      setPaymentModel(newModel);
      
      toast({
        title: '✅ Modèle modifié',
        description: newModel === 'subscription' 
          ? 'Vous êtes passé au modèle abonnement (0% commission)'
          : `Vous êtes passé au modèle commission (${commissionRate}% par vente)`,
      });

      return true;
    } catch (error: any) {
      console.error('Error switching payment model:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de changer de modèle',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchPaymentModel();
      fetchCommissionConfig();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId && commissionConfig) {
      fetchCustomRate();
    }
  }, [restaurantId, commissionConfig]);

  return {
    loading,
    paymentModel,
    commissionRate,
    commissionConfig,
    customRate,
    switchPaymentModel,
    fetchPaymentModel,
  };
};
