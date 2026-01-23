/**
 * Hook unifié pour la tarification de livraison
 * Récupère les tarifs depuis pricing_rules avec synchronisation realtime
 * Remplace les prix hardcodés pour garantir la cohérence avec l'admin
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { logger } from '@/utils/logger';

interface PricingRule {
  id: string;
  service_type: string;
  vehicle_class: string;
  city: string;
  base_price: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_fare: number;
  surge_multiplier: number;
  waiting_fee_per_minute: number;
  free_waiting_time_minutes: number;
  max_waiting_time_minutes: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DeliveryPriceCalculation {
  basePrice: number;
  pricePerKm: number;
  distancePrice: number;
  totalPrice: number;
  currency: string;
  source: 'database' | 'fallback';
  rule?: PricingRule;
}

// Fallbacks uniquement si DB inaccessible
const FALLBACK_PRICING = {
  flash: { base: 5000, perKm: 1000 },
  flex: { base: 55000, perKm: 2500 },
  maxicharge: { base: 100000, perKm: 5000 }
};

export const useDeliveryPricing = (city: string = 'kinshasa') => {
  const queryClient = useQueryClient();

  // Récupérer les règles de tarification actives pour la livraison
  const { data: pricingRules, isLoading, error } = useQuery({
    queryKey: ['delivery-pricing-rules', city],
    queryFn: async () => {
      logger.info('🔄 Chargement des tarifs de livraison', { city });
      
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_type', 'delivery')
        .eq('city', city.toLowerCase())
        .eq('is_active', true)
        .in('vehicle_class', ['flash', 'flex', 'maxicharge']);

      if (error) {
        logger.error('❌ Erreur chargement tarifs livraison', error);
        throw error;
      }

      logger.info('✅ Tarifs de livraison chargés', { 
        count: data?.length,
        rules: data?.map(r => ({ class: r.vehicle_class, base: r.base_price, perKm: r.price_per_km }))
      });

      return data as PricingRule[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // ✅ Synchronisation realtime pour mises à jour instantanées
  useEffect(() => {
    logger.info('🔌 Activation realtime pour tarifs livraison', { city });

    const channel = supabase
      .channel('delivery-pricing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pricing_rules',
          filter: `service_type=eq.delivery,city=eq.${city.toLowerCase()}`
        },
        (payload) => {
          logger.info('🔄 Mise à jour tarif livraison détectée', payload);
          queryClient.invalidateQueries({ queryKey: ['delivery-pricing-rules', city] });
        }
      )
      .subscribe();

    return () => {
      logger.info('🔌 Déconnexion realtime tarifs livraison');
      supabase.removeChannel(channel);
    };
  }, [city, queryClient]);

  /**
   * Calculer le prix de livraison
   * @param serviceType - Type de service ('flash' | 'flex' | 'maxicharge')
   * @param distanceKm - Distance en kilomètres
   * @returns Calcul détaillé du prix
   */
  const calculateDeliveryPrice = (
    serviceType: 'flash' | 'flex' | 'maxicharge',
    distanceKm: number
  ): DeliveryPriceCalculation => {
    // Trouver la règle correspondante
    const rule = pricingRules?.find(r => r.vehicle_class === serviceType);

    let basePrice: number;
    let pricePerKm: number;
    let source: 'database' | 'fallback' = 'database';

    if (rule) {
      basePrice = rule.base_price;
      pricePerKm = rule.price_per_km;
      logger.info(`💰 Tarif ${serviceType} depuis DB`, { basePrice, pricePerKm, city });
    } else {
      // Fallback uniquement si règle introuvable
      const fallback = FALLBACK_PRICING[serviceType];
      basePrice = fallback.base;
      pricePerKm = fallback.perKm;
      source = 'fallback';
      logger.warn(`⚠️ Utilisation fallback pour ${serviceType}`, { basePrice, pricePerKm });
    }

    // Calcul du prix par distance
    const distancePrice = Math.max(0, distanceKm - 1) * pricePerKm; // Premier km inclus
    let totalPrice = Math.round(basePrice + distancePrice);

    // Appliquer la limite minimale si définie
    if (rule && rule.minimum_fare && totalPrice < rule.minimum_fare) {
      totalPrice = rule.minimum_fare;
    }

    logger.info(`📊 Prix calculé ${serviceType}`, {
      distance: distanceKm,
      basePrice,
      pricePerKm,
      distancePrice,
      totalPrice,
      source
    });

    return {
      basePrice,
      pricePerKm,
      distancePrice,
      totalPrice,
      currency: 'CDF',
      source,
      rule
    };
  };

  /**
   * Récupérer les informations tarifaires d'un service
   */
  const getServicePricing = (serviceType: 'flash' | 'flex' | 'maxicharge') => {
    const rule = pricingRules?.find(r => r.vehicle_class === serviceType);
    if (rule) {
      return {
        basePrice: rule.base_price,
        pricePerKm: rule.price_per_km,
        minimumFare: rule.minimum_fare,
        source: 'database' as const
      };
    }

    const fallback = FALLBACK_PRICING[serviceType];
    return {
      basePrice: fallback.base,
      pricePerKm: fallback.perKm,
      minimumFare: fallback.base,
      source: 'fallback' as const
    };
  };

  return {
    pricingRules,
    isLoading,
    error,
    calculateDeliveryPrice,
    getServicePricing
  };
};
