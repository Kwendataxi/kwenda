import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PartnerRange = '7d' | '30d' | 'all';

export interface PartnerDriverEarning {
  driver_id: string;
  driver_name: string;
  total_booking_amount: number;
  total_partner_commission: number;
  total_assignments: number;
  funded_topups: number;
  roi: number | null;
  service_breakdown: Record<string, { bookingAmount: number; commissionAmount: number; count: number }>;
}

export interface PartnerEarningsSummary {
  range: PartnerRange;
  fromDate: string | null;
  totals: {
    totalBookingAmount: number;
    totalPartnerCommission: number;
    totalAssignments: number;
    totalTopups: number;
    roi: number | null;
  };
  drivers: PartnerDriverEarning[];
}

export const usePartnerEarnings = (initialRange: PartnerRange = '30d') => {
  const [range, setRange] = useState<PartnerRange>(initialRange);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PartnerEarningsSummary | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Utiliser la nouvelle edge function améliorée
      const { data, error } = await supabase.functions.invoke('partner-driver-earnings', {
        body: { range },
      });
      if (error) throw error;
      setData(data as PartnerEarningsSummary);
    } catch (e) {
      console.error('usePartnerEarnings error:', e);
      // Fallback vers l'ancienne méthode si nécessaire
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const fallbackData: PartnerEarningsSummary = {
          range,
          fromDate: range === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() :
                    range === '30d' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() :
                    '2020-01-01',
          totals: {
            totalBookingAmount: 0,
            totalPartnerCommission: 0,
            totalAssignments: 0,
            totalTopups: 0,
            roi: null
          },
          drivers: []
        };
        setData(fallbackData);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const fromDate = useMemo(() => data?.fromDate ?? null, [data]);

  return { loading, data, range, setRange, fromDate, refresh: load };
};
