import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromotionalAd {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  cta_text: string;
  cta_action: string;
  cta_target: string | null;
  target_zones: any[];
  target_user_types: string[];
  display_priority: number;
}

export const usePromotionalAds = () => {
  const [ads, setAds] = useState<PromotionalAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_ads')
        .select('*')
        .eq('is_active', true)
        .order('display_priority', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des publicités:', error);
        return;
      }

      setAds(data as PromotionalAd[] || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackAdImpression = async (adId: string) => {
    try {
      // Fetch current count and increment
      const { data: currentAd } = await supabase
        .from('promotional_ads')
        .select('impression_count')
        .eq('id', adId)
        .single();
      
      if (currentAd) {
        const { error } = await supabase
          .from('promotional_ads')
          .update({ impression_count: (currentAd.impression_count || 0) + 1 })
          .eq('id', adId);
        
        if (error) console.error('Erreur tracking impression:', error);
      }
    } catch (error) {
      console.error('Erreur tracking impression:', error);
    }
  };

  const trackAdClick = async (adId: string) => {
    try {
      // Fetch current count and increment
      const { data: currentAd } = await supabase
        .from('promotional_ads')
        .select('click_count')
        .eq('id', adId)
        .single();
      
      if (currentAd) {
        const { error } = await supabase
          .from('promotional_ads')
          .update({ click_count: (currentAd.click_count || 0) + 1 })
          .eq('id', adId);
        
        if (error) console.error('Erreur tracking click:', error);
      }
    } catch (error) {
      console.error('Erreur tracking click:', error);
    }
  };

  return {
    ads,
    loading,
    trackAdImpression,
    trackAdClick,
  };
};