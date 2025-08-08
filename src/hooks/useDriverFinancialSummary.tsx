import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SummaryRange = '7d' | '30d' | 'all';

interface FinancialSummary {
  totalTopup: number;
  totalSpent: number;
  totalEarningsGross: number;
  totalEarningsNet: number;
  roi: number | null; // earningsNet / totalSpent
}

export const useDriverFinancialSummary = (initialRange: SummaryRange = '30d') => {
  const { user } = useAuth();
  const [range, setRange] = useState<SummaryRange>(initialRange);
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalTopup: 0,
    totalSpent: 0,
    totalEarningsGross: 0,
    totalEarningsNet: 0,
    roi: null,
  });

  const fromDate = useMemo(() => {
    if (range === 'all') return null;
    const now = new Date();
    const days = range === '7d' ? 7 : 30;
    const d = new Date(now);
    d.setDate(now.getDate() - days);
    return d.toISOString();
  }, [range]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1) Commission rate (default 85%)
      let driverRate = 85;
      const { data: commission } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('is_active', true)
        .eq('service_type', 'transport')
        .maybeSingle();
      if (commission?.driver_rate) driverRate = Number(commission.driver_rate);

      // 2) Credit transactions (topups and deductions)
      let txQuery = supabase
        .from('credit_transactions')
        .select('amount, transaction_type, created_at')
        .eq('driver_id', user.id);
      if (fromDate) txQuery = txQuery.gte('created_at', fromDate);
      const { data: txs, error: txErr } = await txQuery;
      if (txErr) throw txErr;

      const totalTopup = (txs || [])
        .filter(t => ['topup', 'credit'].includes((t as any).transaction_type))
        .reduce((s, t: any) => s + Number(t.amount || 0), 0);
      const totalSpent = (txs || [])
        .filter(t => ['deduction', 'debit'].includes((t as any).transaction_type))
        .reduce((s, t: any) => s + Number(t.amount || 0), 0);

      // 3) Transport bookings (earnings)
      let bkQuery = supabase
        .from('transport_bookings')
        .select('actual_price, created_at, status')
        .eq('driver_id', user.id)
        .eq('status', 'completed');
      if (fromDate) bkQuery = bkQuery.gte('created_at', fromDate);
      const { data: bookings, error: bkErr } = await bkQuery;
      if (bkErr) throw bkErr;

      const totalEarningsGross = (bookings || [])
        .reduce((s, b: any) => s + Number(b.actual_price || 0), 0);
      const totalEarningsNet = (totalEarningsGross * driverRate) / 100;

      const roi = totalSpent > 0 ? totalEarningsNet / totalSpent : null;

      setSummary({ totalTopup, totalSpent, totalEarningsGross, totalEarningsNet, roi });
    } catch (e) {
      console.error('useDriverFinancialSummary error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, range]);

  return { loading, summary, range, setRange, refresh: load };
};
